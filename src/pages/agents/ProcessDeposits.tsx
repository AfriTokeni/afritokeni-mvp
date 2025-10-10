import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, AlertCircle, Search, X } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { formatCurrencyAmount, AfricanCurrency } from '../../types/currency';
import { NotificationService } from '../../services/notificationService';
import { DataService } from '../../services/dataService';
import { useDemoMode } from '../../context/DemoModeContext';
import { AgentDemoDataService } from '../../services/agentDemoDataService';
import { CurrencySelector } from '../../components/CurrencySelector';
import { CkBTCBalanceCard } from '../../components/CkBTCBalanceCard';
import { CkUSDCBalanceCard } from '../../components/CkUSDCBalanceCard';



interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  agentId: string;
  amount: {
    local: number;
    currency: string;
  };
  depositCode: string;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  createdAt: Date;
  userLocation?: string;
}

const ProcessDeposits: React.FC = () => {
  const { user } = useAuthentication();
  const { isDemoMode } = useDemoMode();
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
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

  const loadDepositRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Demo mode - load from demo service
      if (isDemoMode) {
        const demoDeposits = AgentDemoDataService.getPendingDeposits();
        const transformedRequests = demoDeposits
          .map(deposit => ({
            id: deposit.id,
            userId: deposit.userId,
            userName: deposit.userName,
            userPhone: deposit.userPhone,
            agentId: currentAgent?.id || 'demo-agent',
            amount: {
              local: deposit.amount,
              currency: deposit.currency
            },
            depositCode: deposit.code,
            status: deposit.status as 'pending' | 'confirmed' | 'completed' | 'rejected',
            createdAt: deposit.createdAt,
            userLocation: 'Kampala, Uganda'
          }));
        setDepositRequests(transformedRequests);
        setLoading(false);
        return;
      }

      // Real mode
      const userId = user?.agent?.id || user?.user?.id;
      
      if (!userId) {
        console.error('No user ID available');
        setDepositRequests([]);
        setLoading(false);
        return;
      }

      // First, get the agent record for this user to get the actual agent ID
      console.log('🏦 ProcessDeposits - Looking up agent record for user ID:', userId);
      const agentRecord = await DataService.getAgentByUserId(userId);
      
      if (!agentRecord) {
        console.error('No agent record found for user ID:', userId);
        setDepositRequests([]);
        return;
      }
      
      console.log('🏦 ProcessDeposits - Found agent record:', agentRecord);
      const agentId = agentRecord.id;
      
      // Convert filter to status for API call
      const statusFilter = filter === 'all' ? undefined : filter;
      const rawRequests = await DataService.getAgentDepositRequests(agentId, statusFilter);
      
      // Transform the requests to match the component's expected structure
      const transformedRequests = rawRequests.map(request => ({
        ...request,
        amount: {
          local: request.amount,
          currency: request.currency
        },
        createdAt: new Date(request.createdAt),
        userName: request.userName || 'Unknown User',
        userPhone: request.userPhone || 'Unknown Phone',
        userLocation: request.userLocation || 'Unknown Location'
      }));
      
      setDepositRequests(transformedRequests);
    } catch (error) {
      console.error('Error loading deposit requests:', error);
      setDepositRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, filter, isDemoMode, currentAgent]);

  // Load deposit requests for this agent
  useEffect(() => {
    loadDepositRequests();
  }, [loadDepositRequests]);

  const handleVerifyCode = async (request: DepositRequest) => {
    const currentCode = (verificationCodes[request.id] || '').trim().toUpperCase();
    const expectedCode = request.depositCode.trim().toUpperCase();
    
    console.log('🔍 Verifying code:', { 
      currentCode, 
      expectedCode, 
      match: currentCode === expectedCode,
      isDemoMode 
    });
    
    if (currentCode === expectedCode) {
      try {
        // Demo mode - confirm deposit (change status to confirmed)
        if (isDemoMode) {
          AgentDemoDataService.confirmDeposit(request.id);
          setSelectedRequest(request);
          setError('');
          await loadDepositRequests();
          console.log('✅ Demo mode: Code verified, status changed to confirmed');
          return;
        }

        // Real mode - update via DataService
        const success = await DataService.updateDepositRequestStatus(request.id, 'confirmed');
        if (success) {
          setSelectedRequest(request);
          setError('');
          await loadDepositRequests();
        } else {
          setError('Failed to confirm deposit request. Please try again.');
        }
      } catch (error) {
        console.error('Error confirming deposit:', error);
        setError('Failed to confirm deposit request. Please try again.');
      }
    } else {
      setError(`Invalid deposit code. Expected: ${expectedCode}, Got: ${currentCode}`);
    }
  };

  const handleConfirmDeposit = async (request: DepositRequest) => {
    setIsProcessing(true);
    try {
      // Demo mode - approve deposit
      if (isDemoMode) {
        AgentDemoDataService.approveDeposit(request.id);
        await loadDepositRequests();
        setSelectedRequest(null);
        setVerificationCodes(prev => ({ ...prev, [request.id]: '' }));
        setError('');
        setIsProcessing(false);
        console.log('🎭 Demo deposit approved:', request.id);
        return;
      }

      // Real mode
      const userId = user?.agent?.id || user?.user?.id;
      if (!userId) {
        throw new Error('No user ID available');
      }

      // Get the agent record to get the correct agent ID
      console.log('🏦 handleConfirmDeposit - Looking up agent record for user ID:', userId);
      const agentRecord = await DataService.getAgentByUserId(userId);
      
      if (!agentRecord) {
        throw new Error('Agent record not found');
      }
      
      console.log('🏦 handleConfirmDeposit - Found agent record:', agentRecord);
      const agentId = agentRecord.id;

      // Process the deposit using DataService
      console.log('🏦 handleConfirmDeposit - Processing deposit with agentId:', agentId);
      const result = await DataService.processDepositRequest(request.id, agentId, agentId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process deposit');
      }
      
      // Reload deposit requests to reflect the updated status
      await loadDepositRequests();
      
      setSelectedRequest(null);
      setVerificationCodes(prev => ({ ...prev, [request.id]: '' }));
      setError('');
      
      // Send notifications to both agent and user
      try {
        const [agentUser, customerUser] = await Promise.all([
          DataService.getUserByKey(user.agent?.id || user.user?.id || ''),
          DataService.getUserByKey(request.userId)
        ]);

        // Notify agent of successful deposit processing
        if (agentUser) {
          await NotificationService.sendNotification(agentUser, {
            userId: agentUser.id,
            type: 'deposit',
            amount: request.amount.local,
            currency: request.amount.currency,
            transactionId: request.id,
            message: `Deposit processed successfully for ${request.userName}. Commission earned.`
          });
        }

        // Notify customer of deposit confirmation
        if (customerUser) {
          await NotificationService.sendNotification(customerUser, {
            userId: request.userId,
            type: 'deposit',
            amount: request.amount.local,
            currency: request.amount.currency,
            transactionId: request.id,
            message: `Your cash deposit has been confirmed and added to your account.`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send deposit notifications:', notificationError);
      }

      // Show success message
      alert(`Deposit completed! ${formatCurrencyAmount(request.amount.local, request.amount.currency as AfricanCurrency)} credited to ${request.userName}'s account.`);
    } catch (error) {
      console.error('Failed to process deposit:', error);
      setError('Failed to process deposit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectDeposit = async (request: DepositRequest) => {
    setIsProcessing(true);
    try {
      const success = await DataService.updateDepositRequestStatus(request.id, 'rejected');
      
      if (success) {
        // Reload deposit requests to reflect the updated status
        await loadDepositRequests();
        
        setSelectedRequest(null);
        setVerificationCodes(prev => ({ ...prev, [request.id]: '' }));
        setError('');
      } else {
        throw new Error('Failed to update deposit request status');
      }
    } catch (error) {
      console.error('Failed to reject deposit:', error);
      setError('Failed to reject deposit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = depositRequests.filter(request => {
    // Filter by status
    const statusMatch = filter === 'all' || request.status === filter;
    
    // Filter by search query (name or phone)
    const searchMatch = !searchQuery || 
      request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.userPhone.includes(searchQuery);
    
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
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digital Balance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-gray-600">Digital Balance</p>
                <span className="text-xs text-gray-400">Operations</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono">
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-gray-600">Cash Balance</p>
                <span className="text-xs text-gray-400">Earnings</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono">
                {formatCurrencyAmount(
                  isDemoMode 
                    ? (AgentDemoDataService.getDemoAgent()?.cashBalance || 0)
                    : ((currentAgent as any)?.cashBalance || 0),
                  agentCurrency as AfricanCurrency
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ckBTC and ckUSDC Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Error Message - Move to top for visibility */}
      {error && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 shadow-lg">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Verification Failed</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Deposit Process:</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Customer shows you their deposit code</li>
          <li>Verify the code matches the request</li>
          <li>Collect the cash amount from customer</li>
          <li>Complete the deposit to credit their digital balance</li>
          <li>Customer receives confirmation notification</li>
        </ol>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            ⚠️ Always verify the deposit code before accepting cash. Rejected deposits cannot be reversed.
          </p>
        </div>
        {isDemoMode && (
          <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900 font-medium">
              🎭 Demo Mode: For testing, use these codes - John: DEP8BL, Sarah: DEP6CP, David: DEPKY3
            </p>
          </div>
        )}
      </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                  {tab === 'all' ? depositRequests.length : depositRequests.filter(r => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Deposit Requests List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading deposit requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No deposit requests</h3>
                <p className="text-neutral-600">
                  {filter === 'pending' ? 'No pending deposits at the moment.' : `No ${filter} deposits found.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-2xl p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.userName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                          Digital Balance
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 font-mono">
                        {formatCurrencyAmount(request.amount.local, request.amount.currency as AfricanCurrency)}
                      </div>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {!isDemoMode && (
                        <>
                          <span>Deposit Code: </span>
                          <span className="font-mono font-semibold text-gray-900">{request.depositCode}</span>
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
                              placeholder="Enter deposit code"
                              value={verificationCodes[request.id] || ''}
                              onChange={(e) => setVerificationCodes(prev => ({ ...prev, [request.id]: e.target.value }))}
                              className="px-3 py-1 border border-neutral-300 rounded text-sm font-mono"
                              maxLength={6}
                            />
                            <button
                              onClick={() => handleVerifyCode(request)}
                              disabled={!(verificationCodes[request.id] || '')}
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
                            onClick={() => handleConfirmDeposit(request)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-neutral-300 flex items-center space-x-1"
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Complete Deposit</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectDeposit(request)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-neutral-300 flex items-center space-x-1"
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

    </div>
  );
};

export default ProcessDeposits;
