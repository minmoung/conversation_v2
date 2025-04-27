# 영어회화 AI 백엔드

초등학생을 위한 영어회화 AI 애플리케이션의 백엔드 API 서버입니다.

## 기능

- JWT 기반 사용자 인증 (로그인/회원가입)
- 레슨 콘텐츠 제공
- Google TTS를 활용한 음성 합성 (속도 조절 기능 포함)
- 사용자 영어 발음 평가 및 피드백 제공
- 학습 진행 상황 저장 및 조회

## 시작하기

### 요구사항

- Python 3.8+
- Google Cloud 계정 및 API 키 (TTS, STT 사용)

### 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd backend
```

2. 가상 환경 생성 및 활성화
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. 의존성 설치
```bash
pip install -r requirements.txt
```

4. `.env` 파일 설정
```bash
# .env 파일 생성 및 환경 변수 설정
cp .env.example .env
# 편집기로 .env 파일 수정
```

5. 데이터베이스 마이그레이션
```bash
alembic upgrade head
```

6. 서버 실행
```bash
uvicorn app.main:app --reload
```

## API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 주요 API 엔드포인트

### 인증

- POST `/api/auth/register` - 회원가입
- POST `/api/auth/login` - 로그인
- POST `/api/auth/refresh` - 액세스 토큰 갱신
- POST `/api/auth/logout` - 로그아웃
- GET `/api/auth/profile` - 사용자 프로필 조회

### 레슨

- GET `/api/lessons` - 모든 레슨 목록 조회
- GET `/api/lessons/{lesson_id}` - 특정 레슨 상세 조회
- POST `/api/lessons/{lesson_id}/evaluate` - 음성 평가
- POST `/api/lessons/{lesson_id}/progress` - 학습 진행 상황 저장
- GET `/api/user/progress` - 사용자 진행 상황 조회

## 개발

### 테스트 실행

```bash
pytest
```

### 코드 포맷팅

```bash
black app tests
```