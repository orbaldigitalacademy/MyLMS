from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import uuid

from database import db
from core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/users", tags=["Users"])


# ================= MODELS =================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ================= REGISTER =================

@router.post("/register")
async def register(data: UserCreate):
    email = data.email.lower()

    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already exists")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "role": "student",
        "created_at": now
    }

    await db.users.insert_one(user_doc)

    token = create_access_token({
        "sub": user_id,
        "role": user_doc["role"]
    })

    return {
        "access_token": token,
        "user": user_doc
    }


# ================= LOGIN =================

@router.post("/login")
async def login(data: UserLogin):
    email = data.email.lower()

    user = await db.users.find_one({"email": email})

    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    if user.get("is_blocked"):
        raise HTTPException(403, "User blocked")

    token = create_access_token({
        "sub": user["id"],
        "role": user["role"]
    })

    return {
        "access_token": token,
        "user": user
    }


# ================= PROFILE =================

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user