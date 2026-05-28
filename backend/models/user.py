from pydantic import BaseModel, EmailStr
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
