from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from database.connection import db
import os

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

async def get_current_user(credentials=Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(401, "User not found")

        return user

    except JWTError:
        raise HTTPException(401, "Invalid token")