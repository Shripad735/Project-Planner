import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import { FaArrowLeft } from 'react-icons/fa';
import '../styles/UploadProof.css'

const UploadProof = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decoded.exp < currentTime) {
                alert('Session expired. Please login again.');
                Cookies.remove('token');
                navigate('/login');
                return;
            } else if (decoded.username !== username) {
                navigate('/login');
                return;
            }

            setUserId(decoded.id); // Use the user ID from the decoded token
            fetchTasks(decoded.id);
        } catch (err) {
            navigate('/login');
        }
    }, [username, navigate]);

    const fetchTasks = async (userId) => {
        try {
            const response = await fetch('http://localhost:3000/tasks', {
                headers: {
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
            });
            const tasks = await response.json();
            setTasks(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleBackClick = () => {
        navigate(`/dashboard/${username}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', selectedTaskId);
        formData.append('userId', userId);
        try {
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
                body: formData
            });
        
            if (response.ok) {
                alert('File uploaded successfully');
                navigate(`/dashboard/${username}`);
            } else {
                alert('File upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('File upload failed');
        }
    };

    return (
        <div className='wrapper'>
        <div className="upload-proof">
        <div className="back-arrow" onClick={handleBackClick}>
                <FaArrowLeft size={30} />
            </div>
            <h2>Upload Completion Proof</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} required />
                <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    required
                >
                    <option value="" className='taskName'>Select Task</option>
                    {tasks.map(task => (
                        <option key={task.TaskId} value={task.TaskId}>
                            {task.TaskName}
                        </option>
                    ))}
                </select>
                <button type="submit" className='uploadButton'>Upload</button>
            </form>
        </div>
        </div>
    );
};

export default UploadProof;
