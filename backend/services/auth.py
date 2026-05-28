from app.db.mongo import db

async def get_user_by_id(user_id: str):
    return await db.users.find_one({"id": user_id}, {"_id": 0})
