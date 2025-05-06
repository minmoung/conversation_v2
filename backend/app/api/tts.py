from gtts import gTTS
import io

def text_to_speech(text: str):
    tts = gTTS(text, lang="en")
    audio_bytes = io.BytesIO()
    tts.write_to_fp(audio_bytes)
    audio_bytes.seek(0)
    return audio_bytes