import os
import hmac
import base64
import hashlib
import asyncio
from datetime import datetime
import qrcode
import tempfile
import cloudinary.uploader

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from reportlab.lib.pdfencrypt import StandardEncryption
import uuid
from datetime import datetime

SECRET_KEY = os.getenv("URL_SIGNING_KEY")
CERT_SECRET = os.getenv("CERT_SECRET")
BASE_URL = os.getenv("BASE_URL")


def generate_hash(user_id, course_id, cert_id):
    raw = f"{user_id}-{course_id}-{cert_id}-{CERT_SECRET}"
    return hashlib.sha256(raw.encode()).hexdigest()


def generate_signed_url(cert_id):
    signature = hmac.new(SECRET_KEY.encode(), cert_id.encode(), hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(signature).decode()
    return f"{BASE_URL}/api/certificates/verify/{cert_id}?token={token}"


def verify_signature(cert_id, token):
    expected = hmac.new(SECRET_KEY.encode(), cert_id.encode(), hashlib.sha256).digest()
    expected_token = base64.urlsafe_b64encode(expected).decode()
    return hmac.compare_digest(expected_token, token)


def generate_qr(url):
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    img = qrcode.make(url)
    img.save(tmp.name)
    return tmp.name


async def generate_pdf(user_name, course_title, cert_id, qr_path):
    tmp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")

    encrypt = StandardEncryption(
        userPassword="",
        ownerPassword=os.getenv("PDF_OWNER_PASSWORD", "OWNER_SECRET"),
        canPrint=1,
        canModify=0,
        canCopy=0
    )

    doc = SimpleDocTemplate(tmp_pdf.name, pagesize=landscape(A4), encrypt=encrypt)

    styles = getSampleStyleSheet()
    title = ParagraphStyle(name="title", fontSize=30, alignment=TA_CENTER)
    body = ParagraphStyle(name="body", fontSize=16, alignment=TA_CENTER)

    elements = []
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("CERTIFICATE OF COMPLETION", title))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"<b>{user_name}</b>", title))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Completed: {course_title}", body))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"ID: {cert_id}", body))
    elements.append(Spacer(1, 20))
    elements.append(Image(qr_path, width=1.5*inch, height=1.5*inch))

    doc.build(elements)
    return tmp_pdf.name


async def generate_and_upload_certificate(user, course):
    cert_id = str(hashlib.md5(f"{user['id']}-{course['id']}".encode()).hexdigest())

    cert_hash = generate_hash(user["id"], course["id"], cert_id)
    verify_url = generate_signed_url(cert_id)

    qr_path = generate_qr(verify_url)
    pdf_path = await generate_pdf(user["full_name"], course["title"], cert_id, qr_path)

    upload = cloudinary.uploader.upload(pdf_path, resource_type="raw", folder="certificates")

    os.remove(qr_path)
    os.remove(pdf_path)

    return {
        "id": cert_id,
        "user_id": user["id"],
        "course_id": course["id"],
        "course_title": course["title"],
        "user_name": user["full_name"],
        "issued_at": datetime.utcnow().isoformat(),
        "certificate_url": upload["secure_url"],
        "verification_hash": cert_hash,
        "token": verify_url.split("token=")[1],
        "is_valid": True
    }

async def generate_certificate(user, course):
    cert_id = str(uuid.uuid4())

    file_path, cert_hash = await generate_certificate_pdf(
        user["full_name"],
        course["title"],
        cert_id,
        user["id"],
        course["id"]
    )

    return {
        "id": cert_id,
        "file_path": file_path,
        "hash": cert_hash,
        "issued_at": datetime.utcnow().isoformat()
    }

