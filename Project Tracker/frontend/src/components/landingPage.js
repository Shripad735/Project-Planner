// project-tracker-frontend/src/components/LandingPage.js
import React from 'react';
import '../styles/landingPage.css';
import FeatureCard from './FeatureCard';
import { FaBell, FaUsers, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Current time in seconds

        if (decoded.exp > currentTime) {
          navigate(`/dashboard/${decoded.username}`);
        } else {
          alert('Session expired. Please login again.');
          Cookies.remove('token');
          navigate('/login');
        }
      } catch (err) {
        alert('Invalid token. Please login again.');
        Cookies.remove('token');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: <FaBell />,
      title: 'Track Alert',
      description1: 'Set all deadlines & get notified',
    },
    {
      icon: <FaUsers />,
      title: 'Multi Users',
      description1: 'Assign different tasks to different team members',
    },
    {
      icon: <FaFileAlt />,
      title: 'Submissions',
      description1: 'Monitor work done by team',
    }
  ];

  return (
    <div className="landing-page gradient-background">
      <h1>Welcome to Project Tracker !</h1>
      <p>Stay on Track, Every Step of the Way!</p>
      
      <div className="features">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description1={feature.description1}
          />
        ))}
      </div>
      <br />
      <br />
      <div>
        <button 
          className="button-73" 
          style={{ marginTop: '25px', marginLeft: '20px' }} 
          onClick={handleGetStarted}
        >
          Get started now
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
