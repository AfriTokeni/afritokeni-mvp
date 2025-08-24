import React from 'react';
import { 
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Search,
  Filter,
} from 'lucide-react';
import { Transaction } from '../../services/dataService';
import PageLayout from '../../components/PageLayout';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';



const UserTransactions: React.FC = () => {
  const { transactions, isLoading } = useAfriTokeni();

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading transactions...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // No transactions state
  if (!transactions.length) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900">Transaction History</h1>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUp className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No transactions yet</h3>
            <p className="text-neutral-600">Your transaction history will appear here once you start sending or receiving money.</p>
          </div>
        </div>
      </PageLayout>
    );
  }



  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: Transaction['type']): React.ReactElement => {
    switch (type) {
      case 'send':
        return <ArrowUp className="w-5 h-5 text-red-500" />;
      case 'receive':
        return <ArrowDown className="w-5 h-5 text-green-500" />;
      case 'withdraw':
        return <Minus className="w-5 h-5 text-orange-500" />;
      case 'deposit':
        return <Plus className="w-5 h-5 text-blue-500" />;
      default:
        return <ArrowUp className="w-5 h-5" />;
    }
  };

  const getTransactionDescription = (transaction: Transaction): string => {
    if (transaction.description) {
      return transaction.description;
    }

    switch (transaction.type) {
      case 'send':
        return `Sent to ${transaction.recipientName || transaction.recipientPhone || 'recipient'}`;
      case 'receive':
        return 'Money received';
      case 'withdraw':
        return 'Cash withdrawal';
      case 'deposit':
        return 'Cash deposit';
      default:
        return 'Transaction';
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
                    <p className="font-semibold text-neutral-900 mb-1">{getTransactionDescription(transaction)}</p>
                    <div className="flex items-center space-x-4 text-sm text-neutral-600">
                      <span>{formatDate(transaction.createdAt)}</span>
                      <span className="text-xs font-mono text-neutral-500">ID: {transaction.id}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg font-mono mb-1 ${
                    transaction.type === 'send' || transaction.type === 'withdraw' 
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.type === 'send' || transaction.type === 'withdraw' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
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