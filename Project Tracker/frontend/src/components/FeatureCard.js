// project-tracker-frontend/src/components/FeatureCard.js
import React from 'react';
import '../styles/FeatureCard.css';

const FeatureCard = ({ icon, title, description1, description2 }) => {
  return (
    <div className="card">
      <div className="card-content">
        <div className="card-front">
          <div className="icon">{icon}</div>
          <h3>{title}</h3>
        </div>
        <div className="card-back">
          <p><strong>{description1}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;