import React, { useState } from 'react';
import MilestoneForm from './MilestoneForm';
import { useParams, useNavigate } from 'react-router-dom';
import TaskForm from './TaskForm';
import { FaArrowLeft } from 'react-icons/fa';
import '../styles/CreateProject.css';
import Cookies from 'js-cookie';

const CreateProject = () => {
  const { username } = useParams();
  const [project, setProject] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState({});
  const [isProjectComplete, setIsProjectComplete] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const handleProjectSubmit = (e) => {
    e.preventDefault();
    setIsProjectComplete(true);
  };

  const addMilestone = (milestone) => {
    setMilestones([...milestones, milestone]);
  };

  const deleteMilestone = (index) => {
    const updatedMilestones = milestones.filter((_, i) => i !== index);
    const updatedTasks = { ...tasks };
    delete updatedTasks[milestones[index].name];
    setMilestones(updatedMilestones);
    setTasks(updatedTasks);
  };

  const addTask = (milestoneName, task) => {
    setTasks({
      ...tasks,
      [milestoneName]: tasks[milestoneName] ? [...tasks[milestoneName], task] : [task],
    });
  };

  const deleteTask = (milestoneName, taskIndex) => {
    const updatedTasks = {
      ...tasks,
      [milestoneName]: tasks[milestoneName].filter((_, index) => index !== taskIndex),
    };
    setTasks(updatedTasks);
  };

  const handleFinalSubmit = () => {
    const fullProject = { ...project, milestones, tasks };
    const token = Cookies.get('token');

    fetch('http://localhost:3000/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(fullProject)
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error(text) });
      }
      return response.json();
    })
    .then(data => {
      console.log('Project created:', data);
      alert('Project created successfully');
      setProject({ title: '', description: '', startDate: '', endDate: '' });
      setMilestones([]);
      setTasks({});
      setIsProjectComplete(false);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  const handleBackClick = () => {
    navigate(`/dashboard/${username}`);
  };

  const today = new Date().toISOString().split('T')[0]; // Get today's date in yyyy-mm-dd format

  return (
    <div className='wrapper bg-[#f6e099] min-h-screen p-6'>
  <div className="back-arrow cursor-pointer mb-4" onClick={handleBackClick}>
    <FaArrowLeft size={30} className="text-gray-700 hover:text-gray-900 transition duration-300" />
  </div>
  
  <div className="create-project bg-white shadow-lg rounded-lg p-8 max-w-3xl mx-auto">
    <h1 className="text-4xl font-bold text-gray-900 mb-6">Create Project</h1>
    
    <form onSubmit={handleProjectSubmit} className="space-y-6">
      <input 
        name="title" 
        placeholder="Project Title" 
        value={project.title} 
        onChange={handleChange} 
        required 
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      
      <textarea 
        name="description" 
        placeholder="Project Description" 
        value={project.description} 
        onChange={handleChange} 
        rows="4"
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="date-inputs flex space-x-4">
        <input
          type="date"
          name="startDate"
          placeholder="Start Date"
          value={project.startDate}
          onChange={handleChange}
          min={today}
          required
          className="w-1/2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        
        <input
          type="date"
          name="endDate"
          value={project.endDate}
          onChange={handleChange}
          min={project.startDate || today}
          required
          className="w-1/2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <button 
        type="submit" 
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition duration-300"
      >
        Create Project
      </button>
    </form>

    {isProjectComplete && (
      <>
        <h2 className="text-3xl font-bold text-gray-900 mt-8 mb-6">Milestones</h2>

        {milestones.map((milestone, index) => (
          <div key={index} className="milestone bg-gray-100 p-6 rounded-lg mb-6 shadow-md">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">{milestone.name}</h3>
            <p className="text-gray-600 mb-4">{milestone.description}</p>

            <button 
              className="delete-button bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition duration-300 mb-4"
              onClick={() => deleteMilestone(index)}
            >
              Delete Milestone
            </button>

            {tasks[milestone.name] && tasks[milestone.name].map((task, taskIndex) => (
              <div key={taskIndex} className="task bg-white p-4 rounded-lg mb-4 shadow">
                <h4 className="text-lg font-semibold text-gray-700">{task.name}</h4>
                <p className="text-gray-600">{task.description}</p>
                
                <button 
                  className="delete-button bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition duration-300 mt-2"
                  onClick={() => deleteTask(milestone.name, taskIndex)}
                >
                  Delete Task
                </button>
              </div>
            ))}

            <TaskForm 
              milestoneName={milestone.name} 
              onAddTask={addTask} 
              projectStartDate={project.startDate} 
              projectEndDate={project.endDate} 
            />
          </div>
        ))}

        <MilestoneForm 
          onAddMilestone={addMilestone} 
          projectStartDate={project.startDate} 
          projectEndDate={project.endDate} 
        />

        <button 
          onClick={handleFinalSubmit} 
          className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition duration-300 mt-6"
        >
          Submit Project
        </button>
      </>
    )}
  </div>
</div>

  );
};

export default CreateProject;