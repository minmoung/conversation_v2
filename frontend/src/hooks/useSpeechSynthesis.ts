import { useState, useEffect, useCallback } from 'react';
import { TTSService } from '../services/TTSService';

interface UseSpeechSynthesisProps {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  useGoogleTTS?: boolean;
}

interface UseSpeechSynthesisReturn {
  speak: () => Promise<void>;
  stop: () => void;
  isPending: boolean;
  isSpeaking: boolean;
  phonemes: string[];
  error: Error | null;
}

export const useSpeechSynthesis = ({
  text,
  voice = '',
  rate = 1,
  pitch = 1,
  useGoogleTTS = true
}: UseSpeechSynthesisProps): UseSpeechSynthesisReturn => {
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [phonemes, setPhonemes] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // 컴포넌트 마운트 시 오디오 요소 생성
  useEffect(() => {
    const audio = new Audio();
    setAudioElement(audio);
    
    return () => {
      audio.pause();
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }
    };
  }, []);

  // 음성 생성 및 재생
  const speak = useCallback(async () => {
    if (!text.trim() || !audioElement) return;
    
    try {
      setIsPending(true);
      setError(null);
      
      // 기존 오디오 정리
      audioElement.pause();
      if (audioElement.src) {
        URL.revokeObjectURL(audioElement.src);
      }
      
      let audioData;
      let phonemeData: string[] = [];
      
      if (useGoogleTTS) {
        // Google TTS 서비스 사용
        const result = await TTSService.synthesize(text, {
          voice,
          rate,
          pitch,
          returnPhonemes: true
        });
        audioData = result.audioData;
        phonemeData = result.phonemes;
      } else {
        // 브라우저 내장 TTS 사용
        return new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          
          if (voice) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.name === voice);
            if (selectedVoice) utterance.voice = selectedVoice;
          }
          
          utterance.rate = rate;
          utterance.pitch = pitch;
          
          utterance.onstart = () => {
            setIsSpeaking(true);
            // 브라우저 TTS는 음소 정보를 제공하지 않으므로 기본 패턴 사용
            const basicPhonemes = text.split(' ').flatMap(word => 
              word.split('').map(char => {
                // 간단한 모음/자음 구분
                const vowels = 'aeiouAEIOU';
                return vowels.includes(char) ? 'AA' : 'B';
              })
            );
            setPhonemes(basicPhonemes);
          };
          
          utterance.onend = () => {
            setIsSpeaking(false);
            setPhonemes([]);
            resolve();
          };
          
          utterance.onerror = (event) => {
            setError(new Error(`Speech synthesis error: ${event.error}`));
            setIsSpeaking(false);
            resolve();
          };
          
          window.speechSynthesis.speak(utterance);
        });
      }
      
      // Google TTS에서 받은 오디오 데이터 처리
      const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioElement.src = audioUrl;
      
      // 음소 데이터 설정
      setPhonemes(phonemeData);
      
      // 오디오 이벤트 리스너 설정
      audioElement.onplay = () => setIsSpeaking(true);
      audioElement.onended = () => {
        setIsSpeaking(false);
        setPhonemes([]);
      };
      audioElement.onerror = (e) => {
        setError(new Error('Audio playback error'));
        setIsSpeaking(false);
      };
      
      // 오디오 재생
      await audioElement.play();
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown TTS error'));
    } finally {
      setIsPending(false);
    }
  }, [text, voice, rate, pitch, useGoogleTTS, audioElement]);
  
  // 음성 중지
  const stop = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    } else {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setPhonemes([]);
  }, [audioElement]);

  return {
    speak,
    stop,
    isPending,
    isSpeaking,
    phonemes,
    error
  };
};