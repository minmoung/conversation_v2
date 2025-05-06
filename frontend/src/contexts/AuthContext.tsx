import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import axios from 'axios';

// 사용자 타입 정의
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  level?: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
}

// 인증 컨텍스트 상태 타입
interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

// 인증 컨텍스트 액션 타입
interface AuthContextActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  //updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

// 컨텍스트 타입
type AuthContextType = AuthContextState & AuthContextActions;

// 기본 컨텍스트 값
const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  //updateProfile: async () => {},
  clearError: () => {},
  checkAuthStatus: async () => false
};

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// 컨텍스트 훅
export const useAuth = () => useContext(AuthContext);

// 컨텍스트 제공자 Props
interface AuthProviderProps {
  children: ReactNode;
}

// 컨텍스트 제공자 컴포넌트
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthContextState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // 사용자 로그인
  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 로그인 API 호출
      const response = await authApi.login(email, password);
      const { user, token, refresh_token } = response.data;
      
      // 사용자 정보 저장
      // 토큰 저장
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refresh_token);
      console.log('로그인 성공:', response.data);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

    } catch (error) {
      if (axios.isAxiosError(error)) {
        // alert(JSON.stringify(error.response?.data, null, 2));
        alert(JSON.stringify(error.response?.data.detail, null, 2));
        console.error("서버 응답 오류:", JSON.stringify(error.response?.data, null, 2));
      } else {
        console.error("예상치 못한 오류:", error);
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('로그인에 실패했습니다.') 
      }));
      throw error;
    }
  };

  // 사용자 회원가입
  const register = async (name: string, email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 회원가입 API 호출
      const response = await authApi.register(name, email, password);
      const { user, token, refresh_token } = response.data;
      
      // 토큰 저장
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refresh_token);
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('회원가입에 실패했습니다.') 
      }));
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // 로그아웃 API 호출 (필요시)
      try {
        await authApi.logout();
      } catch (logoutError) {
        console.error('Logout API error:', logoutError);
        // API 오류가 있더라도 로컬 로그아웃은 진행
      }
      
      // 로컬 스토리지 토큰 제거
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('로그아웃 처리 중 오류가 발생했습니다.') 
      }));
    }
  };

  // 프로필 업데이트
  // const updateProfile = async (userData: Partial<User>) => {
  //   try {
  //     setState(prev => ({ ...prev, isLoading: true, error: null }));
      
  //     // 프로필 업데이트 API 호출
  //     const response = await authApi.updateProfile(userData);
  //     const updatedUser = response.data;
      
  //     setState(prev => ({
  //       ...prev,
  //       user: updatedUser,
  //       isLoading: false
  //     }));
  //   } catch (error) {
  //     setState(prev => ({ 
  //       ...prev, 
  //       isLoading: false, 
  //       error: error instanceof Error ? error : new Error('프로필 업데이트에 실패했습니다.') 
  //     }));
  //     throw error;
  //   }
  // };

  // 에러 초기화
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // 인증 상태 확인
  const checkAuthStatus = async (): Promise<boolean> => {
    console.log("Starting auth check");
    try {
      const token = localStorage.getItem('token');
      console.log("Token exists:", !!token);
      
      if (!token) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return false;
      }
      
      // 사용자 프로필 정보 요청
      const response = await authApi.getUserProfile();
      const user = response.data;
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      // 토큰이 유효하지 않은 경우 로그아웃 처리
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('인증 상태 확인에 실패했습니다.')
      });
      
      return false;
    }
  };

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // AuthContext.tsx에서 상태 변화 로깅
  useEffect(() => {
    console.log("Auth Context State:", state);
  }, [state]);

  // API 서비스 확장 (편의를 위해 context에 추가)
  const extendedAuthApi = {
    ...authApi,
    //updateProfile: (userData: Partial<User>) => 
    //authApi.post('/api/auth/profile/update', userData)
  };

  // Context 값
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    // updateProfile,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};