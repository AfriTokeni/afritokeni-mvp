import React, { useState, useEffect } from 'react';
import { Copy, Check, MapPin, Phone, Clock } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { useAuthentication } from '../../context/AuthenticationContext';
import type { Agent } from './types';

interface ConfirmationStepProps {
  ugxAmount: number;
  usdcAmount: number;
  fee: number;
  userLocation: [number, number] | null;
  selectedAgent: Agent;
  withdrawalCode: string;
  onMakeAnotherWithdrawal?: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  ugxAmount,
  usdcAmount,
  fee,
  userLocation,
  selectedAgent,
  withdrawalCode,
  onMakeAnotherWithdrawal
}) => {
  const { userData } = useAuthentication();
  const [codeCopied, setCodeCopied] = useState(false);
  const [transactionCreated, setTransactionCreated] = useState(false);

  // Create transaction on component mount
  useEffect(() => {
    const initializeWithdrawal = async () => {
      if (!userData?.id || transactionCreated) return;

      try {
        // Create withdraw transaction
        await DataService.createWithdrawTransaction(
          userData.id,
          ugxAmount,
          selectedAgent.id,
          withdrawalCode,
          fee
        );

        setTransactionCreated(true);
      } catch (error) {
        console.error('Error initializing withdrawal:', error);
      }
    };

    initializeWithdrawal();
  }, [userData?.id, ugxAmount, selectedAgent.id, withdrawalCode, fee, transactionCreated]);

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
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Your Withdrawal Code is Ready</h2>
          <p className="text-neutral-600 mt-2">Show this 6-digit code to the agent to complete your withdrawal</p>
        </div>

        {/* Withdrawal Code */}
        <div className="bg-neutral-50 rounded-xl p-8 mb-8 border border-neutral-200">
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-600 mb-3">Withdrawal Code</p>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-4xl font-mono font-bold text-neutral-900 tracking-wider">
                {withdrawalCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
                title="Copy code"
              >
                {codeCopied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
            {codeCopied && (
              <p className="text-green-600 text-sm mt-2 font-medium">Code copied to clipboard!</p>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="border-t border-neutral-200 pt-8 mb-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Transaction Summary</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600 font-medium">Withdrawal Amount (USDC):</span>
              <span className="font-mono font-bold">{usdcAmount.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 font-medium">Withdrawal Amount (UGX):</span>
              <span className="font-mono font-bold">{ugxAmount.toLocaleString()} UGX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 font-medium">Transaction Fee (1%):</span>
              <span className="font-mono font-bold text-red-600">{fee.toLocaleString()} UGX</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200">
              <span className="text-neutral-600 font-medium">Total Deducted:</span>
              <span className="font-mono font-bold">{(ugxAmount + fee).toLocaleString()} UGX</span>
            </div>
            <div className="border-t border-neutral-200 pt-4 flex justify-between">
              <span className="font-bold text-neutral-900">Total to Receive:</span>
              <span className="font-mono font-bold text-neutral-900">{ugxAmount.toLocaleString()} UGX</span>
            </div>
          </div>
        </div>

        {/* Withdrawal Instructions */}
        <div className="border-t border-neutral-200 pt-8 mb-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Withdrawal Instructions</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-neutral-700">
            <li className="font-medium">Visit the selected agent location</li>
            <li className="font-medium">Show your 6-digit withdrawal code: <strong className="font-mono text-neutral-900">{withdrawalCode}</strong></li>
            <li className="font-medium">Present a valid ID for verification</li>
            <li className="font-medium">Receive your cash and keep the receipt</li>
          </ol>
        </div>

        {/* Agent Details */}
        {selectedAgent && (
          <div className="border-t border-neutral-200 pt-8">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Agent Details</h3>
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-neutral-900 text-lg">{selectedAgent.name}</h4>
                  <p className="text-sm text-neutral-600 mt-2">{selectedAgent.address}</p>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-700 font-medium">{selectedAgent.contact}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-700 font-medium">{selectedAgent.operatingHours}</span>
                    </div>
                  </div>

                  <button
                   onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(selectedAgent.location);
                    }}
                    className="mt-6 bg-neutral-900 text-white px-6 py-3 rounded-lg hover:bg-neutral-800 text-sm font-semibold transition-colors duration-200"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex space-x-4">
          <button
            onClick={onMakeAnotherWithdrawal}
            className="flex-1 bg-neutral-100 text-neutral-700 py-3 px-6 rounded-lg font-semibold hover:bg-neutral-200 transition-colors duration-200"
          >
            Make Another Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
