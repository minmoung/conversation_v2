from typing import Optional
import os
import requests
import json

# 환경 변수에서 API 키를 가져오거나 직접 설정
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-c9d6142f97294961bcfceb7a5e0da3c9")

# 초등학생을 위한 영어 선생님 프롬프트
TEACHER_PROMPT = """너는 영어를 가르치는 초등학생 1학년 선생님이야. 다음 지침을 따라주세요:

1. 아이들에게 친근하고 따뜻한 말투로 대화해주세요.
2. 최대한 쉬운 단어와 짧은 문장을 사용해 설명해주세요.
3. 답변은 가능하면 20단어를 넘지 않도록 간결하게 해주고 두 문장 이상은 답변하지마세요.
4. 아이가 잘못된 단어나 발음을 사용하면 부드럽게 교정해주세요.
5. 어려운 단어가 나오면 간단한 설명이나 예시를 함께 알려주세요.
6. 아이들이 질문할 때는 인내심을 가지고 격려하며 대답해주세요.
7. 영어 학습에 재미를 느낄 수 있도록 긍정적인 피드백을 주세요.
8. 이모티콘은 사용하지 마세요. (예: 😊, 👍, ⭐)
9. 폭력적이거나 부적절한 내용에 관한 질문은 다른 주제로 부드럽게 전환해주세요.
10. 대화는 영어로만 진행해주세요. (예: "What is your name?" -> "My name is ...")

항상 아이들의 호기심을 존중하고 배움의 즐거움을 느낄 수 있도록 도와주세요!"""


# 너는 영어를 가르치는 초등학생 1학년 선생님이야. 다음 지침을 따라주세요:

# 1. 아이들에게 친근하고 따뜻한 말투로 대화해주세요.
# 2. 최대한 쉬운 단어와 짧은 문장을 사용해 설명해주세요.
# 3. 답변은 가능하면 20단어를 넘지 않도록 간결하게 해주세요.
# 4. 아이가 잘못된 단어나 발음을 사용하면 부드럽게 교정해주세요.
# 5. 어려운 단어가 나오면 간단한 설명이나 예시를 함께 알려주세요.
# 6. 아이들이 질문할 때는 인내심을 가지고 격려하며 대답해주세요.
# 7. 영어 학습에 재미를 느낄 수 있도록 긍정적인 피드백을 주세요.
# 8. 아이들의 수준에 맞게 쉬운 영어 표현부터 가르쳐주세요.
# 9. 이모티콘을 적절히 사용해 친근감을 높여주세요. (예: 😊, 👍, ⭐)
# 10. 폭력적이거나 부적절한 내용에 관한 질문은 다른 주제로 부드럽게 전환해주세요.
# 11. 대화는 영어로만 진행해주세요. (예: "What is your name?" -> "My name is ...")

# 항상 아이들의 호기심을 존중하고 배움의 즐거움을 느낄 수 있도록 도와주세요!


class EnglishTeacher:
    def __init__(self, api_key: str, system_prompt: str):
        self.api_key = api_key
        self.system_prompt = system_prompt
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
    def generate_response(self, user_input: str) -> str:
        """사용자 입력에 대한 응답을 생성합니다."""
        try:
            payload = {
                "model": "deepseek-chat",  # Deepseek의 적절한 모델명으로 대체하세요 (deepseek-chat, deepseek-coder 등)
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_input}
                ],
                "temperature": 0.7,  # 창의성과 일관성의 균형을 위한 온도 설정
                "max_tokens": 150,  # 응답 길이 제한
            }
            
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            response.raise_for_status()  # HTTP 오류 발생 시 예외 발생
            response_data = response.json()
            
            return response_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Error generating response: {e}")
            return "죄송해요, 지금은 대답하기 어려워요. 다시 물어봐 주세요. 😊"

# 메인 함수 - lessons.py에서 호출될 함수
def generate_response(text: str) -> str:
    """
    사용자 입력을 받아 AI 응답을 생성합니다.
    lessons.py의 chat 함수에서 호출됩니다.
    """
    teacher = EnglishTeacher(DEEPSEEK_API_KEY, TEACHER_PROMPT)
    response = teacher.generate_response(text)
    return response

# 모듈이 직접 실행될 때 테스트용 코드
if __name__ == "__main__":
    # 테스트 입력 예시
    test_inputs = [
        "Hello teacher, how are you?",
        "What is apple in English?",
        "I don't understand homework"
    ]
    
    teacher = EnglishTeacher(DEEPSEEK_API_KEY, TEACHER_PROMPT)
    
    for input_text in test_inputs:
        print(f"\n사용자: {input_text}")
        response = teacher.generate_response(input_text)
        print(f"선생님: {response}")