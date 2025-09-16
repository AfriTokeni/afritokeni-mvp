import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { useAuthentication } from '../../context/AuthenticationContext';
import { formatCurrencyAmount, AfricanCurrency } from '../../types/currency';
import { NotificationService } from '../../services/notificationService';
import { DataService } from '../../services/dataService';



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
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('pending');

  const loadDepositRequests = useCallback(async () => {
    const agentId = user?.agent?.id || user?.user?.id;
    if (!agentId) {
      console.error('No agent user ID available');
      return;
    }

    setLoading(true);
    try {
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
  }, [user, filter]);

  // Load deposit requests for this agent
  useEffect(() => {
    loadDepositRequests();
  }, [loadDepositRequests]);

  const handleVerifyCode = async (request: DepositRequest) => {
    if (verificationCode === request.depositCode) {
      try {
        // Update request status to confirmed
        const success = await DataService.updateDepositRequestStatus(request.id, 'confirmed');
        if (success) {
          setSelectedRequest(request);
          setError('');
          // Reload to show updated status
          await loadDepositRequests();
        } else {
          setError('Failed to confirm deposit request. Please try again.');
        }
      } catch (error) {
        console.error('Error confirming deposit:', error);
        setError('Failed to confirm deposit request. Please try again.');
      }
    } else {
      setError('Invalid deposit code. Please check and try again.');
    }
  };

  const handleConfirmDeposit = async (request: DepositRequest) => {
    setIsProcessing(true);
    try {
      const agentId = user?.agent?.id || user?.user?.id;
      if (!agentId) {
        throw new Error('No agent ID available');
      }

      // Process the deposit using DataService
      const result = await DataService.processDepositRequest(request.id, agentId, agentId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process deposit');
      }
      
      // Reload deposit requests to reflect the updated status
      await loadDepositRequests();
      
      setSelectedRequest(null);
      setVerificationCode('');
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
        setVerificationCode('');
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
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Process Deposits</h1>
          <p className="text-neutral-600">Manage customer cash deposits and digital balance credits</p>
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
                      <div className="text-2xl font-bold text-neutral-900 font-mono">
                        {formatCurrencyAmount(request.amount.local, request.amount.currency as AfricanCurrency)}
                      </div>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-600">
                      <span>Deposit Code: </span>
                      <span className="font-mono font-semibold text-neutral-900">{request.depositCode}</span>
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
                              placeholder="Enter deposit code"
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
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
        </div>
      </div>
    </PageLayout>
  );
};

export default ProcessDeposits;
