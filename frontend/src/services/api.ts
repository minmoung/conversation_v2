import axios from 'axios';
import { LessonContent } from '../types/lesson';
import { Console } from 'console';

//const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    console.log('API 요청 URL:', config.url);
    // console.log('현재 토큰:', token);
    
    // console.log('0. token in localStorage: ', token);
    // 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization 헤더 설정됨:', config.headers.Authorization);
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('토큰 만료 시간:', new Date(payload.exp * 1000));
    } else {
      console.log('토큰 없음, Authorization 헤더 설정 안 됨');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 인증 상태 관리를 위한 변수
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 토큰 갱신 후 대기 중인 요청들을 처리
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// 새 토큰을 기다리는 요청 추가
const addSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// 응답 인터셉터 설정
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 이미 재시도된 요청이거나 URL이 refresh인 경우 더 이상 처리하지 않음
    if (originalRequest._retry || originalRequest.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }
    
    // 401 에러 처리 (인증 만료)
    if (error.response?.status === 401) {
      originalRequest._retry = true;
      
      const refresh_token = localStorage.getItem('refresh_token');
      
      alert("refreshToken == >" + refresh_token);
      if (!refresh_token) {
        // 리프레시 토큰이 없으면 로그인 페이지로 리다이렉트
        localStorage.removeItem('token');
        window.location.href = '/';
        return Promise.reject(error);
      }
      
      // 이미 토큰 갱신 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise(resolve => {
          addSubscriber(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }
      
      isRefreshing = true;
      
      try {
        // 리프레시 토큰으로 새 액세스 토큰 요청
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refresh_token
        });
        
        // 새 토큰 저장
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        // 대기 중인 요청들 처리
        onRefreshed(token);
        
        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // 리프레시 실패 시 로그아웃
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authApi = {
  // login: (email: string, password: string) => 
  //   api.post('/api/auth/login', { email, password }),
  login: (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email); // OAuth2는 username 필드를 사용
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
    
  register: (name: string, email: string, password: string) => 
    api.post('/api/auth/register', { name, email, password }),
    
  logout: () => api.post('/api/auth/logout'),
  
  getUserProfile: () => api.get('/api/auth/profile'),

  // 새로 추가할 메서드들
  getUserStats: (userId: string) => api.get(`/api/users/${userId}/stats`),
  
  getUserBadges: (userId: string) => api.get(`/api/users/${userId}/badges`)
};

// 학습 관련 API
export const lessonApi = {

  // 레슨 목록 요청
  getLessons: () => api.get('/api/lessons'),

  getLessonById: (lessonId: string) => 
    api.get(`/api/lessons/${lessonId}`),
    
  //getUserProgress: () => api.get('/api/user/progress'),
  
  submitSpeechEvaluation: (lessonId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    return api.post(`/api/lessons/${lessonId}/evaluate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  saveUserProgress: (lessonId: string, progress: number, score: number) => 
    api.post(`/api/lessons/${lessonId}/progress`, {
      progress,
      score
    })
};
 

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


export const getUserProfile = (userId: string) => api.get(`/api/users/${userId}/profile`);
export const getUserStats = (userId: string) => api.get(`/api/users/${userId}/stats`);
export const getUserBadges = (userId: string) => api.get(`/api/users/${userId}/badges`);

// TTS 요청 함수
export const fetchTTS = async (text: string): Promise<Blob> => {
  console.log('TTS 요청 텍스트:', text);
  const response = await api.post('/api/lessons/tts', { text }, { responseType: 'blob' });
  return response.data; // Blob 데이터 반환
};

// AI에 메시지 전송 함수
export const sendMessageToAI = async (text: string) => {
  const response = await api.post('/api/lessons/chat', { text }, { responseType: 'blob' });
  
  // const response = await fetch("/api/lessons/chat", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ text }),
  // });
  return response.data;
};

// AI에 메시지 전송 함수(Orignal)
// export const sendMessageToAI = async (text: string) => {
//   const response = await fetch("http://127.0.0.1:8000/chat", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text }),
//   });
//   return response.json();
// };


