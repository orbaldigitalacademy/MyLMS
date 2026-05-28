from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, HttpUrl
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from enum import Enum
from seedAdmin import create_admin_if_not_exists
from routers.admin_analytics import router as analytics_router
import asyncio
from utils.scheduler import update_live_class_status
from fastapi import WebSocket
from models.live_classes import router as live_classes_router
from routers.payments import router as payment_router


connections = {}
router = APIRouter(prefix="/api/live-classes", tags=["Live Classes"])

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URI']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('SECRET_KEY')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Cloudinary config

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    raise RuntimeError("Cloudinary environment variables are not properly set")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)
# Create the main app
app = FastAPI(title="Orbal Digital Academy", version="1.0.0")
app.include_router(live_classes_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create routers
api_router = APIRouter(prefix="/api")
api_router.include_router(analytics_router)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== ENUMS ==============
class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    MODERATOR = "moderator"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
class TestimonialStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# ============== MODELS ==============
class AdminCreateUser(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.STUDENT
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class AdminEnrollUser(BaseModel):
    user_id: str
    course_id: str

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
    lesson_count: Optional[int] = 0


class LessonCreate(BaseModel):
    course_id: str
    title: str
    description: str
    video_public_id: Optional[str] = None
    duration: Optional[int] = 0  # seconds
    order: int

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = None

class LessonResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    video_url: Optional[str]
    order: int
    created_at: str

class PaymentSubmit(BaseModel):
    course_id: str
    proof_url: str
    proof_type: str  # "image" or "pdf"

class PaymentResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    course_id: str
    course_title: str
    course_price: float
    proof_url: str
    proof_type: str
    status: str
    admin_note: Optional[str]
    created_at: str
    updated_at: str

class EnrollmentResponse(BaseModel):
    id: str
    user_id: str
    course_id: str
    course_title: str
    course_image: Optional[str]
    payment_status: str
    enrolled_at: str
    completed_lessons: List[str]

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ContactMessageResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: str

class SettingsUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    admin_email: Optional[str] = None

class SettingsResponse(BaseModel):
    bank_name: str
    account_number: str
    account_name: str
    admin_email: str

class LessonProgress(BaseModel):
    lesson_id: str
    completed: bool

class TestimonialCreate(BaseModel):
    content: Optional[str] = None
    video_url: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)


class TestimonialResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    content: Optional[str]
    video_url: Optional[str]
    rating: int
    status: str
    admin_note: Optional[str]
    created_at: str
    updated_at: str

class LiveClassStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class LiveClassCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    meeting_url: HttpUrl


class LiveClassResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    meeting_url: str
    status: LiveClassStatus
    created_by: str


# ============== HELPER FUNCTIONS ==============
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_roles(*roles: UserRole):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access requires one of roles: {roles}"
            )
        return current_user
    return role_checker

def serialize_datetime(dt) -> str:
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)

def generate_signed_video_url(public_id: str):
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type="video",
        secure=True,
        sign_url=True,
        expires_at=int((datetime.utcnow() + timedelta(minutes=30)).timestamp())
    )
    return url

async def generate_certificate(user_id: str, course_id: str):
    user = await db.users.find_one({"id": user_id})
    course = await db.courses.find_one({"id": course_id})

    cert_id = str(uuid.uuid4())

    cert_doc = {
        "id": cert_id,
        "user_id": user_id,
        "course_id": course_id,
        "course_title": course["title"],
        "user_name": user["full_name"],
        "issued_at": datetime.utcnow().isoformat(),
        "certificate_url": f"https://yourdomain.com/certificates/{cert_id}"
    }

    await db.certificates.insert_one(cert_doc)

    return cert_doc

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    email = user_data.email.lower()

    # Check if user already exists
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "role": UserRole.STUDENT,
        "created_at": now,
    }

    await db.users.insert_one(user_doc)

    access_token = create_access_token(
        {"sub": user_id, "role": user_doc["role"]}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_build_user_response(user_doc),
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    email = credentials.email.lower()

    user = await db.users.find_one({"email": email})

    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password",)

    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="User is blocked")

    access_token = create_access_token(
        {"sub": user["id"], "role": user["role"]}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_build_user_response(user),
    )


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _build_user_response(current_user)

