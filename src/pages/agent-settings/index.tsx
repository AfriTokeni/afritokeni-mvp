import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Bell,
  Clock,
  DollarSign,
  Smartphone,
  Globe,
  CheckCircle,
  Info,
  AlertCircle,
  ArrowLeft,
  Bitcoin,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { DataService } from '../../services/dataService';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { AFRICAN_CURRENCIES } from '../../types/currency';

interface AgentSettings {
  commissionRate: number;
  maxCashLimit: number;
  operatingHours: { start: string; end: string };
  bitcoinEnabled: boolean;
  notificationsEnabled: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  status: 'available' | 'busy' | 'cash_out' | 'offline';
  preferredCurrency: string;
  serviceRadius: number;
  minimumTransaction: number;
  autoAcceptLimit: number;
  securityPinEnabled: boolean;
  locationSharing: boolean;
}

const AgentSettings: React.FC = () => {
  const { user, agent, updateAgentStatus, refreshData } = useAfriTokeni();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'operations' | 'security' | 'notifications'>('general');
  
  const [settings, setSettings] = useState<AgentSettings>({
    commissionRate: 2.5,
    maxCashLimit: 500000,
    operatingHours: { start: '08:00', end: '18:00' },
    bitcoinEnabled: true,
    notificationsEnabled: true,
    smsNotifications: true,
    emailNotifications: false,
    status: 'available',
    preferredCurrency: 'UGX',
    serviceRadius: 5,
    minimumTransaction: 1000,
    autoAcceptLimit: 50000,
    securityPinEnabled: true,
    locationSharing: true
  });

  // Load agent settings when agent data is available
  useEffect(() => {
    const initializeAgent = async () => {
      if (user?.agent && !agent) {
        // Create agent record if it doesn't exist
        console.log('Creating agent record for user:', user.agent.id);
        try {
          const newAgent = await DataService.createAgent({
            userId: user.agent.id,
            businessName: `${user.agent.firstName || 'Agent'} ${user.agent.lastName || 'User'}`,
            location: {
              country: 'Uganda',
              state: 'Central',
              city: 'Kampala',
              address: 'Default Location',
              coordinates: { lat: 0.3476, lng: 32.5825 }
            },
            isActive: true,
            status: 'available',
            cashBalance: 0,
            digitalBalance: 0,
            commissionRate: 2.5
          });
          console.log('Created agent record:', newAgent);
          // Refresh data to load the new agent
          await refreshData();
        } catch (error) {
          console.error('Error creating agent record:', error);
        }
      }
      
      if (agent) {
        setSettings(prev => ({
          ...prev,
          status: (agent as any)?.status || 'available',
          commissionRate: (agent as any)?.commissionRate || 2.5
        }));
      }
    };
    
    initializeAgent();
  }, [agent, user?.agent]);

  const handleStatusChange = async (newStatus: 'available' | 'busy' | 'cash_out' | 'offline') => {
    setSaving(true);
    setError(null);
    try {
      console.log('Attempting to update status to:', newStatus);
      console.log('Current user.agent:', user?.agent);
      
      const success = await updateAgentStatus(newStatus);
      console.log('Update result:', success);
      
      if (success) {
        setSettings(prev => ({ ...prev, status: newStatus }));
        setSuccess(`Status updated to ${newStatus}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        console.error('updateAgentStatus returned false');
        throw new Error('Failed to update status');
      }
    } catch (err) {
      console.error('Error in handleStatusChange:', err);
      setError('Failed to update agent status');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof AgentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Check if user is authenticated as an agent
  if (!user?.agent) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">Please log in as an agent to access settings</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show loading state while agent data is being fetched
  if (!agent && user?.agent) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading agent settings...</p>
          </div>
        </div>
      </PageLayout>
    );
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cash_out': return 'bg-red-100 text-red-800 border-red-200';
      case 'offline': return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'operations', label: 'Operations', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/agents/dashboard')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Agent Settings</h1>
              <p className="text-neutral-600 mt-1">Configure your agent profile and preferences</p>
            </div>
          </div>
          <div className={`px-3 py-2 rounded-full border ${getStatusColor(settings.status)} flex items-center space-x-2`}>
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span className="text-sm font-semibold capitalize">{settings.status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-black text-white bg-gradient-to-r from-neutral-900 to-black shadow-lg transform scale-105 rounded-lg'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 hover:shadow-sm rounded-lg'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Agent Status */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-500" />
                <span>Agent Status</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['available', 'busy', 'cash_out', 'offline'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={saving}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      settings.status === status
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-black hover:bg-neutral-50'
                    } disabled:opacity-50`}
                  >
                    <div className="text-sm font-semibold capitalize">{status.replace('_', ' ')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-500" />
                <span>Profile Settings</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Preferred Currency
                  </label>
                  <select
                    value={settings.preferredCurrency}
                    onChange={(e) => handleSettingChange('preferredCurrency', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(AFRICAN_CURRENCIES).map(([code, currency]) => (
                      <option key={code} value={code}>
                        {currency.name} ({code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Service Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.serviceRadius}
                    onChange={(e) => handleSettingChange('serviceRadius', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">How far you'll travel to serve customers</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.locationSharing}
                    onChange={(e) => handleSettingChange('locationSharing', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-neutral-700">Share Location with Customers</span>
                    <p className="text-xs text-neutral-500">Helps customers find you for transactions</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="space-y-6">
            {/* Commission & Limits */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span>Commission & Limits</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={settings.commissionRate}
                    onChange={(e) => handleSettingChange('commissionRate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Your commission on transactions (2-3% recommended)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Max Cash Limit ({settings.preferredCurrency})
                  </label>
                  <input
                    type="number"
                    value={settings.maxCashLimit}
                    onChange={(e) => handleSettingChange('maxCashLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Maximum cash you can handle per transaction</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Minimum Transaction ({settings.preferredCurrency})
                  </label>
                  <input
                    type="number"
                    value={settings.minimumTransaction}
                    onChange={(e) => handleSettingChange('minimumTransaction', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Smallest transaction you'll accept</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Auto-Accept Limit ({settings.preferredCurrency})
                  </label>
                  <input
                    type="number"
                    value={settings.autoAcceptLimit}
                    onChange={(e) => handleSettingChange('autoAcceptLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Transactions below this amount are auto-accepted</p>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <span>Operating Hours</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.operatingHours.start}
                    onChange={(e) => handleSettingChange('operatingHours', {
                      ...settings.operatingHours,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.operatingHours.end}
                    onChange={(e) => handleSettingChange('operatingHours', {
                      ...settings.operatingHours,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                <span>Services Offered</span>
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.bitcoinEnabled}
                    onChange={(e) => handleSettingChange('bitcoinEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-neutral-700">Bitcoin Exchange Services</span>
                    <p className="text-xs text-neutral-500">Help customers buy/sell Bitcoin for cash</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-500" />
                <span>Security Settings</span>
              </h3>
              
              <div className="space-y-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.securityPinEnabled}
                    onChange={(e) => handleSettingChange('securityPinEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-neutral-700">Enable Security PIN</span>
                    <p className="text-xs text-neutral-500">Require PIN for high-value transactions</p>
                  </div>
                </label>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-800 font-semibold text-sm">Security Best Practices</p>
                      <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                        <li>• Never share your login credentials</li>
                        <li>• Always verify customer identity before large transactions</li>
                        <li>• Keep your phone secure and updated</li>
                        <li>• Report suspicious activity immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-500" />
                <span>Notification Preferences</span>
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-neutral-700">SMS Notifications</span>
                    <p className="text-xs text-neutral-500">Receive transaction alerts via SMS</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-neutral-700">Email Notifications</span>
                    <p className="text-xs text-neutral-500">Receive daily summaries and updates via email</p>
                  </div>
                </label>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-800 font-semibold text-sm">SMS Commands Available</p>
                      <p className="text-blue-700 text-sm mt-1">
                        You can manage your agent status and view transactions via SMS commands even when offline.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-neutral-900 text-white px-6 py-3 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors duration-200"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default AgentSettings;
