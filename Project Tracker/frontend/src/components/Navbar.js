import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Notifications from './Notification.js';

function Navbar({ notificationCount, setNotificationCount }) {
    const navigate = useNavigate();
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const dropdownRef = useRef(null);
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.username);
                setFirstName(decoded.name.split(' ')[0]);
            } catch (err) {
                console.error('Invalid token:', err);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        Cookies.remove('token');
        navigate('/login');
    };

    const handleProfileClick = () => {
        navigate(`/profile/${username}`);
    };

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getUserImageUrl = () => {
        return `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}`;
    };

    return (
        <nav className="bg-indigo-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <h1 className="text-2xl font-bold text-white">Project Tracker</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={toggleDropdown}
                                className="p-1 rounded-full text-gray-200 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
                            >
                                <FaBell size={24} />
                                {notificationCount > 0 && (
                                    <span className="absolute top-2 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform -translate-x-1/2 bg-red-600 rounded-full">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                            {isDropdownVisible && (
                                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1">
                                        <Notifications username={username} setNotificationCount={setNotificationCount} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-4"></div> {/* This adds space */}
                        <div className="relative">
                            <button
                                onClick={handleProfileClick}
                                className="flex items-center space-x-2 text-sm font-medium text-gray-200 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <img
                                    src={getUserImageUrl()}
                                    alt={`${firstName}'s profile`}
                                    className="h-8 w-8 rounded-full"
                                />
                                <span>{firstName}</span>
                            </button>
                        </div>
                        <div className="w-4"></div> {/* This adds space */}
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;