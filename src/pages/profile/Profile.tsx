import React, { useState } from 'react';
import { User, Check, LogOut } from 'lucide-react';
import { UserData} from '../../types/user_dashboard';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useAuthentication } from '../../context/AuthenticationContext';


const UserProfile: React.FC = () => {
  const { logout } = useAuthentication();
  const navigate = useNavigate();
  
  // Mock user data
  const [user] = useState<UserData>({
    name: 'John Kamau',
    phone: '+256701234567',
    balances: {
      UGX: 850000,
      USDC: 245.50
    },
    isVerified: true
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-neutral-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">{user.name}</h2>
              <p className="text-neutral-600 font-mono text-lg mb-2">{user.phone}</p>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Verified Account</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900">Account Settings</span>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900">Security & Privacy</span>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900">Transaction Limits</span>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900">Help & Support</span>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            {/* Logout Button - Only visible on mobile */}
            <button 
              onClick={handleLogout}
              className="md:hidden w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-700">Logout</span>
              </div>
              <span className="text-red-400 text-lg">→</span>
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default UserProfile;