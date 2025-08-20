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
import PageLayout from '../../components/PageLayout';



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
        return <ArrowUp className="w-5 h-5 text-red-500" />;
      case 'received':
        return <ArrowDown className="w-5 h-5 text-green-500" />;
      case 'withdrawal':
        return <Minus className="w-5 h-5 text-orange-500" />;
      case 'deposit':
        return <Plus className="w-5 h-5 text-blue-500" />;
      default:
        return <ArrowUp className="w-5 h-5" />;
    }
  };



  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-neutral-900">Transaction History</h1>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200">
              <Search className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Search</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Filter</span>
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 divide-y divide-neutral-100">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-neutral-50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 mb-1">{transaction.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-neutral-600">
                      <span>{formatDate(transaction.date)}</span>
                      <span className="text-xs font-mono text-neutral-500">ID: {transaction.id}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg font-mono mb-1 ${
                    transaction.type === 'sent' || transaction.type === 'withdrawal' 
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.type === 'sent' || transaction.type === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <div className="flex items-center justify-end space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-500' : 
                      transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs font-medium text-neutral-600 capitalize">{transaction.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default UserTransactions;