from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.db.models import User, RefreshToken
from app.schemas.auth import UserCreate, Token, UserProfile, RefreshTokenRequest
from passlib.context import CryptContext

router = APIRouter()

@router.post("/register", response_model=UserProfile)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    새 사용자 등록
    """
    # 이메일 중복 확인
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다."
        )
    
    # 비밀번호 해싱 및 사용자 생성
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 호환 토큰 로그인
    """
    # 해쉬변환용 ( 필요에 따라서 암호화된 데이터를 직접 컬럼에 저장해서 사용하도록 할것)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("1234")
    print(hashed);

    
    print("========================= backend login =========================")
    # 사용자 확인
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 잘못되었습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 생성
    access_token = create_access_token(user.id)
    refresh_token_str, expires_at = create_refresh_token(user.id)
    
    # 리프레시 토큰 저장
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    # 사용자 정보를 포함하여 반환 (수정된 부분)
    # 민감한 정보를 제외한 사용자 정보만 반환
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        # 필요한 다른 사용자 필드들 추가
    }

    
    print("user.id ->" , user.id);
    print("user.email ->" , user.email);
    print("access_token ->" , access_token);
    print("refresh_token_str ->" , refresh_token_str);
    return {"token": access_token, "refresh_token": refresh_token_str, "user": user_data};

@router.post("/refresh", response_model=Token)
def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    리프레시 토큰으로 새 액세스 토큰 발급
    """
    # 리프레시 토큰 확인
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_data.refresh_token,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="리프레시 토큰이 유효하지 않거나 만료되었습니다."
        )
    
    # 새 토큰 생성
    new_access_token = create_access_token(db_token.user_id)
    new_refresh_token_str, expires_at = create_refresh_token(db_token.user_id)
    
    # 기존 토큰 삭제 및 새 토큰 저장
    db.delete(db_token)
    db_refresh_token = RefreshToken(
        user_id=db_token.user_id,
        token=new_refresh_token_str,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    return {"token": new_access_token, "refresh_token": new_refresh_token_str}

@router.post("/logout")
def logout(
    token: str = Depends(OAuth2PasswordRequestForm),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    로그아웃 및 리프레시 토큰 삭제
    """
    # 사용자의 모든 리프레시 토큰 삭제
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).delete()
    db.commit()
    
    return {"detail": "로그아웃 되었습니다."}

@router.get("/profile", response_model=UserProfile)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    현재 로그인한 사용자 프로필 조회
    """
    return current_user