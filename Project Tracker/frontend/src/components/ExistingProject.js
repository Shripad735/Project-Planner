import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';
import { useParams } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const ExistingProject = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { username } = useParams();

  useEffect(() => {
    fetch(`http://localhost:3000/existing-project/${username}`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(projectList => {
        Promise.all(
          projectList.map(project =>
            fetch(`http://localhost:3000/project/${project.ProjectName}`, {
              headers: {
                'Authorization': `Bearer ${Cookies.get('token')}`
              }
            })
              .then(response => response.json())
              .then(projectDetails => ({
                ...project,
                totalTasks: projectDetails.totalTasks,
                completedTasks: projectDetails.completedTasks
              }))
          )
        )
          .then(projectsWithTaskCount => setProjects(projectsWithTaskCount))
          .catch(error => console.error('Error fetching project details:', error));
      })
      .catch(error => console.error('Error fetching projects:', error));
  }, [username]);

  const deleteProject = (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      fetch(`http://localhost:3000/project/delete/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          setProjects(prevProjects => prevProjects.filter(project => project.ProjectID !== projectId));
        })
        .catch(error => console.error('Error deleting project:', error));
    }
  };

  const getChartData = (totalTasks, completedTasks) => {
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return {
      labels: [],
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: ['#00c853', '#e0e0e0'],
        borderWidth: 1
      }]
    };
  };

  const filteredProjects = projects.filter(project =>
    project.ProjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f6e099' }}>
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-indigo-700 mb-6 text-center">All Projects</h2>
        <input
          type="text"
          placeholder="Search by project name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 mb-6 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
        />
        <ul className="space-y-6">
          {filteredProjects.map(project => (
            <li key={project.ProjectID} className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-2 border-indigo-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <a href={`/project/${project.ProjectName}`} className="text-2xl font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition duration-300">
                      {project.ProjectName}
                    </a>
                    <p className="text-gray-700 mt-2">{project.Description}</p>
                  </div>
                  <div className="w-32">
                    <Doughnut data={getChartData(project.totalTasks, project.completedTasks)} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <p>Status: <span className="font-semibold text-blue-600">{project.Status}</span></p>
                  <p>Start: <span className="font-semibold text-green-600">{new Date(project.StartDate).toLocaleDateString()}</span></p>
                  <p>End: <span className="font-semibold text-red-600">{new Date(project.EndDate).toLocaleDateString()}</span></p>
                </div>
              </div>
              <div className="bg-indigo-50 px-6 py-3 flex justify-end">
                <button 
                  className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
                  onClick={() => deleteProject(project.ProjectID)}
                  title="Delete Project"
                >
                  <FaTrash className="mr-2" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExistingProject;