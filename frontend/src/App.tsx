import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
//import Register from './pages/Register';
//import Settings from './pages/Settings';
import { LessonProvider } from './contexts/LessonContext';
import './App.css';


const App: React.FC = () => {
  return (
    <LessonProvider>
      <div className="app-container">
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          
          {/* 보호된 라우트 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/lesson/:lessonId" element={<Lesson />} />
            <Route path="/profile" element={<Profile />} />
            {/* <Route path="/settings" element={<Settings />} /> */}
          </Route>
          
          {/* 나머지 경로는 로그인 페이지로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </LessonProvider>
  );
};

export default App;