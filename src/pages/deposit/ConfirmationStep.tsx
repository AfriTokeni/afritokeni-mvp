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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 lg:p-8">
        <div className="text-center mb-4 md:mb-6 lg:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600" />
          </div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2">Deposit Request Created</h2>
          <p className="text-xs md:text-sm lg:text-base text-gray-600">Meet your agent to complete the deposit</p>
        </div>

        <div className="space-y-3 md:space-y-4 lg:space-y-6">
          {/* Deposit Code */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 lg:p-6 text-center">
            <p className="text-xs md:text-sm font-medium text-gray-700 mb-2">Your Deposit Code</p>
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-gray-900 tracking-wider">
              {depositCode}
            </div>
            <p className="text-xs text-gray-500 mt-2">Show this code to your agent</p>
          </div>

          {/* Transaction Details */}
          <div className="border border-gray-200 rounded-lg p-3 md:p-4">
            <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-3 md:mb-4">Transaction Details</h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between">
                <span className="text-xs md:text-sm text-gray-600">Amount</span>
                <span className="font-semibold text-xs md:text-sm">{formatCurrencyAmount(parseFloat(amount), selectedCurrency as AfricanCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs md:text-sm text-gray-600">Agent</span>
                <span className="font-semibold text-xs md:text-sm">{selectedAgent?.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs md:text-sm text-gray-600">Location</span>
                <span className="font-semibold text-xs md:text-sm">{selectedAgent?.location.address}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-3 md:p-4">
            <h3 className="font-semibold text-sm md:text-base text-blue-900 mb-2 md:mb-3">Next Steps</h3>
            <TransactionCodeDisplay
              code={depositCode}
              title="Your Deposit Code"
              description="Show this code to the agent when making your deposit"
              className="mb-3 md:mb-4 lg:mb-6"
            />
            
            <ol className="list-decimal list-inside space-y-1 md:space-y-1.5 lg:space-y-2 text-xs md:text-sm text-gray-700">
              <li>Bring your cash to the agent&apos;s location</li>
              <li>Show your deposit code or QR code to the agent</li>
              <li>Agent will verify and add money to your account</li>
              <li>You&apos;ll receive a confirmation notification</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 lg:space-x-4">
            <button
              onClick={onReturnToDashboard}
              className="flex-1 bg-gray-900 text-white py-2 md:py-2.5 lg:py-3 px-3 md:px-4 rounded-lg font-medium text-xs md:text-sm lg:text-base hover:bg-gray-800 transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={onMakeAnother}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 md:py-2.5 lg:py-3 px-3 md:px-4 rounded-lg font-medium text-xs md:text-sm lg:text-base hover:bg-gray-50 transition-colors"
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