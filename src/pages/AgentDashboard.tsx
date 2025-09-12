import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  MapPin, 
  Clock,
  User,
  CheckCircle,
  XCircle,
  Navigation,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Bitcoin,
  ArrowRightLeft,
  Wallet,
  ArrowUpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KYCStatusAlert from '../components/KYCStatusAlert';
import PageLayout from '../components/PageLayout';
import { CurrencySelector } from '../components/CurrencySelector';
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import { BalanceService } from '../services/BalanceService';
import { DataService } from '../services/dataService';
import { formatCurrencyAmount } from '../types/currency';
import { Transaction } from '../types/transaction';

interface AgentStatus {
  status: 'available' | 'busy' | 'cash-out';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  lastUpdated: Date;
}

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent, updateAgentStatus: updateStatus } = useAfriTokeni();
  
  // Agent's selected currency (default to UGX)
  const [selectedCurrency, setSelectedCurrency] = useState('UGX');
  
  // Calculate daily earnings from DataService
  const calculateDailyEarnings = (): number => {
    // Simple calculation based on mock data
    return 25000; // Mock daily earnings
  };

  // Get customers count
  const [customersCount, setCustomersCount] = useState(0);
  const [agentTransactions, setAgentTransactions] = useState<Transaction[]>([]);

  React.useEffect(() => {
    // Load customers count asynchronously
    DataService.getAllCustomers().then(customers => {
      setCustomersCount(customers.length);
    });
    
    // Load agent transactions
    if (agent) {
      const transactions = BalanceService.getTransactionHistory(agent.id);
      setAgentTransactions(transactions);
    }
  }, [agent]);

  // Get agent's Bitcoin balance using BalanceService
  const bitcoinBalance = agent ? BalanceService.calculateBalance(agent.id, 'BTC') : 0;
  const dailyEarnings = calculateDailyEarnings();
  
  // Local state for UI status (fallback to agent data if available)
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    status: 'available',
    lastUpdated: new Date()
  });
  
  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'cash-out':
        return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Clock className="w-4 h-4" />;
      case 'cash-out': return <XCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, selectedCurrency as any);
  };

  const handleUpdateAgentStatus = async (newStatus: AgentStatus['status']) => {
    // Convert UI status to backend status format
    const backendStatus = newStatus === 'cash-out' ? 'cash_out' : newStatus;
    
    try {
      // Update in backend if we have the updateStatus function
      if (updateStatus) {
        const success = await updateStatus(backendStatus as 'available' | 'busy' | 'cash_out' | 'offline');
        if (!success) {
          alert('Failed to update status. Please try again.');
          return;
        }
      }
      
      // Update local state
      setAgentStatus(prev => ({
        ...prev,
        status: newStatus,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error updating agent status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Mock reverse geocoding - in real app, use a geocoding service
      const mockAddress = `Kampala, Uganda (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      
      setAgentStatus(prev => ({
        ...prev,
        location: { latitude, longitude, address: mockAddress },
        lastUpdated: new Date()
      }));
      
      // Here you would send the coordinates to your backend
      console.log('Sending location to backend:', { latitude, longitude });
      
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please check your browser permissions.');
    }
  };

  const [showBalance, setShowBalance] = useState(true);

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-0">
        {/* KYC Status Alert */}
        <KYCStatusAlert user_type="agent" />

        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Agent Dashboard</h1>
            <p className="text-neutral-600 mt-1 text-sm sm:text-base">Manage your agent operations and track earnings</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-neutral-700">Currency:</span>
              <CurrencySelector
                currentCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
              />
            </div>
          </div>
        </div>

        {/* Top Row - Status & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Agent Status Control */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <span className="text-xs sm:text-sm font-semibold text-neutral-700">Status:</span>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(agentStatus.status)}`}>
                  {getStatusIcon(agentStatus.status)}
                  <span className="text-xs sm:text-sm font-semibold capitalize">{agentStatus.status.replace('-', ' ')}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateAgentStatus('available')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                    agentStatus.status === 'available' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => handleUpdateAgentStatus('busy')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                    agentStatus.status === 'busy' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Busy
                </button>
                <button
                  onClick={() => handleUpdateAgentStatus('cash-out')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                    agentStatus.status === 'cash-out' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Cash Out
                </button>
              </div>
            </div>
          </div>

          {/* Location Update Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-500 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900">Location</h3>
                  <p className="text-xs text-neutral-600 mt-1 truncate">
                    {agentStatus.location 
                      ? `Updated ${agentStatus.lastUpdated.toLocaleTimeString()}`
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={updateLocation}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200 w-full sm:w-auto"
              >
                <Navigation className="w-4 h-4" />
                <span>Update</span>
              </button>
            </div>
          </div>
        </div>

        {/* Balance Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Cash Balance Card */}
          <div className="bg-white border border-neutral-200 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-neutral-600 text-xs sm:text-sm font-semibold">Cash Balance (Earnings)</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 font-mono truncate">
                    {showBalance ? formatCurrency(agent?.cashBalance || 0) : '••••••••'}
                  </span>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200 flex-shrink-0"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                <Wallet className="w-3 h-3 text-green-600" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-neutral-100 space-y-2 sm:space-y-0">
              <span className="text-neutral-500 text-xs sm:text-sm">Available for settlement</span>
              <button
                onClick={() => navigate('/agents/settlement')}
                className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm transition-colors"
              >
                Withdraw →
              </button>
            </div>
          </div>

          {/* Digital Balance Card */}
          <div className="bg-white border border-neutral-200 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-neutral-600 text-xs sm:text-sm font-semibold">Digital Balance (Operations)</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 font-mono truncate">
                    {showBalance ? formatCurrency(agent?.digitalBalance || 0) : '••••••••'}
                  </span>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200 flex-shrink-0"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <CreditCard className="w-3 h-3 text-blue-600" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-neutral-100 space-y-2 sm:space-y-0">
              <span className="text-neutral-500 text-xs sm:text-sm">
                {(agent?.digitalBalance || 0) < 100000 ? 'Low balance - fund account' : 'Ready for deposits'}
              </span>
              <button
                onClick={() => navigate('/agents/funding')}
                className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm transition-colors"
              >
                Add Funds →
              </button>
            </div>
          </div>

          {/* Bitcoin Balance Card */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-neutral-600 text-xs sm:text-sm font-semibold">Bitcoin Balance</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 font-mono truncate">
                    {showBalance ? `₿${bitcoinBalance.toFixed(8)}` : '••••••••'}
                  </span>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200 flex-shrink-0"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg flex-shrink-0">
                <Bitcoin className="w-3 h-3 text-orange-600" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-orange-100 space-y-2 sm:space-y-0">
              <span className="text-neutral-600 text-xs sm:text-sm">Ready for exchange</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-orange-600 font-medium text-xs sm:text-sm">Bitcoin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <button 
            onClick={() => navigate('/agents/deposit')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Deposit</span>
          </button>

          <button 
            onClick={() => navigate('/agents/withdraw')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Withdrawal</span>
          </button>

          <button 
            onClick={() => navigate('/agents/funding')}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-200 border border-transparent transition-all duration-200">
              <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Fund Account</span>
          </button>

          <button 
            onClick={() => navigate('/agents/settlement')}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-green-200 border border-transparent transition-all duration-200">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Settlement</span>
          </button>

          <button 
            onClick={() => navigate('/agents/customers')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Customers</span>
          </button>

          <button 
            onClick={() => navigate('/agents/settings')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Settings</span>
          </button>

          <button 
            onClick={() => navigate('/agents/bitcoin')}
            className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-orange-200 border border-transparent transition-all duration-200">
              <Bitcoin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Bitcoin</span>
          </button>

          <button 
            onClick={() => navigate('/agents/exchange')}
            className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-purple-200 border border-transparent transition-all duration-200">
              <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Exchange</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-neutral-200">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200 flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-neutral-600">Daily Earnings</p>
                <p className="text-lg sm:text-xl font-bold text-neutral-900 font-mono mt-1 truncate">
                  {formatCurrency(dailyEarnings)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-neutral-200">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200 flex-shrink-0">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-neutral-600">Today&apos;s Transactions</p>
                <p className="text-lg sm:text-xl font-bold text-neutral-900 font-mono mt-1">{agentTransactions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-neutral-200">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-neutral-600">Active Customers</p>
                <p className="text-lg sm:text-xl font-bold text-neutral-900 font-mono mt-1">{customersCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900">Recent Transactions</h2>
            <button onClick={() => navigate('/agents/transactions')} className="text-neutral-600 hover:text-neutral-900 text-xs sm:text-sm font-semibold transition-colors duration-200">
              View All
            </button>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {agentTransactions.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-neutral-600">
                        {transaction.description ? transaction.description.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'TX'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">{transaction.description || 'Transaction'}</p>
                      <p className="text-xs text-neutral-600 font-medium mt-1 truncate">
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace(/[_-]/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs sm:text-sm font-bold text-neutral-900 font-mono">
                      {formatCurrencyAmount(transaction.amount, transaction.currency as any)}
                    </div>
                    <div className="text-xs mt-1">
                      <span className="text-green-600 font-bold font-mono">
                        +{formatCurrencyAmount(Math.round(transaction.amount * 0.02), transaction.currency as any)}
                      </span>
                      <div className={`mt-1 font-semibold text-xs ${
                        transaction.status === 'completed' ? 'text-green-600' : 
                        transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {agentTransactions.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-neutral-600 text-sm">No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AgentDashboard;
