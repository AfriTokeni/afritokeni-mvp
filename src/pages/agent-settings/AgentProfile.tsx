import React from 'react';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { AgentSettingsData } from './types';

interface AgentProfileProps {
  agent: any;
  agentData: AgentSettingsData;
  onSettingChange: (key: keyof AgentSettingsData, value: any) => void;
  onStatusChange: (status: 'available' | 'busy' | 'cash_out' | 'offline') => void;
  expanded: boolean;
  onToggle: () => void;
  selectedCurrency: string;
}

const AgentProfile: React.FC<AgentProfileProps> = ({
  agentData,
  onSettingChange,
  onStatusChange,
  expanded,
  onToggle,
  selectedCurrency
}) => {
  const { agent } = useAfriTokeni();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'cash_out': return 'text-orange-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100';
      case 'busy': return 'bg-yellow-100';
      case 'cash_out': return 'bg-orange-100';
      case 'offline': return 'bg-gray-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 rounded-t-xl"
      >
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Agent Profile</h2>
        </div>
        {expanded ? 
          <ChevronUp className="w-5 h-5 text-neutral-400" /> : 
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        }
      </button>
      
      {expanded && (
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={agent?.businessName || ''}
                disabled
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Agent ID
              </label>
              <input
                type="text"
                value={agent?.id || ''}
                disabled
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500 font-mono"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Current Location
            </label>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-300">
              <p className="text-sm text-neutral-700">
                {agent?.location ? 
                  `${agent.location.address}, ${agent.location.city}, ${agent.location.state}, ${agent.location.country}` :
                  'Location not set'
                }
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional Location Description
            </label>
            <textarea
              value={agentData.locationDescription}
              onChange={(e) => onSettingChange('locationDescription', e.target.value)}
              placeholder="Add landmarks or additional details (e.g., Near Central Market, next to MTN office)"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Agent Status
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['available', 'busy', 'cash_out', 'offline'].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status as any)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    agent?.status === status
                      ? `${getStatusBgColor(status)} ${getStatusColor(status)} border-current`
                      : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'available' ? 'bg-green-500' : 
                      status === 'busy' ? 'bg-yellow-500' :
                      status === 'cash_out' ? 'bg-orange-500' : 'bg-gray-500'
                    }`} />
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProfile;
