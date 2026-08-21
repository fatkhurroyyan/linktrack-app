import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LinkSense AI (LinkTrack-App)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./linktrack.db"
    
    # AI Models (Gemini API)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.7-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.5-flash"
    
    # Optional API Keys
    GOOGLE_DRIVE_API_KEY: Optional[str] = None
    GITHUB_TOKEN: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    # SSRF & Security
    ALLOWED_SCHEMES: list[str] = ["http", "https"]
    MAX_SCRAPE_CHARS: int = 12000
    REQUEST_TIMEOUT_SECONDS: float = 12.0
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
