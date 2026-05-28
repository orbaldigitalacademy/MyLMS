from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from database import db
from core.auth import require_roles, UserRole, get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/courses", tags=["Courses"])


# ================= MODELS =================

class CourseCreate(BaseModel):
    title: str
    short_description: str
    full_description: str
    learning_outcomes: List[str]
    duration: str
    price: float
    image_url: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    learning_outcomes: Optional[List[str]] = None
    duration: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_published: Optional[bool] = None


class CourseResponse(BaseModel):
    id: str
    title: str
    short_description: str
    full_description: str
    learning_outcomes: List[str]
    duration: str
    price: float
    image_url: Optional[str]
    is_published: bool
    created_at: str
    lesson_count: int = 0


# ================= ROUTES =================

@router.post("/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    course_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    course_doc = {
        "id": course_id,
        "title": course_data.title,
        "short_description": course_data.short_description,
        "full_description": course_data.full_description,
        "learning_outcomes": course_data.learning_outcomes,
        "duration": course_data.duration,
        "price": course_data.price,
        "image_url": course_data.image_url,
        "is_published": False,
        "created_at": now,
        "instructor_id": user["id"]
    }

    await db.courses.insert_one(course_doc)

    return CourseResponse(**course_doc, lesson_count=0)


# ================= GET ALL COURSES =================

@router.get("/", response_model=List[CourseResponse])
async def get_courses(published_only: bool = True):
    query = {"is_published": True} if published_only else {}

    courses_cursor = db.courses.find(query, {"_id": 0})
    courses = []

    async for course in courses_cursor:
        lesson_count = await db.lessons.count_documents({"course_id": course["id"]})

        courses.append(
            CourseResponse(**course, lesson_count=lesson_count)
        )

    return courses


# ================= GET SINGLE COURSE =================

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})

    if not course:
        raise HTTPException(404, "Course not found")

    lesson_count = await db.lessons.count_documents({"course_id": course_id})

    return CourseResponse(**course, lesson_count=lesson_count)


# ================= UPDATE COURSE =================

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_data: CourseUpdate,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    course = await db.courses.find_one({"id": course_id})

    if not course:
        raise HTTPException(404, "Course not found")

    # Restrict instructor to own course
    if user["role"] == UserRole.INSTRUCTOR and course.get("instructor_id") != user["id"]:
        raise HTTPException(403, "Not your course")

    update_data = {k: v for k, v in course_data.model_dump().items() if v is not None}

    if update_data:
        await db.courses.update_one({"id": course_id}, {"$set": update_data})

    updated = await db.courses.find_one({"id": course_id}, {"_id": 0})
    lesson_count = await db.lessons.count_documents({"course_id": course_id})

    return CourseResponse(**updated, lesson_count=lesson_count)


# ================= DELETE COURSE =================

@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    result = await db.courses.delete_one({"id": course_id})

    if result.deleted_count == 0:
        raise HTTPException(404, "Course not found")

    # delete lessons too
    await db.lessons.delete_many({"course_id": course_id})

    return {"message": "Course deleted successfully"}