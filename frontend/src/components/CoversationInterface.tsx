import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton, TextField, CircularProgress } from '@mui/material';
import { Mic, MicOff, Send, VolumeUp } from '@mui/icons-material';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { TeacherCanvas } from './AnimatedTeacher/TeacherCanvas';
import { useLesson } from '../contexts/LessonContext';
import { api } from '../services/api';

export const ConversationInterface: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDialogue, setCurrentDialogue] = useState<{
    question: string;
    answer?: string;
    audioUrl?: string;
    phonemeData?: any;
    feedback?: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isRecording, startRecording, stopRecording, audioBlob } = useAudioRecorder();
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();
  const { contextId, difficulty, setContextId } = useLesson();
  
  const [messages, setMessages] = useState<Array<{
    type: 'user' | 'teacher';
    text: string;
    audioUrl?: string;
    phonemeData?: any;
    feedback?: string;
  }>>([]);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(difficulty === 'beginner' ? 0.8 : 1.0);

  // 음성 인식 결과 처리
  useEffect(() => {
    if (transcript && !isListening) {
      setUserInput(transcript);
    }
  }, [transcript, isListening]);

  // 새 메시지가 추가될 때 스크롤 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 오디오 녹음 처리
  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleSpeechSubmit();
    }
  }, [audioBlob, isRecording]);

  // 대화 제출 처리
  const handleSubmit = async () => {
    if (userInput.trim() === '' || isProcessing) return;
    
    setIsProcessing(true);
    
    // 사용자 메시지 추가
    setMessages(prev => [...prev, { type: 'user', text: userInput }]);
    
    try {
      // API 요청
      const response = await api.post('/dialogue/', {
        user_input: userInput,
        context_id: contextId || undefined,
        difficulty_level: difficultyToLevel(difficulty),
      });
      
      // 컨텍스트 ID 저장
      if (response.data.context_id) {
        setContextId(response.data.context_id);
      }
      
      // 교사 응답 메시지 추가
      setMessages(prev => [...prev, { 
        type: 'teacher', 
        text: response.data.text, 
        audioUrl: response.data.audio_url,
        phonemeData: response.data.phoneme_timing,
        feedback: response.data.feedback
      }]);
      
      // 음성 재생 시작
      setIsSpeaking(true);
      
      // 음성 재생 완료 후 상태 초기화
      setTimeout(() => {
        setIsSpeaking(false);
      }, calculateAudioDuration(response.data.text, speechRate) * 1000);
      
    } catch (error) {
      console.error('Failed to get dialogue response:', error);
      // 오류 처리
    } finally {
      setUserInput('');
      setIsProcessing(false);
    }
  };
  
  // 음성 평가 제출
  const handleSpeechSubmit = async () => {
    if (!audioBlob || isProcessing) return;
    
    setIsProcessing(true);
    
    // 음성 데이터 FormData 준비
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'speech.wav');
    formData.append('reference_text', currentDialogue?.question || '');
    
    try {
      // API 요청
      const response = await api.post('/evaluate/', formData);
      
      // 피드백 추가
      setMessages(prev => {
        const updated = [...prev];
        const lastUserMessage = updated.findLast(m => m.type === 'user');
        if (lastUserMessage) {
          lastUserMessage.feedback = response.data.feedback;
        }
        return updated;
      });
      
    } catch (error) {
      console.error('Failed to evaluate speech:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 음성 재생 시간 계산 함수 (대략적인 추정)
  const calculateAudioDuration = (text: string, rate: number): number => {
    // 영어 텍스트의 경우 평균적으로 한 단어당 0.3초 정도 소요된다고 가정
    const words = text.split(' ').length;
    return words * 0.3 / rate;
  };
  
  // 난이도 레벨 변환
  const difficultyToLevel = (difficulty: string): number => {
    switch (difficulty) {
      case 'beginner': return 1;
      case 'elementary': return 2;
      case 'intermediate': return 3;
      case 'advanced': return 4;
      default: return 2;
    }
  };

  return (
    <div className="conversation-container">
      <TeacherCanvas 
        isSpeaking={isSpeaking}
        currentAudio={messages.length > 0 ? messages[messages.length - 1]?.audioUrl : undefined}
        phonemeData={messages.length > 0 ? messages[messages.length - 1]?.phonemeData : undefined}
        emotion={isSpeaking ? 'happy' : 'neutral'}
        speechRate={speechRate}
      />
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.type === 'user' ? 'user-message' : 'teacher-message'}`}
          >
            <div className="message-content">
              <p>{msg.text}</p>
              {msg.feedback && (
                <div className="feedback">
                  <small>{msg.feedback}</small>
                </div>
              )}
            </div>
            {msg.type === 'teacher' && msg.audioUrl && (
              <IconButton 
                size="small" 
                onClick={() => {
                  // 오디오 재생 로직
                  const audio = new Audio(msg.audioUrl);
                  audio.playbackRate = speechRate;
                  audio.play();
                }}
              >
                <VolumeUp fontSize="small" />
              </IconButton>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <TextField
          fullWidth
          variant="outlined"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isProcessing || isRecording}
          placeholder="영어로 대화해보세요..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
        />
        
        <IconButton 
          color={isRecording ? "secondary" : "primary"}
          onClick={() => {
            if (isRecording) {
              stopRecording();
              stopListening();
            } else {
              startRecording();
              startListening();
            }
          }}
          disabled={isProcessing}
        >
          {isRecording ? <MicOff /> : <Mic />}
        </IconButton>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isProcessing || userInput.trim() === ''}
          endIcon={isProcessing ? <CircularProgress size={20} /> : <Send />}
        >
          Send
        </Button>
      </div>
      
      <div className="settings-container">
        <label>
          Speech Rate:
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
          />
          {speechRate.toFixed(1)}x
        </label>
      </div>
    </div>
  );
};