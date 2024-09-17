import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTasks, FaCheckCircle, FaUpload, FaTimesCircle } from 'react-icons/fa';

const iconMap = {
    "Create New Project": <FaPlus size={50} />,
    "Manage Existing Projects": <FaTasks size={50} />,
    "Pending Verification of Tasks": <FaCheckCircle size={50} />,
    "View Assigned Tasks": <FaTasks size={90} />,
    "View Rejected Tasks": <FaTimesCircle size={50} />,
    "Submit Completion Proofs": <FaUpload size={60} />
};

const OptionCard = ({ title, description, path }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(path);
    };

    return (
        <div
            className="option-card bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg rounded-lg p-6 flex flex-col items-center text-center transition-transform transform hover:scale-105 cursor-pointer"
            onClick={handleClick}
        >
            <div className="text-white mb-4">
                {iconMap[title]}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-white">{description}</p>
        </div>
    );
};

export default OptionCard;