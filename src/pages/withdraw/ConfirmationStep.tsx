import React, { useState } from 'react';
import { Copy, Check, MapPin, Phone, Clock } from 'lucide-react';
import { formatCurrencyAmount } from '../../types/currency';
import { Agent as DBAgent } from '../../services/dataService';

interface ConfirmationStepProps {
  localAmount: number;
  btcAmount: string;
  withdrawType: 'cash' | 'bitcoin';
  userCurrency: string;
  fee: number;
  userLocation: [number, number] | null;
  selectedAgent?: DBAgent;
  withdrawalCode: string;
  onMakeAnotherWithdrawal?: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  localAmount,
  btcAmount,
  withdrawType,
  userCurrency,
  fee,
  userLocation,
  selectedAgent,
  withdrawalCode,
  onMakeAnotherWithdrawal
}) => {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(withdrawalCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

    const handleGetDirections = (agentLocation: [number, number]) => {
    if (!userLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${agentLocation[0]},${agentLocation[1]}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 sm:p-6 lg:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900">Your Withdrawal Code is Ready</h2>
          <p className="text-neutral-600 mt-2 text-xs sm:text-sm lg:text-base px-4">Show this 6-digit code to the agent to complete your withdrawal</p>
        </div>

        {/* Withdrawal Code */}
        <div className="bg-neutral-50 rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-neutral-200">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-neutral-600 mb-2 sm:mb-3">Withdrawal Code</p>
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-mono font-bold text-neutral-900 tracking-wider">
                {withdrawalCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 sm:p-2 text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
                title="Copy code"
              >
                {codeCopied ? <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> : <Copy className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
            {codeCopied && (
              <p className="text-green-600 text-sm mt-2 font-medium">Code copied to clipboard!</p>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="border-t border-neutral-200 pt-6 sm:pt-8 mb-6 sm:mb-8">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-neutral-900 mb-4 sm:mb-6">Transaction Summary</h3>
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 font-medium">Withdrawal Amount:</span>
              <span className="font-mono font-bold text-xs sm:text-sm lg:text-base">{formatCurrencyAmount(localAmount, userCurrency as any)}</span>
            </div>
            {withdrawType === 'bitcoin' && btcAmount && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Bitcoin Equivalent:</span>
                <span className="font-mono font-bold text-xs sm:text-sm lg:text-base text-orange-600">₿{parseFloat(btcAmount).toFixed(8)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 font-medium">Transaction Fee (1%):</span>
              <span className="font-mono font-bold text-red-600 text-xs sm:text-sm lg:text-base">{formatCurrencyAmount(fee, userCurrency as any)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
              <span className="text-neutral-600 font-medium">Total Deducted:</span>
              <span className="font-mono font-bold text-xs sm:text-sm lg:text-base">{formatCurrencyAmount(localAmount + fee, userCurrency as any)}</span>
            </div>
            <div className="border-t border-neutral-200 pt-3 sm:pt-4 flex justify-between items-center">
              <span className="font-bold text-neutral-900">Total to Receive:</span>
              <span className="font-mono font-bold text-neutral-900 text-xs sm:text-sm lg:text-base">{formatCurrencyAmount(localAmount, userCurrency as any)}</span>
            </div>
            {withdrawType === 'bitcoin' && (
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-xs text-neutral-500">Exchange rate: 1 BTC = {formatCurrencyAmount(localAmount / parseFloat(btcAmount || '1'), userCurrency as any)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Instructions */}
        <div className="border-t border-neutral-200 pt-6 sm:pt-8 mb-6 sm:mb-8">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-neutral-900 mb-4 sm:mb-6">Withdrawal Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-xs sm:text-sm text-neutral-700">
            <li className="font-medium leading-relaxed">Visit the selected agent location</li>
            <li className="font-medium leading-relaxed">Show your 6-digit withdrawal code: <strong className="font-mono text-neutral-900">{withdrawalCode}</strong></li>
            <li className="font-medium leading-relaxed">Present a valid ID for verification</li>
            <li className="font-medium leading-relaxed">Receive your cash and keep the receipt</li>
          </ol>
        </div>

        {/* Agent Details */}
        {selectedAgent && (
          <div className="border-t border-neutral-200 pt-6 sm:pt-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-neutral-900 mb-4 sm:mb-6">Agent Details</h3>
            <div className="bg-neutral-50 rounded-xl p-3 sm:p-6 border border-neutral-200">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-neutral-900 font-bold text-sm sm:text-base break-words">{selectedAgent.businessName}</span>
                  <p className="text-xs sm:text-sm text-neutral-600 mt-1 sm:mt-2 break-words">{selectedAgent.location.address}</p>
                  
                  <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-neutral-700 font-medium break-words">Via app</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-neutral-700 font-medium break-words">{selectedAgent.location.address}</span>
                    </div>
                  </div>

                  <button
                   onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections([selectedAgent.location.coordinates.lat, selectedAgent.location.coordinates.lng]);
                    }}
                    className="mt-4 sm:mt-6 bg-neutral-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-neutral-800 text-xs sm:text-sm font-semibold transition-colors duration-200 w-full sm:w-auto"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 flex space-x-4">
          <button
            onClick={onMakeAnotherWithdrawal}
            className="flex-1 bg-neutral-100 text-neutral-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-neutral-200 transition-colors duration-200 text-sm sm:text-base"
          >
            Make Another Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
