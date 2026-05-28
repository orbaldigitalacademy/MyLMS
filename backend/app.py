from fastapi import FastAPI
from app.api.router import api_router
from app.db.mongo import connect_to_mongo, close_mongo_connection
from pymongo import MongoClient
from app.services.cloudinary import configure_cloudinary
from app.core.config import APP_NAME, APP_VERSION, CORS_ORIGINS
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=APP_NAME, version=APP_VERSION)

@app.on_event("startup")
async def startup():
    await connect_to_mongo()
    configure_cloudinary()

@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS.split(",") if CORS_ORIGINS else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

