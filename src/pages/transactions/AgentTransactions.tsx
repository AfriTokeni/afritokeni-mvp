import React from 'react';
import { 
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Search,
  Bitcoin,
} from 'lucide-react';
// Transaction type is imported via normalizeTransaction utility
import PageLayout from '../../components/PageLayout';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { BitcoinService } from '../../services/bitcoinService';
import { formatDate } from '../../utils/transactionUtils';

const AgentTransactions: React.FC = () => {
  const { agentTransactions, isLoading, agent } = useAfriTokeni();
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [bitcoinTransactions, setBitcoinTransactions] = React.useState<Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    type: 'buy' | 'sell';
    amount: number;
    currency: string;
    bitcoinAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: Date;
    location?: string;
    exchangeRate: number;
    agentFee?: number;
    description?: string;
  }>>([]);
  const [loadingBitcoin, setLoadingBitcoin] = React.useState(false);

  // Combined transaction type
  type CombinedTransaction = {
    id: string;
    type: string;
    status: string;
    createdAt: Date;
    description?: string;
    amount?: number;
    source: 'regular' | 'bitcoin';
    displayAmount: string;
    commission: string;
    customerName?: string;
    customerPhone?: string;
  };

  // Load Bitcoin transactions when agent is available
  React.useEffect(() => {
    if (agent?.id) {
      setLoadingBitcoin(true);
      BitcoinService.getAgentBitcoinTransactions(agent.id)
        .then(btcTxs => {
          setBitcoinTransactions(btcTxs);
        })
        .catch(error => {
          console.error('Error loading Bitcoin transactions:', error);
          setBitcoinTransactions([]);
        })
        .finally(() => {
          setLoadingBitcoin(false);
        });
    }
  }, [agent?.id]);

  const itemsPerPage = 10;

  const formatCurrency = (amount: number): string => {
    return `UGX ${amount.toLocaleString()}`;
  };

  const getTransactionIcon = (type: string, source?: string) => {
    if (source === 'bitcoin') {
      return <Bitcoin className="h-5 w-5 text-orange-500" />;
    }
    
    switch (type) {
      case 'send':
        return <ArrowUp className="h-5 w-5 text-red-500" />;
      case 'receive':
        return <ArrowDown className="h-5 w-5 text-green-500" />;
      case 'withdraw':
        return <Minus className="h-5 w-5 text-blue-500" />;
      case 'deposit':
        return <Plus className="h-5 w-5 text-purple-500" />;
      case 'buy':
        return <Bitcoin className="h-5 w-5 text-green-600" />;
      case 'sell':
        return <Bitcoin className="h-5 w-5 text-red-600" />;
      default:
        return <Plus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'send':
        return 'text-red-600 bg-red-100';
      case 'receive':
        return 'text-green-600 bg-green-100';
      case 'withdraw':
        return 'text-blue-600 bg-blue-100';
      case 'deposit':
        return 'text-purple-600 bg-purple-100';
      case 'buy':
        return 'text-green-600 bg-green-100';
      case 'sell':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Combine regular and Bitcoin transactions
  const allTransactions = React.useMemo((): CombinedTransaction[] => {
    const regular: CombinedTransaction[] = (agentTransactions || []).map(tx => ({
      ...tx,
      source: 'regular' as const,
      displayAmount: `UGX ${tx.amount.toLocaleString()}`,
      commission: `UGX ${Math.round(tx.amount * 0.02).toLocaleString()}`
    }));

    const bitcoin: CombinedTransaction[] = bitcoinTransactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      status: tx.status,
      createdAt: tx.createdAt,
      description: tx.description,
      source: 'bitcoin' as const,
      displayAmount: `${tx.bitcoinAmount} sats`,
      commission: tx.agentFee ? `UGX ${tx.agentFee.toLocaleString()}` : '0 UGX',
      customerName: tx.customerName,
      customerPhone: tx.customerPhone
    }));

    return [...regular, ...bitcoin].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [agentTransactions, bitcoinTransactions]);

  // Filter transactions based on search term and filters
  const filteredTransactions = React.useMemo(() => {
    return allTransactions.filter((transaction) => {
      const description = transaction.description || '';
      const transactionId = transaction.id || '';
      const customerName = transaction.customerName || '';
      
      const matchesSearch = 
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allTransactions, searchTerm, statusFilter, typeFilter]);

  // Normalize transactions to ensure consistent data structure (skip for combined transactions)
  const normalizedTransactions = React.useMemo(() => {
    // For combined transactions, we don't need to normalize since we already have proper structure
    return filteredTransactions;
  }, [filteredTransactions]);

  // Calculate pagination
  const totalPages = Math.ceil(normalizedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = normalizedTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  if (isLoading || loadingBitcoin) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-48 sm:h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Agent Transaction History</h1>
        
        {/* Search and Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="send">Send</option>
              <option value="receive">Receive</option>
              <option value="withdraw">Withdraw</option>
              <option value="deposit">Deposit</option>
              <option value="buy">Bitcoin Buy</option>
              <option value="sell">Bitcoin Sell</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {currentTransactions.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No transactions found</h3>
              <p className="text-sm sm:text-base text-gray-500">
                {agentTransactions?.length === 0 
                  ? "You haven't made any transactions yet."
                  : "No transactions match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                              {getTransactionIcon(transaction.type, transaction.source)}
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 break-words leading-5">
                                {transaction.description || 
                                 (transaction.customerName ? `${transaction.customerName} - Bitcoin ${transaction.type}` : 'Transaction')}
                              </div>
                              <div className="text-xs text-gray-500 break-all mt-1">
                                ID: {transaction.id}
                              </div>
                              {transaction.source === 'bitcoin' && transaction.customerPhone && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Customer: {transaction.customerPhone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                            {transaction.source === 'bitcoin' ? `Bitcoin ${transaction.type}` : transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.displayAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.commission && (
                            <div className="text-green-600 font-semibold">
                              +{transaction.commission}
                            </div>
                          )}
                          <div className="text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {currentTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.type, transaction.source)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Transaction Description - Full text with wrapping */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900 leading-5 break-words">
                            {transaction.description || 
                             (transaction.customerName ? `${transaction.customerName} - Bitcoin ${transaction.type}` : 'Transaction')}
                          </p>
                          {transaction.source === 'bitcoin' && transaction.customerPhone && (
                            <p className="text-xs text-gray-500 mt-1">
                              Customer: {transaction.customerPhone}
                            </p>
                          )}
                        </div>
                        
                        {/* Amount - Prominent display */}
                        <div className="mb-3">
                          <p className="text-base font-semibold text-gray-900">
                            {transaction.displayAmount}
                          </p>
                          {transaction.commission && (
                            <p className="text-sm text-green-600 font-semibold">
                              Commission: +{transaction.commission}
                            </p>
                          )}
                        </div>
                        
                        {/* Transaction ID - Full display with background */}
                        <div className="bg-gray-50 rounded-md px-2 py-1 mb-3">
                          <p className="text-xs text-gray-500 break-all">
                            ID: {transaction.id}
                          </p>
                        </div>
                        
                        {/* Type, Status, and Date */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                              {transaction.type}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Responsive Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-3 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto relative inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs sm:text-sm text-gray-700 text-center">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto relative inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default AgentTransactions;