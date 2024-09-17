import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { FaArrowLeft } from 'react-icons/fa';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);

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
        } catch (err) {
            navigate('/login');
        }
    }, [username, navigate]);

    if (!userData) {
        return <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
        </div>;
    }

    const handleBackClick = () => {
        navigate(`/dashboard/${username}`);
    };

    const handleUpdateProfileClick = () => {
        navigate(`/updateprofile/${username}`);
    };

    const getUserImageUrl = () => {
        const [firstName, lastName] = userData.name.split(' ');
        return `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`;
    };

    return (
        <div className='wrapper bg-gray-100 min-h-screen p-6'>
            <div className="profile-page bg-white shadow-lg rounded-lg p-8 relative">
                <div className="back-arrow cursor-pointer mb-4" onClick={handleBackClick}>
                    <FaArrowLeft size={30} className="text-gray-700 hover:text-gray-900 transition duration-300" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Profile Page</h2>
                <hr className="mb-4" />
                <img
                    src={getUserImageUrl()}
                    alt={`${userData.username}'s profile`}
                    className='user-icon w-12 h-12 rounded-full absolute top-10 right-8'
                />
                <p className="text-gray-700 mb-2"><strong>Name:</strong> {userData.name}</p>
                <p className="text-gray-700 mb-2"><strong>Username:</strong> {userData.username}</p>
                <p className="text-gray-700 mb-2"><strong>Email:</strong> {userData.useremail}</p>
                <p className="text-gray-700 mb-4"><strong>User Type:</strong> {userData.usertype === 1 ? 'Task Maker' : 'Task Completer'}</p>
                <button onClick={handleUpdateProfileClick} className='updateButton bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300'>Update</button>
            </div>
        </div>
    );
};

export default ProfilePage;