import { useState, useEffect, useCallback } from 'react';

interface SpeechOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string, options?: SpeechOptions) => Promise<void>;
  cancel: () => void;
  speaking: boolean;
  getPhonemes: (text: string) => Promise<string[]>;
}

export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // 브라우저의 TTS 엔진 사용
  const speak = useCallback(async (text: string, options: SpeechOptions = {}) => {
    const { voice, rate = 1, pitch = 1, onEnd } = options;

    // 이전 발화 취소
    cancel();

    // 새 발화 생성
    const newUtterance = new SpeechSynthesisUtterance(text);
    
    // 음성 설정
    if (voice) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === voice);
      if (selectedVoice) newUtterance.voice = selectedVoice;
    }
    
    // 속도, 피치 설정
    newUtterance.rate = rate;
    newUtterance.pitch = pitch;
    
    // 이벤트 핸들러
    newUtterance.onstart = () => setSpeaking(true);
    newUtterance.onend = () => {
      setSpeaking(false);
      if (onEnd) onEnd();
    };
    newUtterance.onerror = () => {
      setSpeaking(false);
      if (onEnd) onEnd();
    };
    
    setUtterance(newUtterance);
    window.speechSynthesis.speak(newUtterance);
    
    // Promise로 반환
    return new Promise<void>((resolve) => {
      newUtterance.onend = () => {
        setSpeaking(false);
        if (onEnd) onEnd();
        resolve();
      };
    });
  }, []);

  // 발화 취소
  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // 음소 추출 (실제로는 백엔드 API를 호출하거나 다른 방법을 사용해야 함)
  const getPhonemes = useCallback(async (text: string): Promise<string[]> => {
    // 여기서는 간단한 예시로 텍스트를 단어로 나누고, 각 단어에 대해 간단한 음소 배열을 반환
    return text.split(/\s+/).flatMap(word => {
      // 실제로는 훨씬 더 정교한 알고리즘이 필요
      const phonemes: string[] = [];
      for (let i = 0; i < word.length; i++) {
        const char = word[i].toLowerCase();
        if ('aeiou'.includes(char)) {
          phonemes.push('AA'); // 모음
        } else {
          phonemes.push('B');  // 자음
        }
      }
      return phonemes;
    });
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    speak,
    cancel,
    speaking,
    getPhonemes
  };
};