import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, AlertCircle, Minus } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { formatCurrencyAmount, AfricanCurrency } from '../../types/currency';
import { NotificationService } from '../../services/notificationService';
import { DataService, WithdrawalRequest } from '../../services/dataService';

const ProcessWithdrawals: React.FC = () => {
  const { user } = useAuthentication();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('pending');

  const loadWithdrawalRequests = useCallback(async () => {
    const userId = user?.agent?.id || user?.user?.id;
    console.log('🏦 ProcessWithdrawals - Current user:', user);
    console.log('🏦 ProcessWithdrawals - User ID:', userId);
    console.log('🏦 ProcessWithdrawals - Filter:', filter);
    
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    setLoading(true);
    try {
      // First, get the agent record for this user to get the actual agent ID
      console.log('🏦 ProcessWithdrawals - Looking up agent record for user ID:', userId);
      const agentRecord = await DataService.getAgentByUserId(userId);
      
      if (!agentRecord) {
        console.error('No agent record found for user ID:', userId);
        setWithdrawalRequests([]);
        return;
      }
      
      console.log('🏦 ProcessWithdrawals - Found agent record:', agentRecord);
      const agentId = agentRecord.id;
      
      // Convert filter to status for API call
      const statusFilter = filter === 'all' ? undefined : filter;
      console.log('🏦 ProcessWithdrawals - Calling getAgentWithdrawalRequests with:', { agentId, statusFilter });
      const rawRequests = await DataService.getAgentWithdrawalRequests(agentId, statusFilter);
      console.log('🏦 ProcessWithdrawals - Raw requests received:', rawRequests);
      
      // Use the requests as-is since they already match the WithdrawalRequest interface
      setWithdrawalRequests(rawRequests);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      setWithdrawalRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  // Load withdrawal requests for this agent
  useEffect(() => {
    loadWithdrawalRequests();
  }, [loadWithdrawalRequests]);

  const handleVerifyCode = async (request: WithdrawalRequest) => {
    if (verificationCode === request.withdrawalCode) {
      try {
        // Update request status to confirmed
        const success = await DataService.updateWithdrawalRequestStatus(request.id, 'confirmed');
        if (success) {
          setSelectedRequest(request);
          setError('');
          // Reload to show updated status
          await loadWithdrawalRequests();
        } else {
          setError('Failed to confirm withdrawal request. Please try again.');
        }
      } catch (error) {
        console.error('Error confirming withdrawal:', error);
        setError('Failed to confirm withdrawal request. Please try again.');
      }
    } else {
      setError('Invalid withdrawal code. Please check and try again.');
    }
  };

  const handleConfirmWithdrawal = async (request: WithdrawalRequest) => {
    setIsProcessing(true);
    try {
      const userId = user?.agent?.id || user?.user?.id;
      if (!userId) {
        throw new Error('No user ID available');
      }

      // Get the agent record to get the correct agent ID
      console.log('🏦 handleConfirmWithdrawal - Looking up agent record for user ID:', userId);
      const agentRecord = await DataService.getAgentByUserId(userId);
      
      if (!agentRecord) {
        throw new Error('Agent record not found');
      }
      
      console.log('🏦 handleConfirmWithdrawal - Found agent record:', agentRecord);
      const agentId = agentRecord.id;

      // Process the withdrawal using DataService
      console.log('🏦 handleConfirmWithdrawal - Processing withdrawal with agentId:', agentId);
      const result = await DataService.processWithdrawalRequest(request.id, agentId, agentId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process withdrawal');
      }
      
      // Reload withdrawal requests to reflect the updated status
      await loadWithdrawalRequests();
      
      setSelectedRequest(null);
      setVerificationCode('');
      setError('');
      
      // Send notifications to both agent and user
      try {
        const [agentUser, customerUser] = await Promise.all([
          DataService.getUserByKey(user.agent?.id || user.user?.id || ''),
          DataService.getUserByKey(request.userId)
        ]);

        // Notify agent of successful withdrawal processing
        if (agentUser) {
          await NotificationService.sendNotification(agentUser, {
            userId: agentUser.id,
            type: 'withdrawal',
            amount: request.amount,
            currency: request.currency,
            transactionId: request.id,
            message: `Withdrawal processed successfully for ${request.userName}. Commission earned.`
          });
        }

        // Notify customer of withdrawal confirmation
        if (customerUser) {
          await DataService.createTransaction({
            userId: request.userId,
            amount: request.amount,
            currency: 'UGX',
            status: 'completed',
            type: 'withdraw',
            agentId: user.agent?.id || '',
            description: `Withdrawal completed by agent ${user.agent?.firstName || 'Unknown'} ${user.agent?.lastName || 'Agent'}`
          });

          // Note: We'll add notification creation when the method is implemented in DataService
        }
      } catch (notificationError) {
        console.error('Failed to send withdrawal notifications:', notificationError);
      }

      // Show success message
      alert(`Withdrawal completed! ${formatCurrencyAmount(request.amount, request.currency as AfricanCurrency)} debited from ${request.userName}'s account.`);
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
      setError('Failed to process withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectWithdrawal = async (request: WithdrawalRequest) => {
    setIsProcessing(true);
    try {
      const success = await DataService.updateWithdrawalRequestStatus(request.id, 'rejected');
      
      if (success) {
        // Reload withdrawal requests to reflect the updated status
        await loadWithdrawalRequests();
        
        setSelectedRequest(null);
        setVerificationCode('');
        setError('');
      } else {
        throw new Error('Failed to update withdrawal request status');
      }
    } catch (error) {
      console.error('Failed to reject withdrawal:', error);
      setError('Failed to reject withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = withdrawalRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-yellow-500" />;
      case 'confirmed':
        return <AlertCircle className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Process Withdrawals</h1>
          <p className="text-sm md:text-base text-gray-600">Manage customer cash withdrawals and digital balance debits</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="overflow-x-auto">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4 md:mb-6 min-w-max">
              {(['all', 'pending', 'confirmed', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-shrink-0 py-2 px-3 md:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    filter === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-1 sm:ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded-full">
                    {tab === 'all' ? withdrawalRequests.length : withdrawalRequests.filter(r => r.status === tab).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Requests List */}
          <div className="space-y-3 md:space-y-4">
            {loading ? (
              <div className="text-center py-8 md:py-12">
                <div className="animate-spin w-6 h-6 md:w-8 md:h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3 md:mb-4"></div>
                <p className="text-sm md:text-base text-gray-600">Loading withdrawal requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Minus className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No withdrawal requests</h3>
                <p className="text-sm md:text-base text-gray-600">
                  {filter === 'pending' ? 'No pending withdrawals at the moment.' : `No ${filter} withdrawals found.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-xl md:rounded-lg p-3 md:p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{request.userName}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs md:text-sm text-gray-600 space-y-1 sm:space-y-0">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">{request.userPhone}</span>
                          </div>
                          {request.userLocation && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              <span className="truncate">{request.userLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg md:text-2xl font-bold text-red-600 font-mono">
                        -{formatCurrencyAmount(request.amount, request.currency as AfricanCurrency)}
                      </div>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </div>
                      {request.fee > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Fee: {formatCurrencyAmount(request.fee, request.currency as AfricanCurrency)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="text-xs md:text-sm text-gray-600">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                        <div>
                          <span>Withdrawal Code: </span>
                          <span className="font-mono font-semibold text-gray-900">{request.withdrawalCode}</span>
                        </div>
                        <div className="text-gray-500">
                          {new Date(request.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                      {request.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Enter withdrawal code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="flex-1 sm:w-auto px-2 md:px-3 py-1 border border-gray-300 rounded text-xs md:text-sm font-mono"
                            maxLength={6}
                          />
                          <button
                            onClick={() => handleVerifyCode(request)}
                            disabled={!verificationCode}
                            className="px-2 md:px-3 py-1 bg-blue-600 text-white rounded text-xs md:text-sm hover:bg-blue-700 disabled:bg-gray-300 whitespace-nowrap"
                          >
                            Verify
                          </button>
                        </div>
                      )}

                      {request.status === 'confirmed' && selectedRequest?.id === request.id && (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() => handleConfirmWithdrawal(request)}
                            disabled={isProcessing}
                            className="px-3 md:px-4 py-2 bg-red-600 text-white rounded text-xs md:text-sm hover:bg-red-700 disabled:bg-gray-300 flex items-center justify-center space-x-1"
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Complete Withdrawal</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(request)}
                            disabled={isProcessing}
                            className="px-3 md:px-4 py-2 bg-gray-600 text-white rounded text-xs md:text-sm hover:bg-gray-700 disabled:bg-gray-300 flex items-center justify-center space-x-1"
                          >
                            <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl md:rounded-lg p-3 md:p-4">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs md:text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl md:rounded-lg p-4 md:p-6">
          <h3 className="font-semibold text-orange-900 mb-3 text-sm md:text-base">Withdrawal Process:</h3>
          <ol className="text-xs md:text-sm text-orange-800 space-y-1.5 md:space-y-2 list-decimal list-inside">
            <li>Customer shows you their withdrawal code</li>
            <li>Verify the code matches the request</li>
            <li>Provide the cash amount to customer</li>
            <li>Complete the withdrawal to debit their digital balance</li>
            <li>Customer receives confirmation notification</li>
          </ol>
          <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-orange-100 rounded-lg">
            <p className="text-xs md:text-sm text-orange-900 font-medium">
              ⚠️ Always verify the withdrawal code before providing cash. Rejected withdrawals cannot be reversed.
            </p>
          </div>
        </div>
    </div>
  );
};

export default ProcessWithdrawals;