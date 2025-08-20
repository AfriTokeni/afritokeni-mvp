import React, { useState } from 'react';
import { User, Check, LogOut, Shield, Bell, MapPin, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

interface AgentData {
  name: string;
  phone: string;
  agentId: string;
  location: string;
  status: 'active' | 'inactive';
  isVerified: boolean;
  joinDate: Date;
}

const AgentSettings: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Mock agent data
  const [agent] = useState<AgentData>({
    name: 'Sarah Nakamura',
    phone: '+256781234567',
    agentId: 'AGT001234',
    location: 'Kampala Central',
    status: 'active',
    isVerified: true,
    joinDate: new Date('2024-01-15')
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
          <h1 className="text-2xl font-bold text-neutral-900">Agent Settings</h1>
          <p className="text-neutral-600 mt-1">Manage your agent account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-neutral-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">{agent.name}</h2>
              <p className="text-neutral-600 font-mono text-lg mb-1">{agent.phone}</p>
              <p className="text-sm text-neutral-500 font-mono mb-2">Agent ID: {agent.agentId}</p>
              <div className="flex items-center space-x-4 mb-2">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">{agent.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">Since {agent.joinDate.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Verified Agent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-medium text-neutral-600 capitalize">{agent.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Agent Profile</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Security & Privacy</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Commission Settings</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Location & Availability</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Notifications</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Help & Support</span>
              </div>
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

export default AgentSettings;
