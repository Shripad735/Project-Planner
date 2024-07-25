import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import { FaArrowLeft } from 'react-icons/fa';
import Cookies from 'js-cookie';
import '../styles/ProofDetails.css';

const ProofDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [proofDetails, setProofDetails] = useState(null);
  const [status, setStatus] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = jwtDecode(token);
    setUsername(decoded.username);

    fetch(`http://localhost:3000/completionProofs/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        data.ProofFile = data.ProofFile.split('uploads\\').pop();
        setProofDetails(data);
        setStatus(data.Status);
      })
      .catch(error => console.error('Error fetching proof details:', error));
  }, [taskId, navigate]);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleSubmit = async () => {
    const token = Cookies.get('token');
    try {
      const response = await fetch(`http://localhost:3000/completionProofs/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert('Status updated successfully');
        setTimeout(() => {
          navigate(`/dashboard/${username}`);
        }, 2000); // Redirect to dashboard after 2 seconds
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleBackClick = () => {
    navigate(`/pending-verifications/${username}`);
  };

  if (!proofDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className='wrapper'>
      <div className="back-arrow" onClick={handleBackClick}>
        <FaArrowLeft size={30} />
      </div>
      <div className="proof-details-container">
        <div className="proof-details-card">
          <h1 className="proof-details-title">Task Name - {proofDetails.TaskName}</h1>
          <hr/>
          <div className="proof-info">
            <p><b>Submitted by:</b> {proofDetails.AssignedTo}</p>
            <p><b>Submitted at:</b> {new Date(proofDetails.submissionAt).toLocaleString()}</p>
            <a
              href={`http://localhost:3000/download/${proofDetails.ProofFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="proof-file-link"
            >
              Download: {proofDetails.ProofFile}
            </a>
          </div>
          <div className="status-select-container">
            <label htmlFor="status" className="status-select-label">Status:</label>
            <select
              id="status"
              value={status}
              onChange={handleStatusChange}
              className="status-select"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="submit-button"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofDetails;
