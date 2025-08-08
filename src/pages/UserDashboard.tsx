import React, { useState } from 'react';
import { 
  Send, 
  MapPin, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
} from 'lucide-react';
import { UserData, Transaction, Currency } from '../types/user_dashboard';
import { useNavigate } from 'react-router-dom';



const UserDashboard: React.FC = () => {
  const [showBalance, setShowBalance] = useState<boolean>(true);

  const navigate = useNavigate();
  
  // Mock user data
  const [user] = useState<UserData>({
    name: 'John Kamau',
    phone: '+256701234567',
    balances: {
      UGX: 850000,
      USDC: 245.50
    },
    isVerified: true
  });

  // Mock transaction data
  const [transactions] = useState<Transaction[]>([
    {
      id: 'TXN001',
      type: 'received',
      amount: 50000,
      currency: 'UGX',
      from: '+254700123456',
      date: '2025-08-07T10:30:00Z',
      status: 'completed',
      description: 'From Mary Wanjiku'
    },
    {
      id: 'TXN002',
      type: 'sent',
      amount: 25.50,
      currency: 'USDC',
      to: '+255713456789',
      date: '2025-08-06T15:45:00Z',
      status: 'completed',
      description: 'To Peter Mwangi'
    },
    {
      id: 'TXN003',
      type: 'withdrawal',
      amount: 100000,
      currency: 'UGX',
      agent: 'Agent Sarah - Nakawa Market',
      date: '2025-08-05T12:15:00Z',
      status: 'completed',
      description: 'Cash withdrawal'
    },
    {
      id: 'TXN004',
      type: 'deposit',
      amount: 75.00,
      currency: 'USDC',
      agent: 'Agent John - Kampala Central',
      date: '2025-08-04T09:20:00Z',
      status: 'pending',
      description: 'Cash deposit'
    }
  ]);


  const formatCurrency = (amount: number, currency: Currency): string => {
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
      case 'sent':
        return <ArrowUp className="w-4 h-4 text-red-500" />;
      case 'received':
        return <ArrowDown className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <Minus className="w-4 h-4 text-orange-500" />;
      case 'deposit':
        return <Plus className="w-4 h-4 text-blue-500" />;
      default:
        return <ArrowUp className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm">UGX Balance</p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl md:text-3xl font-bold">
                  {showBalance ? formatCurrency(user.balances.UGX, 'UGX') : '****'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-blue-200 hover:text-white"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <span className="text-xs font-semibold">UGX</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-purple-100 text-sm">USDC Balance</p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl md:text-3xl font-bold">
                  {showBalance ? formatCurrency(user.balances.USDC, 'USDC') : '****'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-purple-200 hover:text-white"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <span className="text-xs font-semibold">USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/users/send')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">Send Money</span>
        </button>

        <button 
          onClick={() => navigate('/users/withdraw')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">Find Agents</span>
        </button>

        <button 
         onClick={() => navigate('/users/withdraw')}
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
            <Minus className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">Withdraw</span>
        </button>

        <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
            <Plus className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">Deposit</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/users/history')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm ${
                  transaction.type === 'sent' || transaction.type === 'withdrawal' 
                    ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'sent' || transaction.type === 'withdrawal' ? '-' : '+'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;