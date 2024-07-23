import React from 'react';
import { BrowserRouter as Router, Routes, Route , Navigate } from 'react-router-dom';
 import LoginPage from './components/LoginPage';
 import RegistrationPage from './components/RegistrationPage';
import LandingPage from './components/landingPage';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import UpdateProfile from './components/UpdateProfile'; 
import UploadProof from './components/UploadProof';
import UploadedProofs from './components/UploadedProofs';
import TaskCards from './components/TaskCards';
import CompletionProofs from './components/CompletionProofsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/dashboard/:username" element={<Dashboard />} />
        <Route path="/profile/:username" element={<ProfilePage />} /> 
        <Route path="/profile/:username" element={<ProfilePage />} /> 
        <Route path="/updateprofile/:username" element={<UpdateProfile />} />
        <Route path="/upload-proof/:username" element={<UploadProof />} />
        <Route path="/tasksAssigned/:username" element={<TaskCards />} />
        <Route path="/uploaded-proofs/:username" element={<UploadedProofs />} />
        <Route path="/completion-proofs/:username" element={<CompletionProofs />} />
        <Route path="*" element={<Navigate to="/LandingPage" />} />
        {/* Other routes can be added here */}
      </Routes>
    </Router>
  );
}

export default App;