import React, { useState, useEffect, useRef } from 'react';
import './AnimatedTeacherCard.css';

interface AnimatedTeacherCardProps {
  id: string;
  name: string;
  imageUrl: string;
  specialty: string;
  languages: string[];
  rating: number;
  availability: string;
  onSelect: (teacherId: string) => void;
  animatedText?: string; // Optional text to animate speech
}

const AnimatedTeacherCard: React.FC<AnimatedTeacherCardProps> = ({
  id,
  name,
  imageUrl,
  specialty,
  languages,
  rating,
  availability,
  onSelect,
  animatedText
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [textIndex, setTextIndex] = useState<number>(0);
  const mouthRef = useRef<HTMLDivElement>(null);
  
  // Rating stars rendering helper
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="star half-filled">★</span>);
      } else {
        stars.push(<span key={i} className="star">☆</span>);
      }
    }
    return stars;
  };

  // Mouth animation based on text
  useEffect(() => {
    if (!animatedText || animatedText.length === 0) return;
    
    setIsSpeaking(true);
    const textAnimation = setInterval(() => {
      if (textIndex < animatedText.length) {
        setCurrentText(prev => prev + animatedText[textIndex]);
        setTextIndex(prev => prev + 1);
        
        // Animate mouth based on character
        const currentChar = animatedText[textIndex].toLowerCase();
        if (mouthRef.current) {
          // Vowels open mouth wider
          if ('aeiou'.includes(currentChar)) {
            mouthRef.current.className = 'teacher-mouth speaking-vowel';
          } 
          // Consonants open mouth less
          else if ('bcdfghjklmnpqrstvwxyz'.includes(currentChar)) {
            mouthRef.current.className = 'teacher-mouth speaking-consonant';
          }
          // Space or punctuation closes mouth briefly
          else {
            mouthRef.current.className = 'teacher-mouth speaking-pause';
          }
        }
      } else {
        clearInterval(textAnimation);
        setIsSpeaking(false);
        setTextIndex(0);
        setCurrentText('');
        if (mouthRef.current) {
          mouthRef.current.className = 'teacher-mouth';
        }
      }
    }, 100); // Speed of animation

    return () => {
      clearInterval(textAnimation);
      setIsSpeaking(false);
    };
  }, [animatedText, textIndex]);

  const handleStartSpeaking = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If no specific text is provided, use a default introduction
    const speechText = animatedText || `Hi, I'm ${name}. I can help you with ${specialty}.`;
    setCurrentText('');
    setTextIndex(0);
    setIsSpeaking(true);
    // Temporarily set the animated text (this will trigger the effect)
    const element = e.currentTarget as HTMLElement;
    element.setAttribute('data-speaking-text', speechText);
  };

  return (
    <div className="teacher-card" onClick={() => onSelect(id)}>
      <div className="teacher-photo-container">
        <div className={`teacher-face ${isSpeaking ? 'speaking' : ''}`}>
          <img 
            src={imageUrl} 
            alt={`${name} - English teacher`} 
            className="teacher-photo" 
          />
          <div ref={mouthRef} className="teacher-mouth"></div>
        </div>
        <div className="teacher-status online"></div>
        
        {isSpeaking && (
          <div className="speech-bubble">
            {currentText}
          </div>
        )}
        
        <button 
          className="listen-button" 
          onClick={handleStartSpeaking}
          disabled={isSpeaking}
        >
          {isSpeaking ? '🔊 Speaking...' : '🔊 Listen'}
        </button>
      </div>
      
      <div className="teacher-info">
        <div className="teacher-name-container">
          <h3 className="teacher-name">{name}</h3>
          <div className="teacher-rating">
            {renderStars(rating)}
            <span className="rating-number">({rating})</span>
          </div>
        </div>
        
        <p className="teacher-specialty">{specialty}</p>
        
        <div className="teacher-languages">
          {languages.map((language, index) => (
            <span key={index} className="language-badge">{language}</span>
          ))}
        </div>
        
        <p className="teacher-availability">
          <span className="availability-icon">🕒</span>
          <span className="availability-text">{availability}</span>
        </p>
      </div>
      
      <div className="teacher-action-buttons">
        <button className="view-profile-btn">프로필 보기</button>
        <button className="book-lesson-btn">수업 예약</button>
      </div>
    </div>
  );
};

export default AnimatedTeacherCard;