import { useState, useCallback, useEffect } from 'react';

export interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // 컴포넌트 마운트 시 SpeechRecognition 객체 초기화
  useEffect(() => {
    // 브라우저 호환성 확인
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'ko-KR'; // 한국어 인식 설정
      
      // 결과 이벤트 핸들러
      recognitionInstance.onresult = (event: any) => {
        const transcriptArray = Array.from(event.results)
          .map((result: any) => result[0]?.transcript || '')
          .join(' ');
        
        setTranscript(transcriptArray);
      };
      
      // 종료 이벤트 핸들러
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      // 오류 이벤트 핸들러
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.error('Speech Recognition not supported in this browser');
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  // 인식 시작
  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  }, [recognition]);

  // 인식 중지
  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  // 텍스트 초기화
  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return { transcript, isListening, startListening, stopListening, resetTranscript };
};

// 타입 확장 (TypeScript에서 필요)
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}