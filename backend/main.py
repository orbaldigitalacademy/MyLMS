from fastapi import FastAPI
from database import db, client
from fastapi.middleware.cors import CORSMiddleware


# Routers
from routers import courses, lessons, payments, certificate, users, admin, live_classes
from core import auth
from seedAdmin import create_admin_if_not_exists
from routers.live_classes import router as live_classes_router
from utils.scheduler import start_scheduler
import asyncio

app = FastAPI(title="Orbal Digital Academy")
app.include_router(live_classes_router, prefix="/api", tags=["Live Classes"])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include routers with prefix
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(certificate.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth")

# Startup
@app.on_event("startup")
async def startup():
    await create_admin_if_not_exists(db)

# Shutdown
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()