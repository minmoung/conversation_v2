import React, { useState, useEffect, useRef } from 'react';
//import './MouthSync.css';

interface MouthSyncProps {
  speaking: boolean;
  phonemes?: string[];
  speedMultiplier: number;
}

// 영어 발음에 따른 입 모양 매핑
const phonemeToMouthShape: Record<string, string> = {
  'AA': 'open',    // "odd", 'a' in father
  'AE': 'open',    // "at", 'a' in cat
  'AH': 'mid',     // "hut", 'u' in but
  'AO': 'round',   // "ought", 'aw' in law
  'AW': 'round',   // "cow", 'ow' in how
  'AY': 'wide',    // "hide", 'i' in hide
  'B': 'closed',   // "be", 'b' in be
  'CH': 'small',   // "cheese", 'ch' in cheese
  'D': 'small',    // "dee", 'd' in deed
  'DH': 'small',   // "thee", 'th' in thee
  'EH': 'mid',     // "Ed", 'e' in red
  'ER': 'mid',     // "hurt", 'ur' in hurt
  'EY': 'wide',    // "ate", 'a' in ate
  'F': 'teeth',    // "fee", 'f' in fee
  'G': 'closed',   // "green", 'g' in green
  'HH': 'small',   // "he", 'h' in he
  'IH': 'small',   // "it", 'i' in it
  'IY': 'wide',    // "eat", 'ee' in eat
  'JH': 'small',   // "gee", 'g' in gee
  'K': 'closed',   // "key", 'k' in key
  'L': 'small',    // "lee", 'l' in lee
  'M': 'closed',   // "me", 'm' in me
  'N': 'closed',   // "knee", 'n' in knee
  'NG': 'closed',  // "ping", 'ng' in ping
  'OW': 'round',   // "oat", 'o' in oat
  'OY': 'round',   // "toy", 'oy' in toy
  'P': 'closed',   // "pee", 'p' in pee
  'R': 'small',    // "read", 'r' in read
  'S': 'small',    // "sea", 's' in sea
  'SH': 'round',   // "she", 'sh' in she
  'T': 'small',    // "tea", 't' in tea
  'TH': 'teeth',   // "theta", 'th' in think
  'UH': 'round',   // "hood", 'oo' in hood
  'UW': 'round',   // "two", 'oo' in too
  'V': 'teeth',    // "vee", 'v' in vee
  'W': 'round',    // "we", 'w' in we
  'Y': 'small',    // "yield", 'y' in yield
  'Z': 'small',    // "zee", 'z' in zee
  'ZH': 'small',   // "seizure", 's' in pleasure
  'SILENCE': 'closed'
};

const MouthSync: React.FC<MouthSyncProps> = ({ 
  speaking, 
  phonemes = [], 
  speedMultiplier = 1 
}) => {
  const [currentMouthShape, setCurrentMouthShape] = useState<string>('closed');
  const phonemeIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // 말하기 애니메이션 처리
  useEffect(() => {
    if (speaking && phonemes.length > 0) {
      let lastTime = 0;
      let phonemeIndex = 0;
      const phonemeDuration = 150 / speedMultiplier; // 속도 조절

      const animateMouth = (timestamp: number) => {
        if (!lastTime) lastTime = timestamp;
        const elapsed = timestamp - lastTime;
        
        if (elapsed > phonemeDuration) {
          // 다음 음소로 이동
          phonemeIndex = (phonemeIndex + 1) % phonemes.length;
          const currentPhoneme = phonemes[phonemeIndex];
          const mouthShape = phonemeToMouthShape[currentPhoneme] || 'closed';
          setCurrentMouthShape(mouthShape);
          lastTime = timestamp;
        }
        
        animationFrameRef.current = requestAnimationFrame(animateMouth);
      };
      
      animationFrameRef.current = requestAnimationFrame(animateMouth);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // 말하지 않을 때는 입을 닫음
      setCurrentMouthShape('closed');
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [speaking, phonemes, speedMultiplier]);

  return (
    <div className={`teacher-mouth mouth-shape-${currentMouthShape}`}>
      <div className="mouth-inner"></div>
    </div>
  );
};

export default MouthSync;