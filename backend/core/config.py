from pathlib import Path
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# App
APP_NAME = "Naija LMS API"
APP_VERSION = "1.0.0"

# Security
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Mongo
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

# Cloudinary
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY")

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")


