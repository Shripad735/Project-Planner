import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa';
import '../styles/TaskCards.css';

const TaskCards = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [tasksByMonth, setTasksByMonth] = useState({});
  const [selectedMonthYear, setSelectedMonthYear] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = jwtDecode(token);
    if (decoded.usertype !== 2) {
      alert('Please login again, for usertype confirmation');
      Cookies.remove('token');
      navigate('/login');
      return;
    }
    const userId = decoded.id;

    fetch(`http://localhost:3000/tasks/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        setTasksByMonth(data);
        const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        setSelectedMonthYear(currentMonthYear);
      })
      .catch(error => console.error('Error fetching tasks:', error));
  }, [navigate]);

  if (!Object.keys(tasksByMonth).length) {
    return <p className="text-center text-gray-700">No tasks assigned</p>;
  }

  const handleBackClick = () => {
    navigate(`/dashboard/${username}`);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleCloseClick = () => {
    setSelectedTask(null);
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
          setSelectedTask(prevTask => ({ ...prevTask, ProofID: null, ProofFile: null, ProofStatus: null }));
          const updatedTasksByMonth = { ...tasksByMonth };
          updatedTasksByMonth[selectedMonthYear] = updatedTasksByMonth[selectedMonthYear].map(task =>
            task.ProofID === proofId ? { ...task, ProofID: null, ProofFile: null, ProofStatus: null } : task
          );
          setTasksByMonth(updatedTasksByMonth);
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

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleMonthYearChange = (event) => {
    setSelectedMonthYear(event.target.value);
  };

  const getMonthYearsOptions = () => {
    return Object.keys(tasksByMonth).sort((a, b) => new Date(b) - new Date(a));
  };

  return (
    <div className='rtwrapper bg-gray-100 min-h-screen p-6'>
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Tasks Assigned to You</h1>
      <div className="back-arrow cursor-pointer mb-4" onClick={handleBackClick}>
        <FaArrowLeft size={30} className="text-gray-700 hover:text-gray-900 transition duration-300" />
      </div>

      <div className="dropdowns mb-6">
        <select value={selectedMonthYear} onChange={handleMonthYearChange} className="w-full p-2 border border-gray-300 rounded">
          {getMonthYearsOptions().map(monthYear => (
            <option key={monthYear} value={monthYear}>{monthYear}</option>
          ))}
        </select>
      </div>

      {selectedMonthYear && tasksByMonth[selectedMonthYear] && (
        <div className="tasks-container grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="task-column bg-white border-2 border-gray-300 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Not Started</h2>
            {tasksByMonth[selectedMonthYear].filter(task => task.Status === 'Not Started').length === 0 ? (
              <p className="text-center text-lg text-gray-700 mt-20">No tasks started</p>
            ) : (
              tasksByMonth[selectedMonthYear].filter(task => task.Status === 'Not Started').map(task => (
                <div key={task.TaskID} className="task-list-item p-2 mb-2 rounded cursor-pointer hover:bg-gray-100" onClick={() => handleTaskClick(task)} style={{ color: getRandomColor() }}>
                  <p><b>Project Name - {task.ProjectName}</b></p>
                  <p><b>Milestone Name - {task.MilestoneName}</b></p>
                  <p><b>Task Name - {task.TaskName}</b></p>
                </div>
              ))
            )}
          </div>

          <div className="task-column bg-white border-2 border-gray-300 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-yellow-600 mb-4">In Progress</h2>
            {tasksByMonth[selectedMonthYear].filter(task => task.Status === 'In Progress').length === 0 ? (
              <p className="text-center text-lg text-gray-700 mt-20">No tasks in progress</p>
            ) : (
              tasksByMonth[selectedMonthYear].filter(task => task.Status === 'In Progress').map(task => (
                <div key={task.TaskID} className="task-list-item p-2 mb-2 rounded cursor-pointer hover:bg-gray-100" onClick={() => handleTaskClick(task)} style={{ color: getRandomColor() }}>
                  <p><b>Project Name - {task.ProjectName}</b></p>
                  <p><b>Milestone Name - {task.MilestoneName}</b></p>
                  <p><b>Task Name - {task.TaskName}</b></p>
                </div>
              ))
            )}
          </div>

          <div className="task-column bg-white border-2 border-gray-300 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-green-600 mb-4">Completed</h2>
            {tasksByMonth[selectedMonthYear].filter(task => task.Status === 'Completed').length === 0 ? (
              <p className="text-center text-lg text-gray-700 mt-20">No tasks Completed</p>
            ) : (
              tasksByMonth[selectedMonthYear].filter(task => task.Status === 'Completed').map(task => (
                <div key={task.TaskID} className="task-list-item p-2 mb-2 rounded cursor-pointer hover:bg-gray-100" onClick={() => handleTaskClick(task)} style={{ color: getRandomColor() }}>
                  <p><b>Project Name - {task.ProjectName}</b></p>
                  <p><b>Milestone Name - {task.MilestoneName}</b></p>
                  <p><b>Task Name - {task.TaskName}</b></p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="task-detail-card bg-white p-6 rounded-lg shadow-lg relative">
            <FaTimes 
              onClick={handleCloseClick} 
              className="close-button text-gray-700 hover:text-gray-900 transition duration-300 absolute top-4 right-4 cursor-pointer" 
            />
            <h3 className="text-2xl font-bold mb-4">{selectedTask.TaskName}</h3>
            <p className="text-gray-700 mb-2"><b>Deadline:</b> {`${new Date(selectedTask.StartDate).toLocaleDateString()} - ${new Date(selectedTask.EndDate).toLocaleDateString()}`}</p>
            <p className="text-gray-700 mb-2"><b>Task Status:</b> {selectedTask.Status}</p>
            <p className="text-gray-700 mb-2"><b>Task Description:</b> {selectedTask.Description}</p>
            <p className="text-gray-700 mb-2"><b>Under Project:</b> {selectedTask.ProjectName}</p> 
            <p className="text-gray-700 mb-2"><b>Project Description:</b> {selectedTask.projectDescript}</p> 
            <p className="text-gray-700 mb-2"><b>Under Milestone:</b> {selectedTask.MilestoneName}</p> 
            <p className="text-gray-700 mb-2"><b>Milestone Description:</b> {selectedTask.milstoneDescript}</p> 

            {selectedTask.ProofID && selectedTask.ProofFile && (
              <div className="proof-details mt-4">
                <a
                  href={`http://localhost:3000/download/${decodeBase64(selectedTask.ProofFile)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proof-file-link text-blue-500 hover:underline"
                >
                  Download: {decodeBase64(selectedTask.ProofFile)}
                </a>
                <br/>
                {(selectedTask.ProofStatus === 'Rejected' || selectedTask.ProofStatus === 'Pending') && (
                  <button onClick={() => handleDeleteProof(selectedTask.ProofID)} className="upload bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300 mt-2">Delete Proof</button>
                )}
                <p className="text-gray-700 mt-2"><b>Proof Status:</b> {selectedTask.ProofStatus}</p>
                <p className="text-gray-700"><b>Submitted On:</b> {new Date(selectedTask.SubmissionAt).toLocaleString()}</p>
              </div>
            )}

            {(selectedTask.Status === 'In Progress' || selectedTask.Status === 'Overdue') && (
              <button 
                onClick={() => handleUploadProof(selectedTask.TaskID, selectedTask.TaskName, selectedTask.EndDate)} 
                className="upload bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300 mt-4"
              >
                Upload Proof <FaArrowRight size={10}/>
              </button>
            )}
         </div>
        </div>
      )}
    </div>
  );
};

export default TaskCards;