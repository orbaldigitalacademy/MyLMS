from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone
import uuid

from database import db
from core.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ================= USERS =================

@router.get("/users")
async def get_users(admin: dict = Depends(require_roles("admin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_roles("admin"))
):
    result = await db.users.delete_one({"id": user_id})

    if result.deleted_count == 0:
        raise HTTPException(404, "User not found")

    await db.enrollments.delete_many({"user_id": user_id})
    await db.payments.delete_many({"user_id": user_id})

    return {"message": "User deleted"}


@router.put("/users/{user_id}/block")
async def block_user(
    user_id: str,
    admin: dict = Depends(require_roles("admin"))
):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_blocked": True}}
    )
    return {"message": "User blocked"}


@router.put("/users/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    admin: dict = Depends(require_roles("admin"))
):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_blocked": False}}
    )
    return {"message": "User unblocked"}


# ================= ENROLLMENT =================

@router.post("/enroll")
async def enroll_user(
    user_id: str,
    course_id: str,
    admin: dict = Depends(require_roles("admin"))
):
    user = await db.users.find_one({"id": user_id})
    course = await db.courses.find_one({"id": course_id})

    if not user or not course:
        raise HTTPException(404, "User or course not found")

    existing = await db.enrollments.find_one({
        "user_id": user_id,
        "course_id": course_id
    })

    if existing:
        raise HTTPException(400, "Already enrolled")

    await db.enrollments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": course_id,
        "payment_status": "approved",
        "access_granted": True,
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
        "completed_lessons": []
    })

    return {"message": "User enrolled"}


# ================= STATS =================

@router.get("/stats")
async def get_stats(admin: dict = Depends(require_roles("admin"))):
    total_users = await db.users.count_documents({})
    total_courses = await db.courses.count_documents({})
    total_payments = await db.payments.count_documents({"status": "approved"})

    return {
        "users": total_users,
        "courses": total_courses,
        "revenue_count": total_payments
    }