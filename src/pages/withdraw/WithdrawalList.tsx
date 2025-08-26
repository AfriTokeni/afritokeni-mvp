import React, { useState, useEffect } from 'react';
import { Clock, User, Phone, CreditCard, Search } from 'lucide-react';
import { WithdrawalRequest } from './ProcessWithdrawal';
import { DataService, Transaction } from '../../services/dataService';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { User as UserType } from '../../types/auth';
import { listDocs } from '@junobuild/core';

interface WithdrawalListProps {
  onSelectWithdrawal: (withdrawal: WithdrawalRequest) => void;
}

const WithdrawalList: React.FC<WithdrawalListProps> = ({ onSelectWithdrawal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { agent } = useAfriTokeni();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to convert Transaction to WithdrawalRequest - handles both SMS and web users
  const convertTransactionToWithdrawalRequest = async (transaction: Transaction): Promise<WithdrawalRequest | null> => {
    try {
      // First, try to get user directly by ID (works for web users)
      let user: UserType | null = await DataService.getUserByKey(transaction.userId);
      
      if (!user) {
        // If not found, this might be an SMS user where transaction.userId is the user.id
        // but the user is stored with phone number as key. Search through all users.
        console.log(`User not found by key ${transaction.userId}, searching all users...`);
        
        try {
          // Get all users and find the one with matching ID
          const allUsersResult = await listDocs({
            collection: 'users'
          });
          
          const foundUserDoc = allUsersResult.items.find((doc) => {
            const userData = doc.data as UserType;
            return userData.id === transaction.userId;
          });
          
          if (foundUserDoc) {
            const userData = foundUserDoc.data as UserType;
            user = {
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              userType: userData.userType,
              isVerified: userData.isVerified,
              kycStatus: userData.kycStatus,
              pin: userData.pin,
              createdAt: userData.createdAt ? 
                (userData.createdAt instanceof Date ? userData.createdAt : new Date(userData.createdAt)) : 
                new Date()
            };
            
            console.log(`Found SMS user with ID ${transaction.userId}:`, {
              userId: user.id,
              email: user.email, // This contains the phone number for SMS users
              userType: user.userType
            });
          }
        } catch (searchError) {
          console.error('Error searching all users:', searchError);
        }
      }

      if (!user) {
        console.log(`User not found for transaction ${transaction.id} with userId: ${transaction.userId}`);
        return null;
      }

      // Determine if this is an SMS user by checking if email field contains a phone number
      // For SMS users, the email field contains the phone number
      const isSMSUser = /^\+?[1-9]\d{1,14}$/.test(user.email);
      console.log(`Processing ${isSMSUser ? 'SMS' : 'Web'} user transaction:`, {
        transactionId: transaction.id,
        userId: transaction.userId,
        userEmail: user.email,
        userType: user.userType,
        isSMSUser
      });
      
      // Determine user phone number
      let userPhone: string;
      if (isSMSUser) {
        // For SMS users, the email field contains the phone number
        userPhone = user.email.startsWith('+') ? user.email : `+${user.email}`;
      } else {
        // For web users, email field contains actual email
        userPhone = user.email && user.email.includes('@') ? user.email : (user.email || 'Unknown');
      }

      // Build user name from available data
      let userName: string;
      if (user.firstName && user.lastName) {
        userName = `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        userName = user.firstName;
      } else if (user.lastName) {
        userName = user.lastName;
      } else {
        userName = isSMSUser ? `SMS User (${userPhone})` : 'Unknown User';
      }

      return {
        id: transaction.id,
        userName: userName,
        userPhone: userPhone,
        amount: {
          ugx: transaction.amount,
          usdc: transaction.amount * 0.00026 // Convert to USDT using exchange rate
        },
        withdrawalCode: transaction?.metadata?.withdrawalCode || '', 
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

        console.log(`Pending transactions for agent ${agent.id}:`, pendingTransactions);

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

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDT') => {
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
    <div className="p-4 sm:p-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, or withdrawal code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors duration-200 text-sm sm:text-base"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 sm:px-4 py-2 sm:py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors duration-200 text-sm sm:text-base"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Withdrawal Requests List */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">Loading withdrawal requests...</h3>
            <p className="text-neutral-600 text-sm sm:text-base">Please wait while we fetch the latest requests</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">No withdrawal requests found</h3>
            <p className="text-neutral-600 text-sm sm:text-base">
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
              className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-neutral-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  {/* User Avatar */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">{request.userName}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-neutral-600 mt-1 space-y-1 sm:space-y-0">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{request.userPhone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{getTimeAgo(request.requestedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-base sm:text-lg font-bold text-neutral-900 font-mono">
                    {formatCurrency(request.amount.ugx, 'UGX')}
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-600 mb-2 font-mono">
                    ≈ {formatCurrency(request.amount.usdc, 'USDT')}
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
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm text-neutral-600 space-y-2 sm:space-y-0">
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
