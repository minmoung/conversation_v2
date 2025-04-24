import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css'; // 전역 스타일시트가 있다고 가정

// 컨텍스트 프로바이더 임포트
import { AuthProvider } from './contexts/AuthContext';
import { LessonProvider } from './contexts/LessonContext';

// React 18의 createRoot API 사용
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LessonProvider>
          <App />
        </LessonProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);