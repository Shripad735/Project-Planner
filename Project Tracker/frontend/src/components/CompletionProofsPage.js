import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import '../styles/CompletionProofsPage.css'

const CompletionProofs = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [proofs, setProofs] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);
      fetchCompletionProofs(decoded.id);
    } catch (err) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchCompletionProofs = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/completion_proof/${userId}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProofs(data.proofs);
      } else {
        console.error('Failed to fetch completion proofs:', data);
      }
    } catch (error) {
      console.error('Error fetching completion proofs:', error);
    }
  };

  const handleDownload = (filename) => {
    window.open(`http://localhost:3000/download/${filename}`);
  };

  return (
    <div className='wrapper'>
    <div className='comp'>
      <h2>Completion Proofs</h2>
      {proofs.length > 0 ? (
        <ul>
          {proofs.map((proof, index) => (
            <li key={index}>
              {proof}
              <button onClick={() => handleDownload(proof)} className='downloadButton'>Download</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No completion proofs available.</p>
      )}
    </div>
    </div>
  );
};

export default CompletionProofs;
