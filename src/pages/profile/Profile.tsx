import React, { useState } from 'react';
import { User, Check, LogOut } from 'lucide-react';
import { UserData} from '../../types/user_dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


const UserProfile: React.FC = () => {
  const { logout } = useAuth();
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

  const handleLogout = () => {
      logout();
      navigate('/auth/login');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
            <p className="text-gray-600">{user.phone}</p>
            <div className="flex items-center space-x-1 mt-1">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Verified Account</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <span className="font-medium text-gray-800">Account Settings</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <span className="font-medium text-gray-800">Security & Privacy</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <span className="font-medium text-gray-800">Transaction Limits</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <span className="font-medium text-gray-800">Help & Support</span>
            <span className="text-gray-400">→</span>
          </button>
          
          {/* Logout Button - Only visible on mobile */}
          <button 
            onClick={handleLogout}
            className="md:hidden w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-700">Logout</span>
            </div>
            <span className="text-red-400">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;