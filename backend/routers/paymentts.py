from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os
import httpx

from pydantic import BaseModel
from database import db
from core.auth import get_current_user, require_roles, UserRole

router = APIRouter(prefix="/api/payments", tags=["Payments"])

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY")


# ================= MODELS =================

class PaymentSubmit(BaseModel):
    course_id: str
    proof_url: str
    proof_type: str  # image/pdf


class PaymentResponse(BaseModel):
    id: str
    user_id: str
    course_id: str
    course_title: str
    course_price: float
    proof_url: Optional[str]
    status: str
    created_at: str


class PaystackInit(BaseModel):
    course_id: str


# ================= MANUAL PAYMENT =================

@router.post("/manual", response_model=PaymentResponse)
async def submit_manual_payment(
    data: PaymentSubmit,
    user: dict = Depends(get_current_user)
):
    course = await db.courses.find_one({"id": data.course_id})
    if not course:
        raise HTTPException(404, "Course not found")

    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": payment_id,
        "user_id": user["id"],
        "course_id": data.course_id,
        "course_title": course["title"],
        "course_price": course["price"],
        "proof_url": data.proof_url,
        "status": "pending",
        "created_at": now
    }

    await db.payments.insert_one(doc)

    # create enrollment
    await db.enrollments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "course_id": data.course_id,
        "payment_id": payment_id,
        "payment_status": "pending",
        "access_granted": False,
        "enrolled_at": now,
        "completed_lessons": []
    })

    return doc


# ================= PAYSTACK INIT =================

@router.post("/paystack/init")
async def initialize_paystack(
    data: PaystackInit,
    user: dict = Depends(get_current_user)
):
    course = await db.courses.find_one({"id": data.course_id})
    if not course:
        raise HTTPException(404, "Course not found")

    amount = int(course["price"] * 100)  # kobo

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.paystack.co/transaction/initialize",
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET}",
                "Content-Type": "application/json"
            },
            json={
                "email": user["email"],
                "amount": amount,
                "metadata": {
                    "user_id": user["id"],
                    "course_id": data.course_id
                }
            }
        )

    res = response.json()

    if not res.get("status"):
        raise HTTPException(400, "Paystack init failed")

    return {
        "authorization_url": res["data"]["authorization_url"],
        "reference": res["data"]["reference"]
    }


# ================= PAYSTACK VERIFY =================

@router.get("/paystack/verify/{reference}")
async def verify_payment(reference: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"}
        )

    res = response.json()

    if not res.get("status"):
        raise HTTPException(400, "Verification failed")

    data = res["data"]

    if data["status"] != "success":
        raise HTTPException(400, "Payment not successful")

    metadata = data["metadata"]

    user_id = metadata["user_id"]
    course_id = metadata["course_id"]

    course = await db.courses.find_one({"id": course_id})

    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # save payment
    await db.payments.insert_one({
        "id": payment_id,
        "user_id": user_id,
        "course_id": course_id,
        "course_title": course["title"],
        "course_price": course["price"],
        "status": "approved",
        "reference": reference,
        "created_at": now
    })

    # grant access
    await db.enrollments.update_one(
        {
            "user_id": user_id,
            "course_id": course_id
        },
        {
            "$set": {
                "payment_status": "approved",
                "access_granted": True
            }
        },
        upsert=True
    )

    return {"message": "Payment verified & access granted"}


# ================= MY PAYMENTS =================

@router.get("/my", response_model=List[PaymentResponse])
async def get_my_payments(user: dict = Depends(get_current_user)):
    payments = await db.payments.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)

    return payments


# ================= ADMIN =================

@router.get("/admin", response_model=List[PaymentResponse])
async def get_all_payments(
    user: dict = Depends(require_roles(UserRole.ADMIN))
):
    payments = await db.payments.find({}, {"_id": 0}).to_list(500)
    return payments


@router.put("/admin/{payment_id}/approve")
async def approve_payment(
    payment_id: str,
    user: dict = Depends(require_roles(UserRole.ADMIN))
):
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "approved"}}
    )

    payment = await db.payments.find_one({"id": payment_id})

    await db.enrollments.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "payment_status": "approved",
            "access_granted": True
        }}
    )

    return {"message": "Payment approved"}