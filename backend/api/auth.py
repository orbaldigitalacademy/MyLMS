from fastapi import APIRouter, HTTPException
from app.db.mongo import db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import UserCreate, UserLogin, TokenResponse, UserResponse
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate):
    if await db.users.find_one({"email": data.email.lower()}):
        raise HTTPException(400, "Email already registered")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    await db.users.insert_one({
        "id": user_id,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "role": "student",
        "created_at": now,
    })

    token = create_access_token({"sub": user_id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=data.email.lower(),
            full_name=data.full_name,
            role="student",
            created_at=now,
        ),
    )
