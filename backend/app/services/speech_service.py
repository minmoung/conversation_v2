import os
import json
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import translate_v2 as translate
from app.config.settings import settings
from app.schemas.lesson import SpeechEvaluationResponse

# 발음 비교 도구 (필요시 추가 설치 필요)
import jellyfish  # 문자열 유사도 측정
import nltk
from nltk.tokenize import word_tokenize

# nltk 리소스 다운로드
nltk.download('punkt', quiet=True)

def evaluate_speech(audio_file_path: str, expected_text: str) -> SpeechEvaluationResponse:
    """
    사용자 음성을 평가하여 점수와 피드백 제공
    
    Args:
        audio_file_path: 사용자 음성 파일 경로
        expected_text: 예상되는 정확한 텍스트
        
    Returns:
        평가 결과 (정확도, 발음, 유창성, 전체 점수, 피드백)
    """
    # STT로 음성을 텍스트로 변환
    recognized_text = speech_to_text(audio_file_path)
    
    if not recognized_text:
        return SpeechEvaluationResponse(
            accuracy=0.0,
            pronunciation=0.0,
            fluency=0.0,
            overall_score=0.0,
            feedback="음성을 인식할 수 없습니다. 다시 시도해주세요."
        )
    
    # 텍스트 정확도 평가
    accuracy_score = calculate_accuracy(recognized_text, expected_text)
    
    # 발음 평가 (음절 단위로 비교)
    pronunciation_score = calculate_pronunciation(recognized_text, expected_text)
    
    # 유창성 평가 (속도, 쉼 등)
    fluency_score = calculate_fluency(recognized_text, expected_text)
    
    # 전체 점수 계산 (가중치 적용)
    overall_score = (accuracy_score * 0.4) + (pronunciation_score * 0.4) + (fluency_score * 0.2)
    
    # 피드백 생성
    feedback = generate_feedback(accuracy_score, pronunciation_score, fluency_score, recognized_text, expected_text)
    
    return SpeechEvaluationResponse(
        accuracy=accuracy_score,
        pronunciation=pronunciation_score,
        fluency=fluency_score,
        overall_score=overall_score,
        feedback=feedback
    )

def speech_to_text(audio_file_path: str) -> str:
    """
    Google STT API를 사용하여 음성을 텍스트로 변환
    """
    try:
        client = speech.SpeechClient()
        
        # 오디오 파일 읽기
        with open(audio_file_path, "rb") as audio_file:
            content = audio_file.read()
        
        audio = speech.RecognitionAudio(content=content)
        
        # STT 설정 (영어)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="en-US",
            enable_automatic_punctuation=True,
            model="video"  # 고품질 모델 사용
        )
        
        # 음성 인식 요청
        response = client.recognize(config=config, audio=audio)
        
        # 결과 추출
        transcripts = []
        for result in response.results:
            transcripts.append(result.alternatives[0].transcript)
        
        return " ".join(transcripts)
    
    except Exception as e:
        print(f"STT 오류: {e}")
        return ""

def calculate_accuracy(recognized_text: str, expected_text: str) -> float:
    """
    인식된 텍스트와 예상 텍스트 간의 정확도 계산
    """
    # 소문자 변환 및 공백 정규화
    recognized = recognized_text.lower().strip()
    expected = expected_text.lower().strip()
    
    # 토큰화 (단어 단위로 분리)
    recognized_tokens = word_tokenize(recognized)
    expected_tokens = word_tokenize(expected)
    
    # 정확히 일치하는 단어 수 계산
    matching_words = 0
    total_words = len(expected_tokens)
    
    for exp_word in expected_tokens:
        if exp_word in recognized_tokens:
            matching_words += 1
            # 일치하는 단어는 한 번만 카운트하기 위해 제거
            recognized_tokens.remove(exp_word)
    
    # 정확도 점수 계산 (0-100)
    if total_words == 0:
        return 0.0
    
    accuracy = (matching_words / total_words) * 100
    return min(100.0, accuracy)  # 최대 100점

def calculate_pronunciation(recognized_text: str, expected_text: str) -> float:
    """
    발음 유사도 계산
    """
    # 소문자 변환
    recognized = recognized_text.lower()
    expected = expected_text.lower()
    
    # 레벤슈타인 거리 기반 유사도 계산
    similarity = jellyfish.jaro_winkler_similarity(recognized, expected)
    
    # 유사도 점수를 0-100 범위로 변환
    pronunciation_score = similarity * 100
    
    return pronunciation_score

def calculate_fluency(recognized_text: str, expected_text: str) -> float:
    """
    유창성 점수 계산 (단순화된 버전)
    
    실제 구현에서는 음성 파일의 지속 시간, 쉼 등을 분석해야 함
    """
    # 간단한 구현: 인식된 텍스트 길이와 예상 텍스트 길이 비교
    recognized_len = len(recognized_text.split())
    expected_len = len(expected_text.split())
    
    # 길이 비율 계산
    if expected_len == 0:
        ratio = 0
    else:
        ratio = recognized_len / expected_len
    
    # 적절한 범위 내에 있으면 높은 점수, 그렇지 않으면 낮은 점수
    if 0.8 <= ratio <= 1.2:
        fluency_score = 80.0 + (20.0 * (1 - abs(1 - ratio)))
    else:
        fluency_score = 60.0 * (1 - min(1, abs(ratio - 1)))
    
    return max(0.0, min(100.0, fluency_score))

def generate_feedback(accuracy: float, pronunciation: float, fluency: float, 
                      recognized_text: str, expected_text: str) -> str:
    """
    평가 결과에 따른 맞춤형 피드백 생성
    """
    # 단어 단위로 분석하여 틀린 부분 식별
    expected_words = expected_text.lower().split()
    recognized_words = recognized_text.lower().split()
    
    # 초등학생 친화적인 피드백 생성
    feedback = []
    
    # 전체 평가에 따른 격려 메시지
    overall = (accuracy + pronunciation + fluency) / 3
    
    if overall >= 90:
        feedback.append("정말 잘했어요! 👏")
    elif overall >= 70:
        feedback.append("좋은 시도예요! 계속 연습하면 더 좋아질 거예요. 👍")
    elif overall >= 50:
        feedback.append("잘 하고 있어요! 조금만 더 연습해봐요. 😊")
    else:
        feedback.append("도전해 줘서 고마워요! 다시 한번 천천히 따라해볼까요? ⭐")
    
    # 세부 피드백
    if accuracy < 70:
        missed_words = [word for word in expected_words if word not in recognized_words]
        if missed_words:
            feedback.append(f"'{', '.join(missed_words[:3])}' 단어를 연습해보세요.")
    
    if pronunciation < 70:
        feedback.append("발음을 조금 더 또렷하게 해보세요.")
    
    if fluency < 70:
        feedback.append("조금 더 자연스럽게 말해보세요. 너무 빠르거나 느리지 않게요.")
    
    return " ".join(feedback)