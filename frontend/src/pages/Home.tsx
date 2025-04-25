import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLessonContext, Lesson } from '../contexts/LessonContext';
import './Home.css';

// 컴포넌트 임포트
import TeacherAvatar from '../components/AnimatedTeacher/TeacherAvatar';

// 레슨 카드 컴포넌트
const LessonCard: React.FC<{ lesson: Lesson; onSelect: (id: string) => void }> = ({ lesson, onSelect }) => {
  return (
    <div className="lesson-card" onClick={() => onSelect(lesson.id)}>
      <div className="lesson-card-icon">
        {lesson.level === 'beginner' && <span className="level-badge beginner">초급</span>}
        {lesson.level === 'intermediate' && <span className="level-badge intermediate">중급</span>}
        {lesson.level === 'advanced' && <span className="level-badge advanced">고급</span>}
      </div>
      <h3>{lesson.title}</h3>
      <p>{lesson.description}</p>
      <div className="lesson-card-footer">
        <span>{lesson.dialogues.length} 대화</span>
        <span>{lesson.vocabulary.length} 단어</span>
        <span>{lesson.exercises.length} 연습</span>
      </div>
    </div>
  );
};

// 홈 페이지 컴포넌트
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  //const { allLessons, fetchAllLessons, isLoading: lessonsLoading } = useLessonContext();
  const { allLessons, isLoading: lessonsLoading } = useLessonContext();
  
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  
  // 사용자 레벨에 맞는 추천 레슨
  const recommendedLessons = allLessons.filter(lesson => {
    if (!user?.level) return lesson.level === 'beginner';
    return lesson.level === user.level;
  }).slice(0, 3); // 최대 3개만 표시
  
  // 최근 추가된 레슨
  const recentLessons = [...allLessons]
    .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())
    .slice(0, 3);
  
  // 레벨별 레슨
  const beginnerLessons = allLessons.filter(lesson => lesson.level === 'beginner').slice(0, 4);
  const intermediateLessons = allLessons.filter(lesson => lesson.level === 'intermediate').slice(0, 4);
  const advancedLessons = allLessons.filter(lesson => lesson.level === 'advanced').slice(0, 4);
  
  // 레슨 선택 처리
  const handleSelectLesson = (lessonId: string) => {
    console.log(`Selected lesson ID: ${lessonId}`);
    navigate(`/lesson/${lessonId}`);
  };
  
  // 환영 메시지 설정
  useEffect(() => {
    if (user) {
      const hour = new Date().getHours();
      let greeting = '';
      
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';
      else greeting = 'Good evening';
      
      setWelcomeMessage(`${greeting}, ${user.name}! Ready for your English lesson?`);
      
      // 환영 메시지 음성 재생 시뮬레이션
      setIsSpeaking(true);
      const timer = setTimeout(() => {
        setIsSpeaking(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);
  
  // 컴포넌트 마운트 시 레슨 데이터 로드
  useEffect(() => {
    //fetchAllLessons();
  }, []);
  
  // 로딩 상태 표시
  if (authLoading || lessonsLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your lessons...</p>
      </div>
    );
  }
  
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="welcome-section">
          <div className="teacher-container">
            <TeacherAvatar 
              speaking={isSpeaking}
              emotion="happy"
              phonemes={isSpeaking ? ['HH', 'EH', 'L', 'OW'] : []}
              speedMultiplier={1}
            />
          </div>
          <div className="welcome-text">
            <h1>{welcomeMessage}</h1>
            {user && (
              <p className="user-stats">
                You've completed {user.level === 'beginner' ? '25%' : 
                  user.level === 'intermediate' ? '50%' : '75%'} of your journey!
              </p>
            )}
          </div>
        </div>
      </header>
      
      <main className="home-content">
        {isAuthenticated && (
          <section className="lesson-section">
            <h2>Recommended for You</h2>
            {recommendedLessons.length > 0 ? (
              <div className="lesson-grid">
                {recommendedLessons.map(lesson => (
                  <LessonCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    onSelect={handleSelectLesson} 
                  />
                ))}
              </div>
            ) : (
              <p className="no-lessons">No recommended lessons available yet.</p>
            )}
          </section>
        )}
        
        <section className="lesson-section">
          <h2>Recently Added</h2>
          {recentLessons.length > 0 ? (
            <div className="lesson-grid">
              {recentLessons.map(lesson => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  onSelect={handleSelectLesson} 
                />
              ))}
            </div>
          ) : (
            <p className="no-lessons">No lessons available yet.</p>
          )}
        </section>
        
        <section className="lesson-section">
          <h2>Beginner Lessons</h2>
          {beginnerLessons.length > 0 ? (
            <div className="lesson-grid">
              {beginnerLessons.map(lesson => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  onSelect={handleSelectLesson} 
                />
              ))}
            </div>
          ) : (
            <p className="no-lessons">No beginner lessons available yet.</p>
          )}
        </section>
        
        <section className="lesson-section">
          <h2>Intermediate Lessons</h2>
          {intermediateLessons.length > 0 ? (
            <div className="lesson-grid">
              {intermediateLessons.map(lesson => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  onSelect={handleSelectLesson} 
                />
              ))}
            </div>
          ) : (
            <p className="no-lessons">No intermediate lessons available yet.</p>
          )}
        </section>
        
        <section className="lesson-section">
          <h2>Advanced Lessons</h2>
          {advancedLessons.length > 0 ? (
            <div className="lesson-grid">
              {advancedLessons.map(lesson => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  onSelect={handleSelectLesson} 
                />
              ))}
            </div>
          ) : (
            <p className="no-lessons">No advanced lessons available yet.</p>
          )}
        </section>
      </main>
      
      <div className="quick-start-fab" onClick={() => {
        alert(allLessons);
        if (allLessons.length > 0) {
          handleSelectLesson(allLessons[0].id);
        }
      }}>
        <span>시작하기</span>
      </div>
    </div>
  );
};

export default Home;