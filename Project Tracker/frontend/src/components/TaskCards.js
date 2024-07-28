import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
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
    .then(data => {
      const updatedTasks = data.map(task => {
        if (task.ProofFile) {
          return {
            ...task,
            ProofFile: task.ProofFile.split('uploads\\').pop()
          };
        }
        return task;
      });
      setTasks(updatedTasks);
    })
    .catch(error => console.error('Error fetching tasks:', error));
  }, [navigate]);

  if (tasks.length === 0) {
    return <p>No tasks assigned</p>;
  }

  const handleBackClick = () => {
    navigate(`/dashboard/${username}`);
  };

  const handleDeleteProof = (proofId) => {
    const token = Cookies.get('token');
    fetch(`http://localhost:3000/proofs/${proofId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        alert('Proof file deleted successfully');
        setTasks(tasks.map(task => task.ProofID === proofId ? { ...task, ProofID: null, ProofFile: null, ProofStatus: null } : task));
      } else {
        alert('Failed to delete proof file');
      }
    })
    .catch(error => console.error('Error deleting proof file:', error));
  };

  const handleUploadProof = (taskId, taskName, taskDueDate) => {
    const encodedTaskId = btoa(taskId);
    const encodedTaskName = btoa(taskName);
    const encodedTaskDueDate = btoa(taskDueDate);
    navigate(`/upload-proof/${username}?wwtm=${encodedTaskId}&rtmn=${encodedTaskName}&tynr=${encodedTaskDueDate}`);
  };

  const decodeBase64 = (str) => {
    try {
      return atob(str);
    } catch (e) {
      console.error('Failed to decode base64 string:', e);
      return null;
    }
  };

  return (
    <div className='wrapper'>
      <div className="back-arrow" onClick={handleBackClick}>
        <FaArrowLeft size={30} />
      </div>
      <div className="task-cards-container">
        {tasks.map(task => {
          const proofFile = decodeBase64(task.ProofFile);
          return (
            <div className="task-card" key={task.TaskID}>
              <h3>{task.TaskName}</h3>
              <p><b>Deadline:</b> {`${new Date(task.StartDate).toLocaleDateString()} - ${new Date(task.EndDate).toLocaleDateString()}`}</p>
              <p><b>Status:</b> {task.Status}</p>
              <p><b>Description:</b> {task.Description}</p>
              
              {task.ProofID && proofFile && (
                <div className="proof-details">
                  <a
                    href={`http://localhost:3000/download/${proofFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proof-file-link"
                  >
                    Download: {proofFile}
                  </a>
                  <p><b>Proof Status:</b> {task.ProofStatus}</p>
                  <p><b>Submitted On:</b> {new Date(task.SubmissionAt).toLocaleString()}</p>
                  {(task.ProofStatus === 'Rejected' || task.ProofStatus === 'Pending') && (
                    <button onClick={() => handleDeleteProof(task.ProofID)} className="upload">Delete Proof</button>
                  )}
                </div>
              )}

              {(task.Status === 'In Progress' || task.Status === 'Overdue') && (
                <button 
                  onClick={() => handleUploadProof(task.TaskID, task.TaskName, task.EndDate)} 
                  className="upload"
                >
                  Upload Proof <FaArrowRight size={10}/>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskCards;
