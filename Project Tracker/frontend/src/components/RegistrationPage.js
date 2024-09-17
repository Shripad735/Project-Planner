import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'tailwindcss/tailwind.css';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
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
    <div className="min-h-screen flex items-center justify-center bg-customYellow">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Register for Project Tracker</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            required
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="password"
            name="password"
            placeholder="Create Password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="password"
            name="confirm_password"
            placeholder="Confirm Password"
            required
            value={formData.confirm_password}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <div className="flex justify-around mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="user_type"
                value="Taskmaster"
                required
                checked={formData.user_type === 'Taskmaster'}
                onChange={handleChange}
                className="form-radio text-blue-600"
              />
              <span>Project Creator</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="user_type"
                value="ProjectVisionary"
                required
                checked={formData.user_type === 'ProjectVisionary'}
                onChange={handleChange}
                className="form-radio text-blue-600"
              />
              <span>Project Completer</span>
            </label>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200">Register</button>
        </form>
        <a href="/login" className="block mt-4 text-center text-blue-600 hover:underline">Already have an account? Login here</a>
      </div>
    </div>
  );
};

export default RegistrationPage;