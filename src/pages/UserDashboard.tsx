import React from 'react';
import { Send, ArrowDown, Plus, Minus, ArrowUp, Bitcoin, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import KYCStatusAlert from '../components/KYCStatusAlert';
import PageLayout from '../components/PageLayout';
import { Transaction } from '../services/dataService';



const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
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
    <PageLayout>
      <div className="space-y-8">

        {/* KYC Status Alert */}
        <KYCStatusAlert user_type="user" />

        {/* Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white border border-neutral-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <span className="text-neutral-700 font-semibold text-xs sm:text-sm">UGX</span>
                  </div>
                  <div>
                    <p className="text-neutral-900 font-medium text-sm sm:text-base">Ugandan Shilling</p>
                    <p className="text-neutral-500 text-xs sm:text-sm">Primary balance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl sm:text-2xl font-semibold text-neutral-900 font-mono">
                    {formatCurrency(balance?.balance || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-neutral-100">
              <span className="text-neutral-500 text-xs sm:text-sm">Available Balance</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium text-sm">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Bitcoin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-neutral-900 font-medium text-sm sm:text-base">Bitcoin Balance</p>
                    <p className="text-neutral-600 text-xs sm:text-sm">Real Bitcoin wallet</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl sm:text-2xl font-semibold text-neutral-900 font-mono">
                    ₿0.00000000
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-orange-100">
              <span className="text-neutral-600 text-xs sm:text-sm">≈ UGX 0</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-orange-600 font-medium text-sm">Bitcoin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <button 
              onClick={() => navigate('/users/send')}
              className="bg-white border border-neutral-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600 group-hover:text-blue-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-xs sm:text-sm">Send Money</span>
            </button>

            <button 
              onClick={() => navigate('/users/receive')}
              className="bg-white border border-neutral-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-green-50 group-hover:border-green-100 border border-transparent transition-all duration-200">
                <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600 group-hover:text-green-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-xs sm:text-sm">Receive</span>
            </button>

            <button 
              onClick={() => navigate('/users/withdraw')}
              className="bg-white border border-neutral-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-orange-50 group-hover:border-orange-100 border border-transparent transition-all duration-200">
                <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600 group-hover:text-orange-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-xs sm:text-sm">Withdraw</span>
            </button>

            <button 
              onClick={() => navigate('/users/deposit')}
              className="bg-white border border-neutral-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-purple-50 group-hover:border-purple-100 border border-transparent transition-all duration-200">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600 group-hover:text-purple-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-xs sm:text-sm">Deposit</span>
            </button>

            <button 
              onClick={() => navigate('/users/bitcoin')}
              className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-orange-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-orange-200 border border-transparent transition-all duration-200">
                <Bitcoin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 group-hover:text-orange-700 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-xs sm:text-sm">Bitcoin</span>
            </button>

            <button 
              onClick={() => navigate('/users/exchange')}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-blue-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-200 border border-transparent transition-all duration-200">
                <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-xs sm:text-sm">Exchange</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="p-4 sm:p-6 border-b border-neutral-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">Recent Transactions</h3>
              <button 
                onClick={() => navigate('/users/history')}
                className="text-neutral-600 text-xs sm:text-sm font-medium hover:text-neutral-900 transition-colors px-2 sm:px-4 py-2 rounded-lg hover:bg-neutral-50"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="p-3 sm:p-4 md:p-6 hover:bg-neutral-50 transition-colors">
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
                          <p className="text-xs text-neutral-500">{formatDate(transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt)}</p>
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
                        <p className="text-sm text-neutral-500">{formatDate(transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt)}</p>
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
    </PageLayout>
  );
};

export default UserDashboard;