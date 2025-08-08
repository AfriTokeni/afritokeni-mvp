import React, { useState } from 'react';
import { User, Check} from 'lucide-react';
import { UserData} from '../../types/user_dashboard';


const UserProfile: React.FC = () => {
  
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
        </div>
      </div>
    </div>
  );
};

export default UserProfile;