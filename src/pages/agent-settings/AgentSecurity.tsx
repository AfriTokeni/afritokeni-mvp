import React from 'react';
import { Shield, ChevronDown, ChevronUp, Bell, Lock, Eye } from 'lucide-react';
import { AgentSettingsData } from './types';

interface AgentSecurityProps {
  agentData: AgentSettingsData;
  onSettingChange: (key: keyof AgentSettingsData, value: any) => void;
  expanded: boolean;
  onToggle: () => void;
}

const AgentSecurity: React.FC<AgentSecurityProps> = ({
  agentData,
  onSettingChange,
  expanded,
  onToggle
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Security & Notifications</h2>
        </div>
        {expanded ? 
          <ChevronUp className="w-5 h-5 text-gray-400" /> : 
          <ChevronDown className="w-5 h-5 text-gray-400" />
        }
      </button>
      
      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* ID Verification Requirement */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Require ID Verification</h3>
                <p className="text-xs text-red-700 mt-1">
                  Require customers to show ID for all transactions
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={agentData.requireIdVerification}
                onChange={(e) => onSettingChange('requireIdVerification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Push Notifications</h3>
                <p className="text-xs text-blue-700 mt-1">
                  Receive notifications for new transactions and alerts
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={agentData.notificationsEnabled}
                onChange={(e) => onSettingChange('notificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Security Guidelines */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Security Best Practices</span>
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p>Always verify customer identity before processing transactions</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p>Keep your cash in a secure location and avoid displaying large amounts</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p>Meet customers in public, well-lit locations during business hours</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p>Report suspicious activities or transactions to AfriTokeni support</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p>Never share your agent credentials or access codes with anyone</p>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">AfriTokeni Support</h4>
              <p className="text-xs text-gray-600 mb-2">24/7 technical support</p>
              <p className="text-sm font-mono text-blue-600">+256-800-AFRI (2374)</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Emergency Hotline</h4>
              <p className="text-xs text-gray-600 mb-2">Security incidents & fraud</p>
              <p className="text-sm font-mono text-red-600">+256-911-HELP</p>
            </div>
          </div>

          {/* Account Security Status */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">Account Security Status</h4>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Phone Verified</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">ID Documents Verified</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Background Check Complete</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Two-Factor Authentication</span>
                <span className="text-green-600">✓</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSecurity;
