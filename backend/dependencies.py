# backend/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_admin_user(token: str = Depends(oauth2_scheme)):
    """
    Dummy admin check. Replace with real JWT verification.
    """
    if token != "admin-token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin token",
        )
    # Return dummy admin data
    return {"username": "admin", "role": "admin"}