import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { lessonApi } from '../services/api';
import { useAuth } from './AuthContext'; // AuthContext import 추가

// 레슨 타입 정의
export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  dialogues: LessonDialogue[];
  vocabulary: LessonVocabulary[];
  exercises: LessonExercise[];
}

interface LessonDialogue {
  id: string;
  character: string;
  text: string;
  translation?: string;
  audioUrl?: string;
}

interface LessonVocabulary {
  word: string;
  translation: string;
  phonetic: string;
  example: string;
  audioUrl?: string;
}

interface LessonExercise {
  id: string;
  type: 'speaking' | 'listening' | 'multiple-choice' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  hint?: string;
}

// 발음 평가 결과 타입
export interface PronunciationResult {
  score: number;
  feedback: string;
  wordScores: {
    word: string;
    score: number;
    phonemes: { phoneme: string; score: number }[];
  }[];
}

// 사용자 진행 상황 타입
export interface UserProgress {
  lessonId: string;
  completed: boolean;
  score: number;
  lastAttemptDate: Date;
  exercises: {
    exerciseId: string;
    completed: boolean;
    score: number;
  }[];
}

// 컨텍스트 상태 타입
interface LessonContextState {
  currentLesson: Lesson | null;
  isLoading: boolean;
  error: Error | null;
  lessonProgress: number; // 0-100
  userLessonProgress: UserProgress | null;
  allLessons: Lesson[];
  currentExerciseIndex: number;
  pronunciationResults: PronunciationResult | null;
  speechSpeed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast';
  completedLessons: string[]; // 완료된 레슨 ID 배열
  // isAuthenticated 속성 제거
}

