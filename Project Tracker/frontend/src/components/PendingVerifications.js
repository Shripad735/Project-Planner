import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import { FaArrowLeft } from 'react-icons/fa';
import '../styles/PendingVerifications.css';

const PendingVerifications = () => {
    const { username } = useParams();
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState([]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = jwtDecode(token);
    if(decoded.usertype !== 1) {
      alert('Please login again, for usertype confirmation');
      Cookies.remove('token');
      navigate('/login');
      return;
    } 
    
    fetch(`http://localhost:3000/pendingVerifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        const formattedData = data.map(verification => ({
          ...verification,
          ProofFile: verification.ProofFile.split('uploads\\').pop() 
        }));
        setVerifications(formattedData);
      })
      .catch(error => console.error('Error fetching verifications:', error));
  }, [navigate]);

  const handleBackClick = () => {
    navigate(`/dashboard/${username}`);
};

  if (verifications.length === 0) {
    return(
        <div className='wrapper'>
        <div className="back-arrow" onClick={handleBackClick}>
                <FaArrowLeft size={30} />
        </div>
        <div><h1>No pending verifications</h1></div>
        </div>
    ) ;
  }

  return (
    <div className='wrapper'>
        <div className="back-arrow" onClick={handleBackClick}>
                <FaArrowLeft size={30} />
        </div>
      <div className="pending-verifications-container">
        <h1 className="pending-verifications-title">Pending Verifications</h1>
        {verifications.map((verification, index) => (
          <div key={verification.ProofID} className="pending-verifications-card">
            <h1>{index + 1}. {verification.TaskName}</h1>
            <button
              onClick={() => navigate(`/proof-details/${verification.TaskId}`)}
              className="see-proof-button"
            >
              See Proof
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingVerifications;
