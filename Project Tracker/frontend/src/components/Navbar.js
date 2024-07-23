import React, { useState, useEffect, useRef } from 'react';
import '../styles/Navbar.css';
import { FaUserCircle, FaBell } from 'react-icons/fa';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

function Navbar({ username, notificationCount }) {
    const navigate = useNavigate();
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        Cookies.remove('token');
        navigate('/login');
    };

    // console.log(username);

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

    return (
        <div className="navbar">
            <h1>Project Tracker</h1>
            <div className="right-section">
                <div className="notification" onClick={toggleDropdown} ref={dropdownRef}>
                    <FaBell size={30} className="notification-icon" />
                    {notificationCount > 0 && <span className="notification-count">{notificationCount}</span>}
                    {isDropdownVisible && (
                        <div className="notification-dropdown">
                            <ul>
                                {notificationCount > 0 ? (
                                    <>
                                        <li>Notification 1</li>
                                        <li>Notification 2</li>
                                        <li>Notification 3</li>
                                    </>
                                ) : (
                                    <li>No new notifications</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="user-info">
                    <span>Welcome, {username}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
                <div className="profile" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
                    <FaUserCircle size={40} className="profile-icon" />
                </div>
            </div>
        </div>
    );
}

export default Navbar;
