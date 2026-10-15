import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = ROOT_DIR / 'frontend'

# Load environment variables from .env if present
load_dotenv(BACKEND_DIR / '.env')
load_dotenv(ROOT_DIR / '.env')

class Config:
    PORT = int(os.environ.get('PORT', 5000))
    SECRET_KEY = os.environ.get('SECRET_KEY', 'pharmanear-super-secret-key-2026-prod')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', '').strip()

    # Database URL handling
    raw_db_url = os.environ.get('DATABASE_URL', '').strip()
    if raw_db_url:
        if raw_db_url.startswith("postgres://"):
            raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        # Fall back to SQLite
        os.makedirs(BACKEND_DIR / 'instance', exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{BACKEND_DIR / 'instance' / 'pharmanear.db'}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = str(BACKEND_DIR / 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    FRONTEND_FOLDER = str(FRONTEND_DIR)