def _build_user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=user["created_at"],
    )

# ============== COURSE ROUTES ==============
@api_router.post("/admin/courses", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    course_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

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
        "created_at": now.isoformat(),
        "instructor_id": user["id"]
    }

    await db.courses.insert_one(course_doc)

    return CourseResponse(
        id=course_id,
        title=course_doc["title"],
        short_description=course_doc["short_description"],
        full_description=course_doc["full_description"],
        learning_outcomes=course_doc["learning_outcomes"],
        duration=course_doc["duration"],
        price=course_doc["price"],
        image_url=course_doc["image_url"],
        is_published=course_doc["is_published"],
        created_at=course_doc["created_at"],
        lesson_count=0
    )


@api_router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    lesson_count = await db.lessons.count_documents({"course_id": course_id})
    
    return CourseResponse(
        id=course["id"],
        title=course["title"],
        short_description=course["short_description"],
        full_description=course["full_description"],
        learning_outcomes=course.get("learning_outcomes", []),
        duration=course["duration"],
        price=course["price"],
        image_url=course.get("image_url"),
        is_published=course.get("is_published", True),
        created_at=course.get("created_at", datetime.now(timezone.utc).isoformat()),
        lesson_count=lesson_count
    )

@api_router.get("/courses", response_model=list[CourseResponse])
async def get_courses(published_only: bool = True):
    query = {}

    if published_only:
        query["is_published"] = True

    courses_cursor = db.courses.find(query, {"_id": 0})
    courses = []

    async for course in courses_cursor:
        lesson_count = await db.lessons.count_documents({"course_id": course["id"]})

        courses.append(
            CourseResponse(
                id=course["id"],
                title=course["title"],
                short_description=course["short_description"],
                full_description=course["full_description"],
                learning_outcomes=course.get("learning_outcomes", []),
                duration=course["duration"],
                price=course["price"],
                image_url=course.get("image_url"),
                is_published=course.get("is_published", True),
                created_at=course.get("created_at", datetime.now(timezone.utc).isoformat()),
                lesson_count=lesson_count
            )
        )

    return courses

@api_router.put("/admin/courses/{course_id}", response_model=CourseResponse)
async def update_course(course_id: str, course_data: CourseUpdate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))):
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = {k: v for k, v in course_data.model_dump().items() if v is not None}
    if update_data:
        await db.courses.update_one({"id": course_id}, {"$set": update_data})
    
    updated = await db.courses.find_one({"id": course_id}, {"_id": 0})
    lesson_count = await db.lessons.count_documents({"course_id": course_id})
    
    return CourseResponse(
        id=updated["id"],
        title=updated["title"],
        short_description=updated["short_description"],
        full_description=updated["full_description"],
        learning_outcomes=updated.get("learning_outcomes", []),
        duration=updated["duration"],
        price=updated["price"],
        image_url=updated.get("image_url"),
        is_published=updated.get("is_published", True),
        created_at=updated.get("created_at", datetime.now(timezone.utc).isoformat()),
        lesson_count=lesson_count
    )

@api_router.delete("/admin/courses/{course_id}")
async def delete_course(course_id: str, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))):
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete related lessons
    await db.lessons.delete_many({"course_id": course_id})
    
    return {"message": "Course deleted successfully"}

