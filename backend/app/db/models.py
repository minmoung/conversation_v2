from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 정의
    progress = relationship("UserProgress", back_populates="user")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    difficulty_level = Column(Integer, default=1)
    teacher_character = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 정의
    dialogues = relationship("Dialogue", back_populates="lesson")
    progress = relationship("UserProgress", back_populates="lesson")

class Dialogue(Base):
    __tablename__ = "dialogues"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    teacher_line = Column(Text, nullable=False)
    student_line = Column(Text, nullable=False)
    audio_file = Column(String(255), nullable=True)  # 선생님 음성 파일 경로
    sequence = Column(Integer, default=0)  # 대화 순서
    
    # 관계 정의
    lesson = relationship("Lesson", back_populates="dialogues")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    progress = Column(Float, default=0.0)  # 0.0 ~ 1.0 (0% ~ 100%)
    score = Column(Float, default=0.0)  # 0.0 ~ 100.0
    completed = Column(Boolean, default=False)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 정의
    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())