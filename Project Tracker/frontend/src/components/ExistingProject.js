import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';
import { useParams } from 'react-router-dom';
import '../styles/ExistingProject.css'; // Import the CSS file

// Register necessary Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const ExistingProject = () => {
  const [projects, setProjects] = useState([]);
  const { username } = useParams();

  useEffect(() => {
    // Fetch projects list from your API
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
        // Fetch detailed project data including task count for each project
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

  // Function to generate the data for the doughnut chart
  const getChartData = (totalTasks, completedTasks) => {
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return {
      labels: [],
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: ['#4caf50', '#e0e0e0'],
        borderWidth: 1
      }]
    };
  };

  return (
    <div className="existing-projects-container">
      <h2>All Projects</h2>
      <ul>
        {projects.map(project => (
          <li key={project.ProjectID} className="project">
            <div className="project-info">
              <a href={`/project/${project.ProjectName}`} className="project-link">
                {project.ProjectName}
              </a>
              <p className="project-description">{project.Description}</p>
              <p className="project-status">Status: {project.Status}</p>
              <p className="project-dates">Start Date: {new Date(project.StartDate).toLocaleDateString()}</p>
              <p className="project-dates">End Date: {new Date(project.EndDate).toLocaleDateString()}</p>
            </div>
            <div className="project-progress-wrapper">
              <div className="project-progress">
                <Doughnut data={getChartData(project.totalTasks, project.completedTasks)} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExistingProject;
