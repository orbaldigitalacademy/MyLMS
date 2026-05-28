from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from enum import Enum
import uuid
import os
import hmac
import hashlib
import httpx

from database import db
from core.auth import get_current_user, require_roles, UserRole

router = APIRouter(prefix="/api/payments", tags=["Payments"])

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY")


# =========================================================
# ENUMS
# =========================================================

class PaymentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# =========================================================
# MODELS
# =========================================================

class PaymentSubmit(BaseModel):
    course_id: str
    proof_url: str
    proof_type: str = Field(..., description="image/pdf")


class PaystackInit(BaseModel):
    course_id: str


class PaymentResponse(BaseModel):
    id: str
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    course_id: str
    course_title: str
    course_price: float

    proof_url: Optional[str] = None
    proof_type: Optional[str] = None

    reference: Optional[str] = None

    status: PaymentStatus
    admin_note: Optional[str] = None

    created_at: str
    updated_at: str


# =========================================================
# HELPERS
# =========================================================

async def get_course(course_id: str):
    course = await db.courses.find_one(
        {"id": course_id},
        {"_id": 0}
    )

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course


async def check_existing_payment(user_id: str, course_id: str):
    existing = await db.payments.find_one({
        "user_id": user_id,
        "course_id": course_id,
        "status": {
            "$in": [
                PaymentStatus.PENDING,
                PaymentStatus.APPROVED
            ]
        }
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Payment already exists for this course"
        )


async def create_enrollment(
    user_id: str,
    course_id: str,
    payment_id: str,
    status: PaymentStatus,
    access: bool
):
    now = datetime.now(timezone.utc).isoformat()

    await db.enrollments.update_one(
        {
            "user_id": user_id,
            "course_id": course_id
        },
        {
            "$set": {
                "payment_id": payment_id,
                "payment_status": status,
                "access_granted": access,
                "updated_at": now
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "enrolled_at": now,
                "completed_lessons": []
            }
        },
        upsert=True
    )


# =========================================================
# MANUAL PAYMENT
# =========================================================

@router.post(
    "/manual",
    response_model=PaymentResponse
)
async def submit_manual_payment(
    data: PaymentSubmit,
    current_user: dict = Depends(get_current_user)
):
    course = await get_course(data.course_id)

    await check_existing_payment(
        current_user["id"],
        data.course_id
    )

    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    payment_doc = {
        "id": payment_id,

        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "user_name": current_user.get("full_name"),

        "course_id": data.course_id,
        "course_title": course["title"],
        "course_price": course["price"],

        "proof_url": data.proof_url,
        "proof_type": data.proof_type,

        "reference": None,

        "status": PaymentStatus.PENDING,
        "admin_note": None,

        "created_at": now,
        "updated_at": now
    }

    await db.payments.insert_one(payment_doc)

    await create_enrollment(
        user_id=current_user["id"],
        course_id=data.course_id,
        payment_id=payment_id,
        status=PaymentStatus.PENDING,
        access=False
    )

    return PaymentResponse(**payment_doc)


# =========================================================
# PAYSTACK INITIALIZE
# =========================================================

@router.post("/paystack/init")
async def initialize_paystack(
    data: PaystackInit,
    current_user: dict = Depends(get_current_user)
):
    course = await get_course(data.course_id)

    await check_existing_payment(
        current_user["id"],
        data.course_id
    )

    amount = int(course["price"] * 100)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.paystack.co/transaction/initialize",
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET}",
                "Content-Type": "application/json"
            },
            json={
                "email": current_user["email"],
                "amount": amount,
                "metadata": {
                    "user_id": current_user["id"],
                    "user_email": current_user["email"],
                    "user_name": current_user.get("full_name"),
                    "course_id": data.course_id
                }
            }
        )

    res = response.json()

    if not res.get("status"):
        raise HTTPException(
            status_code=400,
            detail="Paystack initialization failed"
        )

    return {
        "authorization_url": res["data"]["authorization_url"],
        "access_code": res["data"]["access_code"],
        "reference": res["data"]["reference"]
    }


# =========================================================
# PAYSTACK WEBHOOK
# =========================================================

