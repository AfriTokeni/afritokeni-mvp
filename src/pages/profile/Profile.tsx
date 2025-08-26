import React, { useState, useEffect } from 'react';
import { User, Check, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useAuthentication } from '../../context/AuthenticationContext';
import { DataService } from '../../services/dataService';

interface UserData {
  name: string;
  phone: string;
  email: string;
  balances: {
    UGX: number;
    USDT: number;
  };
  isVerified: boolean;
  kycStatus: string;
  joinDate: Date;
}

const UserProfile: React.FC = () => {
  const { logout, user } = useAuthentication();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from auth context
        const currentUser = user.user;
        if (!currentUser) {
          setError('No user found. Please log in.');
          return;
        }

        // Fetch user balance from Juno
        let userBalance: { balance: number } = { balance: 0 };
        try {
          const balanceData = await DataService.getUserBalance(currentUser.id);
          if (balanceData) {
            userBalance = balanceData;
          }
        } catch {
          console.log('No balance found, defaulting to 0');
        }

        // Combine user data with balance data
        const combinedUserData: UserData = {
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          phone: currentUser.email.startsWith('+') ? currentUser.email : 'N/A',
          email: currentUser.email,
          balances: {
            UGX: userBalance.balance || 0,
            USDT: (userBalance.balance || 0) / 3800 // Approximate conversion rate
          },
          isVerified: currentUser.isVerified && currentUser.kycStatus === 'approved',
          kycStatus: currentUser.kycStatus || 'pending',
          joinDate: currentUser.createdAt || new Date()
        };

        setUserData(combinedUserData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user.user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="animate-pulse">
              <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-neutral-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 lg:h-8 bg-neutral-200 rounded w-48 mx-auto"></div>
                  <div className="h-4 lg:h-6 bg-neutral-200 rounded w-32 mx-auto"></div>
                  <div className="h-3 lg:h-5 bg-neutral-200 rounded w-36 mx-auto"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 lg:h-14 bg-neutral-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageLayout>
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12">
              <div className="text-red-500 mb-2 text-2xl lg:text-3xl">⚠️</div>
              <h2 className="text-lg lg:text-xl font-semibold text-neutral-900 mb-2">Failed to Load Profile Data</h2>
              <p className="text-neutral-600 mb-4 text-sm lg:text-base">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 lg:px-6 lg:py-3 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 transition-colors text-sm lg:text-base"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show main content if userData is available
  if (!userData) {
    return (
      <PageLayout>
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12">
              <div className="text-neutral-400 mb-2 text-2xl lg:text-3xl">👤</div>
              <h2 className="text-lg lg:text-xl font-semibold text-neutral-900 mb-2">No Profile Data Found</h2>
              <p className="text-neutral-600 text-sm lg:text-base">Please complete your profile setup.</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 px-2 sm:px-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900">Profile</h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
          <div className="flex flex-col items-center text-center space-y-4 mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-neutral-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-neutral-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-1">{userData.name}</h2>
              <p className="text-neutral-600 font-mono text-sm sm:text-base lg:text-lg mb-1">{userData.phone}</p>
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  {userData.isVerified ? 'Verified Account' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Account Settings</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Security & Privacy</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Transaction Limits</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Help & Support</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            {/* Logout Button - Only visible on mobile */}
            <button 
              onClick={handleLogout}
              className="md:hidden w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                <span className="text-sm sm:text-base text-red-700">Logout</span>
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