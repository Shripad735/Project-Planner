import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/optionCard2.css';

const OptionCard = ({ title, deadline, description, status, longDescription, path }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (path) {
            navigate(path);
        } else {
            alert('Task is not started yet');
        }
    };

    return (
        <div 
            className="option-card" 
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <h3>{title}</h3>
            <p>{deadline}</p>
            <p>{description}</p>
            {status === 'Not Started' && <p>Status: Not Started</p>}
            {status === 'In Progress' && <p>Status: In Progress</p>}
            {status === 'Completed' && <p>Status: Completed</p>}
            {isHovered && longDescription && <div className="tooltip">{longDescription}</div>}
        </div>
    );
};

export default OptionCard;
