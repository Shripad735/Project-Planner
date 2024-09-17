import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
    if (decoded.usertype !== 1) {
      alert('Please login again, for usertype confirmation');
      Cookies.remove('token');
      navigate('/login');
      return;
    }
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

  const decodeBase64 = (str) => {
    try {
      return atob(str);
    } catch (e) {
      console.error('Failed to decode base64 string:', e);
      return null;
    }
  };

  if (!proofDetails) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  const decodedProofFile = decodeBase64(proofDetails.ProofFile);

  return (
    <div className='wrapper bg-[#f6e099] min-h-screen p-6'>
      <div className="back-arrow cursor-pointer mb-4" onClick={handleBackClick}>
        <FaArrowLeft size={30} className="text-gray-700 hover:text-gray-900 transition duration-300" />
      </div>
      <div className="proof-details-container bg-white shadow-lg rounded-lg p-8">
        <div className="proof-details-card">
          <h1 className="proof-details-title text-3xl font-bold text-gray-800 mb-6">Task Name - {proofDetails.TaskName}</h1>
          <hr className="mb-4"/>
          <div className="proof-info text-gray-700">
            <p><b>Submitted by:</b> {proofDetails.AssignedTo}</p>
            <p><b>Submitted at:</b> {new Date(proofDetails.submissionAt).toLocaleString()}</p>
            <a
              href={`http://localhost:3000/download/${decodedProofFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="proof-file-link text-blue-500 hover:underline"
            >
              Download: {decodedProofFile ? decodedProofFile : 'No file available'}
            </a>
          </div>
          <div className="status-select-container mt-4">
            <label htmlFor="status" className="status-select-label block text-gray-700 font-semibold mb-2">Status:</label>
            <select
              id="status"
              value={status}
              onChange={handleStatusChange}
              className="status-select w-full p-2 border border-gray-300 rounded"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="submit-button w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600 transition duration-300"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofDetails;