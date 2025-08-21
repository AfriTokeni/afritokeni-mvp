import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WithdrawalList from './WithdrawalList';
import VerifyIdentity from './VerifyIdentity';
import ApproveWithdrawal from './ApproveWithdrawal';
import PageLayout from '../../components/PageLayout';

export interface WithdrawalRequest {
  id: string;
  userName: string;
  userPhone: string;
  amount: {
    ugx: number;
    usdc: number;
  };
  withdrawalCode: string;
  requestedAt: Date;
  status: 'pending' | 'verified' | 'approved' | 'completed' | 'rejected';
  userNationalId?: string;
  location?: string;
}

type Step = 'list' | 'verify' | 'approve';

const ProcessWithdrawal: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('list');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);

  const handleSelectWithdrawal = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setCurrentStep('verify');
  };

  const handleVerifyComplete = () => {
    setCurrentStep('approve');
  };

  const handleApprovalComplete = () => {
    // Reset to list and show success message
    setCurrentStep('list');
    setSelectedWithdrawal(null);
  };

  const handleBack = () => {
    if (currentStep === 'verify') {
      setCurrentStep('list');
      setSelectedWithdrawal(null);
    } else if (currentStep === 'approve') {
      setCurrentStep('verify');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'list': return 'Withdrawal Requests';
      case 'verify': return 'Verify Customer Identity';
      case 'approve': return 'Approve Withdrawal';
      default: return 'Process Withdrawal';
    }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => currentStep === 'list' ? navigate('/agents/dashboard') : handleBack()}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{getStepTitle()}</h1>
              <p className="text-sm text-neutral-600 mt-1">
                {currentStep === 'list' && 'Select a withdrawal request to process'}
                {currentStep === 'verify' && 'Verify the customer\'s identity before proceeding'}
                {currentStep === 'approve' && 'Enter withdrawal code to complete the transaction'}
              </p>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
              currentStep === 'list' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              1
            </div>
            <div className="w-8 h-0.5 bg-neutral-300"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
              currentStep === 'verify' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              2
            </div>
            <div className="w-8 h-0.5 bg-neutral-300"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
              currentStep === 'approve' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          {currentStep === 'list' && (
            <WithdrawalList onSelectWithdrawal={handleSelectWithdrawal} />
          )}
          
          {currentStep === 'verify' && selectedWithdrawal && (
            <VerifyIdentity 
              withdrawal={selectedWithdrawal} 
              onVerifyComplete={handleVerifyComplete}
            />
          )}
          
          {currentStep === 'approve' && selectedWithdrawal && (
            <ApproveWithdrawal 
              withdrawal={selectedWithdrawal}
              onApprovalComplete={handleApprovalComplete}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ProcessWithdrawal;
