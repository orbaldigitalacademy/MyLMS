from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import MONGO_URL, DB_NAME
import certifi
import logging

client: AsyncIOMotorClient | None = None
db = None


async def connect_to_mongo():
    global client, db

    if not MONGO_URL or not DB_NAME:
        raise RuntimeError("MongoDB environment variables missing")

    try:
        client = AsyncIOMotorClient(
            MONGO_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000
        )

        # Force connection test (IMPORTANT for Render)
        await client.admin.command("ping")

        db = client[DB_NAME]
        print("MongoDB connected successfully")

    except Exception as e:
        logging.error(f"MongoDB connection failed: {e}")
        raise e


async def close_mongo_connection():
    global client

    if client:
        client.close()
        print("MongoDB connection closed")