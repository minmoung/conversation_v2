import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 인증 상태 로딩 중이면 로딩 표시
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>인증 상태를 확인하는 중...</p>
      </div>
    );
  }

  // 인증되지 않았으면 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    // 현재 경로를 state로 전달하여 로그인 후 원래 가려던 페이지로 돌아올 수 있게 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 인증되었으면 자식 컴포넌트 렌더링
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;