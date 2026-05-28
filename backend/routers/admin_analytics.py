from fastapi import APIRouter, Depends
from datetime import datetime
from database import db
from dependencies import get_admin_user

router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])


# ======================== Monthly Revenue ===============================#
@router.get("/revenue")
async def monthly_revenue(admin: dict = Depends(get_admin_user)):

    pipeline = [
        {"$match": {"status": "approved"}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": {"$toDate": "$created_at"}},
                    "month": {"$month": {"$toDate": "$created_at"}}
                },
                "revenue": {"$sum": "$course_price"}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]

    results = await db.payments.aggregate(pipeline).to_list(None)

    data = []

    for r in results:
        month = datetime(2024, r["_id"]["month"], 1).strftime("%b")

        data.append({
            "month": month,
            "revenue": r["revenue"]
        })

    return data


# ============================ Course Enrollments ===============================
@router.get("/enrollments")
async def course_enrollments(admin: dict = Depends(get_admin_user)):

    pipeline = [
        {"$match": {"status": "approved"}},
        {
            "$group": {
                "_id": "$course_title",
                "students": {"$sum": 1}
            }
        },
        {"$sort": {"students": -1}}
    ]

    results = await db.payments.aggregate(pipeline).to_list(None)

    return [
        {
            "course": r["_id"],
            "students": r["students"]
        }
        for r in results
    ]


# ===============================
# Student Growth
# ===============================
@router.get("/students")
async def student_growth(admin: dict = Depends(get_admin_user)):

    pipeline = [
        {
            "$group": {
                "_id": {
                    "year": {"$year": {"$toDate": "$created_at"}},
                    "month": {"$month": {"$toDate": "$created_at"}}
                },
                "students": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]

    results = await db.users.aggregate(pipeline).to_list(None)

    data = []

    for r in results:
        month = datetime(2024, r["_id"]["month"], 1).strftime("%b")

        data.append({
            "month": month,
            "students": r["students"]
        })

    return data


# ===============================
# Top Courses
# ===============================
@router.get("/top-courses")
async def top_courses(admin: dict = Depends(get_admin_user)):

    pipeline = [
        {"$match": {"status": "approved"}},
        {
            "$group": {
                "_id": "$course_title",
                "revenue": {"$sum": "$course_price"},
                "students": {"$sum": 1}
            }
        },
        {"$sort": {"revenue": -1}},
        {"$limit": 5}
    ]

    results = await db.payments.aggregate(pipeline).to_list(None)

    return [
        {
            "course": r["_id"],
            "revenue": r["revenue"],
            "students": r["students"]
        }
        for r in results
    ]


# ===============================
# Get All Analytics
# ===============================
@router.get("/")
async def get_all_analytics(admin: dict = Depends(get_admin_user)):

    revenue_data = await monthly_revenue(admin)
    enrollments_data = await course_enrollments(admin)
    students_data = await student_growth(admin)
    top_courses_data = await top_courses(admin)

    return {
        "revenue": revenue_data,
        "enrollments": enrollments_data,
        "students": students_data,
        "top_courses": top_courses_data
    }

