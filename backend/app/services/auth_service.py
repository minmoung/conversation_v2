from datetime import datetime
from sqlalchemy.orm import Session
from app.db.models import User, RefreshToken
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token

def authenticate_user(db: Session, email: str, password: str):
    """
    이메일과 비밀번호로 사용자 인증
    """
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Session, name: str, email: str, password: str):
    """
    새 사용자 생성
    """
    hashed_password = get_password_hash(password)
    db_user = User(
        name=name,
        email=email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_tokens(db: Session, user_id: int):
    """
    사용자 인증 토큰 생성 및 저장
    """
    access_token = create_access_token(user_id)
    refresh_token_str, expires_at = create_refresh_token(user_id)
    
    # 기존 리프레시 토큰 삭제
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    
    # 새 리프레시 토큰 저장
    db_refresh_token = RefreshToken(
        user_id=user_id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    return access_token, refresh_token_str

def validate_refresh_token(db: Session, refresh_token: str):
    """
    리프레시 토큰 유효성 검증
    """
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not db_token:
        return None
    
    return db_token