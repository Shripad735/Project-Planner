import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import '../styles/Notification.css'

const Notifications = ({ username, setNotificationCount }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [type,setType]= useState(null)
  const colorMap = {
    1: 'lightyellow',
    2: 'lightgreen',
    3: 'lightred',
    4: 'lightblue',
    5: 'red',
    6: 'light blue',
    7: 'lightblue'
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);
      fetchNotifications(decoded.id);
        setType(decoded.usertype)
    } catch (err) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchNotifications = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/notifications/${userId}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setNotificationCount(data.length);
      } else {
        console.error('Notifications data is not an array:', data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = (taskId) => {
    if(type === 2){
      navigate(`/tasksAssigned/${username}`);
    }
    else {
      navigate(`/pending-verifications/${username}`);
    }
    console.log('Handle notification click, the username is ', username);
  };

  const handleDismissNotification = async (notnid) => {
    try {
      const response = await fetch(`http://localhost:3000/notifications/${userId}/${notnid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      if (response.ok) {
        setNotifications(notifications.filter(notification => notification.notnid !== notnid));
        setNotificationCount(notifications.length - 1);
      } else {
        console.error('Failed to delete notification');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDismissAllNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:3000/notifications/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      if (response.ok) {
        setNotifications([]);
        setNotificationCount(0);
      } else {
        console.error('Failed to delete all notifications');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No new notifications available.</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.notnid}>
              <span 
                onClick={() => handleNotificationClick(notification.taskId)} 
                style={{backgroundColor: colorMap[notification.notn]}}
              >{notification.message}</span>
              <button onClick={() => handleDismissNotification(notification.notnid)}>Dismiss</button> 
            </li>
          ))} <hr />
        </ul>
      )}
      {notifications.length > 0 && (
        <button onClick={handleDismissAllNotifications} style={{marginLeft : "80px" , width : "90px" }}>Dismiss All</button>
      )}
    </div>
  );
};

export default Notifications;