from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"

client = AsyncIOMotorClient(MONGO_URL)

db = client["mylms"]
live_classes_collection = db["live_classes"]  # collection name