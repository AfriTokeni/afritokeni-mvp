import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../../context/AuthenticationContext';
import UserKYC from '../../components/UserKYC';
import { UserKYCData } from '../../types/auth';

const UserKYCPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const handleKYCSubmit = async (data: UserKYCData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would submit the KYC data to your backend
      console.log('User KYC submitted:', data);
      
      // Show success message and redirect
      alert('KYC verification submitted successfully! We will review your documents and notify you within 24-48 hours.');
      navigate('/dashboard');
    } catch (error) {
      console.error('KYC submission failed:', error);
      alert('Failed to submit KYC verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if user is not logged in or is an agent
  if (!user || user.userType !== 'user') {
    navigate('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <UserKYC onSubmit={handleKYCSubmit} isLoading={isLoading} />
    </div>
  );
};

export default UserKYCPage;
