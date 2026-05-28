from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/api/verify", tags=["Verification"])

@router.get("/{cert_id}")
async def verify(cert_id: str):
    cert = await db.certificates.find_one({"id": cert_id}, {"_id": 0})

    if not cert:
        return {"valid": False}

    return {"valid": True, "data": cert}