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
      USDT: 245.50
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
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto sm:mx-0 flex-shrink-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1">{user.name}</h2>
              <p className="text-neutral-600 font-mono text-base sm:text-lg mb-2 break-words">{user.phone}</p>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Verified Account</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full flex items-center justify-between p-3 sm:p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900 text-sm sm:text-base">Account Settings</span>
              <span className="text-neutral-400 text-base sm:text-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 sm:p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900 text-sm sm:text-base">Security & Privacy</span>
              <span className="text-neutral-400 text-base sm:text-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 sm:p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900 text-sm sm:text-base">Transaction Limits</span>
              <span className="text-neutral-400 text-base sm:text-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 sm:p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <span className="font-semibold text-neutral-900 text-sm sm:text-base">Help & Support</span>
              <span className="text-neutral-400 text-base sm:text-lg">→</span>
            </button>
            
            {/* Logout Button - Only visible on mobile */}
            <button 
              onClick={handleLogout}
              className="md:hidden w-full flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-700 text-sm sm:text-base">Logout</span>
              </div>
              <span className="text-red-400 text-base sm:text-lg">→</span>
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default UserProfile;