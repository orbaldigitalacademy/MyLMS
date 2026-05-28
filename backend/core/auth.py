from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from enum import Enum
from database import db
import os
from passlib.context import CryptContext

from fastapi import APIRouter

router = APIRouter()

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-dev-key")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set")
ALGORITHM = "HS256"

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    MODERATOR = "moderator"


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=403, detail="User not found")
            

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_roles(*roles: UserRole):
    async def checker(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return user
    return checker



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

from pydantic import BaseModel, EmailStr
import uuid

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


@router.post("/register")
async def register(data: RegisterRequest):
    # Check if user exists
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": "student",
        "created_at": datetime.now(timezone.utc)
    }

    await db.users.insert_one(user)

    return {"message": "User registered successfully"}

@router.post("/login")
async def login():
    return {"message": "login works"}
