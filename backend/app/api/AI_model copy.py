from transformers import AutoModelForCausalLM, AutoTokenizer

# 설치명령어 pip install torch==2.5.1+cu121 torchvision==0.20.1+cu121 torchaudio==2.5.1+cu121 --index-url https://download.pytorch.org/whl/cu121
import torch

# 디바이스 확인
device = "cuda" if torch.cuda.is_available() else "cpu"
print("CUDA available:", torch.cuda.is_available())
if device == "cuda":
    free_mem, total_mem = torch.cuda.mem_get_info()
    print(f"GPU memory: {free_mem / 1024**3:.2f} GB free / {total_mem / 1024**3:.2f} GB total")

# Zephyr 모델로 변경
model_name = "HuggingFaceH4/zephyr-7b-alpha"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
)

# 응답 생성 함수
def generate_response(user_input: str) -> str:
    # Zephyr는 ChatML 포맷을 사용
    messages = [
        {"role": "system", "content": "You are a helpful and friendly AI assistant."},
        {"role": "user", "content": user_input},
    ]

    # Chat 템플릿 적용
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    # 응답 생성
    outputs = model.generate(
        **inputs,
        max_new_tokens=100,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )

    # 전체 응답 디코딩 후, assistant 답변만 추출
    decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
    reply = decoded.split(messages[-1]["content"])[-1].strip()

    print("✅ Response ready.")
    return reply

# 테스트
if __name__ == "__main__":
    while True:
        user_text = input("👤 User: ")
        if user_text.lower() in ["exit", "quit"]:
            break
        reply = generate_response(user_text)
        print("🤖 Zephyr:", reply)
