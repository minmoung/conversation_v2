import React, { useEffect, useRef, useState } from 'react';
// import { MouthSync } from './MouthSync';
// import { TeacherAvatar } from './TeacherCanvas';
import { useLesson } from '../../contexts/LessonContext';

interface TeacherCanvasProps {
  isSpeaking: boolean;
  currentAudio?: string;
  phonemeData?: Array<{time: number, phoneme: string}>;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'encouraging';
  speechRate?: number;
}

export const TeacherCanvas: React.FC<TeacherCanvasProps> = ({
  isSpeaking,
  currentAudio,
  phonemeData,
  emotion = 'neutral',
  speechRate = 1.0
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [teacherScale, setTeacherScale] = useState(1);
  const { difficulty } = useLesson();

  // 창 크기에 따라 교사 아바타 크기 조정
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.clientWidth;
        const scale = Math.min(1, width / 500); // 기본 사이즈를 500px로 가정
        setTeacherScale(scale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={canvasRef} 
      className="teacher-canvas"
      style={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        height: '400px',
        margin: '0 auto',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}
    >
      <div 
        style={{ 
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: `translateX(-50%) scale(${teacherScale})`,
          transformOrigin: 'bottom center',
          transition: 'transform 0.3s ease'
        }}
      >
        {/* <TeacherAvatar emotion={emotion} />
        
        {isSpeaking && currentAudio && (
          <div style={{ position: 'absolute', bottom: '30%', left: '50%', transform: 'translateX(-50%)' }}>
            <MouthSync 
              audioUrl={currentAudio} 
              phonemes={phonemeData} 
              speechRate={speechRate} 
            />
          </div>
        )} */}
        
        {/* 난이도에 따른 말풍선 표시 (초급일 경우 한국어 번역 함께 표시) */}
        {difficulty === 'beginner' && isSpeaking && (
          <div className="speech-translation">
            {/* 번역 텍스트는 실제 구현 시 상태로 관리 */}
            <small>안녕하세요, 오늘은 어떻게 지내세요?</small>
          </div>
        )}
      </div>
    </div>
  );
};