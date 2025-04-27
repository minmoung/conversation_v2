import os
from google.cloud import texttospeech
import uuid
from app.config.settings import settings

# 오디오 파일 저장 경로
AUDIO_DIR = "audio_files"
os.makedirs(AUDIO_DIR, exist_ok=True)

def get_tts_audio(text: str, speed: float = 1.0, language_code: str = "en-US") -> str:
    """
    Google Cloud TTS API를 사용하여 음성 파일 생성
    
    Args:
        text: 음성으로 변환할 텍스트
        speed: 음성 속도 조절 (기본 1.0, 작을수록 느림)
        language_code: 언어 코드
        
    Returns:
        생성된 오디오 파일 경로
    """
    try:
        # 클라이언트 초기화
        client = texttospeech.TextToSpeechClient()
        
        # 입력 텍스트 설정
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # 음성 설정
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        
        # 오디오 설정
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speed  # 속도 조절
        )
        
        # TTS 요청 및 응답 생성
        response = client.synthesize_speech(
            input=synthesis_input, 
            voice=voice, 
            audio_config=audio_config
        )
        
        # 파일명 생성 및 저장
        filename = f"{uuid.uuid4()}.mp3"
        file_path = os.path.join(AUDIO_DIR, filename)
        
        with open(file_path, "wb") as out:
            out.write(response.audio_content)
        
        # 상대 경로 반환
        return f"/audio/{filename}"
    
    except Exception as e:
        # 오류 처리 - 실제 환경에서는 로깅 추가
        print(f"TTS 오류: {e}")
        return None

# 속도 조절된 대화 생성 (초등학생을 위한 천천히 말하기 기능)
def get_slow_tts_audio(text: str, language_code: str = "en-US") -> str:
    """
    느린 속도로 TTS 오디오 생성 (초등학생용)
    """
    return get_tts_audio(text, speed=0.7, language_code=language_code)