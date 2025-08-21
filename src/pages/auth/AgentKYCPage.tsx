import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentKYC from '../../components/AgentKYC';
import { AgentKYCData } from '../../types/auth';
import { useAuthentication } from '../../context/AuthenticationContext';

const AgentKYCPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const handleKYCSubmit = async (data: AgentKYCData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would submit the KYC data to your backend
      console.log('Agent KYC submitted:', data);
      
      // Show success message and redirect
      alert('Agent verification submitted successfully! We will review your documents and location, then contact you within 2-3 business days to complete the setup.');
      navigate('/agents/dashboard');
    } catch (error) {
      console.error('KYC submission failed:', error);
      alert('Failed to submit agent verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if user is not logged in or is not an agent
  if (!user || user.userType !== 'agent') {
    navigate('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AgentKYC onSubmit={handleKYCSubmit} isLoading={isLoading} />
    </div>
  );
};

export default AgentKYCPage;
