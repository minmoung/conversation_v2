import React, { createContext, useContext, useState, ReactNode } from 'react';

// userProgress의 인터페이스 정의
interface UserProgressState {
  completedLessons: string[];
  pointsEarned: number;
  currentStreak: number;
  lastCompletedDate: Date | null;
}

interface LessonContextType {
  contextId: string | null;
  setContextId: (id: string | null) => void;
  difficulty: string;
  setDifficulty: (level: string) => void;
  currentLesson: string | null;
  setCurrentLesson: (lesson: string | null) => void;
  userProgress: UserProgressState;
  updateUserProgress: (lessonId: string, points: number) => void;
  isLoading: boolean;
  error: Error | null;
  allLessons: any[];
  lessonProgress: number;
  currentExerciseIndex: number;
  setCurrentExerciseIndex: (index: number) => void;
  speechSpeed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast';
  setSpeechSpeed: (speed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast') => void;
  resetLessonState: () => void;
}

// 기본 컨텍스트 값 설정
const defaultLessonContext: LessonContextType = {
  contextId: null,
  setContextId: () => {},
  difficulty: 'elementary',
  setDifficulty: () => {},
  currentLesson: null,
  setCurrentLesson: () => {},
  userProgress: {
    completedLessons: [],
    pointsEarned: 0,
    currentStreak: 0,
    lastCompletedDate: null
  },
  updateUserProgress: () => {},
  isLoading: false,
  error: null,
  allLessons: [],
  lessonProgress: 0,
  currentExerciseIndex: 0,
  setCurrentExerciseIndex: () => {},
  speechSpeed: 'normal',
  setSpeechSpeed: () => {},
  resetLessonState: () => {}
};

// Context 생성
const LessonContext = createContext<LessonContextType>(defaultLessonContext);

// 훅 정의 - 두 이름 모두 지원
export const useLessonContext = () => useContext(LessonContext);
export const useLesson = useLessonContext; // 별칭으로 추가

interface LessonProviderProps {
  children: ReactNode;
}

export const LessonProvider: React.FC<LessonProviderProps> = ({ children }) => {
  const [contextId, setContextId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('elementary');
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgressState>({
    completedLessons: [],
    pointsEarned: 0,
    currentStreak: 0,
    lastCompletedDate: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [speechSpeed, setSpeechSpeed] = useState<'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast'>('normal');

  // 사용자 진행상황 업데이트
  const updateUserProgress = (lessonId: string, points: number) => {
    setUserProgress(prev => {
      // 이미 완료한 레슨인지 확인
      if (!prev.completedLessons.includes(lessonId)) {
        // 오늘 날짜 추가
        const today = new Date();
        
        // 마지막 완료일이 어제인지 확인하여 스트릭 업데이트
        let newStreak = prev.currentStreak;
        if (prev.lastCompletedDate) {
          const lastDate = new Date(prev.lastCompletedDate);
          const diffTime = Math.abs(today.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // 어제 완료했으면 스트릭 증가
            newStreak += 1;
          } else if (diffDays > 1) {
            // 하루 이상 놓쳤으면 스트릭 리셋
            newStreak = 1;
          }
        } else {
          // 첫 완료
          newStreak = 1;
        }
        
        return {
          completedLessons: [...prev.completedLessons, lessonId],
          pointsEarned: prev.pointsEarned + points,
          currentStreak: newStreak,
          lastCompletedDate: today
        };
      }
      
      // 이미 완료한 레슨이면 포인트만 추가
      return {
        ...prev,
        pointsEarned: prev.pointsEarned + points
      };
    });
  };

  // 레슨 상태 초기화
  const resetLessonState = () => {
    setCurrentLesson(null);
    setLessonProgress(0);
    setCurrentExerciseIndex(0);
    setError(null);
  };

  // Provider에 전달할 값
  const contextValue: LessonContextType = {
    contextId,
    setContextId,
    difficulty,
    setDifficulty,
    currentLesson,
    setCurrentLesson,
    userProgress,
    updateUserProgress,
    isLoading,
    error,
    allLessons,
    lessonProgress,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    speechSpeed,
    setSpeechSpeed,
    resetLessonState
  };

  return (
    <LessonContext.Provider value={contextValue}>
      {children}
    </LessonContext.Provider>
  );
};