import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Registration.css';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    confirm_password: '',
    user_type: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      alert('Passwords do not match!');
      return;
    }

    const userTypeMapping = {
      ProjectVisionary: 2,
      Taskmaster: 1
    };
    const usertype = userTypeMapping[formData.user_type];

    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: formData.username,
        name: formData.full_name,
        email: formData.email,
        password: formData.password,
        usertype: usertype
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User registered:', data);
      alert('Registration successful!');
      navigate('/login'); 
    } else {
      const error = await response.text();
      console.error('Registration error:', error);
      alert('Registration failed!');
    }
  };

  return (
    <div className="wrapper">
     <div className="container">
      <h2>Register for Project Tracker</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          required
          value={formData.full_name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          required
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile"
          required
          value={formData.mobile}
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          required
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Create Password"
          required
          value={formData.password}
          onChange={handleChange}
        />
        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm Password"
          required
          value={formData.confirm_password}
          onChange={handleChange}
        />

        <div className="user-type-selection">
          <label className="user-type-option">
            <input
              type="radio"
              name="user_type"
              value="ProjectVisionary"
              required
              checked={formData.user_type === 'ProjectVisionary'}
              onChange={handleChange}
            />
            Project Visionary
          </label>
          <label className="user-type-option">
            <input
              type="radio"
              name="user_type"
              value="Taskmaster"
              required
              checked={formData.user_type === 'Taskmaster'}
              onChange={handleChange}
            />
            Taskmaster
          </label>
        </div>

        <button type="submit" style = {{marginLeft: '0px'}}>Register</button>
      </form>
      <a href="/login" className="login-link">Already have an account? Login here</a>
    </div>
    </div>
    
  );
};

export default RegistrationPage;
