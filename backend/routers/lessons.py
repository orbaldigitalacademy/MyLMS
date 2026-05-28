from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import cloudinary.uploader
import cloudinary.utils

from database import db
from core.auth import get_current_user, require_roles, UserRole
from pydantic import BaseModel

router = APIRouter(prefix="/api/lessons", tags=["Lessons"])


# ================= MODELS =================

class LessonCreate(BaseModel):
    course_id: str
    title: str
    description: str
    video_public_id: Optional[str] = None
    duration: Optional[int] = 0
    order: int


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_public_id: Optional[str] = None
    order: Optional[int] = None


class LessonResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    video_url: Optional[str] = None
    order: int
    created_at: str


# ================= HELPERS =================

def generate_signed_video_url(public_id: str):
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type="video",
        secure=True,
        sign_url=True,
        expires_at=int((datetime.utcnow().timestamp()) + 1800)  # 30 mins
    )
    return url


# ================= CREATE LESSON =================

@router.post("/", response_model=LessonResponse)
async def create_lesson(
    lesson_data: LessonCreate,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    # Check course exists
    course = await db.courses.find_one({"id": lesson_data.course_id})
    if not course:
        raise HTTPException(404, "Course not found")

    lesson_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    lesson_doc = {
        "id": lesson_id,
        "course_id": lesson_data.course_id,
        "title": lesson_data.title,
        "description": lesson_data.description,
        "video_public_id": lesson_data.video_public_id,  # ✅ FIXED TYPO
        "duration": lesson_data.duration,
        "order": lesson_data.order,
        "created_at": now
    }

    await db.lessons.insert_one(lesson_doc)

    return LessonResponse(**lesson_doc)


# ================= GET COURSE LESSONS =================

@router.get("/course/{course_id}", response_model=List[LessonResponse])
async def get_course_lessons(
    course_id: str,
    user: dict = Depends(get_current_user)
):
    # 🔐 Check access
    enrollment = await db.enrollments.find_one({
        "user_id": user["id"],
        "course_id": course_id,
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(403, "No access to this course")

    lessons = await db.lessons.find(
        {"course_id": course_id},
        {"_id": 0}
    ).sort("order", 1).to_list(100)

    # 🔥 Attach signed URLs
    for lesson in lessons:
        if lesson.get("video_public_id"):
            lesson["video_url"] = generate_signed_video_url(
                lesson["video_public_id"]
            )

    return lessons


# ================= UPDATE LESSON =================

@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: str,
    lesson_data: LessonUpdate,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    update_data = {k: v for k, v in lesson_data.model_dump().items() if v is not None}

    if update_data:
        await db.lessons.update_one({"id": lesson_id}, {"$set": update_data})

    updated = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})

    return LessonResponse(**updated)


# ================= DELETE LESSON =================

@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: str,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    result = await db.lessons.delete_one({"id": lesson_id})

    if result.deleted_count == 0:
        raise HTTPException(404, "Lesson not found")

    return {"message": "Lesson deleted successfully"}


# ================= VIDEO UPLOAD =================

@router.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    allowed_types = ["video/mp4", "video/webm", "video/quicktime"]

    if file.content_type not in allowed_types:
        raise HTTPException(400, "Invalid video type")

    contents = await file.read()

    result = cloudinary.uploader.upload(
        contents,
        resource_type="video",
        folder="lms/videos",
        type="authenticated"
    )

    return {
        "public_id": result["public_id"],
        "url": result["secure_url"]
    }


# ================= SAVE PROGRESS =================

@router.post("/{lesson_id}/progress")
async def save_progress(
    lesson_id: str,
    watched_seconds: int = Form(...),
    user: dict = Depends(get_current_user)
):
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    course_id = lesson["course_id"]

    # 🔐 Check access
    enrollment = await db.enrollments.find_one({
        "user_id": user["id"],
        "course_id": course_id,
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(403, "No access")

    duration = lesson.get("duration", 1)
    completed = watched_seconds >= (0.9 * duration)

    await db.lesson_progress.update_one(
        {
            "user_id": user["id"],
            "lesson_id": lesson_id
        },
        {
            "$set": {
                "course_id": course_id,
                "watched_seconds": watched_seconds,
                "duration": duration,
                "completed": completed,
                "updated_at": datetime.utcnow().isoformat()
            }
        },
        upsert=True
    )

    # 🔥 Update enrollment
    if completed:
        await db.enrollments.update_one(
            {
                "user_id": user["id"],
                "course_id": course_id
            },
            {
                "$addToSet": {"completed_lessons": lesson_id}
            }
        )

    return {"completed": completed}


# ================= GET PROGRESS =================

@router.get("/course/{course_id}/progress")
async def get_progress(
    course_id: str,
    user: dict = Depends(get_current_user)
):
    progress = await db.lesson_progress.find(
        {
            "user_id": user["id"],
            "course_id": course_id
        },
        {"_id": 0}
    ).to_list(100)

    return progress


# ================= COURSE COMPLETION =================

@router.get("/course/{course_id}/completion")
async def get_course_completion(
    course_id: str,
    user: dict = Depends(get_current_user)
):
    total = await db.lessons.count_documents({"course_id": course_id})

    completed = await db.lesson_progress.count_documents({
        "user_id": user["id"],
        "course_id": course_id,
        "completed": True
    })

    percent = (completed / total) * 100 if total > 0 else 0

    return {
        "completed_lessons": completed,
        "total_lessons": total,
        "percentage": round(percent, 2)
    }