import os
from typing import List
from pydantic import BaseSettings

class Settings(BaseSettings):
    # 기본 설정
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "영어회화 AI"
    
    # 데이터베이스 설정
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # JWT 설정
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24시간
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7일
    
    # CORS 설정
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite 기본 포트
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # 누락된 설정 추가
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Google Cloud 설정 (TTS 용)
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()