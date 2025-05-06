import React, { useState, useEffect, useRef } from 'react';
import './TeacherAvatar.css';
import MouthSync from './MouthSync';

interface TeacherAvatarProps {
  speaking: boolean;
  phonemes?: string[];
  emotion?: 'normal' | 'happy' | 'thinking' | 'encouraging' | 'surprised';
  speedMultiplier: number;
}

const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  speaking,
  phonemes = [],
  emotion = 'normal',
  speedMultiplier = 1
}) => {
  const [currentEmotion, setCurrentEmotion] = useState<string>(emotion);
  const [blinking, setBlinking] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);
  
  // Handle emotion changes
  useEffect(() => {
    setCurrentEmotion(emotion);
  }, [emotion]);
  
  // Random blinking effect
  useEffect(() => {
    const startBlinkInterval = () => {
      const randomDelay = () => 2000 + Math.random() * 4000; // Random blink between 2-6 seconds
      
      const blink = () => {
        setBlinking(true);
        
        // Reset blink after 200ms
        setTimeout(() => {
          setBlinking(false);
          
          // Schedule next blink
          const nextBlinkTimeout = setTimeout(blink, randomDelay());
          return () => clearTimeout(nextBlinkTimeout);
        }, 200);
      };
      
      const initialBlinkTimeout = setTimeout(blink, randomDelay());
      return () => clearTimeout(initialBlinkTimeout);
    };
    
    const cleanupFunction = startBlinkInterval();
    return cleanupFunction;
  }, []);

  // Subtle floating animation
  useEffect(() => {
    let startTime = Date.now();
    
    const animate = () => {
      const avatarElement = document.querySelector('.teacher-character');
      if (avatarElement) {
        const elapsed = Date.now() - startTime;
        const movement = Math.sin(elapsed / 1000) * 3;
        avatarElement.setAttribute('style', `transform: translateY(${movement}px)`);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="teacher-avatar-container">
      <div className={`teacher-character ${currentEmotion}`}>
        {/* Background elements */}
        <div className="character-backdrop"></div>
        <div className="character-glow"></div>
        
        {/* Teacher body */}
        <div className="teacher-upper-body">
          <div className="teacher-head">
            <div className="teacher-hair"></div>
            <div className="teacher-face">
              <div className="teacher-eyes">
                <div className={`eye left-eye ${blinking ? 'blinking' : ''}`}>
                  <div className="pupil"></div>
                  <div className="eye-shine"></div>
                </div>
                <div className={`eye right-eye ${blinking ? 'blinking' : ''}`}>
                  <div className="pupil"></div>
                  <div className="eye-shine"></div>
                </div>
              </div>
              
              <div className="teacher-eyebrows">
                <div className="eyebrow left-eyebrow"></div>
                <div className="eyebrow right-eyebrow"></div>
              </div>
              
              <div className="teacher-nose"></div>
              
              <MouthSync 
                speaking={speaking}
                phonemes={phonemes}
                speedMultiplier={speedMultiplier}
              />
            </div>
          </div>
          
          <div className="teacher-shoulders">
            <div className="teacher-neck"></div>
            <div className="teacher-collar"></div>
          </div>
        </div>
        
        {/* Accessories */}
        <div className="teacher-accessories">
          {currentEmotion === 'thinking' && (
            <div className="thinking-bubble">
              <div className="thinking-dot dot-1"></div>
              <div className="thinking-dot dot-2"></div>
              <div className="thinking-dot dot-3"></div>
            </div>
          )}
          
          {speaking && (
            <div className="sound-waves">
              <div className="sound-wave wave-1"></div>
              <div className="sound-wave wave-2"></div>
              <div className="sound-wave wave-3"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Controls overlay */}
      <div className="avatar-controls-overlay">
        {speaking && (
          <div className="speaking-indicator">
            <div className="audio-wave"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAvatar;