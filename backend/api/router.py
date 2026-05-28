from fastapi import APIRouter
from app.api import auth, courses, lessons, payments, enrollments, uploads, admin

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(courses.router)
api_router.include_router(lessons.router)
api_router.include_router(payments.router)
api_router.include_router(enrollments.router)
api_router.include_router(uploads.router)
api_router.include_router(admin.router)
