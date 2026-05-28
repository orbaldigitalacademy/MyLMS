from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from database.connection import db
from schemas.live_classes import LiveClassCreate, LiveClassResponse, LiveClassStatus
from datetime import datetime
import uuid
from typing import List

router = APIRouter()

# =========================
# 🔌 WebSocket Connections
# =========================
connections = {}

# =========================
# 📌 CREATE LIVE CLASS
# =========================
@router.post("/admin/live-classes", response_model=LiveClassResponse)
async def create_live_class(data: LiveClassCreate):
    class_id = str(uuid.uuid4())

    doc = {
        "id": class_id,
        "course_id": data.course_id,
        "title": data.title,
        "description": data.description,
        "start_time": data.start_time.isoformat(),
        "end_time": data.end_time.isoformat(),
        "meeting_url": str(data.meeting_url),
        "status": LiveClassStatus.SCHEDULED,
        "created_by": "admin"  # replace with auth later
    }

    await db.live_classes.insert_one(doc)
    return doc


# =========================
# 📌 GET LIVE CLASSES (BY COURSE)
# =========================
@router.get("/courses/{course_id}/live-classes", response_model=List[LiveClassResponse])
async def get_live_classes(course_id: str):
    classes = await db.live_classes.find(
        {"course_id": course_id},
        {"_id": 0}
    ).sort("start_time", 1).to_list(100)

    return classes


# =========================
# 📌 JOIN LIVE CLASS
# =========================
@router.post("/live-classes/{class_id}/join")
async def join_live_class(class_id: str):
    cls = await db.live_classes.find_one({"id": class_id})

    if not cls:
        raise HTTPException(404, "Class not found")

    return {
        "meeting_url": cls["meeting_url"],
        "status": cls["status"]
    }


# =========================
# 📌 UPDATE STATUS AUTOMATICALLY
# =========================
async def update_live_class_status():
    now = datetime.utcnow()

    classes = await db.live_classes.find({}).to_list(100)

    for cls in classes:
        start = datetime.fromisoformat(cls["start_time"])
        end = datetime.fromisoformat(cls["end_time"])

        if start <= now <= end:
            status = LiveClassStatus.LIVE
        elif now > end:
            status = LiveClassStatus.COMPLETED
        else:
            status = LiveClassStatus.SCHEDULED

        await db.live_classes.update_one(
            {"id": cls["id"]},
            {"$set": {"status": status}}
        )


# =========================
# 💬 WEBSOCKET (LIVE CHAT)
# =========================
@router.websocket("/ws/live/{class_id}")
async def live_chat(websocket: WebSocket, class_id: str):
    await websocket.accept()

    if class_id not in connections:
        connections[class_id] = []

    connections[class_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            for conn in connections[class_id]:
                await conn.send_text(data)

    except WebSocketDisconnect:
        connections[class_id].remove(websocket)