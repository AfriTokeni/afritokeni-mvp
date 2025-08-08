import React, { useState } from 'react';
import { 
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Search,
  Filter,
} from 'lucide-react';
import { Transaction, Currency } from '../../types/user_dashboard';



const UserTransactions: React.FC = () => {


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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Search className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Search</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'sent' || transaction.type === 'withdrawal' 
                    ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'sent' || transaction.type === 'withdrawal' ? '-' : '+'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-500' : 
                    transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-500 capitalize">{transaction.status}</span>
                </div>
              </div>
            </div>
            <div className="ml-15 text-xs text-gray-500">
              ID: {transaction.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTransactions;