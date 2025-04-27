from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, lessons
from app.config.settings import settings

app = FastAPI(
    title="영어회화 AI API",
    description="초등학생도 이용 가능한 영어회화 AI 백엔드 API",
    version="0.1.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router, prefix="/api/auth", tags=["인증"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["학습"])

@app.get("/")
async def root():
    return {"message": "영어회화 AI API에 오신 것을 환영합니다!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)