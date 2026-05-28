from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])

@router.get("/{course_id}")
async def leaderboard(course_id: str):
    data = await db.leaderboard.find(
        {"course_id": course_id},
        {"_id": 0}
    ).sort("score", -1).limit(10).to_list(10)

    return data