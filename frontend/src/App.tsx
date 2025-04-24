import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { LessonProvider } from './contexts/LessonContext';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <LessonProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lesson/:lessonId" element={<Lesson />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </LessonProvider>
    </Router>
  );
};

export default App;