from fastapi import APIRouter, Depends, HTTPException
from database import db
from server import get_current_user, require_roles, UserRole
from services.certificate_service import (
    generate_and_upload_certificate,
    verify_signature,
    generate_hash
)

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])


@router.post("/generate/{course_id}")
async def generate_certificate(course_id: str, current_user: dict = Depends(get_current_user)):

    user = await db.users.find_one({"id": current_user["id"]})
    course = await db.courses.find_one({"id": course_id})

    if not user or not course:
        raise HTTPException(404, "User or Course not found")

    # Prevent duplicate
    existing = await db.certificates.find_one({
        "user_id": user["id"],
        "course_id": course_id
    })
    if existing:
        return existing

    # Completion check
    completed = await db.lesson_progress.count_documents({
        "user_id": user["id"],
        "course_id": course_id,
        "completed": True
    })

    total = await db.lessons.count_documents({"course_id": course_id})

    if total == 0 or completed < total:
        raise HTTPException(403, "Course not completed")

    cert_doc = await generate_and_upload_certificate(user, course)

    await db.certificates.insert_one(cert_doc)

    return cert_doc


@router.get("/my")
async def get_my_certificates(current_user: dict = Depends(get_current_user)):
    certs = await db.certificates.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return certs


@router.get("/{cert_id}/download")
async def download(cert_id: str, current_user: dict = Depends(get_current_user)):
    cert = await db.certificates.find_one({"id": cert_id})

    if not cert:
        raise HTTPException(404, "Not found")

    if cert["user_id"] != current_user["id"]:
        raise HTTPException(403, "Not allowed")

    return {"download_url": cert["certificate_url"]}


@router.get("/verify/{cert_id}")
async def verify(cert_id: str, token: str):

    if not verify_signature(cert_id, token):
        raise HTTPException(400, "Invalid signature")

    cert = await db.certificates.find_one({"id": cert_id})

    if not cert:
        raise HTTPException(404, "Not found")

    if not cert.get("is_valid", True):
        raise HTTPException(400, "Revoked")

    expected_hash = generate_hash(cert["user_id"], cert["course_id"], cert_id)

    if cert["verification_hash"] != expected_hash:
        raise HTTPException(400, "Tampered")

    return {
        "status": "valid",
        "user_name": cert["user_name"],
        "course_title": cert["course_title"],
        "issued_at": cert["issued_at"]
    }


@router.put("/admin/revoke/{cert_id}")
async def revoke(cert_id: str, admin=Depends(require_roles(UserRole.ADMIN))):

    await db.certificates.update_one(
        {"id": cert_id},
        {"$set": {"is_valid": False}}
    )

    return {"message": "revoked"}
