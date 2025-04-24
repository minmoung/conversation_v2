import axios from 'axios';
import { LessonContent } from '../types/lesson';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('token');
    
    // 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러 처리 (인증 만료)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 리프레시 토큰으로 새 액세스 토큰 요청
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // 리프레시 토큰이 없으면 로그인 페이지로 리다이렉트
          window.location.href = '/';
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken
        });
        
        // 새 토큰 저장
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // 리프레시 실패 시 로그아웃
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
    
  register: (name: string, email: string, password: string) => 
    api.post('/api/auth/register', { name, email, password }),
    
  logout: () => api.post('/api/auth/logout'),
  
  getUserProfile: () => api.get('/api/auth/profile')
};

// 학습 관련 API
// export const lessonApi = {
//   getLessons: () => api.get('/api/lessons'),
  
//   getLessonById: (lessonId: string) => 
//     api.get(`/api/lessons/${lessonId}`),
    
//   getUserProgress: () => api.get('/api/user/progress'),
  
//   submitSpeechEvaluation: (lessonId: string, audioBlob: Blob) => {
//     const formData = new FormData();
//     formData.append('audio', audioBlob);
    
//     return api.post(`/api/lessons/${lessonId}/evaluate`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     });
//   },
  
//   saveUserProgress: (lessonId: string, progress: number, score: number) => 
//     api.post(`


// 예시 데이터 (실제로는 API 호출로 대체)
const sampleLessons: Record<string, LessonContent> = {
  "lesson1": {
    id: "lesson1",
    title: "기본 인사하기",
    teacherCharacter: "female1",
    dialogues: [
      {
        id: "d1",
        teacherLine: "안녕하세요. 만나서 반갑습니다.",
        studentLine: "안녕하세요. 저도 만나서 반갑습니다."
      },
      {
        id: "d2",
        teacherLine: "오늘 날씨가 좋네요.",
        studentLine: "네, 정말 좋은 날씨입니다."
      },
      {
        id: "d3",
        teacherLine: "실례지만, 성함이 어떻게 되시나요?",
        studentLine: "제 이름은 ___입니다."
      }
    ]
  },
  "lesson2": {
    id: "lesson2",
    title: "카페에서 주문하기",
    teacherCharacter: "male1",
    dialogues: [
      {
        id: "d1",
        teacherLine: "어서오세요. 무엇을 도와드릴까요?",
        studentLine: "아메리카노 한 잔 주세요."
      },
      {
        id: "d2",
        teacherLine: "아이스로 드릴까요, 따뜻한 걸로 드릴까요?",
        studentLine: "따뜻한 걸로 주세요."
      }
    ]
  }
};


// 레슨 ID로 레슨 데이터 가져오기
export const fetchLessonById = async (lessonId: string): Promise<LessonContent> => {
  // 실제 API 호출 대신 샘플 데이터 사용
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lesson = sampleLessons[lessonId];
      if (lesson) {
        resolve(lesson);
      } else {
        reject(new Error("Lesson not found"));
      }
    }, 500); // 실제 API 호출을 시뮬레이션하기 위한 지연
  });
};