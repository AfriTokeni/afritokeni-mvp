import React, { useState } from 'react';
import { 
  Send, 
  MapPin, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import KYCStatusAlert from '../components/KYCStatusAlert';
import PageLayout from '../components/PageLayout';
import { Transaction } from '../services/dataService';



const UserDashboard: React.FC = () => {
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    balance, 
    transactions
  } = useAfriTokeni();


  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: Transaction['type']): React.ReactElement => {
    switch (type) {
      case 'send':
        return <ArrowUp className="w-4 h-4 text-red-500" />;
      case 'receive':
        return <ArrowDown className="w-4 h-4 text-green-500" />;
      case 'withdraw':
        return <Minus className="w-4 h-4 text-orange-500" />;
      case 'deposit':
        return <Plus className="w-4 h-4 text-blue-500" />;
      default:
        return <ArrowUp className="w-4 h-4" />;
    }
  };

  return (
    <PageLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Hello, {user?.firstName || user?.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-gray-300 text-lg">Welcome back to your wallet</p>
            </div>
            <div className="text-right">
              <p className="text-gray-300 text-sm">Total Balance</p>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-3xl md:text-4xl font-bold">
                  {showBalance ? formatCurrency(balance?.balance || 0) : '****'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-300 hover:text-white transition-colors p-1"
                >
                  {showBalance ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Status Alert */}
        <KYCStatusAlert />
        
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">UGX</span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Ugandan Shilling</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    {showBalance ? formatCurrency(balance?.balance || 0) : '****'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Available Balance</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">USD</span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">US Dollar Equivalent</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    {showBalance ? `$${((balance?.balance || 0) * 0.00026).toFixed(2)}` : '****'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Exchange Rate: 1 USD = 3,846 UGX</span>
              <span className="text-blue-600 font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/users/send')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto transition-colors">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 block">Send Money</span>
              <span className="text-xs text-gray-500 mt-1 block">Transfer to anyone</span>
            </button>

            <button 
              onClick={() => navigate('/users/withdraw')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="w-12 h-12 bg-green-50 group-hover:bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto transition-colors">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 block">Find Agents</span>
              <span className="text-xs text-gray-500 mt-1 block">Locate nearby</span>
            </button>

            <button 
              onClick={() => navigate('/users/withdraw')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="w-12 h-12 bg-orange-50 group-hover:bg-orange-100 rounded-xl flex items-center justify-center mb-4 mx-auto transition-colors">
                <Minus className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 block">Withdraw</span>
              <span className="text-xs text-gray-500 mt-1 block">Cash out money</span>
            </button>

            <button 
              onClick={() => navigate('/users/deposit')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto transition-colors">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 block">Deposit</span>
              <span className="text-xs text-gray-500 mt-1 block">Add money</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
              <button 
                onClick={() => navigate('/users/history')}
                className="text-black text-sm font-medium hover:text-gray-700 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt.toISOString())}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'send' || transaction.type === 'withdraw' 
                        ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'send' || transaction.type === 'withdraw' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{transaction.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUp className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h4>
                <p className="text-gray-500 mb-6">Start by sending money or making a deposit</p>
                <button 
                  onClick={() => navigate('/users/send')}
                  className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Send Money
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default UserDashboard;