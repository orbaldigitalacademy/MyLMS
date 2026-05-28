from fastapi import APIRouter, HTTPException
from database.connection import db
from schemas.user import UserCreate
from core.security import hash_password, verify_password, create_access_token
import uuid

router = APIRouter()

@router.post("/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(400, "Email already exists")

    user_id = str(uuid.uuid4())

    await db.users.insert_one({
        "id": user_id,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "full_name": user.full_name,
        "role": "student"
    })

    token = create_access_token({"sub": user_id})

    return {"access_token": token}