import React, { useState } from 'react';
import '../styles/Sidebar.css';
import { FaBell } from 'react-icons/fa';

function Sidebar() {
    const [notifications, setNotifications] = useState([]); // Add your notifications here
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <div className="sidebar">
            <h3 onClick={toggleDropdown}>
                 <FaBell />
            </h3>
            {showDropdown && (
                <ul className="notification-dropdown">
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <li key={index}>{notification}</li>
                        ))
                    ) : (
                        <li>No new notifications</li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default Sidebar;
