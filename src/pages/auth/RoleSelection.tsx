import React, { useState } from 'react';
import { User, Shield, ArrowRight } from 'lucide-react';
import { authSubscribe, type User as JunoUser } from '@junobuild/core';
import { useRoleBasedAuth, type UserRole } from '../../hooks/useRoleBasedAuth';
import { useAuthentication } from '../../context/AuthenticationContext';
import { useEffect } from 'react';

const RoleSelection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [junoUser, setJunoUser] = useState<JunoUser | null>(null);
  const { setUserRole } = useRoleBasedAuth();
  const { updateUserType } = useAuthentication();

  useEffect(() => {
    const unsubscribe = authSubscribe((user: JunoUser | null) => {
      setJunoUser(user);
    });

    return unsubscribe;
  }, []);

  const handleRoleSelection = async (role: UserRole) => {
    if (!junoUser) {
      console.error('No authenticated user found');
      return;
    }

    setIsLoading(true);
    try {
      // Set the role in the user_roles collection
      await setUserRole(junoUser, role);
      // Update the userType in the authentication context to trigger storage key change
      // await updateUserType(role,'user');
    } catch (error) {
      console.error('Failed to set user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!junoUser) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome to AfriTokeni</h1>
          <p className="text-neutral-600">Choose your account type to get started</p>
        </div>

        <div className="space-y-4">
          {/* User Option */}
          <button
            onClick={() => setSelectedRole('user')}
            disabled={isLoading}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedRole === 'user'
                ? 'border-neutral-900 bg-white shadow-lg'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedRole === 'user' ? 'bg-neutral-900' : 'bg-neutral-100'
              }`}>
                <User className={`w-6 h-6 ${
                  selectedRole === 'user' ? 'text-white' : 'text-neutral-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">I'm a User</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Send money, withdraw cash, and manage your digital wallet
                </p>
              </div>
              {selectedRole === 'user' && (
                <ArrowRight className="w-5 h-5 text-neutral-900" />
              )}
            </div>
          </button>

          {/* Agent Option */}
          <button
            onClick={() => setSelectedRole('agent')}
            disabled={isLoading}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedRole === 'agent'
                ? 'border-neutral-900 bg-white shadow-lg'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedRole === 'agent' ? 'bg-neutral-900' : 'bg-neutral-100'
              }`}>
                <Shield className={`w-6 h-6 ${
                  selectedRole === 'agent' ? 'text-white' : 'text-neutral-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">I'm an Agent</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Process transactions, manage customers, and earn commissions
                </p>
              </div>
              {selectedRole === 'agent' && (
                <ArrowRight className="w-5 h-5 text-neutral-900" />
              )}
            </div>
          </button>
        </div>

        {/* Continue Button */}
        {selectedRole && (
          <button
            onClick={() => handleRoleSelection(selectedRole)}
            disabled={isLoading}
            className="w-full mt-6 bg-neutral-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Setting up your account...</span>
              </>
            ) : (
              <>
                <span>Continue as {selectedRole === 'user' ? 'User' : 'Agent'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500">
            You can change your account type later in settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
