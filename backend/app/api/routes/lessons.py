from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from app.api.tts import text_to_speech
from app.api.tts import text_to_speech_with_pydub
from app.api.AI_model_DS import  generate_response
from pydantic import BaseModel
from typing import Optional
from google.cloud import texttospeech
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
    lessons = db.query(Lesson).filter(Lesson.is_active == True).all()
    print("lessons: ", lessons);
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

# class TextRequest(BaseModel):
#     text: str


# @router.post("/tts")
# def tts(req: TextRequest):
#     """
#     텍스트를 음성으로 변환하는 TTS 엔드포인트
#     """
    
#     print("req.text  :: " , req.text)
#     audio_data = text_to_speech_with_pydub(req.text)
#     return Response(content=audio_data.read(), media_type="audio/mpeg")



# 요청 모델 수정
class TextRequest(BaseModel):
    text: str
    emotion: Optional[str] = "friendly"
    useSSML: Optional[bool] = False

# Google Cloud TTS 클라이언트 초기화
try:
    # 환경변수가 설정되어 있으면 자동으로 인증
    # 인증을 위해서는 Google Cloud Platform 에 접속하여 키를 발급받고
    # 해당 키 파일을 cmd로 등록한다.
    # set GOOGLE_APPLICATION_CREDENTIALS=D:\conversation_v2\backend\app\api\routes\ssml-key.json
    client = texttospeech.TextToSpeechClient()
    print("Google Cloud 인증 성공 (환경변수)")
except Exception as e:
    print(f"환경변수 인증 실패: {e}")
    client = None

# 감정별 음성 설정
VOICE_SETTINGS = {
    "happy": {
        "name": "en-US-Neural2-F",
        "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE,
        "pitch": 2.0,
        "speaking_rate": 1.1
    },
    "excited": {
        "name": "en-US-Neural2-F", 
        "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE,
        "pitch": 4.0,
        "speaking_rate": 1.2
    },
    "calm": {
        "name": "en-US-Neural2-D",
        "ssml_gender": texttospeech.SsmlVoiceGender.MALE,
        "pitch": 0.0,
        "speaking_rate": 0.9
    },
    "friendly": {
        "name": "en-US-Neural2-F",
        "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE,
        "pitch": 1.0,
        "speaking_rate": 1.0
    },
    "sad": {
        "name": "en-US-Neural2-D",
        "ssml_gender": texttospeech.SsmlVoiceGender.MALE,
        "pitch": -2.0,
        "speaking_rate": 0.8
    },
    "angry": {
        "name": "en-US-Neural2-D",
        "ssml_gender": texttospeech.SsmlVoiceGender.MALE,
        "pitch": 1.0,
        "speaking_rate": 1.1
    },
    "surprised": {
        "name": "en-US-Neural2-F",
        "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE,
        "pitch": 3.0,
        "speaking_rate": 1.3
    },
    "encouraging": {
        "name": "en-US-Neural2-F",
        "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE,
        "pitch": 1.0,
        "speaking_rate": 1.0
    }
}

def text_to_speech_with_emotion(text: str, emotion: str = "friendly", use_ssml: bool = False):
    """
    감정이 포함된 TTS 생성 함수
    """
    try:
        # 감정 설정 가져오기 (기본값: friendly)
        voice_config = VOICE_SETTINGS.get(emotion, VOICE_SETTINGS["friendly"])
        
        print(f"TTS 요청 - 텍스트: {text}, 감정: {emotion}, SSML 사용: {use_ssml}")
        
        # 음성 설정
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name=voice_config["name"],
            ssml_gender=voice_config["ssml_gender"]
        )
        
        # 오디오 설정
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            pitch=voice_config["pitch"],
            speaking_rate=voice_config["speaking_rate"],
            effects_profile_id=["telephony-class-application"]
        )
        
        # 입력 텍스트 설정 (SSML 또는 일반 텍스트)
        if use_ssml:
            synthesis_input = texttospeech.SynthesisInput(ssml=text)
        else:
            synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # TTS 요청
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content
        
    except Exception as e:
        print(f"TTS 생성 오류: {e}")
        # 오류 발생 시 기본 TTS로 fallback
        return text_to_speech_with_pydub(text)

@router.post("/tts")
def tts(req: TextRequest):
    """
    감정이 포함된 텍스트를 음성으로 변환하는 TTS 엔드포인트
    """
    print(f"TTS 요청 데이터: {req}")
    print(f"텍스트: {req.text}")
    print(f"감정: {req.emotion}")
    print(f"SSML 사용: {req.useSSML}")
    
    # 감정이 포함된 TTS 생성
    audio_data = text_to_speech_with_emotion(
        text=req.text,
        emotion=req.emotion,
        use_ssml=req.useSSML
    )
    
    return Response(
        content=audio_data,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "attachment; filename=tts_output.mp3"
        }
    )

# 기존 함수와의 호환성을 위한 래퍼 (필요한 경우)
def text_to_speech_with_pydub(text: str):
    """
    기존 TTS 함수 (호환성을 위해 유지)
    """
    # 여기에 기존 pydub를 사용한 TTS 로직을 넣으세요
    # 또는 기본 감정으로 새 함수를 호출
    #return original_tts_function(text)  # 직접 호출
    print(text);
    return



def original_tts_function(text: str):
    # 여기에 원래 사용하던 TTS 코드를 복사하세요
    # 예: pydub, gTTS, pyttsx3 등
    pass



@router.post("/chat")
def chat(req: TextRequest):
    print("👉 Received request:", req)
    print("📥 Input text:", req.text)

    reply = generate_response(req.text)
    print("📤 Generated reply:", reply)

    return {"reply": reply}