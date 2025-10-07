import React from 'react';
import { Bitcoin, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { AgentSettingsData } from './types';
import { formatCurrencyAmount } from '../../types/currency';

interface AgentBitcoinProps {
  agentData: AgentSettingsData;
  onSettingChange: (key: keyof AgentSettingsData, value: any) => void;
  expanded: boolean;
  onToggle: () => void;
  selectedCurrency: string;
}

const AgentBitcoin: React.FC<AgentBitcoinProps> = ({
  agentData,
  onSettingChange,
  expanded,
  onToggle,
  selectedCurrency
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-300 rounded-t-xl"
      >
        <div className="flex items-center space-x-3">
          <Bitcoin className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bitcoin Services</h2>
        </div>
        {expanded ? 
          <ChevronUp className="w-5 h-5 text-gray-400" /> : 
          <ChevronDown className="w-5 h-5 text-gray-400" />
        }
      </button>
      
      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Bitcoin Services Toggle */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div>
              <h3 className="text-sm font-medium text-orange-900">Enable Bitcoin Services</h3>
              <p className="text-xs text-orange-700 mt-1">
                Allow customers to exchange Bitcoin for local currency
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={agentData.bitcoinEnabled}
                onChange={(e) => onSettingChange('bitcoinEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {agentData.bitcoinEnabled && (
            <>
              {/* Bitcoin Commission Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitcoin Commission Rate (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    value={agentData.bitcoinCommissionRate}
                    onChange={(e) => onSettingChange('bitcoinCommissionRate', parseFloat(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="3.0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Higher rates for Bitcoin due to volatility and complexity
                </p>
              </div>

              {/* Bitcoin Service Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Bitcoin Service Guidelines</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Always verify Bitcoin transactions are confirmed before releasing cash</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Use AfriTokeni's escrow system for secure Bitcoin exchanges</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Check current Bitcoin exchange rates before agreeing to transactions</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Maintain sufficient cash reserves for Bitcoin-to-cash exchanges</p>
                  </div>
                </div>
              </div>

              {/* Bitcoin Exchange Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Daily Bitcoin Limit</h4>
                  <p className="text-xs text-gray-600 mb-2">Maximum Bitcoin value per day</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-mono text-orange-600">₿0.1</span>
                    <span className="text-sm text-gray-500">≈ {formatCurrencyAmount(15000000, selectedCurrency as any)}</span>
                  </div>
                </div>
                <div className="p-4 border border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Transaction Limit</h4>
                  <p className="text-xs text-gray-600 mb-2">Maximum per transaction</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-mono text-orange-600">₿0.01</span>
                    <span className="text-sm text-gray-500">≈ {formatCurrencyAmount(1500000, selectedCurrency as any)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!agentData.bitcoinEnabled && (
            <div className="text-center py-8">
              <Bitcoin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Enable Bitcoin services to start earning from Bitcoin exchanges
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentBitcoin;
