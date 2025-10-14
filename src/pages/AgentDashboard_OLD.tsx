import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  Plus, 
  Minus, 
  Bitcoin,
  Eye,
  EyeOff,
  Wallet,
  CreditCard,
  X
} from 'lucide-react';
import { BalanceService } from '../services/BalanceService';
import { formatCurrencyAmount } from '../types/currency';
import AgentStatusIndicator from '../components/AgentStatusIndicator';
import LiquidityAlert from '../components/LiquidityAlert';
import NotificationSystem from '../components/NotificationSystem';
import { useNotifications } from '../hooks/useNotifications';
import { useAfriTokeni } from '../hooks/useAfriTokeni';

import { Transaction } from '../types/transaction';


const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent } = useAfriTokeni();
  const [showBalance, setShowBalance] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<string>('Kampala, Uganda');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(true);
  const { notifications, dismissNotification } = useNotifications();
  
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
  

  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, 'UGX');
  };

  // Check for liquidity alerts
  const checkLiquidityAlerts = () => {
    if (!agent) return [];
    
    const alerts = [];
    const digitalBalance = agent.digitalBalance || 0;
    const cashBalance = agent.cashBalance || 0;
    
    // Digital balance alerts
    if (digitalBalance < 50000) {
      alerts.push({
        type: 'critical_digital' as const,
        balance: digitalBalance,
        threshold: 50000
      });
    } else if (digitalBalance < 100000) {
      alerts.push({
        type: 'low_digital' as const,
        balance: digitalBalance,
        threshold: 100000
      });
    }
    
    // Cash balance alerts
    if (cashBalance < 25000) {
      alerts.push({
        type: 'critical_cash' as const,
        balance: cashBalance,
        threshold: 25000
      });
    } else if (cashBalance < 50000) {
      alerts.push({
        type: 'low_cash' as const,
        balance: cashBalance,
        threshold: 50000
      });
    }
    
    return alerts;
  };

  const liquidityAlerts = checkLiquidityAlerts();


  const updateLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    try {
      setIsUpdatingLocation(true);
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
      
      setCurrentLocation(mockAddress);
      setIsUpdatingLocation(false);
      
      // Here you would send the coordinates to your backend
      console.log('Sending location to backend:', { latitude, longitude });
      
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please check your browser permissions.');
      setIsUpdatingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      <NotificationSystem 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      
      {/* Agent Verification Status */}
      {showVerificationAlert && (
        agent?.isActive ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 relative">
            <div className="flex items-center justify-between">
              <p className="text-green-800 text-sm">✓ Agent verified and active</p>
              <button
                onClick={() => setShowVerificationAlert(false)}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 relative">
            <div className="flex items-center justify-between">
              <p className="text-yellow-800 text-sm">⚠ Agent verification pending</p>
              <button
                onClick={() => setShowVerificationAlert(false)}
                className="text-yellow-600 hover:text-yellow-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      )}

      {/* Agent Status and Location */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <AgentStatusIndicator 
                  status={agent?.status || 'available'}
                  isActive={agent?.isActive || true}
                  size="lg"
                />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Agent Status</h2>
                  <p className="text-neutral-600 text-sm sm:text-base">
                    {agent?.status === 'available' && 'Currently available for transactions'}
                    {agent?.status === 'busy' && 'Currently busy with other transactions'}
                    {agent?.status === 'cash_out' && 'Currently out of cash'}
                    {agent?.status === 'offline' && 'Currently offline'}
                    {!agent?.status && 'Status unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-neutral-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm truncate">
                    {isUpdatingLocation ? (
                      <span className="text-blue-600">Updating location...</span>
                    ) : (
                      currentLocation
                    )}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={updateLocation}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200 w-full sm:w-auto"
            >
              <MapPin className="w-4 h-4" />
              <span>Update</span>
            </button>
          </div>
        </div>

        {/* Liquidity Alerts */}
        {liquidityAlerts.length > 0 && (
          <div className="space-y-3">
            {liquidityAlerts.map((alert, index) => (
              <LiquidityAlert
                key={index}
                type={alert.type}
                currentBalance={alert.balance}
                threshold={alert.threshold}
                onActionClick={() => {
                  if (alert.type.includes('digital')) {
                    navigate('/agents/funding');
                  } else {
                    navigate('/agents/settlement');
                  }
                }}
              />
            ))}
          </div>
        )}

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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/agents/deposit')}
            className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900 block text-center">Process Deposits</span>
          </button>

          <button 
            onClick={() => navigate('/agents/withdraw')}
            className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Minus className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900 block text-center">Process Withdrawals</span>
          </button>

          <button 
            onClick={() => navigate('/agents/customers')}
            className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900 block text-center">Manage Customers</span>
          </button>

          <button 
            onClick={() => navigate('/agents/settings')}
            className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900 block text-center">Settings</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-neutral-200">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
  );
};

export default AgentDashboard;
