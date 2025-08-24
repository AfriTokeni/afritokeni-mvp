import React, { useState, useEffect } from 'react';
import { Clock, User, Phone, CreditCard, Search } from 'lucide-react';
import { WithdrawalRequest } from './ProcessWithdrawal';
import { DataService, Transaction } from '../../services/dataService';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';

interface WithdrawalListProps {
  onSelectWithdrawal: (withdrawal: WithdrawalRequest) => void;
}

const WithdrawalList: React.FC<WithdrawalListProps> = ({ onSelectWithdrawal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { agent } = useAfriTokeni();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to convert Transaction to WithdrawalRequest
  const convertTransactionToWithdrawalRequest = async (transaction: Transaction): Promise<WithdrawalRequest | null> => {
    try {
      // Get user details for the withdrawal request
      const user = await DataService.getWebUserById(transaction.userId);
      if (!user) return null;

      return {
        id: transaction.id,
        userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        userPhone: user.email || 'Unknown', // Using email as phone since that's what's available
        amount: {
          ugx: transaction.amount,
          usdc: transaction.amount * 0.00026 // Convert to USDC using exchange rate
        },
        withdrawalCode: (transaction as { withdrawalCode?: string }).withdrawalCode || '', // Type assertion for withdrawalCode
        requestedAt: transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt),
        status: transaction.status as 'pending' | 'verified' | 'approved' | 'completed' | 'rejected',
        userNationalId: 'N/A', // Not available in User type
        location: 'N/A' // Not available in User type
      };
    } catch (error) {
      console.error('Error converting transaction:', error);
      return null;
    }
  };

  // Fetch real withdrawal requests
  useEffect(() => {
    const fetchWithdrawalRequests = async () => {
      if (!agent?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get pending withdrawals for this agent
        const pendingTransactions = await DataService.getPendingWithdrawals(agent.id);
        
        // Convert transactions to withdrawal requests
        const withdrawalRequestPromises = pendingTransactions.map(convertTransactionToWithdrawalRequest);
        const withdrawalRequestsResults = await Promise.all(withdrawalRequestPromises);
        
        // Filter out null results
        const validWithdrawalRequests = withdrawalRequestsResults.filter(
          (request): request is WithdrawalRequest => request !== null
        );
        
        setWithdrawalRequests(validWithdrawalRequests);
      } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
        setWithdrawalRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalRequests();
  }, [agent?.id]);

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDC') => {
    if (currency === 'UGX') {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'verified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const filteredRequests = withdrawalRequests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userPhone.includes(searchTerm) ||
                         request.withdrawalCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, or withdrawal code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors duration-200"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors duration-200"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Withdrawal Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CreditCard className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Loading withdrawal requests...</h3>
            <p className="text-neutral-600">Please wait while we fetch the latest requests</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No withdrawal requests found</h3>
            <p className="text-neutral-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Withdrawal requests will appear here when customers make requests'
              }
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => onSelectWithdrawal(request)}
              className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-neutral-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* User Avatar */}
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-neutral-600" />
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">{request.userName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{request.userPhone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeAgo(request.requestedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="text-right">
                  <div className="text-lg font-bold text-neutral-900 font-mono">
                    {formatCurrency(request.amount.ugx, 'UGX')}
                  </div>
                  <div className="text-sm text-neutral-600 mb-2 font-mono">
                    ≈ {formatCurrency(request.amount.usdc, 'USDC')}
                  </div>
                  
                  {/* Withdrawal Code */}
                  <div className="text-xs text-neutral-500 mb-2">
                    Code: <span className="font-mono font-semibold">{request.withdrawalCode}</span>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredRequests.length > 0 && (
        <div className="mt-6 pt-4 border-t border-neutral-200">
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Showing {filteredRequests.length} withdrawal request{filteredRequests.length !== 1 ? 's' : ''}</span>
            <span className="font-mono font-semibold">
              Total: {formatCurrency(
                filteredRequests.reduce((sum, req) => sum + req.amount.ugx, 0), 
                'UGX'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalList;
