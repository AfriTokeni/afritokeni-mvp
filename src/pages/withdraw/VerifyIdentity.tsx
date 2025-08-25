import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, User, Phone, CreditCard, MapPin, Clock } from 'lucide-react';
import { WithdrawalRequest } from './ProcessWithdrawal';

interface VerifyIdentityProps {
  withdrawal: WithdrawalRequest;
  onVerifyComplete: () => void;
}

const VerifyIdentity: React.FC<VerifyIdentityProps> = ({ withdrawal, onVerifyComplete }) => {
  const [verificationSteps, setVerificationSteps] = useState({
    identityDocument: false,
    phoneVerification: false,
    amountConfirmation: false,
    customerPresence: false
  });

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

  const handleStepToggle = (step: keyof typeof verificationSteps) => {
    setVerificationSteps(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  const allStepsCompleted = Object.values(verificationSteps).every(step => step);

  const verificationInstructions = [
    {
      key: 'identityDocument' as keyof typeof verificationSteps,
      icon: <User className="w-5 h-5" />,
      title: 'Verify Identity Document',
      description: 'Check the customer\'s National ID or Passport matches the withdrawal request',
      details: [
        'Ask the customer to present their National ID or Passport',
        'Verify the name matches the withdrawal request',
        'Check that the document is valid and not expired',
        'Ensure the photo matches the person in front of you'
      ]
    },
    {
      key: 'phoneVerification' as keyof typeof verificationSteps,
      icon: <Phone className="w-5 h-5" />,
      title: 'Verify Phone Number',
      description: 'Confirm the customer\'s phone number matches the registered number',
      details: [
        'Ask the customer to show their phone number',
        'Verify it matches the registered number in the system',
        'You may ask them to receive an SMS verification code'
      ]
    },
    {
      key: 'amountConfirmation' as keyof typeof verificationSteps,
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Confirm Withdrawal Amount',
      description: 'Verify the customer knows the exact amount they are withdrawing',
      details: [
        'Ask the customer to state the withdrawal amount',
        'Confirm they understand the UGX equivalent',
        'Ensure they have the withdrawal code ready'
      ]
    },
    {
      key: 'customerPresence' as keyof typeof verificationSteps,
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Confirm Customer Presence',
      description: 'Verify the customer is physically present and ready to receive cash',
      details: [
        'Ensure the customer is physically present',
        'Confirm they are ready to receive the cash amount',
        'Check that they understand the transaction process'
      ]
    }
  ];

  return (
    <div className="p-6">
      {/* Withdrawal Details Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{withdrawal.userName}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
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
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(withdrawal.amount.ugx, 'UGX')}
            </div>
            <div className="text-sm text-gray-600">
              ≈ {formatCurrency(withdrawal.amount.usdc, 'USDT')}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Code: <span className="font-mono font-medium">{withdrawal.withdrawalCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800">Important Security Notice</h4>
            <p className="text-sm text-amber-700 mt-1">
              Please complete ALL verification steps before proceeding to withdrawal approval. 
              This ensures the security of both the customer and your agency.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Identity Verification Checklist</h2>
        
        {verificationInstructions.map((instruction, index) => (
          <div 
            key={instruction.key}
            className={`border rounded-lg p-4 transition-colors ${
              verificationSteps[instruction.key] 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-lg ${
                  verificationSteps[instruction.key] 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {instruction.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-medium text-gray-800">{instruction.title}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{instruction.description}</p>
                  
                  {/* <ul className="space-y-1">
                    {instruction.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-sm text-gray-700 flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul> */}
                </div>
              </div>
              
              <button
                onClick={() => handleStepToggle(instruction.key)}
                className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  verificationSteps[instruction.key]
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {verificationSteps[instruction.key] ? 'Verified' : 'Mark as Verified'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-800">Verification Progress</h4>
            <p className="text-sm text-gray-600">
              {Object.values(verificationSteps).filter(Boolean).length} of {Object.keys(verificationSteps).length} steps completed
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={`${(Object.values(verificationSteps).filter(Boolean).length / Object.keys(verificationSteps).length) * 100}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-800">
                  {Math.round((Object.values(verificationSteps).filter(Boolean).length / Object.keys(verificationSteps).length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onVerifyComplete}
          disabled={!allStepsCompleted}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            allStepsCompleted
              ? 'w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {allStepsCompleted ? 'Proceed to Approval' : 'Complete All Verifications'}
        </button>
      </div>
    </div>
  );
};

export default VerifyIdentity;
