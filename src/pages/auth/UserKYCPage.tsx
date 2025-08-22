import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../../context/AuthenticationContext';
import UserKYC from '../../components/UserKYC';
import { UserKYCData } from '../../types/auth';
import { DataService } from '../../services/dataService';

const UserKYCPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const handleKYCSubmit = async (data: UserKYCData) => {
    setIsLoading(true);
    
    try {
      // Format phone number consistently
      const formattedPhone = data.phoneNumber.startsWith('+') ? 
        data.phoneNumber : 
        `+256${data.phoneNumber.replace(/^0/, '')}`;

      // Check for existing user ID from localStorage or context
      let existingUserId: string | null = null;
      
      // First check if user is already logged in and has an ID
      if (user?.id) {
        existingUserId = user.id;
      } else {
        // Check localStorage for existing user
        const storedUser = localStorage.getItem('afritokeni_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser?.id) {
              existingUserId = parsedUser.id;
            }
          } catch (error) {
            console.error('Error parsing stored user:', error);
          }
        }
      }

      // Create user in Juno datastore with existing ID or generate new one
      // If user already exists, update their information instead of creating new
      let finalUser;
      if (existingUserId && user) {
        // For existing users, try to get user by phone number
        const existingUser = await DataService.getUser(formattedPhone);
        
        if (existingUser) {
          // Update existing user with new information
          const updateSuccess = await DataService.updateUser(formattedPhone, {
            firstName: data.firstName,
            lastName: data.lastName,
            kycStatus: 'pending',
            // For both web and SMS users, update email to phone number for financial operations
            email: formattedPhone
          });
          
          if (updateSuccess) {
            finalUser = {
              ...existingUser,
              firstName: data.firstName,
              lastName: data.lastName,
              kycStatus: 'pending' as const,
              // For both web and SMS users, use phone number as email for financial operations
              email: formattedPhone
            };
          } else {
            throw new Error('Failed to update existing user');
          }
        } else {
          // Create new user with existing ID
          finalUser = await DataService.createUser({
            id: existingUserId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: formattedPhone, // Use phone number for both web and SMS users
            userType: 'user',
            kycStatus: 'pending'
          });
        }
      } else {
        // Create completely new user
        finalUser = await DataService.createUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: formattedPhone,
          userType: 'user',
          kycStatus: 'pending'
        });
      }

      // Initialize user balance (only if it's a new user or balance doesn't exist)
      await DataService.initializeUserData(finalUser.id);

      // Determine auth method and email for storage
      const isWebUser = user?.email === user?.id;
      const authMethod = isWebUser ? 'web' : 'sms';
      // After KYC, both web and SMS users use phone number as email for financial operations
      const emailForStorage = formattedPhone;

      // Update localStorage with user information (using both session and local storage)
      const userForStorage = {
        id: finalUser.id,
        firstName: finalUser.firstName,
        lastName: finalUser.lastName,
        email: emailForStorage, // Phone number for both user types
        userType: 'user' as const,
        kycStatus: 'pending' as const,
        isVerified: false
      };

      // Store in both sessionStorage (tab-specific) and localStorage (persistent)
      const userString = JSON.stringify(userForStorage);
      sessionStorage.setItem('afritokeni_user', userString);
      sessionStorage.setItem('afritokeni_auth_method', authMethod);
      localStorage.setItem('afritokeni_user', userString);
      localStorage.setItem('afritokeni_auth_method', authMethod);

      // Update authentication context
      updateUser({
        id: finalUser.id,
        firstName: finalUser.firstName,
        lastName: finalUser.lastName,
        email: formattedPhone, // Phone number for both web and SMS users after KYC
        userType: 'user',
        kycStatus: 'pending',
        isVerified: false,
        createdAt: new Date()
      });

      console.log('User KYC submitted:', { ...data, user: finalUser });
      
      // Show success message and redirect
      alert('KYC verification submitted successfully! We will review your documents and notify you within 24-48 hours.');
      navigate('/users/dashboard');
    } catch (error) {
      console.error('KYC submission failed:', error);
      alert('Failed to submit KYC verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Allow access to KYC page even if not logged in for new user registration
  // If user is logged in and is an agent, redirect to agent KYC
  if (user && user.userType === 'agent') {
    navigate('/agents/agent-kyc');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <UserKYC onSubmit={handleKYCSubmit} isLoading={isLoading} />
    </div>
  );
};

export default UserKYCPage;
