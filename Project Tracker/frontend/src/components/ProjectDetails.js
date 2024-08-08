import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProjectDetails.css'; // Import updated CSS

const ProjectDetails = () => {
  const { projectname } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null); // Track expanded item
  const [itemType, setItemType] = useState(null); // Track the type of expanded item

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
      setProject(data);
      setLoading(false);
    })
    .catch(error => {
      setError(error);
      setLoading(false);
    });
  }, [projectname]);

  const handleExpand = (itemId, type) => {
    setExpandedItem(expandedItem === itemId ? null : itemId); // Toggle visibility
    setItemType(expandedItem === itemId ? null : type); // Set item type for expanded item
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
    <div className="project-details-container">
      <h2>{project.ProjectName}</h2>
      <p>{project.Description}</p>
      {/* <p>Start Date: {new Date(project.StartDate).toLocaleDateString()}</p>
      <p>End Date: {new Date(project.EndDate).toLocaleDateString()}</p> */}
      <p>Status: {project.Status}</p>
      <Link to={`/project/${projectname}/edit`} className="edit-button">
        <FontAwesomeIcon icon={faEdit} />
      </Link>

      {/* <h3>Timeline</h3> */}
      <div className="timeline-container">
        <div className="timeline-start-date">
          Start Date: {new Date(project.StartDate).toLocaleDateString()}
        </div>
        <div id="timeline">
          {project.milestones.map(milestone => (
            <div key={milestone.MilestoneID}>
              <div className={`timeline-item ${expandedItem === milestone.MilestoneID && itemType === 'milestone' ? 'expanded' : ''}`}>
                <div 
                  className={`timeline-icon milestone-icon ${milestone.Status === 'Completed' ? 'completed' : milestone.Status === 'In Progress' ? 'in-progress' : 'not-started'}`}
                  onClick={() => handleExpand(milestone.MilestoneID, 'milestone')}
                >
                  ★
                </div>
                <div className="timeline-content">
                  <h2 
                    onClick={() => handleExpand(milestone.MilestoneID, 'milestone')} 
                    style={{ cursor: 'pointer' }}
                  >
                    Milestone: {milestone.MilestoneName}
                  </h2>
                  {expandedItem === milestone.MilestoneID && itemType === 'milestone' && (
                    <>
                      <p>Description: {milestone.description}</p>
                      <p>Start Date: {new Date(milestone.StartDate).toLocaleDateString()}</p>
                      <p>End Date: {new Date(milestone.EndDate).toLocaleDateString()}</p>
                      <p>Status: {milestone.Status}</p>
                    </>
                  )}
                </div>
              </div>

              {milestone.tasks.map(task => {
                // Determine the class based on task status
                const taskStatusClass = task.Status === 'Completed'
                  ? 'completed'
                  : task.Status === 'In Progress'
                  ? 'in-progress'
                  : 'not-started';
                
                return (
                  <div 
                    key={task.TaskID} 
                    className={`timeline-item ${expandedItem === task.TaskID && itemType === 'task' ? 'expanded' : ''}`}
                  >
                    <div 
                      className={`timeline-icon task-icon ${taskStatusClass}`} 
                      onClick={() => handleExpand(task.TaskID, 'task')}
                    >
                      <i className="fa fa-tasks" aria-hidden="true"></i>
                    </div>
                    <div className="timeline-content">
                      <h2 
                        onClick={() => handleExpand(task.TaskID, 'task')} 
                        style={{ cursor: 'pointer' }}
                      >
                        Task: {task.TaskName}
                      </h2>
                      {expandedItem === task.TaskID && itemType === 'task' && (
                        <>
                          <p>Description: {task.Description} </p>
                          <p>Assigned To: {task.AssignedTo}</p>
                          <p>Start Date: {new Date(task.StartDate).toLocaleDateString()}</p>
                          <p>End Date: {new Date(task.EndDate).toLocaleDateString()}</p>
                          <p>Status: {task.Status}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="timeline-end-date">
          End Date: {new Date(project.EndDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
