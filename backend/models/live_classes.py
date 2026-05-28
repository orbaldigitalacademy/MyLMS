# live_classes.py
from fastapi import APIRouter, HTTPException
from typing import List
from schemas.live_classes import LiveClassCreate, LiveClassResponse, LiveClassStatus
from database import live_classes_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/live-classes", tags=["Live Classes"])

def serialize_class(doc):
    return LiveClassResponse(
        id=str(doc["_id"]),
        course_id=doc["course_id"],
        title=doc["title"],
        description=doc.get("description"),
        start_time=doc["start_time"],
        end_time=doc["end_time"],
        meeting_url=doc["meeting_url"],
        status=doc.get("status", LiveClassStatus.SCHEDULED),
        created_by=doc.get("created_by", "admin")
    )

# GET all live classes
@router.get("/", response_model=List[LiveClassResponse])
async def get_all_classes():
    classes = []
    cursor = live_classes_collection.find()
    async for doc in cursor:
        classes.append(serialize_class(doc))
    return classes

# GET class by ID
@router.get("/{class_id}", response_model=LiveClassResponse)
async def get_class(class_id: str):
    doc = await live_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found")
    return serialize_class(doc)

# GET classes by course
@router.get("/course/{course_id}", response_model=List[LiveClassResponse])
async def get_classes_by_course(course_id: str):
    classes = []
    cursor = live_classes_collection.find({"course_id": course_id})
    async for doc in cursor:
        classes.append(serialize_class(doc))
    if not classes:
        raise HTTPException(status_code=404, detail="No classes found for this course")
    return classes

# POST create class
@router.post("/", response_model=LiveClassResponse)
async def create_class(class_in: LiveClassCreate):
    doc = class_in.dict()
    doc["status"] = LiveClassStatus.SCHEDULED
    result = await live_classes_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_class(doc)