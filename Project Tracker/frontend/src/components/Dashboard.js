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

            setName(decoded.username);
            setUsertype(decoded.usertype);
            setNotificationCount(3); // Set your actual notification count here
        } catch (err) {
            navigate('/login');
        }
    }, [username, navigate]);

    if (usertype === 1) {
        return (
            <div className="dashboard-container">
                <Navbar username={name} notificationCount={notificationCount} />
                <div className="dashboard">
                    <h2>Welcome to Your Dashboard</h2>
                    <div className="option-cards">
                        <OptionCard title="Create New Project" description="Start a new project and track its progress." path={`/create-project`} />
                        <OptionCard title="Create New Project" description="Start a new project and track its progress."  />
                        <OptionCard title="Manage Existing Projects" description="View and manage your existing projects." />
                        <OptionCard title="Pending Verification of Tasks" description="Verify tasks that are pending approval." path={`/pending-verifications/${username}`}/>
                    </div>
                </div>
            </div>
        );
    } else if (usertype === 2) {
        return (
            <div className="dashboard-container">
                <Navbar username={name} notificationCount={notificationCount} />
                <div className="dashboard">
                    <h2>Welcome to Your Dashboard</h2>
                    <div className="option-cards">
                        <OptionCard title="View Assigned Tasks" description="View all deliverables in a single place" path={`/tasksAssigned/${username}`} />
                        <OptionCard title="Submit Completion Proofs" description="Make submissions for your completed tasks" path={`/upload-proof/${username}`} />
                        <OptionCard title="View Rejected Tasks" description="Verify tasks that have been rejected" />
                    </div>
                </div>
            </div>
        );
    } else {
        return null;
    }
};

export default Dashboard;
