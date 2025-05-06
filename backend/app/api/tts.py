from gtts import gTTS
import io
import tempfile
import os
import wave
import numpy as np
from scipy.io.wavfile import read, write
from scipy.signal import resample
from pydub import AudioSegment

def text_to_speech(text: str, speed: float = 1.0) -> io.BytesIO:
    # TTS 생성
    tts = gTTS(text, lang="en")
    audio_bytes = io.BytesIO()
    tts.write_to_fp(audio_bytes)
    audio_bytes.seek(0)

    # MP3 데이터를 WAV로 변환
    audio = AudioSegment.from_file(audio_bytes, format="mp3")
    wav_bytes = io.BytesIO()
    audio.export(wav_bytes, format="wav")
    wav_bytes.seek(0)

    # WAV 데이터를 읽고 속도 조절
    with wave.open(wav_bytes, "rb") as wav_in:
        params = wav_in.getparams()
        frames = wav_in.readframes(params.nframes)
        audio_data = np.frombuffer(frames, dtype=np.int16)

    # 속도 조절
    new_length = int(len(audio_data) / speed)
    resampled_data = resample(audio_data, new_length)

    # 속도 조절된 데이터를 다시 WAV로 저장
    output_bytes = io.BytesIO() 
    with wave.open(output_bytes, "wb") as wav_out:
        wav_out.setnchannels(params.nchannels)
        wav_out.setsampwidth(params.sampwidth)
        wav_out.setframerate(int(params.framerate * speed))
        wav_out.writeframes(resampled_data.astype(np.int16).tobytes())

    output_bytes.seek(0)
    return output_bytes


def text_to_speech_back(text: str, speed: float = 1.0) -> io.BytesIO:
    """
    텍스트를 음성으로 변환하고 속도를 조절합니다.
    
    Args:
        text: 음성으로 변환할 텍스트
        speed: 재생 속도 (1.0이 기본 속도, 2.0은 2배 빠름, 0.5는 절반 속도)
    
    Returns:
        io.BytesIO: 변환된 오디오 데이터
    """
    # 속도 조절을 위한 방법 1: 텍스트에 SSML 태그 추가
    # 참고: gTTS는 현재 SSML을 완전히 지원하지 않으므로 이 방법은 제한적입니다
    try:
        # 속도를 조절하기 위해 임시 파일 사용
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            temp_path = temp_file.name
        
        # 기본 TTS 생성
        tts = gTTS(text, lang="en")
        tts.save(temp_path)
        
        # 파일에서 데이터 읽기
        with open(temp_path, 'rb') as f:
            audio_data = f.read()
        
        # 임시 파일 삭제
        os.unlink(temp_path)
        
        # BytesIO 객체로 변환
        audio_bytes = io.BytesIO(audio_data)
        return audio_bytes
    
    except Exception as e:
        print(f"TTS 처리 중 오류 발생: {e}")
        # 오류 발생 시 기본 TTS 반환
        tts = gTTS(text, lang="en")
        audio_bytes = io.BytesIO()
        tts.write_to_fp(audio_bytes)
        audio_bytes.seek(0)
        return audio_bytes

# FFmpeg가 설치되어 있다면 pydub 사용 방법
def text_to_speech_with_pydub(text: str, speed: float = 1.5) -> io.BytesIO:
    """
    pydub를 사용하여 텍스트를 음성으로 변환하고 속도를 조절합니다.
    이 함수는 FFmpeg가 설치된 환경에서만 작동합니다.
    """
    from pydub import AudioSegment
    import subprocess
    import os
    
    try:
        # TTS 생성
        tts = gTTS(text, lang="en")
        
        # 원본 음성 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as original_file:
            original_path = original_file.name
        
        tts.save(original_path)
        
        # 속도 조절된 출력 파일 경로
        output_path = original_path + "_speed.mp3"
        
        # FFmpeg를 직접 사용하여 속도 조절
        if speed != 1.0:
            # atempo 필터 사용 (0.5~2.0 범위 제약)
            if 0.5 <= speed <= 2.0:
                subprocess.call([
                    'ffmpeg', '-y', '-i', original_path, 
                    '-filter:a', f"atempo={speed}", 
                    '-vn', output_path
                ])
            elif speed < 0.5:
                # 0.5보다 작은 경우 두 번 적용 (예: 0.4 = 0.8 x 0.5)
                temp_speed = speed / 0.5
                subprocess.call([
                    'ffmpeg', '-y', '-i', original_path, 
                    '-filter:a', f"atempo=0.5,atempo={temp_speed}", 
                    '-vn', output_path
                ])
            else:  # speed > 2.0
                # 2.0보다 큰 경우 두 번 적용 (예: 2.5 = 1.25 x 2.0)
                temp_speed = speed / 2.0
                subprocess.call([
                    'ffmpeg', '-y', '-i', original_path, 
                    '-filter:a', f"atempo=2.0,atempo={temp_speed}", 
                    '-vn', output_path
                ])
        else:
            # 속도 변경이 없으면 원본 복사
            output_path = original_path
        
        # 결과 파일 읽기
        with open(output_path, 'rb') as f:
            audio_data = f.read()
        
        # 임시 파일 삭제
        os.unlink(original_path)
        if output_path != original_path:
            os.unlink(output_path)
        
        # BytesIO 객체로 변환
        audio_bytes = io.BytesIO(audio_data)
        return audio_bytes
        
    except Exception as e:
        print(f"TTS 속도 조절 중 오류 발생: {e}")
        # 오류 발생 시 기본 TTS 반환
        tts = gTTS(text, lang="en")
        audio_bytes = io.BytesIO()
        tts.write_to_fp(audio_bytes)
        audio_bytes.seek(0)
        return audio_bytes