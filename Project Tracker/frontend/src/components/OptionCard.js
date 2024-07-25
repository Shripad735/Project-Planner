import React from 'react';
import '../styles/OptionCard.css';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTasks, FaCheckCircle, FaUpload, FaTimesCircle } from 'react-icons/fa';

const iconMap = {
    "Create New Project": <FaPlus size={50} />,
    "Manage Existing Projects": <FaTasks size={50} />,
    "Pending Verification of Tasks": <FaCheckCircle size={50} />,
    "View Assigned Tasks": <FaTasks size={50}/>,
    "View Rejected Tasks": <FaTimesCircle size={50} />,
    "Submit Completion Proofs": <FaUpload size={50} />
};

const OptionCard = ({ title, description, path }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(path);
    };

    return (
        <div className="option-card" onClick={handleClick}>
            {iconMap[title]}
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
};

export default OptionCard;
