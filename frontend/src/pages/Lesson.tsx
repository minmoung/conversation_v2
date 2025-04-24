import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLessonContext } from '../contexts/LessonContext';
import TeacherAvatar from '../components/AnimatedTeacher/TeacherAvatar';
import MouthSync from '../components/AnimatedTeacher/MouthSync';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import AudioControls from '../components/AudioControls/AudioControls';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { LessonContent } from '../types/lesson';
import { fetchLessonById } from '../services/api';

const Lesson: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  // const { currentLesson, setCurrentLesson, userProgress, updateProgress } = useLessonContext();
  const { currentLesson, setCurrentLesson, userProgress, updateUserProgress } = useLessonContext();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentPhonemes, setCurrentPhonemes] = useState<string[]>([]);
  const [speechRate, setSpeechRate] = useState<number>(1); // 기본 말하기 속도
  const [feedback, setFeedback] = useState<string>('');
  
  const { startRecording, stopRecording, audioBlob } = useAudioRecorder();
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();
  const { speak, cancel, speaking, getPhonemes } = useSpeechSynthesis();

  // 레슨 데이터 불러오기
  useEffect(() => {
    const loadLesson = async () => {
      if (lessonId) {
        setIsLoading(true);
        try {
          const lessonData = await fetchLessonById(lessonId);
          //setCurrentLesson(lessonData);
        } catch (error) {
          console.error('Failed to load lesson:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadLesson();
  }, [lessonId, setCurrentLesson]);

  // 대화 진행
  const handleNext = () => {
    //if (!currentLesson || currentDialogueIndex >= currentLesson.dialogues.length - 1) return;
    
    setCurrentDialogueIndex(prev => prev + 1);
    setFeedback('');
  };

  // 이전 대화로 돌아가기
  const handlePrevious = () => {
    if (currentDialogueIndex <= 0) return;
    
    setCurrentDialogueIndex(prev => prev - 1);
    setFeedback('');
  };

  // 선생님 말하기 실행
  const handleTeacherSpeak = async () => {
    if (!currentLesson) return;
    
    //const dialogue = currentLesson.dialogues[currentDialogueIndex];
    const teacherLine = dialogue.teacherLine;
    
    setIsSpeaking(true);
    
    // 발음 정보 가져오기 (입 동기화용)
    const phonemes = await getPhonemes(teacherLine);
    setCurrentPhonemes(phonemes);
    
    // 선생님 말하기 실행
    await speak(teacherLine, {
      rate: speechRate,
      onEnd: () => {
        setIsSpeaking(false);
        setCurrentPhonemes([]);
      }
    });
  };

  // 학생 응답 평가
  const evaluateStudentResponse = async () => {
    if (!currentLesson || !transcript) return;
    
    const expectedResponse = currentLesson.dialogues[currentDialogueIndex].studentLine;
    
    try {
      // 백엔드에 학생 응답 전송하여 평가 받기
      const response = await fetch('/api/evaluate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expectedResponse,
          studentResponse: transcript,
          lessonId,
          dialogueIndex: currentDialogueIndex
        }),
      });
      
      const result = await response.json();
      setFeedback(result.feedback);
      
      // 진행 상황 업데이트
      if (result.score > 0.7) {
        updateProgress(lessonId, currentDialogueIndex);
      }
    } catch (error) {
      console.error('Error evaluating response:', error);
      setFeedback('평가 중 오류가 발생했습니다.');
    }
  };

  // 말하기 속도 조절
  const handleSpeedChange = (newSpeed: number) => {
    setSpeechRate(newSpeed);
  };

  // 학생 응답 녹음 시작
  const handleStartSpeaking = () => {
    startRecording();
    startListening();
  };

  // 학생 응답 녹음 종료 및 평가
  const handleStopSpeaking = () => {
    stopRecording();
    stopListening();
    setTimeout(evaluateStudentResponse, 500); // 인식 완료 시간 고려
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  if (!currentLesson) {
    return <div className="flex items-center justify-center h-screen">레슨을 찾을 수 없습니다.</div>;
  }

  const currentDialogue = currentLesson.dialogues[currentDialogueIndex];

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      {/* 상단 프로그레스 바 */}
      <div className="p-4 bg-white shadow">
        <ProgressBar 
          current={currentDialogueIndex + 1} 
          total={currentLesson.dialogues.length}
          completed={userProgress[lessonId]?.completedDialogues || []}
        />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center p-6 overflow-auto">
        {/* 선생님 아바타 및 음성 */}
        <div className="relative w-full max-w-md h-64 bg-white rounded-lg shadow-md mb-8">
          <TeacherAvatar 
            character={currentLesson.teacherCharacter} 
            expression={isSpeaking ? 'speaking' : 'idle'} 
          />
          <MouthSync 
            active={isSpeaking} 
            phonemes={currentPhonemes}
          />
          
          {/* 말하기 속도 조절 */}
          <div className="absolute bottom-4 right-4 flex items-center">
            <label className="mr-2 text-sm font-medium">속도:</label>
            <select 
              value={speechRate} 
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="text-sm border rounded p-1"
            >
              <option value="0.5">매우 느리게</option>
              <option value="0.75">느리게</option>
              <option value="1">보통</option>
              <option value="1.25">빠르게</option>
            </select>
          </div>
        </div>
        
        {/* 대화 내용 */}
        <div className="w-full max-w-md mb-8">
          <div className="bg-blue-100 p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">선생님:</h3>
            <p>{currentDialogue.teacherLine}</p>
            <button 
              onClick={handleTeacherSpeak}
              disabled={isSpeaking}
              className="mt-2 bg-blue-500 text-white py-1 px-3 rounded-full text-sm"
            >
              {isSpeaking ? '말하는 중...' : '다시 듣기'}
            </button>
          </div>
          
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-bold mb-2">내 차례:</h3>
            <p className="mb-2">{currentDialogue.studentLine}</p>
            
            {/* 학생 응답 표시 */}
            {transcript && (
              <div className="bg-white p-2 rounded mb-2">
                <p className="text-gray-700">내가 말한 내용: {transcript}</p>
              </div>
            )}
            
            {/* 피드백 표시 */}
            {feedback && (
              <div className="bg-yellow-50 p-2 rounded border border-yellow-200 mt-2">
                <p className="text-sm">{feedback}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 오디오 컨트롤 */}
        <AudioControls 
          onStartRecording={handleStartSpeaking}
          onStopRecording={handleStopSpeaking}
          isRecording={isListening}
        />
      </div>
      
      {/* 하단 네비게이션 */}
      <div className="bg-white p-4 shadow-inner flex justify-between">
        <button 
          onClick={handlePrevious}
          disabled={currentDialogueIndex <= 0}
          className="bg-gray-200 py-2 px-6 rounded disabled:opacity-50"
        >
          이전
        </button>
        <button 
          onClick={handleNext}
          disabled={currentDialogueIndex >= currentLesson.dialogues.length - 1}
          className="bg-blue-500 text-white py-2 px-6 rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default Lesson;