# ============== LESSON ROUTES ==============
@api_router.get("/courses/{course_id}/lessons", response_model=List[LessonResponse])
async def get_course_lessons(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    # 🔐 Check access
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": course_id,
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(status_code=403, detail="No access")

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


@api_router.post("/admin/lessons", response_model=LessonResponse)
async def create_lesson(lesson_data: LessonCreate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))):
    # Check course exists
    course = await db.courses.find_one({"id": lesson_data.course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    lesson_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    lesson_doc = {
        "id": lesson_id,
        "course_id": lesson_data.course_id,
        "title": lesson_data.title,
        "description": lesson_data.description,
        "video_public_id": lesson_data.video_public_id,
        "duration": lesson_data.duration,
        "order": lesson_data.order,
        "created_at": now.isoformat()
    }
    
    await db.lessons.insert_one(lesson_doc)
    
    return LessonResponse(**lesson_doc)


@api_router.put("/admin/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(lesson_id: str, lesson_data: LessonUpdate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))):
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    update_data = {k: v for k, v in lesson_data.model_dump().items() if v is not None}
    if update_data:
        await db.lessons.update_one({"id": lesson_id}, {"$set": update_data})
    
    updated = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    return LessonResponse(**updated)


@api_router.post("/lessons/{lesson_id}/progress")
async def save_progress(
    lesson_id: str,
    watched_seconds: int = Form(...),
    current_user: dict = Depends(get_current_user)
):
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    course_id = lesson["course_id"]

    # 🔐 Check access
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": course_id,
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(403, "No access")

    duration = lesson.get("duration", 1)
    completed = watched_seconds >= (0.9 * duration)

    await db.lesson_progress.update_one(
        {
            "user_id": current_user["id"],
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

    # 🔥 Sync with enrollment
    if completed:
        await db.enrollments.update_one(
            {
                "user_id": current_user["id"],
                "course_id": course_id
            },
            {
                "$addToSet": {"completed_lessons": lesson_id}
            }
        )

    return {"completed": completed}

@api_router.get("/courses/{course_id}/progress")
async def get_progress(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    progress = await db.lesson_progress.find(
        {
            "user_id": current_user["id"],
            "course_id": course_id
        },
        {"_id": 0}
    ).to_list(100)

    return progress

@api_router.get("/courses/{course_id}/completion")
async def get_course_completion(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    total = await db.lessons.count_documents({"course_id": course_id})

    completed = await db.lesson_progress.count_documents({
        "user_id": current_user["id"],
        "course_id": course_id,
        "completed": True
    })

    percent = (completed / total) * 100 if total > 0 else 0

    return {
        "completed_lessons": completed,
        "total_lessons": total,
        "percentage": round(percent, 2)
    }

@api_router.post("/admin/live-classes")
async def create_live_class(
    data: LiveClassCreate,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    class_id = str(uuid.uuid4())

    doc = {
        "id": class_id,
        "course_id": data.course_id,
        "title": data.title,
        "description": data.description,
        "start_time": data.start_time.isoformat(),
        "end_time": data.end_time.isoformat(),
        "meeting_url": data.meeting_url,
        "status": "scheduled",
        "created_by": user["id"]
    }

    await db.live_classes.insert_one(doc)
    return doc

@router.get("/course/{course_id}", response_model=List[LiveClassResponse])
async def get_classes_by_course(course_id: str):
    classes = await db.live_classes.find(
        {"course_id": course_id},
        {"_id": 0}
    ).to_list(100)

    if not classes:
        raise HTTPException(
            status_code=404,
            detail="No classes found for this course"
        )

    return classes

@api_router.delete("/admin/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))):
    result = await db.lessons.delete_one({"id": lesson_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"message": "Lesson deleted successfully"}


# ============== ENROLLMENT ROUTES ==============
@api_router.get("/enrollments/my", response_model=List[EnrollmentResponse])
async def get_my_enrollments(current_user: dict = Depends(get_current_user)):
    enrollments = await db.enrollments.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for enroll in enrollments:
        course = await db.courses.find_one({"id": enroll["course_id"]}, {"_id": 0})
        if course:
            result.append(EnrollmentResponse(
                id=enroll["id"],
                user_id=enroll["user_id"],
                course_id=enroll["course_id"],
                course_title=course["title"],
                course_image=course.get("image_url"),
                payment_status=enroll["payment_status"],
                enrolled_at=enroll["enrolled_at"],
                completed_lessons=enroll.get("completed_lessons", [])
            ))
    return result

@api_router.get("/enrollments/{course_id}/access")
async def check_course_access(course_id: str, current_user: dict = Depends(get_current_user)):
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": course_id,
        "access_granted": True
    })
    
    return {"has_access": enrollment is not None}

@api_router.post("/enrollments/{course_id}/progress")
async def update_lesson_progress(course_id: str, progress: LessonProgress, current_user: dict = Depends(get_current_user)):
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": course_id,
        "access_granted": True
    })
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="No access to this course")
    
    completed = enrollment.get("completed_lessons", [])
    if progress.completed and progress.lesson_id not in completed:
        completed.append(progress.lesson_id)
    elif not progress.completed and progress.lesson_id in completed:
        completed.remove(progress.lesson_id)
    
    await db.enrollments.update_one(
        {"id": enrollment["id"]},
        {"$set": {"completed_lessons": completed}}
    )
    
    return {"message": "Progress updated", "completed_lessons": completed}


@api_router.post("/admin/users", response_model=UserResponse)
async def create_user(
    user_data: AdminCreateUser,
    admin: dict = Depends(get_admin_user)
):
    email = user_data.email.lower()

    # Check if user exists
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "role": user_data.role,
        "created_at": now,
    }

    await db.users.insert_one(user_doc)

    return _build_user_response(user_doc)


@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return [_build_user_response(user) for user in users]


@api_router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(get_admin_user)
):
    result = await db.users.delete_one({"id": user_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    # Optional: also delete related data
    await db.enrollments.delete_many({"user_id": user_id})
    await db.payments.delete_many({"user_id": user_id})

    return {"message": "User deleted successfully"}

@api_router.put("/admin/users/{user_id}/block")
async def block_user(
    user_id: str,
    admin: dict = Depends(get_admin_user)
):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_blocked": True}}
    )
    return {"message": "User blocked"}


@api_router.put("/admin/users/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    admin: dict = Depends(get_admin_user)
):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_blocked": False}}
    )
    return {"message": "User unblocked"}


@api_router.post("/admin/enroll")
async def admin_enroll_user(
    data: AdminEnrollUser,
    admin: dict = Depends(get_admin_user)
):
    user = await db.users.find_one({"id": data.user_id})
    course = await db.courses.find_one({"id": data.course_id})

    if not user or not course:
        raise HTTPException(status_code=404, detail="User or course not found")

    existing = await db.enrollments.find_one({
        "user_id": data.user_id,
        "course_id": data.course_id
    })

    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment_doc = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "course_id": data.course_id,
        "payment_status": "approved",
        "access_granted": True,
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
        "completed_lessons": []
    }

    await db.enrollments.insert_one(enrollment_doc)

    return {"message": "User enrolled successfully"}


@app.on_event("startup")
async def start_scheduler():
    async def loop():
        while True:
            await update_live_class_status()
            await asyncio.sleep(60)  # every minute

    asyncio.create_task(loop())

@router.get("/sync-status")
async def sync_live_class_status_route():
    now = datetime.now(timezone.utc)

    classes = await db.live_classes.find({}).to_list(100)

    for cls in classes:
        start = datetime.fromisoformat(cls["start_time"])
        end = datetime.fromisoformat(cls["end_time"])

        if start <= now <= end:
            status = "live"
        elif now > end:
            status = "ended"
        else:
            status = "scheduled"

        await db.live_classes.update_one(
            {"id": cls["id"]},
            {"$set": {"status": status}}
        )

    return {"message": "sync completed"}

@api_router.get("/courses/{course_id}/live-classes")
async def get_live_classes(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    # 🔐 Check access
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": course_id,
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(403, "No access")

    classes = await db.live_classes.find(
        {"course_id": course_id},
        {"_id": 0}
    ).sort("start_time", 1).to_list(100)

    return classes


@api_router.post("/live-classes/{class_id}/join")
async def join_live_class(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    cls = await db.live_classes.find_one({"id": class_id})

    if not cls:
        raise HTTPException(404, "Class not found")

    # 🔐 Check enrollment
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": cls["course_id"],
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(403, "No access")

    # 🧾 Save attendance
    await db.attendance.insert_one({
        "id": str(uuid.uuid4()),
        "class_id": class_id,
        "user_id": current_user["id"],
        "joined_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "meeting_url": cls["meeting_url"],
        "status": cls["status"]
    }

@api_router.post("/live-classes/{class_id}/leave")
async def leave_live_class(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    await db.attendance.update_one(
        {
            "class_id": class_id,
            "user_id": current_user["id"]
        },
        {
            "$set": {"left_at": datetime.now(timezone.utc).isoformat()}
        }
    )

    return {"message": "Left class"}


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

    except Exception:
        if websocket in connections[class_id]:
            connections[class_id].remove(websocket)

# ============== CONTACT ROUTES ==============
@api_router.post("/contact", response_model=ContactMessageResponse)
async def submit_contact(message_data: ContactMessageCreate):
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    message_doc = {
        "id": message_id,
        "name": message_data.name,
        "email": message_data.email,
        "subject": message_data.subject,
        "message": message_data.message,
        "is_read": False,
        "created_at": now.isoformat()
    }
    
    await db.contact_messages.insert_one(message_doc)
    
    return ContactMessageResponse(**message_doc)

@api_router.get("/admin/contacts", response_model=List[ContactMessageResponse])
async def get_contact_messages(user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR))):
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ContactMessageResponse(**m) for m in messages]

@api_router.put("/admin/contacts/{message_id}/read")
async def mark_contact_read(message_id: str, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR))):
    result = await db.contact_messages.update_one(
        {"id": message_id},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Marked as read"}

# ============== SETTINGS ROUTES ==============
@api_router.get("/settings/bank")
async def get_bank_settings():
    settings = await db.settings.find_one({"type": "bank"}, {"_id": 0})
    if not settings:
        # Return defaults from env or empty
        return SettingsResponse(
            bank_name=os.environ.get("BANK_NAME", ""),
            account_number=os.environ.get("ACCOUNT_NUMBER", ""),
            account_name=os.environ.get("ACCOUNT_NAME", ""),
            admin_email=os.environ.get("ADMIN_EMAIL", "")
        )
    return SettingsResponse(
        bank_name=settings.get("bank_name", ""),
        account_number=settings.get("account_number", ""),
        account_name=settings.get("account_name", ""),
        admin_email=settings.get("admin_email", "")
    )

@api_router.put("/admin/settings/bank", response_model=SettingsResponse)
async def update_bank_settings(settings_data: SettingsUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_data["type"] = "bank"
    
    await db.settings.update_one(
        {"type": "bank"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"type": "bank"}, {"_id": 0})
    return SettingsResponse(
        bank_name=settings.get("bank_name", ""),
        account_number=settings.get("account_number", ""),
        account_name=settings.get("account_name", ""),
        admin_email=settings.get("admin_email", "")
    )

# ============== UPLOAD ROUTES ==============
@api_router.post("/upload/image")

async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not cloudinary.config().cloud_name:
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid image type")
    
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            resource_type="image",
            folder="lms/images"
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...),  user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))):
    if not cloudinary.config().cloud_name:
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    # Validate file type
    allowed_types = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid video type")
    
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            resource_type="video",
            folder="lms/videos"
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@api_router.post("/upload/document")
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not cloudinary.config().cloud_name:
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and images allowed.")
    
    try:
        contents = await file.read()
        resource_type = "image" if file.content_type.startswith("image") else "raw"
        result = cloudinary.uploader.upload(
            contents,
            resource_type=resource_type,
            folder="lms/proofs"
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

# ============== TESTIMONIAL ROUTES ==============

@api_router.post("/testimonials", response_model=TestimonialResponse)
async def submit_testimonial(
    testimonial_data: TestimonialCreate,
    current_user: dict = Depends(get_current_user)
):
    if not testimonial_data.content and not testimonial_data.video_url:
        raise HTTPException(
            status_code=400,
            detail="Either content or video_url must be provided"
        )

    testimonial_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    testimonial_doc = {
        "id": testimonial_id,
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_email": current_user["email"],
        "content": testimonial_data.content,
        "video_url": testimonial_data.video_url,
        "rating": testimonial_data.rating,
        "status": TestimonialStatus.PENDING,
        "admin_note": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }

    await db.testimonials.insert_one(testimonial_doc)

    return TestimonialResponse(**testimonial_doc)

@api_router.get("/testimonials", response_model=List[TestimonialResponse])
async def get_approved_testimonials():
    testimonials = await db.testimonials.find(
        {"status": TestimonialStatus.APPROVED},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    return [TestimonialResponse(**t) for t in testimonials]    

@api_router.get("/admin/testimonials", response_model=List[TestimonialResponse])
async def get_all_testimonials(
    status: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR))
):
    query = {}
    if status:
        query["status"] = status

    testimonials = await db.testimonials.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)

    return [TestimonialResponse(**t) for t in testimonials]

