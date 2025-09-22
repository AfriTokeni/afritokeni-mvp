import React from 'react';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Agent } from '../../../services/escrowService';

interface BitcoinConfirmStepProps {
  selectedAgent: Agent | null;
  transactionId: string;
  onViewTransactions: () => void;
  onMakeAnother: () => void;
}

const BitcoinConfirmStep: React.FC<BitcoinConfirmStepProps> = ({
  selectedAgent,
  transactionId,
  onViewTransactions,
  onMakeAnother,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Exchange Initiated!</h2>
        <p className="text-neutral-600">Your Bitcoin exchange is being processed</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Transaction ID:</span>
            <span className="font-mono text-sm">{transactionId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Status:</span>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-600 font-medium">Waiting for confirmation</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Agent:</span>
            <span className="font-medium">{selectedAgent?.name}</span>
          </div>
        </div>

        {/* Agent Info Card */}
        {selectedAgent && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">
                  {selectedAgent.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-900">{selectedAgent.name}</h4>
                <p className="text-sm text-neutral-600">{selectedAgent.location}</p>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-500">{selectedAgent.rating} ★</span>
                  <span className="ml-2 text-neutral-600">• {selectedAgent.fee}% fee</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status and Next Steps */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Next Steps:</p>
              <ul className="space-y-1 text-xs">
                <li>• Wait for Bitcoin transaction confirmation (≈10 minutes)</li>
                <li>• Agent will contact you to arrange cash pickup</li>
                <li>• Bring valid ID for verification</li>
                <li>• Show your exchange code to receive cash</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Transaction Timeline */}
        <div className="mt-6">
          <h4 className="font-medium text-neutral-900 mb-4">Transaction Progress</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">Escrow Created</p>
                <p className="text-xs text-neutral-500">Exchange request initiated</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">Awaiting Bitcoin</p>
                <p className="text-xs text-neutral-500">Send Bitcoin to the provided address</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">Bitcoin Confirmation</p>
                <p className="text-xs text-neutral-400">Usually takes 10-60 minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">Cash Exchange</p>
                <p className="text-xs text-neutral-400">Meet agent to complete exchange</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={onViewTransactions}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>View Transaction History</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onMakeAnother}
            className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Make Another Exchange
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitcoinConfirmStep;