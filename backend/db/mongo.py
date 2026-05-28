from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import MONGO_URL, DB_NAME

client: AsyncIOMotorClient | None = None
db = None

async def connect_to_mongo():
    global client, db

    if not MONGO_URL or not DB_NAME:
        raise RuntimeError("MongoDB environment variables missing")

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

async def close_mongo_connection():
    if client:
        client.close()
