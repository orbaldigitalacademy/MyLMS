from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb+srv://moseskor_db:<db_password>@cluster0.6l3bnn2.mongodb.net/"

client = AsyncIOMotorClient(MONGO_URL)

db = client["mylms"]
live_classes_collection = db["live_classes"]  # collection name