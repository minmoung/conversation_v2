from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings

# 데이터베이스 엔진 생성
engine = create_engine(
    settings.DATABASE_URL,
    # SQLite를 사용하는 경우에만 적용
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLAlchemy 모델의 기본 클래스
Base = declarative_base()

# 데이터베이스 초기화 함수
def init_db():
    """
    데이터베이스 테이블 생성
    
    첫 실행 시 사용
    """
    from app.db.models import Base
    Base.metadata.create_all(bind=engine)