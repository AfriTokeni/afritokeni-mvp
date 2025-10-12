import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, AlertCircle, Minus, Search } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { formatCurrencyAmount, AfricanCurrency } from '../../types/currency';
import { NotificationService } from '../../services/notificationService';
import { DataService, WithdrawalRequest } from '../../services/dataService';
import { useDemoMode } from '../../context/DemoModeContext';
import { AgentDemoDataService } from '../../services/agentDemoDataService';
import { CurrencySelector } from '../../components/CurrencySelector';
import { CkBTCBalanceCard } from '../../components/CkBTCBalanceCard';
import { CkUSDCBalanceCard } from '../../components/CkUSDCBalanceCard';

const ProcessWithdrawals: React.FC = () => {
  const { user } = useAuthentication();
  const { isDemoMode } = useDemoMode();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [verificationCodes, setVerificationCodes] = useState<{[requestId: string]: string}>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('pending');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get agent currency
  const currentAgent = user.agent;
  const agentCurrency = selectedCurrency || (currentAgent as any)?.preferredCurrency || 'UGX';

  // Initialize demo data if needed
  useEffect(() => {
    if (isDemoMode && (currentAgent as any)?.email) {
      AgentDemoDataService.initializeDemoAgent((currentAgent as any).email);
    }
  }, [isDemoMode, currentAgent]);

  const loadWithdrawalRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Demo mode - load from demo service
      if (isDemoMode) {
        const demoWithdrawals = AgentDemoDataService.getPendingWithdrawals();
        const transformedRequests = demoWithdrawals
          .map(withdrawal => ({
            id: withdrawal.id,
            userId: withdrawal.userId,
            userName: withdrawal.userName,
            userPhone: withdrawal.userPhone,
            agentId: currentAgent?.id || 'demo-agent',
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            withdrawalCode: withdrawal.code,
            withdrawalType: withdrawal.withdrawalType,
            status: withdrawal.status as 'pending' | 'confirmed' | 'completed' | 'rejected',
            createdAt: withdrawal.createdAt.toISOString(),
            updatedAt: withdrawal.createdAt.toISOString(),
            userLocation: 'Kampala, Uganda',
            fee: Math.round(withdrawal.amount * 0.02)
          }));
        setWithdrawalRequests(transformedRequests);
        setLoading(false);
        return;
      }

      // Real mode
      const userId = user?.agent?.id || user?.user?.id;
      console.log('🏦 ProcessWithdrawals - Current user:', user);
      console.log('🏦 ProcessWithdrawals - User ID:', userId);
      console.log('🏦 ProcessWithdrawals - Filter:', filter);
      
      if (!userId) {
        console.error('No user ID available');
        setWithdrawalRequests([]);
        setLoading(false);
        return;
      }

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
  }, [user, filter, isDemoMode, currentAgent]);

  // Load withdrawal requests for this agent
  useEffect(() => {
    loadWithdrawalRequests();
  }, [loadWithdrawalRequests]);

  const handleVerifyCode = async (request: WithdrawalRequest) => {
    const currentCode = (verificationCodes[request.id] || '').trim().toUpperCase();
    const expectedCode = request.withdrawalCode.trim().toUpperCase();
    
    console.log('🔍 Verifying withdrawal code:', { 
      currentCode, 
      expectedCode, 
      match: currentCode === expectedCode,
      isDemoMode 
    });
    
    if (currentCode === expectedCode) {
      try {
        // Demo mode - confirm withdrawal (change status to confirmed)
        if (isDemoMode) {
          AgentDemoDataService.confirmWithdrawal(request.id);
          setSelectedRequest(request);
          setError('');
          await loadWithdrawalRequests();
          console.log('✅ Demo mode: Withdrawal code verified, status changed to confirmed');
          return;
        }

        // Real mode - update via DataService
        const success = await DataService.updateWithdrawalRequestStatus(request.id, 'confirmed');
        if (success) {
          setSelectedRequest(request);
          setError('');
          await loadWithdrawalRequests();
        } else {
          setError('Failed to confirm withdrawal request. Please try again.');
        }
      } catch (error) {
        console.error('Error confirming withdrawal:', error);
        setError('Failed to confirm withdrawal request. Please try again.');
      }
    } else {
      setError(`Invalid withdrawal code. Expected: ${expectedCode}, Got: ${currentCode}`);
    }
  };

  const handleConfirmWithdrawal = async (request: WithdrawalRequest) => {
    setIsProcessing(true);
    try {
      // Demo mode - approve withdrawal
      if (isDemoMode) {
        AgentDemoDataService.approveWithdrawal(request.id);
        await loadWithdrawalRequests();
        setSelectedRequest(null);
        setVerificationCodes(prev => ({ ...prev, [request.id]: '' }));
        setError('');
        setIsProcessing(false);
        console.log('🎭 Demo withdrawal approved:', request.id);
        return;
      }

      // Real mode
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
      setVerificationCodes(prev => ({ ...prev, [request.id]: '' }));
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
        setVerificationCodes(prev => ({ ...prev, [request.id]: '' }));
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
    // Filter by status
    const statusMatch = filter === 'all' || request.status === filter;
    
    // Filter by search query (name or phone)
    const searchMatch = !searchQuery || 
      (request.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.userPhone || '').includes(searchQuery);
    
    return statusMatch && searchMatch;
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
        return <Clock className="w-5 h-5 text-gray-500" />;
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
    <div className="space-y-6">
        {/* Balance Cards - Compact on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Digital Balance Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-600">Digital Balance</p>
                  <span className="text-xs text-gray-400">Operations</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">
                  {formatCurrencyAmount(
                    isDemoMode 
                      ? (AgentDemoDataService.getDemoAgent()?.digitalBalance || 0)
                      : ((currentAgent as any)?.digitalBalance || 0),
                    agentCurrency as AfricanCurrency
                  )}
                </p>
              </div>
              <CurrencySelector
                currentCurrency={agentCurrency}
                onCurrencyChange={(currency) => setSelectedCurrency(currency)}
              />
            </div>
          </div>

          {/* Cash Balance Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-600">Cash Balance</p>
                  <span className="text-xs text-gray-400">Earnings</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">
                  {formatCurrencyAmount(
                    isDemoMode 
                      ? (AgentDemoDataService.getDemoAgent()?.cashBalance || 0)
                      : ((currentAgent as any)?.cashBalance || 0),
                    agentCurrency as AfricanCurrency
                  )}
                </p>
              </div>
              <CurrencySelector
                currentCurrency={agentCurrency}
                onCurrencyChange={(currency) => setSelectedCurrency(currency)}
              />
            </div>
          </div>
        </div>

      {/* ckBTC and ckUSDC Balance Cards - Compact on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <CkBTCBalanceCard
          principalId={currentAgent?.id || 'demo-agent'}
          preferredCurrency={agentCurrency}
          showActions={false}
        />
        <CkUSDCBalanceCard
          principalId={currentAgent?.id || 'demo-agent'}
          preferredCurrency={agentCurrency}
          showActions={false}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Withdrawal Process:</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Customer shows you their withdrawal code</li>
          <li>Verify the code matches the request</li>
          <li>Give the cash amount to customer</li>
          <li>Complete the withdrawal to debit their digital balance</li>
          <li>Customer receives confirmation notification</li>
        </ol>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            ⚠️ Always verify the withdrawal code before giving cash. Rejected withdrawals cannot be reversed.
          </p>
        </div>
        {isDemoMode && (
          <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900 font-medium">
              🎭 Demo Mode: For testing, use these codes - Mary: WTH5MA, Peter: WTH9PS, Grace: WTH2GN
            </p>
          </div>
        )}
      </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            {(['all', 'pending', 'confirmed', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filter === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
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
                <p className="text-gray-600">Loading withdrawal requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Minus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No withdrawal requests</h3>
                <p className="text-gray-600">
                  {filter === 'pending' ? 'No pending withdrawals at the moment.' : `No ${filter} withdrawals found.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-gray-900">{request.userName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
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
                      <div className="flex items-center justify-end gap-2 mb-1">
                        {request.withdrawalType === 'ckbtc' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                            ckBTC
                          </span>
                        )}
                        {request.withdrawalType === 'ckusdc' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            ckUSDC
                          </span>
                        )}
                        {(!request.withdrawalType || request.withdrawalType === 'digital_balance') && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                            Digital Balance
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        -{formatCurrencyAmount(request.amount, request.currency as AfricanCurrency)}
                      </p>
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

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {!isDemoMode && (
                        <>
                          <span>Withdrawal Code: </span>
                          <span className="font-mono font-semibold text-gray-900">{request.withdrawalCode}</span>
                        </>
                      )}
                      <span className={!isDemoMode ? "ml-4" : ""}>
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
                              value={verificationCodes[request.id] || ''}
                              onChange={(e) => setVerificationCodes(prev => ({ ...prev, [request.id]: e.target.value }))}
                              className="px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                              maxLength={6}
                            />
                            <button
                              onClick={() => handleVerifyCode(request)}
                              disabled={!(verificationCodes[request.id] || '')}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
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
                            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300 flex items-center space-x-1"
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
                            className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300 flex items-center space-x-1"
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

    </div>
  );
};

export default ProcessWithdrawals;