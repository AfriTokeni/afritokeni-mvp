import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, AlertCircle, Minus, DollarSign } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
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
  const [initializingBalance, setInitializingBalance] = useState(false);

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

  const handleInitializeMyBalance = async () => {
    setInitializingBalance(true);
    try {
      const userId = user?.agent?.id || user?.user?.id;
      if (!userId) {
        throw new Error('No user ID available');
      }

      // Get the agent record to get the correct agent ID
      const agentRecord = await DataService.getAgentByUserId(userId);
      if (!agentRecord) {
        throw new Error('Agent record not found');
      }

      console.log(`🏦 Current agent balance: ${agentRecord.cashBalance.toLocaleString()} UGX`);
      
      // Set balance to 25,000,000 UGX (the amount from environment variable)
      const newBalance = 25000000;
      const success = await DataService.updateAgentBalance(agentRecord.id, {
        cashBalance: newBalance
      });

      if (success) {
        console.log(`✅ Updated agent cash balance to ${newBalance.toLocaleString()} UGX`);
        alert(`✅ Agent cash balance updated to ${newBalance.toLocaleString()} UGX! You can now process withdrawals.`);
        
        // Reload withdrawal requests to refresh any UI that might depend on agent balance
        await loadWithdrawalRequests();
      } else {
        throw new Error('Failed to update agent balance');
      }
    } catch (error) {
      console.error('Failed to initialize agent balance:', error);
      alert(`❌ Failed to initialize agent balance: ${error}`);
    } finally {
      setInitializingBalance(false);
    }
  };

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
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-500" />;
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
        return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-neutral-900">Process Withdrawals</h1>
            <button
              onClick={handleInitializeMyBalance}
              disabled={initializingBalance}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center text-sm"
            >
              {initializingBalance ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Set My Cash Balance (25M UGX)
                </>
              )}
            </button>
          </div>
          <p className="text-neutral-600">Manage customer cash withdrawals and digital balance debits</p>
          {!initializingBalance && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                💡 <strong>Need cash balance?</strong> If withdrawals fail due to insufficient agent cash balance, 
                click the &ldquo;Set My Cash Balance&rdquo; button above to initialize your account with 25,000,000 UGX.
              </p>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 mb-6">
            {(['all', 'pending', 'confirmed', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filter === tab
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                  {tab === 'all' ? withdrawalRequests.length : withdrawalRequests.filter(r => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Withdrawal Requests List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading withdrawal requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Minus className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No withdrawal requests</h3>
                <p className="text-neutral-600">
                  {filter === 'pending' ? 'No pending withdrawals at the moment.' : `No ${filter} withdrawals found.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{request.userName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{request.userPhone}</span>
                          </div>
                          {request.userLocation && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{request.userLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600 font-mono">
                        -{formatCurrencyAmount(request.amount, request.currency as AfricanCurrency)}
                      </div>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </div>
                      {request.fee > 0 && (
                        <div className="text-xs text-neutral-500 mt-1">
                          Fee: {formatCurrencyAmount(request.fee, request.currency as AfricanCurrency)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-600">
                      <span>Withdrawal Code: </span>
                      <span className="font-mono font-semibold text-neutral-900">{request.withdrawalCode}</span>
                      <span className="ml-4">
                        {new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="Enter withdrawal code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              className="px-3 py-1 border border-neutral-300 rounded text-sm font-mono"
                              maxLength={6}
                            />
                            <button
                              onClick={() => handleVerifyCode(request)}
                              disabled={!verificationCode}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-neutral-300"
                            >
                              Verify
                            </button>
                          </div>
                        </>
                      )}

                      {request.status === 'confirmed' && selectedRequest?.id === request.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConfirmWithdrawal(request)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-neutral-300 flex items-center space-x-1"
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Complete Withdrawal</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(request)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-neutral-600 text-white rounded text-sm hover:bg-neutral-700 disabled:bg-neutral-300 flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="font-semibold text-orange-900 mb-3">Withdrawal Process:</h3>
          <ol className="text-sm text-orange-800 space-y-2 list-decimal list-inside">
            <li>Customer shows you their withdrawal code</li>
            <li>Verify the code matches the request</li>
            <li>Provide the cash amount to customer</li>
            <li>Complete the withdrawal to debit their digital balance</li>
            <li>Customer receives confirmation notification</li>
          </ol>
          <div className="mt-4 p-3 bg-orange-100 rounded-lg">
            <p className="text-sm text-orange-900 font-medium">
              ⚠️ Always verify the withdrawal code before providing cash. Rejected withdrawals cannot be reversed.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProcessWithdrawals;