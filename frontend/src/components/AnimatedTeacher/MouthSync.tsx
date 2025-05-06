import React, { useState, useEffect, useRef } from 'react';
import './MouthSync.css';

interface MouthSyncProps {
  speaking: boolean;
  phonemes?: string[];
  speedMultiplier: number;
}

// Mapping of phoneme types to mouth shapes
const phonemeMouthShapes: Record<string, string> = {
  'AA': 'open',      // as in "father"
  'AE': 'open',      // as in "cat"
  'AH': 'open',      // as in "but"
  'AO': 'rounded',   // as in "dog"
  'AW': 'rounded',   // as in "cow"
  'AY': 'wide',      // as in "hide"
  'B': 'closed',     // as in "be"
  'CH': 'small',     // as in "cheese"
  'D': 'small',      // as in "dee"
  'DH': 'small',     // as in "thee"
  'EH': 'wide',      // as in "red"
  'ER': 'rounded',   // as in "hurt"
  'EY': 'wide',      // as in "say"
  'F': 'teeth',      // as in "fee"
  'G': 'small',      // as in "green"
  'HH': 'small',     // as in "he"
  'IH': 'small',     // as in "big"
  'IY': 'wide',      // as in "eat"
  'JH': 'small',     // as in "gee"
  'K': 'small',      // as in "key"
  'L': 'small',      // as in "lee"
  'M': 'closed',     // as in "me"
  'N': 'small',      // as in "knee"
  'NG': 'small',     // as in "ping"
  'OW': 'rounded',   // as in "oat"
  'OY': 'rounded',   // as in "toy"
  'P': 'closed',     // as in "pee"
  'R': 'rounded',    // as in "read"
  'S': 'small',      // as in "sea"
  'SH': 'rounded',   // as in "she"
  'T': 'small',      // as in "tea"
  'TH': 'teeth',     // as in "thin"
  'UH': 'rounded',   // as in "hood"
  'UW': 'rounded',   // as in "two"
  'V': 'teeth',      // as in "vee"
  'W': 'rounded',    // as in "we"
  'Y': 'small',      // as in "yield"
  'Z': 'small',      // as in "zee"
  'ZH': 'small',     // as in "seizure"
  // Default for when no phoneme is matched
  'default': 'neutral'
};

const MouthSync: React.FC<MouthSyncProps> = ({
  speaking,
  phonemes = [],
  speedMultiplier = 1
}) => {
  const [currentMouthShape, setCurrentMouthShape] = useState<string>('neutral');
  const [mouthInterpolation, setMouthInterpolation] = useState<number>(0);
  const lastPhonemeTimeRef = useRef<number>(Date.now());
  const currentPhonemeIndexRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Base duration for each phoneme in ms, modified by speed multiplier
  const basePhonemeDuration = 200;
  
  useEffect(() => {
    if (!speaking || phonemes.length === 0) {
      setCurrentMouthShape('neutral');
      currentPhonemeIndexRef.current = 0;
      return;
    }
    
    const animateMouth = () => {
      const now = Date.now();
      const timeSinceLastPhoneme = now - lastPhonemeTimeRef.current;
      const adjustedDuration = basePhonemeDuration / speedMultiplier;
      
      // Calculate interpolation value (0 to 1) for smooth transitions
      const interpolation = Math.min(1, timeSinceLastPhoneme / (adjustedDuration * 0.3));
      setMouthInterpolation(interpolation);
      
      // Move to next phoneme if enough time has passed
      if (timeSinceLastPhoneme >= adjustedDuration) {
        lastPhonemeTimeRef.current = now;
        currentPhonemeIndexRef.current = (currentPhonemeIndexRef.current + 1) % phonemes.length;
        
        // Get mouth shape for current phoneme
        const currentPhoneme = phonemes[currentPhonemeIndexRef.current];
        const mouthShape = phonemeMouthShapes[currentPhoneme] || 'neutral';
        setCurrentMouthShape(mouthShape);
        setMouthInterpolation(0);
      }
      
      animationFrameRef.current = requestAnimationFrame(animateMouth);
    };
    
    // Start animation
    lastPhonemeTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animateMouth);
    
    // Set initial mouth shape
    const initialPhoneme = phonemes[0];
    const initialMouthShape = phonemeMouthShapes[initialPhoneme] || 'neutral';
    setCurrentMouthShape(initialMouthShape);
    
    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speaking, phonemes, speedMultiplier]);
  
  // Add subtle animation even when not speaking
  useEffect(() => {
    if (!speaking) {
      let idleTimer: number;
      
      const idleAnimation = () => {
        // Random micro-movements for the mouth when idle
        const randomMove = () => {
          const shapes = ['neutral', 'neutral-slight'];
          const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
          setCurrentMouthShape(randomShape);
          
          // Schedule next movement
          idleTimer = window.setTimeout(randomMove, 2000 + Math.random() * 3000);
        };
        
        randomMove();
      };
      
      idleAnimation();
      
      return () => {
        clearTimeout(idleTimer);
      };
    }
  }, [speaking]);

  return (
    <div className="mouth-container">
      <div className={`mouth ${currentMouthShape}`} 
           style={{ 
             transform: `scale(${1 + mouthInterpolation * 0.2})`,
             opacity: speaking ? 1 : 0.8
           }}>
        <div className="upper-lip"></div>
        <div className="lower-lip"></div>
        <div className="mouth-interior"></div>
        <div className="mouth-teeth upper-teeth"></div>
        <div className="mouth-teeth lower-teeth"></div>
      </div>
    </div>
  );
};

export default MouthSync;