@router.post("/paystack/webhook")
async def paystack_webhook(request: Request):

    signature = request.headers.get("x-paystack-signature")

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Missing Paystack signature"
        )

    payload = await request.body()

    computed_signature = hmac.new(
        PAYSTACK_SECRET.encode(),
        payload,
        hashlib.sha512
    ).hexdigest()

    if computed_signature != signature:
        raise HTTPException(
            status_code=400,
            detail="Invalid Paystack signature"
        )

    event = await request.json()

    if event["event"] != "charge.success":
        return {"message": "Event ignored"}

    data = event["data"]

    reference = data["reference"]

    # Prevent duplicate processing
    existing_payment = await db.payments.find_one({
        "reference": reference
    })

    if existing_payment:
        return {"message": "Payment already processed"}

    metadata = data["metadata"]

    user_id = metadata["user_id"]
    user_email = metadata["user_email"]
    user_name = metadata.get("user_name")

    course_id = metadata["course_id"]

    course = await get_course(course_id)

    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    payment_doc = {
        "id": payment_id,

        "user_id": user_id,
        "user_email": user_email,
        "user_name": user_name,

        "course_id": course_id,
        "course_title": course["title"],
        "course_price": course["price"],

        "proof_url": None,
        "proof_type": None,

        "reference": reference,

        "status": PaymentStatus.APPROVED,
        "admin_note": None,

        "created_at": now,
        "updated_at": now
    }

    await db.payments.insert_one(payment_doc)

    await create_enrollment(
        user_id=user_id,
        course_id=course_id,
        payment_id=payment_id,
        status=PaymentStatus.APPROVED,
        access=True
    )

    return {"message": "Webhook processed successfully"}


# =========================================================
# GET MY PAYMENTS
# =========================================================

@router.get(
    "/my",
    response_model=List[PaymentResponse]
)
async def get_my_payments(
    current_user: dict = Depends(get_current_user)
):
    payments = await db.payments.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    return [PaymentResponse(**p) for p in payments]


# =========================================================
# ADMIN - GET ALL PAYMENTS
# =========================================================

@router.get(
    "/admin",
    response_model=List[PaymentResponse]
)
async def get_all_payments(
    status: Optional[PaymentStatus] = None,
    admin: dict = Depends(require_roles(UserRole.ADMIN))
):
    query = {}

    if status:
        query["status"] = status

    payments = await db.payments.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)

    return [PaymentResponse(**p) for p in payments]


# =========================================================
# ADMIN APPROVE MANUAL PAYMENT
# =========================================================

@router.put("/admin/{payment_id}/approve")
async def approve_payment(
    payment_id: str,
    admin_note: Optional[str] = None,
    admin: dict = Depends(require_roles(UserRole.ADMIN))
):
    payment = await db.payments.find_one({"id": payment_id})

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    now = datetime.now(timezone.utc).isoformat()

    await db.payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "status": PaymentStatus.APPROVED,
                "admin_note": admin_note,
                "updated_at": now
            }
        }
    )

    await db.enrollments.update_one(
        {"payment_id": payment_id},
        {
            "$set": {
                "payment_status": PaymentStatus.APPROVED,
                "access_granted": True,
                "updated_at": now
            }
        }
    )

    return {"message": "Payment approved successfully"}


# =========================================================
# ADMIN REJECT MANUAL PAYMENT
# =========================================================

@router.put("/admin/{payment_id}/reject")
async def reject_payment(
    payment_id: str,
    admin_note: Optional[str] = None,
    admin: dict = Depends(require_roles(UserRole.ADMIN))
):
    payment = await db.payments.find_one({"id": payment_id})

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    now = datetime.now(timezone.utc).isoformat()

    await db.payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "status": PaymentStatus.REJECTED,
                "admin_note": admin_note,
                "updated_at": now
            }
        }
    )

    await db.enrollments.update_one(
        {"payment_id": payment_id},
        {
            "$set": {
                "payment_status": PaymentStatus.REJECTED,
                "access_granted": False,
                "updated_at": now
            }
        }
    )

    return {"message": "Payment rejected successfully"}