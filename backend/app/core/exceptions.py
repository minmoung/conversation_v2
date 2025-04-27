from fastapi import HTTPException, status

class AuthError(HTTPException):
    """인증 관련 오류"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

class PermissionDeniedError(HTTPException):
    """권한 부족 오류"""
    def __init__(self, detail: str = "이 작업을 수행할 권한이 없습니다."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

class NotFoundError(HTTPException):
    """리소스 찾을 수 없음 오류"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )

class BadRequestError(HTTPException):
    """잘못된 요청 오류"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class DatabaseError(HTTPException):
    """데이터베이스 오류"""
    def __init__(self, detail: str = "데이터베이스 오류가 발생했습니다."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )