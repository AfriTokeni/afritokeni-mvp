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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/agents')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Process Deposit</h1>
          <p className="text-gray-600">Help customers deposit money into their digital wallet</p>
        </div>
      </div>

      {depositStep === 'select' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Pending Deposit Requests</h2>
            <p className="text-sm text-gray-600">Select a customer request to process</p>
          </div>
          <div className="divide-y divide-gray-100">
            {depositRequests.filter(req => req.status === 'pending').map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{request.customer}</h3>
                      <p className="text-sm text-gray-600 flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{request.customerPhone}</span>
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(request.timestamp)}</p>
                      {request.customerLocation && (
                        <p className="text-xs text-blue-600">{request.customerLocation}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      {formatCurrency(request.requestedAmount.ugx, 'UGX')}
                    </div>
                    <div className="text-sm text-gray-500">
                      ≈ {formatCurrency(request.requestedAmount.usdc, 'USDC')}
                    </div>
                    <button
                      onClick={() => handleSelectRequest(request)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Confirm Deposit Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedRequest.customer}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.customerPhone}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requested Amount</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{formatCurrency(selectedRequest.requestedAmount.ugx, 'UGX')}</p>
                  <p className="text-sm text-gray-600">≈ {formatCurrency(selectedRequest.requestedAmount.usdc, 'USDC')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Actual UGX Amount Received</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={actualAmount.ugx}
                    onChange={(e) => setActualAmount(prev => ({ ...prev, ugx: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter UGX amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equivalent USDC Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={actualAmount.usdc}
                    onChange={(e) => setActualAmount(prev => ({ ...prev, usdc: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter USDC amount"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setDepositStep('select')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeposit}
              disabled={!actualAmount.ugx || !actualAmount.usdc}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Deposit
            </button>
          </div>
        </div>
      )}

      {depositStep === 'processing' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Deposit...</h3>
          <p className="text-gray-600">Please wait while we process the transaction</p>
        </div>
      )}

      {depositStep === 'completed' && selectedRequest && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Deposit Completed!</h3>
          <p className="text-gray-600 mb-4">
            {formatCurrency(parseFloat(actualAmount.ugx), 'UGX')} has been deposited to {selectedRequest.customer}&apos;s account
          </p>
          <div className="text-sm text-gray-500">
            Transaction ID: DEP{Date.now().toString().slice(-6)}
          </div>
          <button
            onClick={handleNewDeposit}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Process Another Deposit
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessDeposit;