@api_router.put("/admin/testimonials/{testimonial_id}/approve")
async def approve_testimonial(
    testimonial_id: str,
    admin_note: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR))
):
    testimonial = await db.testimonials.find_one({"id": testimonial_id})
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    now = datetime.now(timezone.utc)

    await db.testimonials.update_one(
        {"id": testimonial_id},
        {
            "$set": {
                "status": TestimonialStatus.APPROVED,
                "admin_note": admin_note,
                "updated_at": now.isoformat()
            }
        }
    )

    return {"message": "Testimonial approved successfully"}

@api_router.put("/admin/testimonials/{testimonial_id}/reject")
async def reject_testimonial(
    testimonial_id: str,
    admin_note: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR))
):
    testimonial = await db.testimonials.find_one({"id": testimonial_id})
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    now = datetime.now(timezone.utc)

    await db.testimonials.update_one(
        {"id": testimonial_id},
        {
            "$set": {
                "status": TestimonialStatus.REJECTED,
                "admin_note": admin_note,
                "updated_at": now.isoformat()
            }
        }
    )

    return {"message": "Testimonial rejected"}



# ============== ADMIN STATS ==============
@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    total_students = await db.users.count_documents({"role": UserRole.STUDENT})
    total_courses = await db.courses.count_documents({})
    pending_payments = await db.payments.count_documents({"status": PaymentStatus.PENDING})
    approved_payments = await db.payments.count_documents({"status": PaymentStatus.APPROVED})
    total_revenue = 0
    
    approved = await db.payments.find({"status": PaymentStatus.APPROVED}, {"course_price": 1, "_id": 0}).to_list(1000)
    for p in approved:
        total_revenue += p.get("course_price", 0)
    
    return {
        "total_students": total_students,
        "total_courses": total_courses,
        "pending_payments": pending_payments,
        "approved_payments": approved_payments,
        "total_revenue": total_revenue
    }

