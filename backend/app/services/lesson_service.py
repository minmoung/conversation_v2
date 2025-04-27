from sqlalchemy.orm import Session
from app.db.models import Lesson, Dialogue, UserProgress
from typing import List, Optional
from app.schemas.lesson import LessonCreate

def get_all_lessons(db: Session):
    """
    활성화된 모든 레슨 조회
    """
    return db.query(Lesson).filter(Lesson.is_active == True).all()

def get_lesson_by_id(db: Session, lesson_id: str) -> Optional[Lesson]:
    """
    ID로 레슨 조회
    """
    return db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active == True).first()

def create_lesson(db: Session, lesson_data: LessonCreate) -> Lesson:
    """
    새 레슨 생성
    """
    db_lesson = Lesson(
        id=lesson_data.id,
        title=lesson_data.title,
        description=lesson_data.description,
        difficulty_level=lesson_data.difficulty_level,
        teacher_character=lesson_data.teacher_character
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

def add_dialogue_to_lesson(
    db: Session, 
    lesson_id: str, 
    teacher_line: str, 
    student_line: str, 
    sequence: int
) -> Dialogue:
    """
    레슨에 대화 추가
    """
    dialogue = Dialogue(
        id=f"d{sequence}",
        lesson_id=lesson_id,
        teacher_line=teacher_line,
        student_line=student_line,
        sequence=sequence
    )
    db.add(dialogue)
    db.commit()
    db.refresh(dialogue)
    return dialogue

def get_user_progress(db: Session, user_id: int) -> List[UserProgress]:
    """
    사용자의 모든 학습 진행 상황 조회
    """
    return db.query(UserProgress).filter(UserProgress.user_id == user_id).all()

def get_user_lesson_progress(db: Session, user_id: int, lesson_id: str) -> Optional[UserProgress]:
    """
    특정 레슨에 대한 사용자의 진행 상황 조회
    """
    return db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.lesson_id == lesson_id
    ).first()

def update_user_progress(
    db: Session, 
    user_id: int, 
    lesson_id: str, 
    progress: float, 
    score: float
) -> UserProgress:
    """
    사용자 학습 진행 상황 업데이트
    """
    user_progress = get_user_lesson_progress(db, user_id, lesson_id)
    
    if not user_progress:
        # 새 진행 상황 생성
        user_progress = UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            progress=progress,
            score=score,
            completed=progress >= 1.0
        )
        db.add(user_progress)
    else:
        # 기존 진행 상황 업데이트 (최고 점수 유지)
        user_progress.progress = max(user_progress.progress, progress)
        user_progress.score = max(user_progress.score, score)
        user_progress.completed = user_progress.progress >= 1.0
    
    db.commit()
    db.refresh(user_progress)
    
    return user_progress