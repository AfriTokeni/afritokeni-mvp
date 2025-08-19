import React, { useState } from 'react';
import { 
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Search,
  Download,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface AgentTransaction {
  id: string;
  customer: string;
  customerPhone: string;
  type: 'deposit' | 'withdrawal' | 'send-money' | 'receive-money';
  amount: {
    ugx: number;
    usdc: number;
  };
  commission: {
    ugx: number;
    usdc: number;
  };
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  location?: string;
  notes?: string;
}

const AgentTransactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'send-money' | 'receive-money'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Mock transaction data
  const [transactions] = useState<AgentTransaction[]>([
    {
      id: 'AGT001',
      customer: 'John Kamau',
      customerPhone: '+256701234567',
      type: 'withdrawal',
      amount: { ugx: 100000, usdc: 26.32 },
      commission: { ugx: 2000, usdc: 0.53 },
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      location: 'Kampala Central',
      notes: 'Regular customer withdrawal'
    },
    {
      id: 'AGT002',
      customer: 'Mary Nakato',
      customerPhone: '+256702345678',
      type: 'deposit',
      amount: { ugx: 75000, usdc: 19.74 },
      commission: { ugx: 1500, usdc: 0.39 },
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      location: 'Nakawa Market'
    },
    {
      id: 'AGT003',
      customer: 'Peter Okello',
      customerPhone: '+256703456789',
      type: 'send-money',
      amount: { ugx: 200000, usdc: 52.63 },
      commission: { ugx: 3000, usdc: 0.79 },
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      location: 'Wandegeya'
    },
    {
      id: 'AGT004',
      customer: 'Sarah Namugga',
      customerPhone: '+256704567890',
      type: 'withdrawal',
      amount: { ugx: 150000, usdc: 39.47 },
      commission: { ugx: 3000, usdc: 0.79 },
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
      location: 'Kampala Central',
      notes: 'Large withdrawal - ID verified'
    },
    {
      id: 'AGT005',
      customer: 'David Mukasa',
      customerPhone: '+256705678901',
      type: 'deposit',
      amount: { ugx: 50000, usdc: 13.16 },
      commission: { ugx: 1000, usdc: 0.26 },
      status: 'failed',
      timestamp: new Date(Date.now() - 1000 * 60 * 240),
      location: 'Ntinda',
      notes: 'Insufficient cash available'
    },
    {
      id: 'AGT006',
      customer: 'Grace Achieng',
      customerPhone: '+256706789012',
      type: 'receive-money',
      amount: { ugx: 80000, usdc: 21.05 },
      commission: { ugx: 1600, usdc: 0.42 },
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 300),
      location: 'Kampala Central'
    }
  ]);

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDC'): string => {
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

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: AgentTransaction['type']): React.ReactElement => {
    switch (type) {
      case 'withdrawal':
        return <Minus className="w-5 h-5 text-red-500" />;
      case 'deposit':
        return <Plus className="w-5 h-5 text-green-500" />;
      case 'send-money':
        return <ArrowUp className="w-5 h-5 text-blue-500" />;
      case 'receive-money':
        return <ArrowDown className="w-5 h-5 text-purple-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: AgentTransaction['status']) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerPhone.includes(searchTerm) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const now = new Date();
      const transactionDate = transaction.timestamp;
      
      switch (dateRange) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const totalCommission = transactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => ({ ugx: acc.ugx + t.commission.ugx, usdc: acc.usdc + t.commission.usdc }), { ugx: 0, usdc: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Agent Transactions</h2>
          <p className="text-gray-600">Track and manage your customer transactions</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-4 h-4" />
          <span className="text-sm">Export</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalCommission.ugx, 'UGX')}</p>
              <p className="text-sm text-gray-500">≈ {formatCurrency(totalCommission.usdc, 'USDC')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{transactions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today&apos;s Count</p>
              <p className="text-2xl font-bold text-gray-800">
                {transactions.filter(t => t.timestamp.toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Customer, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'pending' | 'failed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'deposit' | 'withdrawal' | 'send-money' | 'receive-money')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="send-money">Send Money</option>
              <option value="receive-money">Receive Money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Transactions ({filteredTransactions.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No transactions found matching your filters.</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-gray-800">{transaction.customer}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm text-gray-600">{transaction.customerPhone}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('-', ' ')} • 
                        {formatDate(transaction.timestamp)} • 
                        {transaction.location}
                      </p>
                      {transaction.notes && (
                        <p className="text-xs text-blue-600 mt-1">{transaction.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="mb-2">
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(transaction.amount.ugx, 'UGX')}
                      </p>
                      <p className="text-sm text-gray-500">
                        ≈ {formatCurrency(transaction.amount.usdc, 'USDC')}
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <p className="text-xs text-green-600 font-medium">Commission</p>
                      <p className="text-sm font-semibold text-green-800">
                        +{formatCurrency(transaction.commission.ugx, 'UGX')}
                      </p>
                      <p className="text-xs text-green-600">
                        ≈ +{formatCurrency(transaction.commission.usdc, 'USDC')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">ID: {transaction.id}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentTransactions;
