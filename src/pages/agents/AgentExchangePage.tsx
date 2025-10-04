import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Bitcoin, 
  DollarSign, 
  MapPin, 
  Clock, 
  CheckCircle,
  RefreshCw,
  MessageSquare,
  Smartphone,
  Calculator
} from 'lucide-react';
import { BitcoinService } from '../../services/bitcoinService';
import DynamicFeeCalculator from '../../components/DynamicFeeCalculator';

interface ExchangeRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  type: 'buy' | 'sell';
  amount: number;
  currency: string;
  bitcoinAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
  location?: string;
}

const AgentExchangePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'calculator'>('requests');
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Calculator state
  const [calcAmount, setCalcAmount] = useState<string>('');
  const [calcCurrency, setCalcCurrency] = useState<'UGX' | 'BTC'>('UGX');
  const [calcResult, setCalcResult] = useState<number>(0);

  useEffect(() => {
    const initializeExchange = async () => {
      try {
        setLoading(true);
        
        // Get current exchange rate
        const rate = await BitcoinService.getExchangeRate('UGX');
        setExchangeRate(rate.btcToLocal);
        
        // Mock exchange requests - in real app, fetch from backend
        const mockRequests: ExchangeRequest[] = [
          {
            id: '1',
            customerName: 'John Mukasa',
            customerPhone: '+256701234567',
            type: 'buy',
            amount: 100000,
            currency: 'UGX',
            bitcoinAmount: 0.00260417,
            status: 'pending',
            createdAt: new Date(Date.now() - 5 * 60 * 1000),
            location: 'Kampala Central'
          },
          {
            id: '2',
            customerName: 'Sarah Nakato',
            customerPhone: '+256702345678',
            type: 'sell',
            amount: 50000,
            currency: 'UGX',
            bitcoinAmount: 0.00130208,
            status: 'processing',
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
            location: 'Wandegeya'
          }
        ];
        
        setExchangeRequests(mockRequests);
        
      } catch (error) {
        console.error('Error initializing exchange:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeExchange();
  }, []);

  useEffect(() => {
    if (calcAmount && exchangeRate) {
      const amount = parseFloat(calcAmount);
      if (!isNaN(amount)) {
        if (calcCurrency === 'UGX') {
          setCalcResult(amount / exchangeRate);
        } else {
          setCalcResult(amount * exchangeRate);
        }
      } else {
        setCalcResult(0);
      }
    } else {
      setCalcResult(0);
    }
  }, [calcAmount, calcCurrency, exchangeRate]);

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    setExchangeRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'approve' ? 'processing' : 'cancelled' }
          : req
      )
    );
  };

  const completeExchange = async (requestId: string) => {
    setExchangeRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'completed' }
          : req
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading exchange data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bitcoin Exchange</h1>
            <p className="text-gray-600 mt-1">Manage customer Bitcoin exchanges</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">1 BTC = UGX {exchangeRate.toLocaleString()}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
              activeTab === 'requests'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exchange Requests
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
              activeTab === 'calculator'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rate Calculator
          </button>
        </div>

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Pending</p>
                    <p className="text-xl font-bold text-gray-900">
                      {exchangeRequests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Processing</p>
                    <p className="text-xl font-bold text-gray-900">
                      {exchangeRequests.filter(r => r.status === 'processing').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Completed Today</p>
                    <p className="text-xl font-bold text-gray-900">
                      {exchangeRequests.filter(r => r.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exchange Requests */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Active Requests</h2>
              
              {exchangeRequests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length === 0 ? (
                <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm text-center">
                  <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Requests</h3>
                  <p className="text-gray-600">
                    When customers request Bitcoin exchanges, they'll appear here.
                  </p>
                </div>
              ) : (
                exchangeRequests
                  .filter(r => r.status !== 'completed' && r.status !== 'cancelled')
                  .map((request) => (
                    <div key={request.id} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              request.type === 'buy' ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              {request.type === 'buy' ? (
                                <Bitcoin className="w-5 h-5 text-green-600" />
                              ) : (
                                <DollarSign className="w-5 h-5 text-orange-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">
                                {request.customerName} - {request.type === 'buy' ? 'Buy' : 'Sell'} Bitcoin
                              </h3>
                              <p className="text-gray-600 text-sm">{request.customerPhone}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Amount</p>
                              <p className="font-semibold text-gray-900 font-mono">
                                UGX {request.amount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Bitcoin</p>
                              <p className="font-semibold text-gray-900 font-mono">
                                ₿{request.bitcoinAmount.toFixed(8)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Time</p>
                              <p className="font-semibold text-gray-900">
                                {Math.floor((Date.now() - request.createdAt.getTime()) / 60000)}m ago
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Location</p>
                              <p className="font-semibold text-gray-900 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {request.location}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRequestAction(request.id, 'reject')}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-semibold"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleRequestAction(request.id, 'approve')}
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 font-semibold"
                              >
                                Accept
                              </button>
                            </>
                          )}
                          {request.status === 'processing' && (
                            <button
                              onClick={() => completeExchange(request.id)}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 font-semibold"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="space-y-6">
            {/* Dynamic Fee Calculator */}
            <DynamicFeeCalculator />

            {/* Rate Calculator */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Simple Exchange Rate Calculator</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={calcCurrency}
                    onChange={(e) => setCalcCurrency(e.target.value as 'UGX' | 'BTC')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="UGX">UGX (Ugandan Shilling)</option>
                    <option value="BTC">BTC (Bitcoin)</option>
                  </select>
                </div>
              </div>

              {calcAmount && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">Converts to:</p>
                    <p className="text-2xl font-bold text-gray-900 font-mono">
                      {calcCurrency === 'UGX' 
                        ? `₿${calcResult.toFixed(8)}`
                        : `UGX ${calcResult.toLocaleString()}`
                      }
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Rate: 1 BTC = UGX {exchangeRate.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Commission Information */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Smart Commission System</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-green-800 mb-2">Urban Areas</h4>
                  <p className="text-gray-600 text-sm mb-2">Low distance, high competition</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-green-700">2.5-4% commission</p>
                    <p className="text-gray-600">Quick service, nearby customers</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Rural Areas</h4>
                  <p className="text-gray-600 text-sm mb-2">Medium distance, moderate effort</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-yellow-700">4-7% commission</p>
                    <p className="text-gray-600">Travel required, fewer agents</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-red-800 mb-2">Remote Villages</h4>
                  <p className="text-gray-600 text-sm mb-2">Long distance, high effort</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-red-700">7-12% commission</p>
                    <p className="text-gray-600">Significant travel, exclusive service</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Additional Fee Factors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Express Service:</span>
                    <p className="text-blue-600">+30% fee</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Emergency:</span>
                    <p className="text-red-600">+80% fee</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Night Service:</span>
                    <p className="text-purple-600">+40% fee</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Weekend:</span>
                    <p className="text-orange-600">+15% fee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Commands */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <span>SMS Exchange Commands</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Accept Exchange Request:</h4>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <code className="text-sm text-gray-700">EXCHANGE ACCEPT [request-id]</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Complete Exchange:</h4>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <code className="text-sm text-gray-700">EXCHANGE COMPLETE [request-id]</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Check BTC Rate:</h4>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <code className="text-sm text-gray-700">BTC RATE UGX</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">List Pending Requests:</h4>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <code className="text-sm text-gray-700">EXCHANGE LIST</code>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-semibold text-sm">SMS Exchange Available</p>
                <p className="text-blue-700 text-sm mt-1">
                  Manage Bitcoin exchanges via SMS when offline. Send commands to <strong>+256-XXX-XXXX</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentExchangePage;
