import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

// 컴포넌트 임포트
import AnimatedTeacherCard from '../components/AnimatedTeacher/AnimatedTeacherCard';

// 선생님 타입 정의
interface Teacher {
  id: string;
  name: string;
  specialty: string; // 전문 분야 (비즈니스 영어, 일상 회화, 시험 준비 등)
  experience: number; // 경력 연수
  rating: number; // 평점 (5점 만점)
  imageUrl: string; // 선생님 이미지 URL
  description: string; // 선생님 소개
  languages: string[]; // 구사 가능 언어
  price: number; // 수업 가격 (시간당)
  availability: string; // 수업 가능 시간대
  level: 'beginner' | 'intermediate' | 'advanced' | 'all'; // 적합한 학생 레벨
}

// User interface
interface User {
  name?: string;
  completedClasses?: number;
  recentTeachers?: string[];
}

// 샘플 선생님 데이터
const sampleTeachers: Teacher[] = [
  {
    id: 'teacher1',
    name: 'Emma Wilson',
    specialty: 'Business English',
    experience: 8,
    rating: 4.9,
    imageUrl: '/assets/teachers/emma.jpg',
    description: 'Specializes in business communication and presentation skills with 8 years of experience teaching professionals.',
    languages: ['English', 'Spanish'],
    price: 25,
    availability: 'Weekdays 9AM-5PM',
    level: 'intermediate'
  },
  {
    id: 'teacher2',
    name: 'James Miller',
    specialty: 'Conversation Practice',
    experience: 5,
    rating: 4.7,
    imageUrl: '/assets/teachers/james.jpg',
    description: 'Focuses on natural conversation and pronunciation with a friendly, patient approach.',
    languages: ['English', 'French'],
    price: 22,
    availability: 'Evenings and Weekends',
    level: 'beginner'
  },
  {
    id: 'teacher3',
    name: 'Sarah Johnson',
    specialty: 'TOEFL & IELTS Preparation',
    experience: 10,
    rating: 4.8,
    imageUrl: '/assets/teachers/sarah.jpg',
    description: 'Exam preparation specialist with proven success helping students achieve target scores.',
    languages: ['English'],
    price: 30,
    availability: 'Flexible Hours',
    level: 'advanced'
  },
  {
    id: 'teacher4',
    name: 'Michael Chen',
    specialty: 'Academic English',
    experience: 7,
    rating: 4.6,
    imageUrl: '/assets/teachers/michael.jpg',
    description: 'Specializes in academic writing and research paper preparation for university students.',
    languages: ['English', 'Mandarin'],
    price: 28,
    availability: 'Weekdays and Saturday mornings',
    level: 'advanced'
  },
  {
    id: 'teacher5',
    name: 'Sophia Rodriguez',
    specialty: 'Everyday Conversation',
    experience: 4,
    rating: 4.9,
    imageUrl: '/assets/teachers/sophia.jpg',
    description: 'Creates engaging lessons focused on practical, everyday English conversations.',
    languages: ['English', 'Spanish', 'Portuguese'],
    price: 20,
    availability: 'Afternoons and Evenings',
    level: 'beginner'
  },
  {
    id: 'teacher6',
    name: 'Daniel Kim',
    specialty: 'Pronunciation & Accent Reduction',
    experience: 9,
    rating: 4.8,
    imageUrl: '/assets/teachers/daniel.jpg',
    description: 'Accent coach with specialized training in phonetics and speech patterns.',
    languages: ['English', 'Korean'],
    price: 26,
    availability: 'Mornings and Weekends',
    level: 'intermediate'
  },
  {
    id: 'teacher7',
    name: 'Olivia Parker',
    specialty: 'English for Kids',
    experience: 6,
    rating: 4.9,
    imageUrl: '/assets/teachers/olivia.jpg',
    description: 'Creates fun, engaging lessons for young learners with games and interactive activities.',
    languages: ['English', 'German'],
    price: 24,
    availability: 'After School Hours',
    level: 'beginner'
  },
  {
    id: 'teacher8',
    name: 'Robert Thompson',
    specialty: 'Business Negotiations',
    experience: 12,
    rating: 4.7,
    imageUrl: '/assets/teachers/robert.jpg',
    description: 'Former business executive specializing in negotiation language and professional communications.',
    languages: ['English'],
    price: 35,
    availability: 'Business Hours',
    level: 'advanced'
  }
];

