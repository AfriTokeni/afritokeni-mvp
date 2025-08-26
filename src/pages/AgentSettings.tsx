import React, { useState, useEffect } from 'react';
import { User, Check, LogOut, Shield, Bell, MapPin, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuthentication } from '../context/AuthenticationContext';
import { DataService } from '../services/dataService';

interface AgentData {
  id: string;
  name: string;
  phone: string;
  agentId: string;
  location: string;
  status: 'active' | 'inactive';
  isVerified: boolean;
  joinDate: Date;
  businessName?: string;
  cashBalance?: number;
  digitalBalance?: number;
}

const AgentSettings: React.FC = () => {
  const { logout, user } = useAuthentication();
  const navigate = useNavigate();
  
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current agent user from auth context
        const currentAgent = user.agent;
        if (!currentAgent) {
          setError('No agent user found. Please log in as an agent.');
          return;
        }

        // Fetch agent profile data from Juno
        const agentProfileData = await DataService.getAgentByUserId(currentAgent.id);
        
        // Combine user data with agent profile data
        const combinedAgentData: AgentData = {
          id: currentAgent.id,
          name: `${currentAgent.firstName} ${currentAgent.lastName}`,
          phone: currentAgent.email, // We'll use email for now, can be updated to real phone later
          agentId: agentProfileData?.id || currentAgent.id.substring(0, 8).toUpperCase(),
          location: agentProfileData?.location ? 
            `${agentProfileData.location.city}, ${agentProfileData.location.state}` : 
            'Location not set',
          status: agentProfileData?.isActive ? 'active' : 'inactive',
          isVerified: currentAgent.isVerified && currentAgent.kycStatus === 'approved',
          joinDate: currentAgent.createdAt || new Date(),
          businessName: agentProfileData?.businessName,
          cashBalance: agentProfileData?.cashBalance,
          digitalBalance: agentProfileData?.digitalBalance
        };

        setAgentData(combinedAgentData);
      } catch (err) {
        console.error('Error fetching agent data:', err);
        setError('Failed to load agent data');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [user.agent]);

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
                {[...Array(6)].map((_, i) => (
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
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 sm:p-4 lg:p-8 xl:p-10 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12 xl:py-16">
              <div className="text-red-500 mb-2 text-2xl lg:text-3xl xl:text-4xl">⚠️</div>
              <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-neutral-900 mb-2">Failed to Load Agent Data</h2>
              <p className="text-neutral-600 mb-4 text-sm lg:text-base xl:text-lg">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 transition-colors text-sm lg:text-base xl:text-lg"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show main content if agentData is available
  if (!agentData) {
    return (
      <PageLayout>
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 sm:p-4 lg:p-8 xl:p-10 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12 xl:py-16">
              <div className="text-neutral-400 mb-2 text-2xl lg:text-3xl xl:text-4xl">👤</div>
              <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-neutral-900 mb-2">No Agent Data Found</h2>
              <p className="text-neutral-600 text-sm lg:text-base xl:text-lg">Please complete your agent profile setup.</p>
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
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900">Agent Settings</h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">Manage your agent account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
          <div className="flex flex-col items-center text-center space-y-4 mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-neutral-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-neutral-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-1">{agentData.name}</h2>
              {agentData.businessName && (
                <p className="text-neutral-600 text-base sm:text-lg mb-1">{agentData.businessName}</p>
              )}
              <p className="text-neutral-600 font-mono text-sm sm:text-base lg:text-lg mb-1">{agentData.phone}</p>
              <p className="text-sm text-neutral-500 font-mono mb-3">Agent ID: {agentData.agentId}</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-2 sm:space-y-0 sm:space-x-6 mb-2">
                <div className="flex items-center justify-center space-x-1">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">{agentData.location}</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">Since {agentData.joinDate.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-2 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center justify-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {agentData.isVerified ? 'Verified Agent' : 'Pending Verification'}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${agentData.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-medium text-neutral-600 capitalize">{agentData.status}</span>
                </div>
              </div>
              {(agentData.cashBalance !== undefined || agentData.digitalBalance !== undefined) && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-1 sm:space-y-0 sm:space-x-6">
                    {agentData.digitalBalance !== undefined && (
                      <div className="flex items-center justify-center space-x-1">
                        <DollarSign className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-neutral-600">
                          Digital: UGX {agentData.digitalBalance.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Agent Profile</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Security & Privacy</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Commission Settings</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Location & Availability</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Notifications</span>
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

export default AgentSettings;
