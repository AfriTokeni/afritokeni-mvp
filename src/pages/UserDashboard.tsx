import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../context/AuthenticationContext';
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import KYCStatusAlert from '../components/KYCStatusAlert';
import { CurrencySelector } from '../components/CurrencySelector';
import { 
  Send, 
  Bitcoin,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus
} from 'lucide-react';
import { AFRICAN_CURRENCIES, formatCurrencyAmount } from '../types/currency';



const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserCurrency } = useAuthentication();
  const { 
    transactions,
    balance,
    refreshData
  } = useAfriTokeni();

  // Get user's preferred currency or default to UGX
  const currentUser = user.user;
  const userCurrency = currentUser?.preferredCurrency || 'UGX';
  const currencyInfo = AFRICAN_CURRENCIES[userCurrency as keyof typeof AFRICAN_CURRENCIES];

  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, userCurrency as any);
  };

  // Get real balance from datastore
  const getRealBalance = (): number => {
    if (!balance) return 0;
    // Return the balance if it matches the user's currency, otherwise return 0
    return balance.currency === userCurrency ? balance.balance : 0;
  };

  // // Refresh data when dashboard mounts to ensure latest balance
  // useEffect(() => {
  //   if (currentUser?.id) {
  //     console.log('💰 UserDashboard - Refreshing data for user:', currentUser.id);
  //     console.log('💰 UserDashboard - Current balance:', balance);
  //     refreshData();
  //   }
  // }, [currentUser?.id, refreshData, balance]);

  // Also refresh when user navigates back to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser?.id) {
        console.log('💰 UserDashboard - Window focused, refreshing data');
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser?.id, refreshData]);

  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type: string): React.ReactElement => {
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
    <div className="space-y-6">

        {/* KYC Status Alert */}
        <KYCStatusAlert user_type="user" />

        {/* Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-8 rounded-2xl hover:border-gray-300 transition-all">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-sm">{userCurrency}</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-base">{currencyInfo.name}</p>
                    <p className="text-gray-500 text-sm">Primary balance</p>
                  </div>
                </div>
              </div>
              <CurrencySelector 
                currentCurrency={userCurrency}
                onCurrencyChange={(currency) => {
                  updateUserCurrency(currency);
                }}
              />
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 font-mono">
                {formatCurrency(getRealBalance())}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-gray-500 text-sm">Available Balance</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium text-sm">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-8 rounded-2xl hover:border-gray-300 transition-all">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Bitcoin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-base">Bitcoin Balance</p>
                    <p className="text-gray-500 text-sm">Bitcoin wallet</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-4xl font-bold text-gray-900 font-mono">
                    ₿0.00000000
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-gray-500 text-sm">≈ {formatCurrency(0)}</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-orange-600 font-medium text-sm">Bitcoin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/users/deposit')}
              className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-gray-400 transition-all text-center group"
            >
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100 transition-colors">
                <Plus className="w-7 h-7 text-green-600" />
              </div>
              <span className="text-gray-900 font-semibold text-sm">Deposit Cash</span>
              <p className="text-gray-500 text-xs mt-1">Add money via agents</p>
            </button>

            <button 
              onClick={() => navigate('/users/send')}
              className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-gray-400 transition-all text-center group"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                <Send className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-gray-900 font-semibold text-sm">Send Money</span>
              <p className="text-gray-500 text-xs mt-1">Transfer to contacts</p>
            </button>

            <button 
              onClick={() => navigate('/users/withdraw')}
              className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-gray-400 transition-all text-center group"
            >
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-red-100 transition-colors">
                <Minus className="w-7 h-7 text-red-600" />
              </div>
              <span className="text-gray-900 font-semibold text-sm">Withdraw Cash</span>
              <p className="text-gray-500 text-xs mt-1">Get cash from agents</p>
            </button>

            <button 
              onClick={() => navigate('/users/bitcoin')}
              className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-gray-400 transition-all text-center group"
            >
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-100 transition-colors">
                <Bitcoin className="w-7 h-7 text-orange-600" />
              </div>
              <span className="text-gray-900 font-semibold text-sm">Bitcoin Exchange</span>
              <p className="text-gray-500 text-xs mt-1">Convert BTC to cash</p>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
              <button 
                onClick={() => navigate('/users/history')}
                className="text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-neutral-900 text-sm truncate pr-2">{transaction.description}</p>
                          <p className={`font-semibold text-base font-mono flex-shrink-0 ${
                            transaction.type === 'send' || transaction.type === 'withdraw' 
                              ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.type === 'send' || transaction.type === 'withdraw' ? '-' : '+'}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-neutral-500">{formatDate(transaction.createdAt)}</p>
                          <p className="text-xs text-neutral-500 capitalize">{transaction.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 text-sm truncate">{transaction.description}</p>
                        <p className="text-sm text-neutral-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`font-semibold text-sm font-mono ${
                        transaction.type === 'send' || transaction.type === 'withdraw' 
                          ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'send' || transaction.type === 'withdraw' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-neutral-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">No transactions yet</h4>
                <p className="text-neutral-500 mb-4 sm:mb-6 text-sm sm:text-base">Start by sending money or making a deposit</p>
                <button 
                  onClick={() => navigate('/users/send')}
                  className="bg-neutral-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors text-sm sm:text-base"
                >
                  Send Money
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default UserDashboard;