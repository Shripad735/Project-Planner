import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { FaArrowLeft, FaUserCircle, FaCheck, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/UpdateProfile.css';

const UpdateProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: ''
    });
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            if (decoded.username !== username) {
                navigate('/login');
                return;
            }

            setUserData(decoded);
            setFormData({
                name: decoded.name,
                username: decoded.username
            });
        } catch (err) {
            navigate('/login');
        }
    }, [username, navigate]);

    if (!userData) {
        return <div>Loading...</div>;
    }

    const handleBackClick = () => {
        navigate(`/profile/${username}`);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        setUsernameError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`http://localhost:3000/users/${userData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.status === 409) {
                // Username is already taken
                const data = await response.json();
                setUsernameError(data.message);
                toast.error(data.message, {
                    className: 'custom-toast custom-toast-error',
                    progressClassName: 'custom-toast-progress-error',
                    icon: <FaTimes size={18} />
                });
            } else if (response.ok) {
                toast.success('Profile updated successfully. Please log in again.', {
                    className: 'custom-toast custom-toast-success',
                    progressClassName: 'custom-toast-progress-success',
                    icon: <FaCheck size={18} />
                });
                Cookies.remove('token');
                navigate('/login');
            } else {
                toast.error('Failed to update profile.', {
                    className: 'custom-toast custom-toast-error',
                    progressClassName: 'custom-toast-progress-error',
                    icon: <FaTimes size={18} />
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile.', {
                className: 'custom-toast custom-toast-error',
                progressClassName: 'custom-toast-progress-error',
                icon: <FaTimes size={18} />
            });
        }
    };

    return (
        <div className='wrapper'>
            <div className="profile-page">
                <div className="back-arrow" onClick={handleBackClick}>
                    <FaArrowLeft size={30} />
                </div>
                <div className="user-icon" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                    <FaUserCircle size={80} />
                </div>
                <h2>Profile Page</h2>
                <hr />
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name"><strong>Name:</strong></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <br />
                    <div>
                        <label htmlFor="username"><strong>Username:</strong></label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                        />
                        {usernameError && <p className="error">{usernameError}</p>}
                    </div>
                    <br />
                    <button type="submit">Update</button>
                </form>
            </div>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </div>
    );
};

export default UpdateProfile;