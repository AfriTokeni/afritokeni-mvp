import React from 'react';
import { CheckCircle } from 'lucide-react';
import TransactionCodeDisplay from '../../components/TransactionCodeDisplay';
import { formatCurrencyAmount, type AfricanCurrency } from '../../types/currency';
import { ConfirmationStepProps } from '../../types/depositTypes';

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  amount,
  selectedCurrency,
  selectedAgent,
  depositCode,
  onReturnToDashboard,
  onMakeAnother,
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Request Created</h2>
          <p className="text-gray-600">Meet your agent to complete the deposit</p>
        </div>

        <div className="space-y-6">
          {/* Deposit Code */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Your Deposit Code</p>
            <div className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
              {depositCode}
            </div>
            <p className="text-xs text-gray-500 mt-2">Show this code to your agent</p>
          </div>

          {/* Transaction Details */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Transaction Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">{formatCurrencyAmount(parseFloat(amount), selectedCurrency as AfricanCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Agent</span>
                <span className="font-semibold">{selectedAgent?.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-semibold">{selectedAgent?.location.address}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
            <TransactionCodeDisplay
              code={depositCode}
              title="Your Deposit Code"
              description="Show this code to the agent when making your deposit"
              className="mb-6"
            />
            
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Bring your cash to the agent&apos;s location</li>
              <li>Show your deposit code or QR code to the agent</li>
              <li>Agent will verify and add money to your account</li>
              <li>You&apos;ll receive a confirmation notification</li>
            </ol>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onReturnToDashboard}
              className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={onMakeAnother}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Make Another Deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;