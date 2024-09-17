import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import Navbar from './Navbar';
import OptionCard from './OptionCard';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [usertype, setUsertype] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Current time in seconds

            if (decoded.exp < currentTime) {
                alert('Session expired. Please login again.');
                Cookies.remove('token');
                navigate('/login');
                return;
            } else if (decoded.username !== username) {
                navigate('/login');
                return;
            }

            setName(decoded.name);
            setUsertype(decoded.usertype)
            fetchNotificationCount(decoded.id);

        } catch (err) {
            navigate('/login');
        }
    }, [username, navigate]);


    const fetchNotificationCount = async (userId) => {
        try {
          const response = await fetch(`http://localhost:3000/notifications/${userId}`, {
            headers: {
              'Authorization': `Bearer ${Cookies.get('token')}`
            }
          });
          const data = await response.json();
          setNotificationCount(data.length);
        } catch (error) {
          console.error(error);
        }
      };

    if (usertype === 1) {
        return (
            <div className="dashboard-container">
                <Navbar username={name} notificationCount={notificationCount} setNotificationCount={setNotificationCount} />
                <div className="dashboard">
                    {/* use tailwindcss */}
                    <h1 className='text-3xl font-bold text-gray-800 mb-4 font-sans'>Welcome, {name}!</h1>
                    <h2 className='text-2xl font-semibold text-gray-800 mb-4 '>What would you like to do today?</h2>
                    <div></div>
                    <div></div>
                    <br></br>
                    <div className="option-cards">
                        <OptionCard title="Create New Project" description="Start a new project and track its progress." path={`/create-project/${username}`}/>
                        <OptionCard title="Manage Existing Projects" description="View and manage your existing projects." path={`/existing-project/${username}`} />
                        <OptionCard title="Pending Verification of Tasks" description="Verify tasks that are pending approval." path={`/pending-verifications/${username}`}/>
                    </div>
                </div>
            </div>
        );
    } else if (usertype === 2) {
        return (
            <div className="dashboard-container">
                <Navbar username={name} notificationCount={notificationCount} setNotificationCount={setNotificationCount} />
                <div className="dashboard">
                    <h1 className='text-3xl font-bold text-gray-800 mb-4 font-sans'>Welcome to Your Dashboard</h1>
                    <br></br>
                    <div className="option-cards">
                        <OptionCard title="View Assigned Tasks" description="View all deliverables in a single place" path={`/tasksAssigned/${username}`} />
                        <OptionCard title="Submit Completion Proofs" description="Make submissions for your completed tasks" path={`/upload-proof/${username}`} />
                    </div>
                </div>
            </div>
        );
    } else {
        return null;
    }
};

export default Dashboard;


