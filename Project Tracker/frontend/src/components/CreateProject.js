import React, { useState } from 'react';
import MilestoneForm from './MilestoneForm';
import TaskForm from './TaskForm';
import '../styles/CreateProject.css';
import Cookies from 'js-cookie';

const CreateProject = () => {
  const [project, setProject] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState({});
  const [isProjectComplete, setIsProjectComplete] = useState(false);

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

    fetch('/projects', {
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

  const today = new Date().toISOString().split('T')[0]; // Get today's date in yyyy-mm-dd format

  return (
    <div className="create-project-container">
      <div className="create-project">
        <h1>Create Project</h1>
        <form onSubmit={handleProjectSubmit}>
          <input name="title" placeholder="Project Title" value={project.title} onChange={handleChange} required />
          <input name="description" placeholder="Project Description" value={project.description} onChange={handleChange} />
          <div className="date-inputs">
            <input
              type="date"
              name="startDate"
              placeholder="Start Date"
              value={project.startDate}
              onChange={handleChange}
              min={today}
              required
            />
            <input
              type="date"
              name="endDate"
              value={project.endDate}
              onChange={handleChange}
              min={project.startDate || today}
              required
            />
          </div>
          <button type="submit">Create Project</button>
        </form>

        {isProjectComplete && (
          <>
            <h2>Milestones</h2>
            {milestones.map((milestone, index) => (
              <div key={index} className="milestone">
                <h3>{milestone.name}</h3>
                <p>{milestone.description}</p>
                <button className="delete-button" onClick={() => deleteMilestone(index)}>Delete Milestone</button>
                {tasks[milestone.name] && tasks[milestone.name].map((task, taskIndex) => (
                  <div key={taskIndex} className="task">
                    <h4>{task.name}</h4>
                    <p>{task.description}</p>
                    <button className="delete-button" onClick={() => deleteTask(milestone.name, taskIndex)}>Delete Task</button>
                  </div>
                ))}
                <TaskForm milestoneName={milestone.name} onAddTask={addTask} projectStartDate={project.startDate} projectEndDate={project.endDate} />
              </div>
            ))}
            <MilestoneForm onAddMilestone={addMilestone} projectStartDate={project.startDate} projectEndDate={project.endDate} />
            <button onClick={handleFinalSubmit}>Submit Project</button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateProject;
