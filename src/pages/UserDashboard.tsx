import React from 'react';
import { Send, ArrowDown, Plus, Minus, ArrowUp } from 'lucide-react';
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
        <KYCStatusAlert />
        
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <span className="text-neutral-700 font-semibold text-sm">UGX</span>
                  </div>
                  <div>
                    <p className="text-neutral-900 font-medium">Ugandan Shilling</p>
                    <p className="text-neutral-500 text-sm">Primary balance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-semibold text-neutral-900 font-mono">
                    {formatCurrency(balance?.balance || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
              <span className="text-neutral-500 text-sm">Available Balance</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium text-sm">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <span className="text-neutral-700 font-semibold text-sm">USD</span>
                  </div>
                  <div>
                    <p className="text-neutral-900 font-medium">US Dollar Equivalent</p>
                    <p className="text-neutral-500 text-sm">Converted value</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-semibold text-neutral-900 font-mono">
                    ${((balance?.balance || 0) * 0.00026).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
              <span className="text-neutral-500 text-sm">1 USD = 3,846 UGX</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-600 font-medium text-sm">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/users/send')}
              className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
                <Send className="w-6 h-6 text-neutral-600 group-hover:text-blue-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-sm">Send Money</span>
            </button>

            <button 
              onClick={() => navigate('/users/receive')}
              className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-50 group-hover:border-green-100 border border-transparent transition-all duration-200">
                <ArrowDown className="w-6 h-6 text-neutral-600 group-hover:text-green-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-sm">Receive</span>
            </button>

            <button 
              onClick={() => navigate('/users/withdraw')}
              className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-50 group-hover:border-orange-100 border border-transparent transition-all duration-200">
                <Minus className="w-6 h-6 text-neutral-600 group-hover:text-orange-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-sm">Withdraw</span>
            </button>

            <button 
              onClick={() => navigate('/users/deposit')}
              className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-neutral-300"
            >
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-50 group-hover:border-purple-100 border border-transparent transition-all duration-200">
                <Plus className="w-6 h-6 text-neutral-600 group-hover:text-purple-600 transition-colors duration-200" />
              </div>
              <span className="text-neutral-900 font-medium text-sm">Deposit</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-neutral-900">Recent Transactions</h3>
              <button 
                onClick={() => navigate('/users/history')}
                className="text-neutral-600 text-sm font-medium hover:text-neutral-900 transition-colors px-4 py-2 rounded-lg hover:bg-neutral-50"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{transaction.description}</p>
                      <p className="text-sm text-neutral-500">{formatDate(transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg font-mono ${
                      transaction.type === 'send' || transaction.type === 'withdraw' 
                        ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'send' || transaction.type === 'withdraw' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-neutral-500 capitalize">{transaction.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUp className="w-8 h-8 text-neutral-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-2">No transactions yet</h4>
                <p className="text-neutral-500 mb-6">Start by sending money or making a deposit</p>
                <button 
                  onClick={() => navigate('/users/send')}
                  className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
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