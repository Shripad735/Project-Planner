import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTasks, faStar } from '@fortawesome/free-solid-svg-icons';

const ProjectDetails = () => {
  const { projectname } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [itemType, setItemType] = useState(null);

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
    setExpandedItem(expandedItem === itemId ? null : itemId);
    setItemType(expandedItem === itemId ? null : type);
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-center text-red-600 text-xl mt-10">Error: {error.message}</div>;
  }

  if (!project) {
    return <div className="text-center text-gray-600 text-xl mt-10">No project found</div>;
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-8 py-8" style={{ backgroundColor: '#f6e099' }}>      
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-indigo-700">{project.ProjectName}</h2>
          <Link to={`/project/${projectname}/edit`} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            Edit Project
          </Link>
        </div>
        <p className="text-gray-700 mb-4">
          <span className="font-semibold">Description:</span> {project.Description}
        </p>
        <p className="text-gray-700 mb-4">
          <span className="font-semibold">Status:</span> 
          <span className={`px-2 py-1 rounded ${getStatusColor(project.Status)} text-white`}>{project.Status}</span>
        </p>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="text-2xl font-bold text-indigo-700 mb-6">Timeline</h3>
        <div className="flex justify-between mb-4 text-sm text-gray-600">
          <div>Start Date: {new Date(project.StartDate).toLocaleDateString()}</div>
          <div>End Date: {new Date(project.EndDate).toLocaleDateString()}</div>
        </div>
        <div className="space-y-6">
          {project.milestones.map(milestone => (
            <div key={milestone.MilestoneID} className="border-l-4 border-indigo-500 pl-4">
              <div className={`mb-4 ${expandedItem === milestone.MilestoneID && itemType === 'milestone' ? 'bg-indigo-50 p-4 rounded' : ''}`}>
                <div className="flex items-center cursor-pointer" onClick={() => handleExpand(milestone.MilestoneID, 'milestone')}>
                  <FontAwesomeIcon icon={faStar} className={`mr-2 ${getStatusColor(milestone.Status)} text-white p-2 rounded-full`} />
                  <h4 className="text-xl font-semibold text-indigo-600">Milestone: {milestone.MilestoneName}</h4>
                </div>
                {expandedItem === milestone.MilestoneID && itemType === 'milestone' && (
                  <div className="mt-2 ml-8 text-gray-700">
                    <p><span className="font-semibold">Description:</span> {milestone.description}</p>
                    <p><span className="font-semibold">Start Date:</span> {new Date(milestone.StartDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold">End Date:</span> {new Date(milestone.EndDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded ${getStatusColor(milestone.Status)} text-white`}>{milestone.Status}</span></p>
                  </div>
                )}
              </div>

              {milestone.tasks.map(task => (
                <div key={task.TaskID} className={`ml-8 mb-4 ${expandedItem === task.TaskID && itemType === 'task' ? 'bg-blue-50 p-4 rounded' : ''}`}>
                  <div className="flex items-center cursor-pointer" onClick={() => handleExpand(task.TaskID, 'task')}>
                    <FontAwesomeIcon icon={faTasks} className={`mr-2 ${getStatusColor(task.Status)} text-white p-2 rounded-full`} />
                    <h5 className="text-lg font-semibold text-blue-600">Task: {task.TaskName}</h5>
                  </div>
                  {expandedItem === task.TaskID && itemType === 'task' && (
                    <div className="mt-2 ml-8 text-gray-700">
                      <p><span className="font-semibold">Description:</span> {task.Description}</p>
                      <p><span className="font-semibold">Assigned To:</span> {task.AssignedTo}</p>
                      <p><span className="font-semibold">Start Date:</span> {new Date(task.StartDate).toLocaleDateString()}</p>
                      <p><span className="font-semibold">End Date:</span> {new Date(task.EndDate).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded ${getStatusColor(task.Status)} text-white`}>{task.Status}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
