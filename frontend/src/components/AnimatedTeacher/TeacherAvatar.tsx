import React, { useState, useEffect } from 'react';
import MouthSync from './MouthSync';
import './TeacherAvatar.css';

interface TeacherAvatarProps {
  speaking: boolean;
  phonemes?: string[];
  emotion?: 'normal' | 'happy' | 'thinking' | 'encouraging';
  speedMultiplier: number;
}

const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  speaking,
  phonemes = [],
  emotion = 'normal',
  speedMultiplier = 1
}) => {
  const [currentEmotion, setCurrentEmotion] = useState<string>(emotion);
  
  useEffect(() => {
    setCurrentEmotion(emotion);
  }, [emotion]);

  return (
    <div className="teacher-avatar">
      <div className={`teacher-container ${currentEmotion}`}>
        <div className="teacher-face">
          <div className="teacher-eyes">
            <div className="eye left-eye"></div>
            <div className="eye right-eye"></div>
          </div>
          <div className="teacher-nose"></div>
          <MouthSync 
            speaking={speaking} 
            phonemes={phonemes} 
            speedMultiplier={speedMultiplier} 
          />
        </div>
        <div className="teacher-body"></div>
      </div>
    </div>
  );
};

export default TeacherAvatar;