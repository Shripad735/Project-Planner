import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`/projects`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`
        }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectData({ ...projectData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/projects', projectData, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`
        }
      });
      fetchProjects();
      setProjectData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
      });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await axios.delete(`/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`
        }
      });
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div>
      <h2>Manage Projects</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={projectData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={projectData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Start Date:</label>
          <input
            type="date"
            name="startDate"
            value={projectData.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>End Date:</label>
          <input
            type="date"
            name="endDate"
            value={projectData.endDate}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Create Project</button>
      </form>

      <h3>Existing Projects</h3>
      <ul>
        {projects.map((project) => (
          <li key={project.projectid}>
            <h4>{project.projectname}</h4>
            <p>{project.description}</p>
            <p>
              {project.startddate} to {project.enddate}
            </p>
            <button onClick={() => handleDelete(project.projectid)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageProjects;
