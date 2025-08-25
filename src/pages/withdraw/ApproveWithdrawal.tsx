import React, { useState } from 'react';
import { CheckCircle, User, Phone, MapPin, Clock, AlertCircle } from 'lucide-react';
import { WithdrawalRequest } from './ProcessWithdrawal';

interface ApproveWithdrawalProps {
  withdrawal: WithdrawalRequest;
  onApprovalComplete: () => void;
}

const ApproveWithdrawal: React.FC<ApproveWithdrawalProps> = ({ withdrawal, onApprovalComplete }) => {
  const [withdrawalCode, setWithdrawalCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [cashGiven, setCashGiven] = useState(false);

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDT') => {
    if (currency === 'UGX') {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setWithdrawalCode(value);
    if (codeError) {
      setCodeError('');
    }
  };

  const handleApproveWithdrawal = async () => {
    if (withdrawalCode !== withdrawal.withdrawalCode) {
      setCodeError('Invalid withdrawal code. Please check and try again.');
      return;
    }

    if (!cashGiven) {
      setCodeError('Please confirm that you have given the cash to the customer.');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsCompleted(true);
      
      // Auto redirect after success
      setTimeout(() => {
        onApprovalComplete();
      }, 3000);
    } catch {
      setCodeError('Failed to process withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Withdrawal Completed!</h2>
        <p className="text-neutral-600 mb-6">
          The withdrawal has been successfully processed and recorded.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Transaction Summary</h3>
            <div className="space-y-2 text-sm text-green-700">
              <p><strong>Customer:</strong> {withdrawal.userName}</p>
              <p><strong>Amount:</strong> <span className="font-mono">{formatCurrency(withdrawal.amount.ugx, 'UGX')}</span></p>
              <p><strong>Withdrawal Code:</strong> <span className="font-mono">{withdrawal.withdrawalCode}</span></p>
              <p><strong>Completed:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-500">
          Redirecting to withdrawal requests in a few seconds...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Withdrawal Details Header */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{withdrawal.userName}</h3>
              <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{withdrawal.userPhone}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{withdrawal.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Requested {getTimeAgo(withdrawal.requestedAt)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {formatCurrency(withdrawal.amount.ugx, 'UGX')}
            </div>
            <div className="text-sm text-neutral-600 font-mono">
              ≈ {formatCurrency(withdrawal.amount.usdc, 'USDT')}
            </div>
          </div>
        </div>
      </div>

      {/* Cash Breakdown */}
      {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
          <Banknote className="w-5 h-5 mr-2" />
          Suggested Cash Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(denominations).map(([denom, count]) => (
            <div key={denom} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">
                {formatCurrency(Number(denom), 'UGX')}
              </div>
              <div className="text-sm text-gray-600">× {count}</div>
              <div className="text-xs text-gray-500">
                = {formatCurrency(Number(denom) * count, 'UGX')}
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Cash Confirmation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800">Before Proceeding</h4>
            <p className="text-sm text-amber-700 mt-1">
              Ensure you have counted the exact amount and are ready to give it to the customer.
            </p>
            
            <label className="flex items-center mt-4">
              <input
                type="checkbox"
                checked={cashGiven}
                onChange={(e) => setCashGiven(e.target.checked)}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-amber-800">
                I confirm that I have given <span className="font-mono font-semibold">{formatCurrency(withdrawal.amount.ugx, 'UGX')}</span> cash to the customer
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Withdrawal Code Input */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Enter Withdrawal Code</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Ask the customer to provide their withdrawal code to complete the transaction.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="withdrawalCode" className="block text-sm font-semibold text-neutral-700 mb-2">
              Withdrawal Code
            </label>
            <input
              type="text"
              id="withdrawalCode"
              value={withdrawalCode}
              onChange={handleCodeChange}
              placeholder="Enter withdrawal code"
              className={`w-full px-4 py-3 border rounded-lg font-mono text-lg tracking-wider focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors duration-200 ${
                codeError ? 'border-red-300 bg-red-50' : 'border-neutral-300'
              }`}
              disabled={isProcessing}
            />
            {codeError && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {codeError}
              </p>
            )}
          </div>

          <div className="bg-neutral-50 rounded-lg p-4">
            <p className="text-sm text-neutral-600">
              <strong>Expected Code:</strong> 
              <span className="font-mono ml-2 bg-white px-3 py-1 rounded border border-neutral-200 font-semibold">
                {withdrawal.withdrawalCode}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleApproveWithdrawal}
          disabled={!withdrawalCode || isProcessing || !cashGiven}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center ${
            withdrawalCode && cashGiven && !isProcessing
              ? 'w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Withdrawal...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Withdrawal
            </>
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-neutral-500">
          This transaction will be recorded and cannot be reversed. 
          Ensure all details are correct before proceeding.
        </p>
      </div>
    </div>
  );
};

export default ApproveWithdrawal;
