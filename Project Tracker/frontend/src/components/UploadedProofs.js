import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';

const UploadedProofs = () => {
    const navigate = useNavigate();
    const [proofs, setProofs] = useState([]);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetch('http://localhost:3000/uploaded-proofs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => setProofs(data))
        .catch(error => console.error('Error fetching proofs:', error));
    }, [navigate]);

    const handleStatusChange = async (proofId, status) => {
        const token = Cookies.get('token');
        try {
            const response = await fetch(`http://localhost:3000/update-proof-status/${proofId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setProofs(proofs.map(proof => 
                    proof.ProofID === proofId ? { ...proof, Status: status } : proof
                ));
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    return (
        <div className="uploaded-proofs">
            <h2>Uploaded Proofs</h2>
            <table>
                <thead>
                    <tr>
                        <th>Task Name</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Submission At</th>
                        <th>Assigned User</th>
                        <th>Completion Proof</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {proofs.map(proof => (
                        <tr key={proof.ProofID}>
                            <td>{proof.TaskName}</td>
                            <td>{new Date(proof.StartDate).toLocaleDateString()}</td>
                            <td>{new Date(proof.EndDate).toLocaleDateString()}</td>
                            <td>{new Date(proof.SubmissionAt).toLocaleDateString()}</td>
                            <td>{proof.AssignedUser}</td>
                            <td>
                                <a href={`http://localhost:3000/uploads/${proof.CompletionProof}`} download>
                                    Download
                                </a>
                            </td>
                            <td>{proof.Status}</td>
                            <td>
                                {proof.Status === 'pending' && (
                                    <>
                                        <button onClick={() => handleStatusChange(proof.ProofID, 'approved')}>Approve</button>
                                        <button onClick={() => handleStatusChange(proof.ProofID, 'rejected')}>Reject</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UploadedProofs;
