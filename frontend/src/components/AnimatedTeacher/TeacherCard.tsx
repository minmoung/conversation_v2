import React from 'react';
import './TeacherCard.css';

interface TeacherCardProps {
  id: string;
  name: string;
  imageUrl: string;
  specialty: string;
  languages: string[];
  rating: number;
  availability: string;
  onClick: () => void;
}

const TeacherCard: React.FC<TeacherCardProps> = ({
  name,
  imageUrl,
  specialty,
  languages,
  rating,
  availability,
  onClick
}) => {
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

  return (
    <div className="teacher-card" onClick={onClick}>
      <div className="teacher-photo-container">
        <img 
          src={imageUrl} 
          alt={`${name} - English teacher`} 
          className="teacher-photo" 
        />
        <div className="teacher-status online"></div>
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

export default TeacherCard;