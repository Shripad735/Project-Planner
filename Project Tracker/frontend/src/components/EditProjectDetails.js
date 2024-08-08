import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSave } from '@fortawesome/free-solid-svg-icons';
import '../styles/EditProjectDetails.css';

const EditProjectDetails = () => {
  const { projectname } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRefs = useRef({}); // Create a ref to store input refs dynamically

  useEffect(() => {
    fetch(`http://localhost:3000/project/${projectname}`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('No project found');
      }
      return response.json();
    })
    .then(data => {
      console.log('Project Data:', data);
      setProject({
        ...data,
        StartDate: data.StartDate.split('T')[0], // Convert date format
        EndDate: data.EndDate.split('T')[0] // Convert date format
      });
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching project details:', error);
      setError(error);
      setLoading(false);
    });
  }, [projectname]);

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    setProject(prevProject => ({ ...prevProject, [field]: value }));
  };

  const handleMilestoneChange = (e, milestoneId, field) => {
    const { value } = e.target;
    setProject(prevProject => ({
      ...prevProject,
      milestones: prevProject.milestones.map(milestone => 
        milestone.MilestoneID === milestoneId ? { ...milestone, [field]: value } : milestone
      )
    }));
  };
  
  const handleTaskChange = (e, milestoneId, taskId, field) => {
    const { value } = e.target;
    setProject(prevProject => ({
      ...prevProject,
      milestones: prevProject.milestones.map(milestone => 
        milestone.MilestoneID === milestoneId ? { 
          ...milestone, 
          tasks: milestone.tasks.map(task => 
            task.TaskID === taskId ? { ...task, [field]: value } : task
          ) 
        } : milestone
      )
    }));
  };  

  const handleAddMilestone = () => {
    const newMilestone = {
      MilestoneID: 'New', // Use timestamp as temporary ID
      MilestoneName: '',
      description: '',
      StartDate: '',
      EndDate: '',
      Status: 'Not Started',
      tasks: []
    };
    setProject(prevProject => ({
      ...prevProject,
      milestones: [...(prevProject.milestones || []), newMilestone]
    }));
  };  

  const handleDeleteMilestone = (milestoneId) => {
    setProject(prevProject => ({
      ...prevProject,
      milestones: prevProject.milestones.filter(milestone => milestone.MilestoneID !== milestoneId)
    }));
  };

  const handleAddTask = (milestoneId) => {
    const newTask = {
      TaskID: 'New', // Temporary ID, replace with proper ID after saving to backend
      TaskName: '',
      Description: '',
      AssignedTo: '',
      StartDate: '',
      EndDate: '',
      Status: 'Not Started'
    };
    setProject(prevProject => ({
      ...prevProject,
      milestones: prevProject.milestones.map(milestone => 
        milestone.MilestoneID === milestoneId ? {
          ...milestone,
          tasks: [...milestone.tasks, newTask]
        } : milestone
      )
    }));
  };

  const handleDeleteTask = (milestoneId, taskId) => {
    setProject(prevProject => ({
      ...prevProject,
      milestones: prevProject.milestones.map(milestone => 
        milestone.MilestoneID === milestoneId ? {
          ...milestone,
          tasks: milestone.tasks.filter(task => task.TaskID !== taskId)
        } : milestone
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct the payload for the new endpoint
    const payload = {
      projectID: project.ProjectID,
      milestones: (project.milestones || []).map(milestone => ({
        milestoneid: milestone.MilestoneID,
        name: milestone.MilestoneName,
        description: milestone.Description,
        startDate: milestone.StartDate,
        endDate: milestone.EndDate,
        tasks: (milestone.tasks || []).map(task => ({
          taskid: task.TaskID,
          name: task.TaskName,
          description: task.Description,
          assignedTo: task.AssignedTo,
          startDate: task.StartDate,
          endDate: task.EndDate
        }))
      }))
    };
    console.log('Payload: ', payload);

    // Send the payload to the new endpoint
    fetch(`http://localhost:3000/projects/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      console.log(response);
      if (!response.ok) {
        throw new Error('Error inserting milestones and tasks');
      }
      return response.json();
    })
    .then(data => {
      console.log('Milestones and tasks added successfully:', data);
      setProject(prevProject => ({
        ...prevProject,
        milestones: data.milestones
      }));
      alert('Project updated successfully!');
    })
    .catch(error => {
      console.error('Error inserting milestones and tasks:', error);
      setError(error);
    });
  };

  const handleEmailInputChange = (e, milestoneId, taskId) => {
    const { value } = e.target;
    fetch(`http://localhost:3000/emails?q=${value}`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setEmailSuggestions(data);
      setShowSuggestions(true);
    })
    .catch(error => {
      console.error('Error fetching email suggestions:', error);
    });
  
    handleTaskChange(e, milestoneId, taskId, 'AssignedTo');
  };

  const EmailSuggestions = ({ suggestions, onSuggestionClick, inputRef }) => {
    return (
      <ul className="suggestions-list">
        {suggestions.map((email) => (
          <li
            key={email}
            onClick={() => onSuggestionClick(email, inputRef)}
          >
            {email}
          </li>
        ))}
      </ul>
    );
  };

  const handleEmailSuggestionClick = (email, milestoneId, taskId, inputRef) => {
    setProject(prevProject => ({
      ...prevProject,
      milestones: prevProject.milestones.map(milestone => 
        milestone.MilestoneID === milestoneId ? { 
          ...milestone, 
          tasks: milestone.tasks.map(task => 
            task.TaskID === taskId ? { ...task, AssignedTo: email } : task
          ) 
        } : milestone
      )
    }));
    setShowSuggestions(false);
    if (inputRef) {
      inputRef.value = email;  // Update the input field with the selected email
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!project) {
    return <div>No project found</div>;
  }

  return (
    <div className="edit-project-details-container">
      <h2>Edit Project: {project.ProjectName}</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Project Name:</label>
          <input 
            type="text" 
            value={project.ProjectName}
            onChange={(e) => handleInputChange(e, 'ProjectName')} 
          />
        </div>
        <div>
          <label>Description:</label>
          <input 
            type="text" 
            value={project.Description} 
            onChange={(e) => handleInputChange(e, 'Description')} 
          />
        </div>
        <div>
          <label>Start Date:</label>
          <input 
            type="date" 
            value={project.StartDate}
            onChange={(e) => handleInputChange(e, 'StartDate')} 
          />
        </div>
        <div>
          <label>End Date:</label>
          <input 
            type="date" 
            value={project.EndDate} 
            onChange={(e) => handleInputChange(e, 'EndDate')} 
          />
        </div>

        <h3>Milestones</h3>
        
        {(project.milestones || []).map(milestone => (
          <div key={milestone.MilestoneID} className="milestone">
            <div className="milestone-header">
              <input 
                type="text" 
                value={milestone.MilestoneName} 
                onChange={(e) => handleMilestoneChange(e, milestone.MilestoneID, 'MilestoneName')} 
              />
              <button 
                type="button" 
                onClick={() => handleDeleteMilestone(milestone.MilestoneID)} 
                className="delete-button">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            <div>
              <label>Description:</label>
              <input 
                type="text" 
                value={milestone.Description} 
                onChange={(e) => handleMilestoneChange(e, milestone.MilestoneID, 'Description')} 
              />
            </div>
            <div>
              <label>Start Date:</label>
              <input 
                type="date" 
                value={milestone.StartDate.split('T')[0]} 
                onChange={(e) => handleMilestoneChange(e, milestone.MilestoneID, 'StartDate')} 
              />
            </div>
            <div>
              <label>End Date:</label>
              <input 
                type="date" 
                value={milestone.EndDate.split('T')[0]} 
                onChange={(e) => handleMilestoneChange(e, milestone.MilestoneID, 'EndDate')} 
              />
            </div>
            <h4>Tasks</h4>
            {(milestone.tasks || []).map(task => (
              <div key={task.TaskID} className="task">
                <div className="task-header">
                  <input 
                    type="text" 
                    value={task.TaskName} 
                    onChange={(e) => handleTaskChange(e, milestone.MilestoneID, task.TaskID, 'TaskName')} 
                  />
                  <button 
                    type="button" 
                    onClick={() => handleDeleteTask(milestone.MilestoneID, task.TaskID)} 
                    className="delete-button">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div>
                  <label>Description:</label>
                  <input 
                    type="text" 
                    value={task.Description} 
                    onChange={(e) => handleTaskChange(e, milestone.MilestoneID, task.TaskID, 'Description')} 
                  />
                </div>
                <div>
  <label>Assigned To:</label>
  <input
    type="text"
    value={task.AssignedTo}
    onChange={(e) => handleEmailInputChange(e, milestone.MilestoneID, task.TaskID)}
    ref={el => inputRefs.current[task.TaskID] = el}
  />
  {showSuggestions && emailSuggestions.length > 0 && (
    <EmailSuggestions
      suggestions={emailSuggestions}
      onSuggestionClick={(email, inputRef) =>
        handleEmailSuggestionClick(email, milestone.MilestoneID, task.TaskID, inputRef)
      }
      inputRef={inputRefs.current[task.TaskID]}
    />
  )}
</div>
                <div>
                  <label>Start Date:</label>
                  <input 
                    type="date" 
                    value={task.StartDate.split('T')[0]} 
                    onChange={(e) => handleTaskChange(e, milestone.MilestoneID, task.TaskID, 'StartDate')} 
                  />
                </div>
                <div>
                  <label>End Date:</label>
                  <input 
                    type="date" 
                    value={task.EndDate.split('T')[0]} 
                    onChange={(e) => handleTaskChange(e, milestone.MilestoneID, task.TaskID, 'EndDate')} 
                  />
                </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => handleAddTask(milestone.MilestoneID)} 
              className="add-task-button">
              <FontAwesomeIcon icon={faPlus} /> Add Task
            </button>
          </div>
        ))}

        <button 
          type="button" 
          onClick={handleAddMilestone} 
          className="add-milestone-button">
          <FontAwesomeIcon icon={faPlus} /> Add Milestone
        </button>

        <button 
          type="submit" 
          className="save-button">
          <FontAwesomeIcon icon={faSave} /> Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProjectDetails;
