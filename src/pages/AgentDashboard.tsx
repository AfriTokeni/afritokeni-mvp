import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
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
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import { DataService } from '../services/dataService';

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent } = useAfriTokeni();
  const [showBalance, setShowBalance] = useState(true);
  const [showVerificationAlert, setShowVerificationAlert] = useState(true);
  
  // Get customers count
  const [customersCount, setCustomersCount] = useState(0);

  React.useEffect(() => {
    DataService.getAllCustomers().then(customers => {
      setCustomersCount(customers.length);
    });
  }, []);

  // Get agent's Bitcoin balance
  const bitcoinBalance = agent ? BalanceService.calculateBalance(agent.id, 'BTC') : 0;
  const dailyEarnings = 25000; // Mock
  
  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, 'UGX');
  };

  // Check for liquidity alerts
  const getLiquidityAlerts = () => {
    if (!agent) return [];
    
    const alerts = [];
    const digitalBalance = agent.digitalBalance || 0;
    const cashBalance = agent.cashBalance || 0;
    
    // Critical digital balance
    if (digitalBalance < 50000) {
      alerts.push({
        type: 'critical',
        title: 'Critical Digital Balance',
        message: `Your digital balance is critically low. You may not be able to process large deposits.`,
        balance: digitalBalance,
        action: 'Fund Now',
        link: '/agents/funding'
      });
    }
    // Low digital balance
    else if (digitalBalance < 100000) {
      alerts.push({
        type: 'warning',
        title: 'Low Digital Balance',
        message: `Your digital balance is running low. Consider funding your account.`,
        balance: digitalBalance,
        action: 'Fund Account',
        link: '/agents/funding'
      });
    }
    
    // Critical cash balance
    if (cashBalance < 25000) {
      alerts.push({
        type: 'critical',
        title: 'Critical Cash Balance',
        message: `Your cash balance is critically low. You may not be able to process withdrawals.`,
        balance: cashBalance,
        action: 'Urgent Settlement',
        link: '/agents/settlement'
      });
    }
    
    return alerts;
  };

  const liquidityAlerts = getLiquidityAlerts();

  return (
    <div className="space-y-6">
      
      {/* Agent Verification Status */}
      {showVerificationAlert && (
        agent?.isActive ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-green-800 text-sm">✓ Agent verified and active</p>
              <button
                onClick={() => setShowVerificationAlert(false)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-yellow-800 text-sm">⚠ Agent verification pending</p>
              <button
                onClick={() => setShowVerificationAlert(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      )}

      {/* Liquidity Alerts */}
      {liquidityAlerts.map((alert, index) => (
        <div 
          key={index}
          className={`border rounded-2xl p-4 ${
            alert.type === 'critical' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-semibold text-sm mb-1 ${
                alert.type === 'critical' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {alert.title}
              </h4>
              <p className={`text-sm ${
                alert.type === 'critical' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {alert.message}
              </p>
              <p className={`text-xs mt-1 font-mono ${
                alert.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                Current balance: {formatCurrency(alert.balance)}
              </p>
            </div>
            <button
              onClick={() => navigate(alert.link)}
              className={`ml-4 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                alert.type === 'critical'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {alert.action} →
            </button>
          </div>
        </div>
      ))}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Balance */}
        <div className="bg-white border border-gray-200 p-8 rounded-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Cash Balance</p>
              <div className="flex items-center space-x-3">
                <p className="text-3xl font-bold text-gray-900 font-mono">
                  {showBalance ? formatCurrency(agent?.cashBalance || 0) : '••••••'}
                </p>
                <button onClick={() => setShowBalance(!showBalance)} className="text-gray-400">
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-2">Earnings</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <button
            onClick={() => navigate('/agents/settlement')}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Withdraw
          </button>
        </div>

        {/* Digital Balance */}
        <div className="bg-white border border-gray-200 p-8 rounded-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Digital Balance</p>
              <div className="flex items-center space-x-3">
                <p className="text-3xl font-bold text-gray-900 font-mono">
                  {showBalance ? formatCurrency(agent?.digitalBalance || 0) : '••••••'}
                </p>
                <button onClick={() => setShowBalance(!showBalance)} className="text-gray-400">
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-2">Operations</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <button
            onClick={() => navigate('/agents/funding')}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Add Funds
          </button>
        </div>

        {/* Bitcoin Balance */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-8 rounded-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Bitcoin Balance</p>
              <div className="flex items-center space-x-3">
                <p className="text-3xl font-bold text-gray-900 font-mono">
                  {showBalance ? `₿${bitcoinBalance.toFixed(8)}` : '••••••'}
                </p>
                <button onClick={() => setShowBalance(!showBalance)} className="text-gray-400">
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-2">Ready for exchange</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Bitcoin className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <button
            onClick={() => navigate('/agents/bitcoin')}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <span className="text-sm font-semibold text-gray-900 block text-center">Customers</span>
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

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Daily Earnings</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">{formatCurrency(dailyEarnings)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-3 rounded-xl">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Transactions</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-3 rounded-xl">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">{customersCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
