from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    token: str
    refresh_token: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class UserProfile(UserBase):
    id: int
    
    class Config:
        orm_mode = True

class RefreshTokenRequest(BaseModel):
    refresh_token: str