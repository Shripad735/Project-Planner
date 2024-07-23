import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import OptionCard from './optionCard2';
import { FaArrowLeft   } from 'react-icons/fa';
import '../styles/TaskCards.css';

const TaskCards = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        

        const decoded = jwtDecode(token);
        const userId = decoded.id;

        fetch(`http://localhost:3000/tasks/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => setTasks(data))
        .catch(error => console.error('Error fetching tasks:', error));
    }, [navigate]);

    if (tasks.length === 0) {
        return <p>No tasks assigned</p>;
    }
    
    const handleBackClick = () => {
        navigate(`/dashboard/${username}`);
    };

    return (
        <div className='wrapper'>
            <div className="back-arrow" onClick={handleBackClick}>
                <FaArrowLeft size={30} />
            </div>
        <div className="task-cards-container">
            {tasks.map(task => (
                <OptionCard 
                    key={task.TaskID}
                    title={task.TaskName}
                    deadline={`${new Date(task.StartDate).toLocaleDateString()} - ${new Date(task.EndDate).toLocaleDateString()}`}
                    status={task.Status}
                    longDescription={task.Description}  // You can customize this as needed
                    path={task.Status === 'In Progress' ? `/upload-proof/${username}` : null}
                />
            ))}
        </div>
        </div>
    );
};

export default TaskCards;
