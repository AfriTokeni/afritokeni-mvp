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
    <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 md:p-6 flex items-center justify-between text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-300 rounded-t-lg sm:rounded-t-xl"
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Bitcoin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Bitcoin Services</h2>
        </div>
        {expanded ? 
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" /> : 
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
        }
      </button>
      
      {expanded && (
        <div className="px-3 sm:px-4 md:px-5 lg:px-6 pb-3 sm:pb-4 md:pb-5 lg:pb-6 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Bitcoin Services Toggle */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200 gap-3">
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-orange-900">Enable Bitcoin Services</h3>
              <p className="text-[10px] sm:text-xs text-orange-700 mt-0.5 sm:mt-1 break-words">
                Allow customers to exchange Bitcoin for local currency
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Bitcoin Commission Rate (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    value={agentData.bitcoinCommissionRate}
                    onChange={(e) => onSettingChange('bitcoinCommissionRate', parseFloat(e.target.value))}
                    className="w-full pl-8 sm:pl-10 pr-2.5 sm:pr-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="3.0"
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Higher rates for Bitcoin due to volatility and complexity
                </p>
              </div>

              {/* Bitcoin Service Information */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Bitcoin Service Guidelines</h3>
                <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-gray-600">
                  <div className="flex items-start space-x-1.5 sm:space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="break-words">Always verify Bitcoin transactions are confirmed before releasing cash</p>
                  </div>
                  <div className="flex items-start space-x-1.5 sm:space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="break-words">Use AfriTokeni&apos;s escrow system for secure Bitcoin exchanges</p>
                  </div>
                  <div className="flex items-start space-x-1.5 sm:space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="break-words">Check current Bitcoin exchange rates before agreeing to transactions</p>
                  </div>
                  <div className="flex items-start space-x-1.5 sm:space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="break-words">Maintain sufficient cash reserves for Bitcoin-to-cash exchanges</p>
                  </div>
                </div>
              </div>

              {/* Bitcoin Exchange Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 border border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">Daily Bitcoin Limit</h4>
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2">Maximum Bitcoin value per day</p>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
                    <span className="text-base sm:text-lg font-mono text-orange-600 whitespace-nowrap">₿0.1</span>
                    <span className="text-xs sm:text-sm text-gray-500 break-all">≈ {formatCurrencyAmount(15000000, selectedCurrency as any)}</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 border border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">Transaction Limit</h4>
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2">Maximum per transaction</p>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
                    <span className="text-base sm:text-lg font-mono text-orange-600 whitespace-nowrap">₿0.01</span>
                    <span className="text-xs sm:text-sm text-gray-500 break-all">≈ {formatCurrencyAmount(1500000, selectedCurrency as any)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!agentData.bitcoinEnabled && (
            <div className="text-center py-6 sm:py-8">
              <Bitcoin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-gray-500 break-words px-4">
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
