import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "cybershield-kalam-innovista-2026-secure-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'cybershield.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS Origin configuration
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Security limits
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB max request payload
    REQUEST_TIMEOUT_SECONDS = 5
    
    # Model storage path
    MODEL_DIR = BASE_DIR / "ml" / "models"
    
    # External threat intelligence adapter (Optional - reads exclusively from env)
    GOOGLE_SAFE_BROWSING_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", None)
    VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", None)
    
    # SSRF Protection
    ALLOWED_SCHEMES = {"http", "https"}
    MAX_REDIRECTS = 3
    CONNECT_TIMEOUT = 3.0
    READ_TIMEOUT = 3.0
