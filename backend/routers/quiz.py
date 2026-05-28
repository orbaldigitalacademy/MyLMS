from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime
import uuid
import random

from database import db
from core.auth import get_current_user, require_roles, UserRole
from services.certificate_service import generate_certificate  # make sure this exists

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

# ================= CONFIG =================

MAX_ATTEMPTS = 3


# ================= MODELS =================

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "mcq"
    TRUE_FALSE = "true_false"


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int   # ✅ FIXED (was correct_answer)
    points: int = 1


class QuizCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    questions: List[QuizQuestion]
    pass_percentage: float = 70


class QuizResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: Optional[str]
    total_questions: int
    pass_percentage: float
    created_at: str


class QuizSubmission(BaseModel):
    quiz_id: str
    answers: Dict[str, int]  # {question_id: selected_index}


class QuizResult(BaseModel):
    score: float
    passed: bool
    correct_answers: int
    total_questions: int


# ================= CREATE QUIZ =================

@router.post("/admin", response_model=QuizResponse)
async def create_quiz(
    quiz_data: QuizCreate,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    quiz_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    quiz_doc = {
        "id": quiz_id,
        "course_id": quiz_data.course_id,
        "title": quiz_data.title,
        "description": quiz_data.description,
        "questions": [q.dict() for q in quiz_data.questions],
        "pass_percentage": quiz_data.pass_percentage,
        "created_at": now
    }

    await db.quizzes.insert_one(quiz_doc)

    return QuizResponse(
        id=quiz_id,
        course_id=quiz_data.course_id,
        title=quiz_data.title,
        description=quiz_data.description,
        total_questions=len(quiz_data.questions),
        pass_percentage=quiz_data.pass_percentage,
        created_at=now
    )


# ================= GET QUIZ (HIDE ANSWERS) =================

@router.get("/course/{course_id}")
async def get_quiz(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    quiz = await db.quizzes.find_one({"course_id": course_id}, {"_id": 0})

    if not quiz:
        raise HTTPException(404, "Quiz not found")

    # 🔐 Check enrollment (important)
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": course_id,
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(403, "No access to this course")

    # 🎲 Shuffle questions (anti-cheat)
    random.shuffle(quiz["questions"])

    # 🔒 Hide answers
    for q in quiz["questions"]:
        q.pop("correct_index", None)

    return quiz


# ================= SUBMIT QUIZ =================

@router.post("/submit", response_model=QuizResult)
async def submit_quiz(
    submission: QuizSubmission,
    current_user: dict = Depends(get_current_user)
):
    quiz = await db.quizzes.find_one({"id": submission.quiz_id})

    if not quiz:
        raise HTTPException(404, "Quiz not found")

    # 🔐 Check enrollment
    enrollment = await db.enrollments.find_one({
        "user_id": current_user["id"],
        "course_id": quiz["course_id"],
        "access_granted": True
    })

    if not enrollment:
        raise HTTPException(403, "No access to this course")

    # 🔒 Attempt limit
    attempts = await db.quiz_attempts.count_documents({
        "user_id": current_user["id"],
        "quiz_id": submission.quiz_id
    })

    if attempts >= MAX_ATTEMPTS:
        raise HTTPException(403, f"Maximum attempts ({MAX_ATTEMPTS}) reached")

    questions = quiz["questions"]
    total_questions = len(questions)

    correct = 0
    earned_points = 0
    total_points = sum(q.get("points", 1) for q in questions)

    for q in questions:
        qid = q["id"]
        correct_index = q["correct_index"]

        if submission.answers.get(qid) == correct_index:
            correct += 1
            earned_points += q.get("points", 1)

    # ✅ Safe scoring
    score = (earned_points / total_points) * 100 if total_points > 0 else 0
    passed = score >= quiz["pass_percentage"]

    # 🏆 Leaderboard (keep best score)
    await db.leaderboard.update_one(
        {
            "user_id": current_user["id"],
            "course_id": quiz["course_id"]
        },
        {
            "$max": {"score": score},
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        },
        upsert=True
    )

    # 🎓 Certificate logic
    if passed:
        total_lessons = await db.lessons.count_documents({
            "course_id": quiz["course_id"]
        })

        completed_lessons = await db.lesson_progress.count_documents({
            "user_id": current_user["id"],
            "course_id": quiz["course_id"],
            "completed": True
        })

        if total_lessons > 0 and completed_lessons == total_lessons:
            existing = await db.certificates.find_one({
                "user_id": current_user["id"],
                "course_id": quiz["course_id"]
            })

            if not existing:
                await generate_certificate(
                    current_user["id"],
                    quiz["course_id"]
                )

    # 💾 Save attempt
    result_doc = {
        "id": str(uuid.uuid4()),
        "quiz_id": submission.quiz_id,
        "user_id": current_user["id"],
        "score": score,
        "passed": passed,
        "correct_answers": correct,
        "total_questions": total_questions,
        "submitted_at": datetime.utcnow().isoformat()
    }

    await db.quiz_attempts.insert_one(result_doc)

    return QuizResult(
        score=score,
        passed=passed,
        correct_answers=correct,
        total_questions=total_questions
    )