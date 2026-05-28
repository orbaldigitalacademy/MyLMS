from datetime import datetime
from database import db

collection = db["live_classes"]

async def update_live_class_status():
    now = datetime.utcnow()

    async for cls in collection.find():
        start = datetime.strptime(
            f"{cls['scheduled_date']} {cls['start_time']}",
            "%Y-%m-%d %H:%M"
        )
        end = datetime.strptime(
            f"{cls['scheduled_date']} {cls['end_time']}",
            "%Y-%m-%d %H:%M"
        )

        if start <= now <= end:
            status = "live"
        elif now > end:
            status = "completed"
        else:
            status = "scheduled"

        await collection.update_one(
            {"_id": cls["_id"]},
            {"$set": {"status": status}}
        )