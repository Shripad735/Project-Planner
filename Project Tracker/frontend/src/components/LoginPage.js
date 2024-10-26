import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/loginMe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Cookies.set('token', data.token, { expires: 0.5 });
        setIsToastVisible(true);
        toast.success('Login successful!', {
          className: 'custom-toast',
          autoClose: 2000,
          onClose: () => navigate(`/dashboard/${username}`),
        });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (isToastVisible) {
        navigate(`/dashboard/${username}`);
      } else {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-blue-radial">
      <ToastContainer />
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Login to Project Tracker</h2>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200">Login</button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot Password?</Link>
        </div>
        <div className="mt-2 text-center">
          <Link to="/register" className="text-blue-600 hover:underline">Don't have an account? Register here</Link>
        </div>
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;