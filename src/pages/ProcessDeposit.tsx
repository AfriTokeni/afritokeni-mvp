import React, { useState } from 'react';
import { 
  ArrowLeft,
  Plus,
  User,
  Phone,
  DollarSign,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

interface DepositRequest {
  id: string;
  customer: string;
  customerPhone: string;
  requestedAmount: {
    ugx: number;
    usdc: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  timestamp: Date;
  customerLocation?: string;
}

const ProcessDeposit: React.FC = () => {
  const navigate = useNavigate();
  const [depositStep, setDepositStep] = useState<'select' | 'confirm' | 'processing' | 'completed'>('select');
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [actualAmount, setActualAmount] = useState({ ugx: '', usdc: '' });

  // Mock pending deposit requests
  const [depositRequests] = useState<DepositRequest[]>([
    {
      id: 'DEP001',
      customer: 'John Kamau',
      customerPhone: '+256701234567',
      requestedAmount: { ugx: 100000, usdc: 26.32 },
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      customerLocation: 'Kampala Central'
    },
    {
      id: 'DEP002',
      customer: 'Mary Nakato',
      customerPhone: '+256702345678',
      requestedAmount: { ugx: 75000, usdc: 19.74 },
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      customerLocation: 'Nakawa Market'
    },
    {
      id: 'DEP003',
      customer: 'Peter Okello',
      customerPhone: '+256703456789',
      requestedAmount: { ugx: 150000, usdc: 39.47 },
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

  const formatTimeAgo = (date: Date): string => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  const handleSelectRequest = (request: DepositRequest) => {
    setSelectedRequest(request);
    setActualAmount({
      ugx: request.requestedAmount.ugx.toString(),
      usdc: request.requestedAmount.usdc.toString()
    });
    setDepositStep('confirm');
  };

  const handleConfirmDeposit = () => {
    setDepositStep('processing');
    // Simulate processing time
    setTimeout(() => {
      setDepositStep('completed');
    }, 2000);
  };

  const handleNewDeposit = () => {
    setDepositStep('select');
    setSelectedRequest(null);
    setActualAmount({ ugx: '', usdc: '' });
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/agents/dashboard')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Process Deposit</h1>
            <p className="text-neutral-600 mt-1">Help customers deposit money into their digital wallet</p>
          </div>
        </div>

        {depositStep === 'select' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Pending Deposit Requests</h2>
              <p className="text-sm text-neutral-600 mt-1">Select a customer request to process</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {depositRequests.filter(req => req.status === 'pending').map((request) => (
                <div key={request.id} className="p-6 hover:bg-neutral-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{request.customer}</h3>
                        <p className="text-sm text-neutral-600 flex items-center space-x-1 mt-1">
                          <Phone className="w-4 h-4" />
                          <span>{request.customerPhone}</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{formatTimeAgo(request.timestamp)}</p>
                        {request.customerLocation && (
                          <p className="text-xs text-neutral-600 mt-1">{request.customerLocation}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-neutral-900 font-mono">
                        {formatCurrency(request.requestedAmount.ugx, 'UGX')}
                      </div>
                      <div className="text-sm text-neutral-600 font-mono">
                        ≈ {formatCurrency(request.requestedAmount.usdc, 'USDC')}
                      </div>
                      <button
                        onClick={() => handleSelectRequest(request)}
                        className="mt-3 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-semibold transition-colors duration-200"
                      >
                        Process
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {depositStep === 'confirm' && selectedRequest && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
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
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setDepositStep('select')}
                className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeposit}
                disabled={!actualAmount.ugx || !actualAmount.usdc}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        )}

        {depositStep === 'processing' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Processing Deposit...</h3>
            <p className="text-neutral-600">Please wait while we process the transaction</p>
          </div>
        )}

        {depositStep === 'completed' && selectedRequest && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Deposit Completed!</h3>
            <p className="text-neutral-600 mb-4">
              <span className="font-mono font-semibold">{formatCurrency(parseFloat(actualAmount.ugx), 'UGX')}</span> has been deposited to {selectedRequest.customer}&apos;s account
            </p>
            <div className="text-sm text-neutral-500 font-mono">
              Transaction ID: DEP{Date.now().toString().slice(-6)}
            </div>
            <button
              onClick={handleNewDeposit}
              className="mt-6 px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 font-semibold transition-colors duration-200"
            >
              Process Another Deposit
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ProcessDeposit;