@api_router.get("/admin/students")
async def get_all_students(admin: dict = Depends(get_admin_user)):
    students = await db.users.find({"role": UserRole.STUDENT}, {"_id": 0, "password_hash": 0}).to_list(500)
    
    result = []
    for student in students:
        enrollments = await db.enrollments.count_documents({"user_id": student["id"]})
        result.append({
            "id": student["id"],
            "email": student["email"],
            "full_name": student["full_name"],
            "created_at": student["created_at"],
            "enrollment_count": enrollments
        })
    return result

@api_router.get("/admin/analytics")
async def get_admin_analytics(admin: dict = Depends(get_admin_user)):

    revenue = [
        {"month": "Jan", "revenue": 120000},
        {"month": "Feb", "revenue": 180000},
        {"month": "Mar", "revenue": 220000},
        {"month": "Apr", "revenue": 200000}
    ]

    enrollments = [
        {"course": "Python", "students": 40},
        {"course": "Data Science", "students": 65},
        {"course": "SQL", "students": 30}
    ]

    students = [
        {"name": "Active", "value": 150},
        {"name": "Inactive", "value": 35}
    ]

    return {
        "revenue": revenue,
        "enrollments": enrollments,
        "students": students
    }

# ============== ROOT ==============
@api_router.get("/")
async def root():
    return {"message": "Orbal Digital Academy", "version": "1.0.0"}

# Include router
app.include_router(live_classes_router)
app.include_router(api_router)
app.include_router(router)
app.include_router(payment_router)


@app.on_event("startup")
async def startup():
    await create_admin_if_not_exists(db)

    async def loop():
        while True:
            await update_live_class_status()
            await asyncio.sleep(60)

    asyncio.create_task(loop())