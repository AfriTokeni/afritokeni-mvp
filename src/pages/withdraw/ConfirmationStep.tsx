import React, { useState } from 'react';
import { Copy, Check, MapPin, Phone, Clock } from 'lucide-react';
import type { Agent } from './types';

interface ConfirmationStepProps {
  ugxAmount: number;
  usdcAmount: number;
  userLocation: [number, number] | null;
  selectedAgent: Agent;
  withdrawalCode: string;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  ugxAmount,
  usdcAmount,
  userLocation,
  selectedAgent,
  withdrawalCode
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Your Withdrawal Code is Ready</h2>
          <p className="text-gray-600 mt-2">Show this code to the agent to complete your withdrawal</p>
        </div>

        {/* Withdrawal Code */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Withdrawal Code</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                {withdrawalCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-500 hover:text-blue-600"
                title="Copy code"
              >
                {codeCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {codeCopied && (
              <p className="text-green-600 text-sm mt-1">Code copied to clipboard!</p>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Withdrawal Amount (USDC):</span>
              <span className="font-medium">{usdcAmount.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Withdrawal Amount (UGX):</span>
              <span className="font-medium">{ugxAmount.toLocaleString()} UGX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction Fee:</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total to Receive:</span>
              <span>{ugxAmount.toLocaleString()} UGX</span>
            </div>
          </div>
        </div>

        {/* Withdrawal Instructions */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Withdrawal Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Visit the selected agent location</li>
            <li>Show your withdrawal code: <strong>{withdrawalCode}</strong></li>
            <li>Present a valid ID for verification</li>
            <li>Receive your cash and keep the receipt</li>
          </ol>
        </div>

        {/* Agent Details */}
        {selectedAgent && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Agent Details</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{selectedAgent.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedAgent.address}</p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{selectedAgent.contact}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{selectedAgent.operatingHours}</span>
                    </div>
                  </div>

                  <button
                   onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(selectedAgent.location);
                    }}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
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
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200"
          >
            Make Another Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
