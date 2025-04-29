from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import tempfile

from app.api.deps import get_db, get_current_user
from app.db.models import Lesson, UserProgress, User
from app.schemas.lesson import (
    LessonSummary, 
    LessonContent, 
    UserProgressUpdate, 
    UserProgressResponse,
    SpeechEvaluationResponse
)
from app.services.speech_service import evaluate_speech
from app.services.tts_service import get_tts_audio

router = APIRouter()

@router.get("/", response_model=List[LessonSummary])
def get_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용 가능한 모든 레슨 목록 조회
    """
    print(" ======= call lessons ======")
    lessons = db.query(Lesson).filter(Lesson.is_active == True).all()
    return lessons

@router.get("/{lesson_id}", response_model=LessonContent)
def get_lesson_by_id(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    특정 레슨의 상세 내용 조회
    """
    print(" ======= call lesson by id ======")
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active == True).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레슨을 찾을 수 없습니다."
        )
    
    # 사용자의 레슨 진행 상황 업데이트 (마지막 접속 시간)
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id == lesson_id
    ).first()
    
    if not user_progress:
        # 처음 접속하는 경우 진행 상황 생성
        user_progress = UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            progress=0.0,
            score=0.0
        )
        db.add(user_progress)
        db.commit()
    
    return lesson

@router.get("/tts/{lesson_id}/{dialogue_id}")
def get_lesson_audio(
    lesson_id: str,
    dialogue_id: str,
    speed: float = 1.0,  # 속도 조절 파라미터
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    레슨 대화의 TTS 오디오 생성
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레슨을 찾을 수 없습니다."
        )
    
    dialogue = next((d for d in lesson.dialogues if d.id == dialogue_id), None)
    if not dialogue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="대화를 찾을 수 없습니다."
        )
    
    # TTS 생성 (speed 파라미터 전달)
    audio_path = get_tts_audio(dialogue.teacher_line, speed=speed)
    
    return {"audio_url": audio_path}

@router.post("/{lesson_id}/evaluate", response_model=SpeechEvaluationResponse)
async def evaluate_user_speech(
    lesson_id: str,
    audio: UploadFile = File(...),
    dialogue_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자 음성 녹음 평가
    """
    # 레슨 및 대화 확인
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레슨을 찾을 수 없습니다."
        )
    
    dialogue = next((d for d in lesson.dialogues if d.id == dialogue_id), None)
    if not dialogue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="대화를 찾을 수 없습니다."
        )
    
    # 임시 파일로 오디오 저장
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file_path = temp_file.name
        content = await audio.read()
        temp_file.write(content)
    
    try:
        # 음성 평가 서비스 호출
        evaluation_result = evaluate_speech(
            temp_file_path, 
            dialogue.student_line
        )
        
        return evaluation_result
    finally:
        # 임시 파일 삭제
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.post("/{lesson_id}/progress", response_model=UserProgressResponse)
def save_user_progress(
    lesson_id: str,
    progress_data: UserProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자의 레슨 진행 상황 저장
    """
    # 레슨 확인
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레슨을 찾을 수 없습니다."
        )
    
    # 사용자 진행 상황 업데이트
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id == lesson_id
    ).first()
    
    if not user_progress:
        # 새 진행 상황 생성
        user_progress = UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            progress=progress_data.progress,
            score=progress_data.score,
            completed=progress_data.progress >= 1.0
        )
        db.add(user_progress)
    else:
        # 기존 진행 상황 업데이트 (최고 점수 유지)
        user_progress.progress = max(user_progress.progress, progress_data.progress)
        user_progress.score = max(user_progress.score, progress_data.score)
        user_progress.completed = user_progress.progress >= 1.0
    
    db.commit()
    db.refresh(user_progress)
    
    return UserProgressResponse(
        lesson_id=lesson_id,
        progress=user_progress.progress,
        score=user_progress.score,
        completed=user_progress.completed
    )


@router.get("/user/progress", response_model=List[UserProgressResponse])
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자의 모든 레슨 진행 상황 조회
    """
    progress_list = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).all()
    
    return progress_list