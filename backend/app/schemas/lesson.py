from pydantic import BaseModel
from typing import List, Optional

class DialogueBase(BaseModel):
    id: str
    teacher_line: str
    student_line: str

class Dialogue(DialogueBase):
    pass

    class Config:
        orm_mode = True

class LessonBase(BaseModel):
    id: str
    title: str
    teacher_character: str

class LessonCreate(LessonBase):
    description: Optional[str] = None
    difficulty_level: int = 1

class LessonContent(LessonBase):
    dialogues: List[Dialogue]

    class Config:
        orm_mode = True

class LessonSummary(LessonBase):
    description: Optional[str] = None
    difficulty_level: int = 1
    
    class Config:
        orm_mode = True

class UserProgressUpdate(BaseModel):
    progress: float
    score: float

class UserProgressResponse(BaseModel):
    lesson_id: str
    progress: float
    score: float
    completed: bool
    
    class Config:
        orm_mode = True

class SpeechEvaluationResponse(BaseModel):
    accuracy: float
    pronunciation: float
    fluency: float
    overall_score: float
    feedback: str