// 선생님 인사말 목록
const teacherGreetings: Record<string, string> = {
  'teacher1': "Hi there! I'm Emma. I specialize in business English to help professionals excel in their careers.",
  'teacher2': "Hello! I'm James. Let's practice natural conversation together!",
  'teacher3': "Welcome! I'm Sarah. I can help you prepare for TOEFL and IELTS exams with proven strategies.",
  'teacher4': "Good day! I'm Michael. I help students excel in academic writing and research.",
  'teacher5': "¡Hola! I'm Sophia. Let's make everyday English conversations fun and engaging!",
  'teacher6': "안녕하세요! I'm Daniel. I can help you improve your pronunciation and reduce your accent.",
  'teacher7': "Hello, friends! I'm Olivia. Learning English should be fun, especially for kids!",
  'teacher8': "Greetings! I'm Robert. I teach the art of business negotiations and professional communication."
};

// 홈 페이지 컴포넌트
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [teachers] = useState<Teacher[]>(sampleTeachers);
  const [hoveredTeacher, setHoveredTeacher] = useState<string | null>(null);
  
  // 환영 메시지 설정
  useEffect(() => {
    if (user && user.name) {
      const hour = new Date().getHours();
      let greeting = '';
      
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';
      else greeting = 'Good evening';
      
      setWelcomeMessage(`${greeting}, ${user.name}! 최적의 영어 선생님을 찾아보세요.`);
    } else {
      setWelcomeMessage('환영합니다! 최적의 영어 선생님을 찾아보세요.');
    }
  }, [user?.name]);
  
  // 선생님 선택 처리
  const handleSelectTeacher = (teacherId: string) => {
    console.log(`Selected teacher ID: ${teacherId}`);
    navigate(`/teacher/${teacherId}`);
  };
  
  // 선생님 필터링
  const filteredTeachers = teachers.filter(teacher => {
    // 검색어 필터링
    const matchesSearch = searchTerm === '' || 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 전문 분야 필터링
    const matchesSpecialty = selectedSpecialty === 'all' || 
      teacher.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    
    // 레벨 필터링
    const matchesLevel = selectedLevel === 'all' || 
      teacher.level === selectedLevel || 
      teacher.level === 'all';
    
    return matchesSearch && matchesSpecialty && matchesLevel;
  });
  
  // 로딩 상태 표시
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>선생님 정보를 불러오는 중...</p>
      </div>
    );
  }
  
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="welcome-section">
          <h1>{welcomeMessage}</h1>
          {user && (
            <p className="user-stats">
              지금까지 {user.completedClasses || 0}개의 수업을 완료하셨습니다. 다음 수업을 예약해 보세요!
            </p>
          )}
        </div>
      </header>
      
      <section className="search-filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="선생님 이름 또는 전문 분야 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button">검색</button>
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label>전문 분야:</label>
            <select 
              value={selectedSpecialty} 
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="Business">비즈니스 영어</option>
              <option value="Conversation">일상 회화</option>
              <option value="TOEFL">시험 준비</option>
              <option value="Pronunciation">발음 교정</option>
              <option value="Kids">어린이 영어</option>
              <option value="Academic">학술 영어</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>레벨:</label>
            <select 
              value={selectedLevel} 
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>
        </div>
      </section>
      
      <main className="home-content">
        <section className="teachers-section">
          <h2>선생님 목록</h2>
          {filteredTeachers.length > 0 ? (
            <div className="teachers-grid">
              {filteredTeachers.map(teacher => (
                <AnimatedTeacherCard 
                  key={teacher.id}
                  id={teacher.id}
                  name={teacher.name}
                  imageUrl={teacher.imageUrl}
                  specialty={teacher.specialty}
                  languages={teacher.languages}
                  rating={teacher.rating}
                  availability={teacher.availability}
                  onSelect={handleSelectTeacher}
                  animatedText={teacherGreetings[teacher.id]}
                />
              ))}
            </div>
          ) : (
            <p className="no-teachers">검색 조건에 맞는 선생님이 없습니다.</p>
          )}
        </section>
        
        {isAuthenticated && user?.recentTeachers && user.recentTeachers.length > 0 && (
          <section className="teachers-section">
            <h2>최근 수업한 선생님</h2>
            <div className="teachers-grid">
              {user.recentTeachers.map(teacherId => {
                const teacher = teachers.find(t => t.id === teacherId);
                return teacher ? (
                  <AnimatedTeacherCard 
                    key={teacher.id}
                    id={teacher.id}
                    name={teacher.name}
                    imageUrl={teacher.imageUrl}
                    specialty={teacher.specialty}
                    languages={teacher.languages}
                    rating={teacher.rating}
                    availability={teacher.availability}
                    onSelect={handleSelectTeacher}
                    animatedText={teacherGreetings[teacher.id]}
                  />
                ) : null;
              })}
            </div>
          </section>
        )}
      </main>
      
      <div className="quick-action-fab">
        <button onClick={() => navigate('/schedule')}>나의 수업 일정 보기</button>
      </div>
    </div>
  );
};

export default Home;