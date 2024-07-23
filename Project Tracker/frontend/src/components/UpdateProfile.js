import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import { FaArrowLeft, FaUserCircle } from 'react-icons/fa';
import '../styles/UpdateProfile.css';

const UpdateProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: ''
    });

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
                username: decoded.username,
                email: decoded.useremail
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

            if (response.ok) {
                alert('Profile updated successfully. Please log in again.');
                Cookies.remove('token');
                navigate('/login');
            } else {
                alert('Failed to update profile.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile.');
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
                    </div>
                    <br />
                    <div>
                        <label htmlFor="email"><strong>Email:</strong></label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <br />
                    <button type="submit">Update</button>
                </form>
            </div>
        </div>
    );
};

export default UpdateProfile;