// 컨텍스트 액션 타입
interface LessonContextActions {
  fetchLesson: (lessonId: string) => Promise<void>;
  fetchAllLessons: () => Promise<void>;
  setCurrentExerciseIndex: (index: number) => void;
  submitExerciseAnswer: (exerciseId: string, answer: string | string[]) => Promise<boolean>;
  submitSpeechEvaluation: (exerciseId: string, audioBlob: Blob) => Promise<PronunciationResult>;
  updateLessonProgress: (progress: number) => void;
  setSpeechSpeed: (speed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast') => void;
  resetLessonState: () => void;
  // setIsAuthenticated 함수 제거
}

// 컨텍스트 타입
type LessonContextType = LessonContextState & LessonContextActions;

// 기본 컨텍스트 값
const defaultLessonContext: LessonContextType = {
  currentLesson: null,
  isLoading: false,
  error: null,
  lessonProgress: 0,
  userLessonProgress: null,
  allLessons: [],
  currentExerciseIndex: 0,
  pronunciationResults: null,
  speechSpeed: 'normal',
  completedLessons: [],
  fetchLesson: async () => {},
  fetchAllLessons: async () => {},
  setCurrentExerciseIndex: () => {},
  submitExerciseAnswer: async () => false,
  submitSpeechEvaluation: async () => ({ 
    score: 0, 
    feedback: '', 
    wordScores: [] 
  }),
  updateLessonProgress: () => {},
  setSpeechSpeed: () => {},
  resetLessonState: () => {}
};

// 컨텍스트 생성
const LessonContext = createContext<LessonContextType>(defaultLessonContext);

// 컨텍스트 훅 정의 - 두 이름 모두 지원
export const useLessonContext = () => useContext(LessonContext);
export const useLesson = useLessonContext; // 별칭으로 추가

// 컨텍스트 제공자 Props
interface LessonProviderProps {
  children: ReactNode;
}

// 컨텍스트 제공자 컴포넌트
export const LessonProvider: React.FC<LessonProviderProps> = ({ children }) => {
  // AuthContext에서 인증 상태 가져오기
  const { isAuthenticated } = useAuth();
  
  const [state, setState] = useState<LessonContextState>({
    currentLesson: null,
    isLoading: false,
    error: null,
    lessonProgress: 0,
    userLessonProgress: null,
    allLessons: [],
    currentExerciseIndex: 0,
    pronunciationResults: null,
    speechSpeed: 'normal',
    completedLessons: []
  });

  // 레슨 데이터 가져오기
  const fetchLesson = async (lessonId: string) => {
    // 로그인 상태가 아니면 함수 실행하지 않음
    if (!isAuthenticated) {
      console.log("User is not authenticated. Cannot fetch lesson.");
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 레슨 데이터 요청
      const response = await lessonApi.getLessonById(lessonId);
      const lessonData = response.data;
      
      // 사용자 진행 상황 요청
      // const progressResponse = await lessonApi.getUserProgress();
      // const userProgress = progressResponse.data.lessons.find(
      //   (progress: UserProgress) => progress.lessonId === lessonId
      // ) || null;
      
      // setState(prev => ({
      //   ...prev,
      //   currentLesson: lessonData,
      //   userLessonProgress: userProgress,
      //   isLoading: false,
      //   lessonProgress: userProgress ? 
      //     (userProgress.exercises.filter((ex: { exerciseId: string; completed: boolean; score: number }) => ex.completed).length / lessonData.exercises.length) * 100 : 0
      // }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to fetch lesson') 
      }));
    }
  };

  // 모든 레슨 목록 가져오기
  const fetchAllLessons = async () => {
    // 로그인 상태가 아니면 함수 실행하지 않음
    if (!isAuthenticated) {
      console.log("User is not authenticated. Cannot fetch all lessons.");
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 레슨 목록 요청
      let lessons = [];
      try {
        const response = await lessonApi.getLessons();
        lessons = response.data;
        console.log("Fetched lessons:", lessons);
      } catch (err) {
        console.error("Error fetching lessons:", err);
      }

      // 사용자 진행 상황 요청
      // const progressResponse = await lessonApi.getUserProgress();
      
      // // 완료된 레슨 ID 목록 추출
      // const completedLessonIds = progressResponse.data.lessons
      //   .filter((progress: UserProgress) => progress.completed)
      //   .map((progress: UserProgress) => progress.lessonId);
      
      // setState(prev => ({
      //   ...prev,
      //   allLessons: lessons,
      //   completedLessons: completedLessonIds,
      //   isLoading: false
      // }));

      setState(prev => ({
        ...prev,
        allLessons: lessons,
        isLoading: false
      }));


    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to fetch lessons') 
      }));
    }
  };

  // 현재 진행 중인 연습 문제 인덱스 설정
  const setCurrentExerciseIndex = (index: number) => {
    setState(prev => ({ ...prev, currentExerciseIndex: index }));
  };

  const submitExerciseAnswer = async (exerciseId: string, answer: string | string[]): Promise<boolean> => {
    // 로그인 상태가 아니면 함수 실행하지 않음
    if (!isAuthenticated || !state.currentLesson) {
      console.log("User is not authenticated or no active lesson. Cannot submit answer.");
      return false;
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // 현재 연습 문제 찾기
      const exercise = state.currentLesson.exercises.find(ex => ex.id === exerciseId);
      if (!exercise) throw new Error('Exercise not found');
      
      // 답안 검증
      let isCorrect = false;
      if (Array.isArray(exercise.correctAnswer) && Array.isArray(answer)) {
        // 배열 답안 비교 (순서 무관)
        isCorrect = exercise.correctAnswer.every(item => answer.includes(item)) &&
                  answer.every(item => exercise.correctAnswer.includes(item));
      } else if (!Array.isArray(exercise.correctAnswer) && !Array.isArray(answer)) {
        // 문자열 답안 비교
        isCorrect = exercise.correctAnswer.toLowerCase() === answer.toLowerCase();
      }
      
      // 결과 저장
      if (state.currentLesson) {
        const response = await lessonApi.saveUserProgress(
          state.currentLesson.id,
          state.lessonProgress,
          isCorrect ? 100 : 50
        );
        
        // 진행률 업데이트
        const totalExercises = state.currentLesson.exercises.length;
        const completedExercises = state.currentExerciseIndex + 1;
        const newProgress = (completedExercises / totalExercises) * 100;
        
        // 레슨이 완료되었는지 확인 (모든 연습문제를 풀었을 때)
        const isLessonCompleted = completedExercises >= totalExercises;
        
        // completedLessons 업데이트
        let updatedCompletedLessons = [...state.completedLessons];
        if (isLessonCompleted && !updatedCompletedLessons.includes(state.currentLesson.id)) {
          updatedCompletedLessons.push(state.currentLesson.id);
        }
        
        setState(prev => ({
          ...prev,
          lessonProgress: newProgress,
          completedLessons: updatedCompletedLessons,
          isLoading: false
        }));
      }
      
      return isCorrect;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to submit answer') 
      }));
      return false;
    }
  };

  // 음성 평가 제출
  const submitSpeechEvaluation = async (exerciseId: string, audioBlob: Blob): Promise<PronunciationResult> => {
    // 로그인 상태가 아니면 함수 실행하지 않음
    if (!isAuthenticated || !state.currentLesson) {
      console.log("User is not authenticated or no active lesson. Cannot submit speech evaluation.");
      return {
        score: 0,
        feedback: 'No active lesson or not authenticated',
        wordScores: []
      };
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // 음성 데이터 전송 및 평가 결과 수신
      const response = await lessonApi.submitSpeechEvaluation(
        state.currentLesson.id,
        audioBlob
      );
      
      const result: PronunciationResult = response.data;
      
      // 결과 저장
      setState(prev => ({
        ...prev,
        pronounciationResults: result,
        isLoading: false
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to evaluate speech')
      }));
      
      return {
        score: 0,
        feedback: 'Evaluation failed',
        wordScores: []
      };
    }
  };

  // 레슨 진행률 업데이트
  const updateLessonProgress = (progress: number) => {
    setState(prev => ({ ...prev, lessonProgress: progress }));
  };

  // 음성 속도 설정
  const setSpeechSpeed = (speed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast') => {
    setState(prev => ({ ...prev, speechSpeed: speed }));
  };

  // 레슨 상태 초기화
  const resetLessonState = () => {
    setState(prev => ({
      ...prev,
      currentLesson: null,
      lessonProgress: 0,
      currentExerciseIndex: 0,
      pronounciationResults: null
    }));
  };

  // 인증 상태가 변경될 때마다 레슨 데이터 다시 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllLessons();
    } else {
      // 로그아웃 시 레슨 상태 초기화
      resetLessonState();
      setState(prev => ({
        ...prev,
        allLessons: [],
        completedLessons: []
      }));
    }
  }, [isAuthenticated]);

  // 컨텍스트 값
  const contextValue: LessonContextType = {
    ...state,
    fetchLesson,
    fetchAllLessons,
    setCurrentExerciseIndex,
    submitExerciseAnswer,
    submitSpeechEvaluation,
    updateLessonProgress,
    setSpeechSpeed,
    resetLessonState
  };

  return (
    <LessonContext.Provider value={contextValue}>
      {children}
    </LessonContext.Provider>
  );
};