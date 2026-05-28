import os
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


async def create_admin_if_not_exists(db):
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_full_name = os.getenv("ADMIN_FULL_NAME", "Administrator")

    if not admin_email or not admin_password:
        print("⚠️ Admin credentials not set in environment.")
        return

    existing_admin = await db.users.find_one({"email": admin_email.lower()})

    if existing_admin:
        print("✅ Admin already exists.")
        return

    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": admin_email.lower(),
        "password_hash": hash_password(admin_password),
        "full_name": admin_full_name,
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(admin_doc)
    print("🚀 Admin created successfully.")