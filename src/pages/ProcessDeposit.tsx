import React, { useState } from 'react';
import { 
  ArrowLeft,
  User,
  Phone,
  DollarSign,
  Check,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

export interface DepositRequest {
  id: string;
  customer: string;
  customerPhone: string;
  requestedAmount: {
    ugx: number;
    usdc: number;
  };
  depositCode: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  timestamp: Date;
  customerLocation?: string;
}

type Step = 'list' | 'confirm' | 'complete';

const ProcessDeposit: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('list');
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [actualAmount, setActualAmount] = useState({ ugx: '', usdc: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Mock pending deposit requests
  const [depositRequests] = useState<DepositRequest[]>([
    {
      id: 'DEP001',
      customer: 'John Kamau',
      customerPhone: '+256701234567',
      requestedAmount: { ugx: 100000, usdc: 26.32 },
      depositCode: 'DEP001234',
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      customerLocation: 'Kampala Central'
    },
    {
      id: 'DEP002',
      customer: 'Mary Nakato',
      customerPhone: '+256702345678',
      requestedAmount: { ugx: 75000, usdc: 19.74 },
      depositCode: 'DEP002345',
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      customerLocation: 'Nakawa Market'
    },
    {
      id: 'DEP003',
      customer: 'Peter Okello',
      customerPhone: '+256703456789',
      requestedAmount: { ugx: 150000, usdc: 39.47 },
      depositCode: 'DEP003456',
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 8)
    }
  ]);

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDC'): string => {
    if (currency === 'UGX') {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const handleSelectRequest = (request: DepositRequest) => {
    setSelectedRequest(request);
    setActualAmount({
      ugx: request.requestedAmount.ugx.toString(),
      usdc: request.requestedAmount.usdc.toString()
    });
    setCurrentStep('confirm');
  };

  const handleConfirmDeposit = async () => {
    setIsProcessing(true);
    
    // Simulate processing time
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsCompleted(true);
      
      // Auto redirect after success
      setTimeout(() => {
        handleNewDeposit();
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewDeposit = () => {
    setCurrentStep('list');
    setSelectedRequest(null);
    setActualAmount({ ugx: '', usdc: '' });
    setIsProcessing(false);
    setIsCompleted(false);
  };

  const handleBack = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('list');
      setSelectedRequest(null);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'list': return 'Deposit Requests';
      case 'confirm': return 'Confirm Deposit Details';
      case 'complete': return 'Deposit Completed';
      default: return 'Process Deposit';
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
                {currentStep === 'list' && 'Select a deposit request to process'}
                {currentStep === 'confirm' && 'Verify the deposit amount and complete the transaction'}
                {currentStep === 'complete' && 'Deposit has been successfully processed'}
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
              currentStep === 'confirm' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              2
            </div>
            <div className="w-8 h-0.5 bg-neutral-300"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
              currentStep === 'complete' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          {currentStep === 'list' && (
            <div className="p-6">
              <div className="space-y-4">
                {depositRequests.filter(req => req.status === 'pending').map((request) => (
                  <div
                    key={request.id}
                    onClick={() => handleSelectRequest(request)}
                    className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-neutral-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* User Avatar */}
                        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-neutral-600" />
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-neutral-900">{request.customer}</h3>
                          <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{request.customerPhone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{getTimeAgo(request.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amount and Status */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-neutral-900 font-mono">
                          {formatCurrency(request.requestedAmount.ugx, 'UGX')}
                        </div>
                        <div className="text-sm text-neutral-600 mb-2 font-mono">
                          ≈ {formatCurrency(request.requestedAmount.usdc, 'USDC')}
                        </div>
                        
                        {/* Deposit Code */}
                        <div className="text-xs text-neutral-500 mb-2">
                          Code: <span className="font-mono font-semibold">{request.depositCode}</span>
                        </div>
                        
                        {/* Status Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'confirm' && selectedRequest && (
            <div className="p-6">
              {isCompleted ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Deposit Completed!</h2>
                  <p className="text-neutral-600 mb-6">
                    The deposit has been successfully processed and recorded.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-green-800 mb-3">Transaction Summary</h3>
                      <div className="space-y-2 text-sm text-green-700">
                        <p><strong>Customer:</strong> {selectedRequest.customer}</p>
                        <p><strong>Amount:</strong> <span className="font-mono">{formatCurrency(parseFloat(actualAmount.ugx), 'UGX')}</span></p>
                        <p><strong>Transaction ID:</strong> <span className="font-mono">DEP{Date.now().toString().slice(-6)}</span></p>
                        <p><strong>Completed:</strong> {new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-500">
                    Redirecting to deposit requests in a few seconds...
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-6">Confirm Deposit Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Customer</label>
                        <div className="p-4 bg-neutral-50 rounded-lg">
                          <p className="font-semibold text-neutral-900">{selectedRequest.customer}</p>
                          <p className="text-sm text-neutral-600 mt-1">{selectedRequest.customerPhone}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Requested Amount</label>
                        <div className="p-4 bg-neutral-50 rounded-lg">
                          <p className="font-bold text-neutral-900 font-mono">{formatCurrency(selectedRequest.requestedAmount.ugx, 'UGX')}</p>
                          <p className="text-sm text-neutral-600 font-mono mt-1">≈ {formatCurrency(selectedRequest.requestedAmount.usdc, 'USDC')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Actual UGX Amount Received</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="number"
                            value={actualAmount.ugx}
                            onChange={(e) => setActualAmount(prev => ({ ...prev, ugx: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono transition-colors duration-200"
                            placeholder="Enter UGX amount"
                            disabled={isProcessing}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Equivalent USDC Amount</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="number"
                            value={actualAmount.usdc}
                            onChange={(e) => setActualAmount(prev => ({ ...prev, usdc: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono transition-colors duration-200"
                            placeholder="Enter USDC amount"
                            step="0.01"
                            disabled={isProcessing}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-8">
                    <button
                      onClick={() => setCurrentStep('list')}
                      disabled={isProcessing}
                      className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDeposit}
                      disabled={!actualAmount.ugx || !actualAmount.usdc || isProcessing}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing Deposit...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Confirm Deposit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  );
};

export default ProcessDeposit;
