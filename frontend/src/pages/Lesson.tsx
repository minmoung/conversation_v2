import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLessonContext } from '../contexts/LessonContext';
import TeacherAvatar from '../components/AnimatedTeacher/TeacherAvatar';
import MouthSync from '../components/AnimatedTeacher/MouthSync';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import AudioControls from '../components/AudioControls/AudioControls';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { LessonContent, Dialogue } from '../types/lesson';
import { fetchLessonById, fetchTTS } from '../services/api';
import ChatBox from '../components/Chatbot/ChatBox';

const Lesson: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  // const { setCurrentLesson, updateUserProgress } = useLessonContext();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentPhonemes, setCurrentPhonemes] = useState<string[]>([]);
  const [speechRate, setSpeechRate] = useState<number>(1); // 기본 말하기 속도
  const [feedback, setFeedback] = useState<string>('');
  const [lessonData, setLessonData] = useState<LessonContent | null>(null);
  
  const { startRecording, stopRecording, audioBlob, isRecording: isAudioRecording } = useAudioRecorder();
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();

  // 레슨 데이터 불러오기
  useEffect(() => {
    const loadLesson = async () => {
      if (lessonId) {
        setIsLoading(true);
        try {
          const lessonData = await fetchLessonById(lessonId);
          setLessonData(lessonData);
          //setCurrentLesson(lessonData.id);
        } catch (error) {
          console.error('Failed to load lesson:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadLesson();
  //}, [lessonId, setCurrentLesson]);
  }, [lessonId]);

  // 대화 진행
  const handleNext = () => {
    if (!lessonData || currentDialogueIndex >= lessonData.dialogues.length - 1) return;
    
    setCurrentDialogueIndex(prev => prev + 1);
    setFeedback('');
  };

  // 이전 대화로 돌아가기
  const handlePrevious = () => {
    if (currentDialogueIndex <= 0) return;
    
    setCurrentDialogueIndex(prev => prev - 1);
    setFeedback('');
  };

  // // 선생님 말하기 실행
  // const handleTeacherSpeak = async () => {
  //   if (!lessonData) return;
    
  //   const dialogue = lessonData.dialogues[currentDialogueIndex];
  //   console.log('currentDialogueIndex :: ' + currentDialogueIndex );
  //   console.log('dialogue :: ' + dialogue );
  //   const teacherLine = dialogue.teacherLine;
  //   console.log('teacherLine :: ' + teacherLine );

  //   setIsSpeaking(true);
    
  //   // 간단한 시뮬레이션 (실제로는 TTS 서비스를 사용하겠지만 여기선 타이머로 대체)
  //   const mockPhonemes = teacherLine.split(' ').flatMap(word => 
  //     ['AA', 'B', 'EH', 'D', 'F', 'G', 'IY'].slice(0, Math.ceil(word.length / 2))
  //   );
  //   setCurrentPhonemes(mockPhonemes);
    
  //   // 말하기 시뮬레이션
  //   setTimeout(() => {
  //     setIsSpeaking(false);
  //     setCurrentPhonemes([]);
  //   }, teacherLine.length * 100 / speechRate);
  // };

  // 선생님 말하기 실행
  const handleTeacherSpeak = async () => {
    if (!lessonData) return;
  
    const dialogue = lessonData.dialogues[currentDialogueIndex];
    const teacherLine = dialogue.teacherLine;
    console.log('teacherLine :: ' + teacherLine);
  
    setIsSpeaking(true);
  
    try {
      // TTS API 호출
      const audioBlob = await fetchTTS(teacherLine);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
  
      // 오디오 재생이 끝난 후 상태 업데이트
      audio.onended = () => {
        setIsSpeaking(false);
      };
    } catch (error) {
      console.error('TTS 요청 중 오류 발생:', error);
      setIsSpeaking(false);
    }
  };


  // 학생 응답 평가
  const evaluateStudentResponse = async () => {
    if (!lessonData || !transcript || !lessonId) return;
    
    const expectedResponse = lessonData.dialogues[currentDialogueIndex].studentLine;
    
    // 간단한 평가 로직 (실제로는 백엔드 API를 호출)
    const similarityScore = calculateSimilarity(transcript, expectedResponse);
    
    // 피드백 설정
    if (similarityScore > 0.7) {
      setFeedback('잘했어요! 발음이 아주 좋습니다.');
      //updateUserProgress(lessonId, 10); // 10 포인트 부여
    } else if (similarityScore > 0.4) {
      setFeedback('좋아요! 조금 더 연습해보세요.');
    } else {
      setFeedback('다시 한번 시도해보세요.');
    }
  };

  // 간단한 유사도 계산 함수 (실제로는 더 정교한 알고리즘 사용)
  const calculateSimilarity = (a: string, b: string): number => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    //const commonChars = [...aLower].filter(char => bLower.includes(char)).length;
    const commonChars = Array.from(aLower).filter(char => bLower.includes(char)).length;
    return commonChars / Math.max(aLower.length, bLower.length);
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

  if (!lessonData) {
    return <div className="flex items-center justify-center h-screen">레슨을 찾을 수 없습니다.</div>;
  }

  const currentDialogue = lessonData.dialogues[currentDialogueIndex];

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      {/* 상단 프로그레스 바 */}
      <div className="p-4 bg-white shadow">
        <ProgressBar 
          current={currentDialogueIndex + 1} 
          total={lessonData.dialogues.length}
          completed={[]} // 실제 앱에서는 완료된 대화 ID를 넣어주세요
        />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center p-6 overflow-auto">
        {/* 선생님 아바타 및 음성 */}
        <div className="relative w-full max-w-md h-64 bg-white rounded-lg shadow-md mb-8">
          <TeacherAvatar 
            speaking={isSpeaking}
            phonemes={currentPhonemes}
            emotion="normal"
            speedMultiplier={speechRate}
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
          disabled={currentDialogueIndex >= lessonData.dialogues.length - 1}
          className="bg-blue-500 text-white py-2 px-6 rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>

      <div className="bg-white p-4 shadow-inner flex justify-between">
        <ChatBox />
      </div>
      
    </div>
  );
};

export default Lesson;