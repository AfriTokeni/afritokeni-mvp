import React, { useState } from 'react';
import { 
  ArrowLeft,
  User,
  Phone,
  DollarSign,
  Check,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { User as UserType } from '../types/auth';
import { getDoc } from '@junobuild/core';
import { DataService } from '../services/dataService';

export interface DepositData {
  customerPhone: string;
  customer?: UserType;
  amount: {
    ugx: number;
    usdc: number;
  };
}

type Step = 'input' | 'summary' | 'complete';

const ProcessDeposit: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [depositData, setDepositData] = useState<DepositData>({
    customerPhone: '',
    amount: { ugx: 0, usdc: 0 }
  });
  const [ugxAmount, setUgxAmount] = useState<string>('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Exchange rate: 1 USDC = 3800 UGX (approximate)
  const EXCHANGE_RATE = 3800;

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

  const searchUserByPhone = async (phone: string) => {
    if (!phone) return;
    
    setIsSearchingUser(true);
    try {
      // Format phone number
      const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;

      console.log('Searching user by phone:', formattedPhone);
      
      // Search for user in Juno datastore
      const userDoc = await getDoc({
        collection: 'users',
        key: formattedPhone
      });

      console.log('User document found:', userDoc);

      if (userDoc?.data) {
        const user = userDoc.data as UserType;
        setDepositData(prev => ({
          ...prev,
          customerPhone: formattedPhone,
          customer: user
        }));
      } else {
        setDepositData(prev => ({
          ...prev,
          customerPhone: formattedPhone,
          customer: undefined
        }));
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setDepositData(prev => ({
        ...prev,
        customerPhone: phone,
        customer: undefined
      }));
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setUgxAmount(value);
    const ugxNum = parseFloat(value) || 0;
    const usdcNum = ugxNum / EXCHANGE_RATE;
    
    setDepositData(prev => ({
      ...prev,
      amount: {
        ugx: ugxNum,
        usdc: usdcNum
      }
    }));
  };

  const handleConfirmDeposit = () => {
    setCurrentStep('summary');
  };

  const handleProcessDeposit = async () => {
    setIsProcessing(true);
    
    try {
      // Get current user's balance
      const customerId = depositData.customer?.id || `user_${Date.now()}`;
      let currentBalance = 0;
      
      try {
        const balanceData = await DataService.getUserBalance(customerId);
        currentBalance = balanceData?.balance || 0;
      } catch {
        console.log('No existing balance found, starting with 0');
      }

      // Create transaction in Juno datastore
      const transaction = await DataService.createTransaction({
        userId: customerId,
        type: 'deposit',
        amount: depositData.amount.ugx,
        currency: 'UGX',
        agentId: 'agent_001', // Mock agent ID - in production, get from auth context
        status: 'completed',
        description: `Cash deposit via agent`,
        completedAt: new Date(),
        metadata: {
          agentLocation: 'Kampala Central',
          smsReference: `DEP${Date.now().toString().slice(-6)}`
        }
      });

      // Update user balance in Juno datastore
      const newBalance = currentBalance + depositData.amount.ugx;
      await DataService.updateUserBalance(customerId, newBalance);

      // Initialize user data if new user
      if (!depositData.customer) {
        await DataService.initializeUserData(customerId);
      }

      // Send SMS notification via our webhook API
      try {
        const smsMessage = `AfriTokeni: You have received UGX ${depositData.amount.ugx.toLocaleString()} from Agent. New balance: UGX ${newBalance.toLocaleString()}. Transaction ID: ${transaction.id}. Thank you!`;
        
        // Call our SMS webhook to send notification
        await fetch('http://localhost:3001/api/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: depositData.customerPhone,
            message: smsMessage,
            transactionId: transaction.id
          })
        });

        // Log SMS in Juno datastore
        await DataService.logSMSMessage({
          userId: customerId,
          phoneNumber: depositData.customerPhone,
          message: smsMessage,
          direction: 'outbound',
          status: 'sent',
          transactionId: transaction.id
        });
      } catch (smsError) {
        console.error('SMS sending failed, but transaction completed:', smsError);
      }

      console.log('Deposit processed successfully:', transaction);
      setCurrentStep('complete');
      
      // Auto redirect after success
      setTimeout(() => {
        handleNewDeposit();
      }, 3000);

    } catch (error) {
      console.error('Error processing deposit:', error);
      alert('An error occurred while processing the deposit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewDeposit = () => {
    setCurrentStep('input');
    setDepositData({
      customerPhone: '',
      amount: { ugx: 0, usdc: 0 }
    });
    setUgxAmount('');
    setIsProcessing(false);
  };

  const handleBack = () => {
    if (currentStep === 'summary') {
      setCurrentStep('input');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'input': return 'New Deposit';
      case 'summary': return 'Deposit Summary';
      case 'complete': return 'Deposit Completed';
      default: return 'Process Deposit';
    }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => currentStep === 'input' ? navigate('/agents/dashboard') : handleBack()}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{getStepTitle()}</h1>
              <p className="text-sm text-neutral-600 mt-1">
                {currentStep === 'input' && 'Enter customer phone number and deposit amount'}
                {currentStep === 'summary' && 'Review and confirm the deposit details'}
                {currentStep === 'complete' && 'Deposit has been successfully processed'}
              </p>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
              currentStep === 'input' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              1
            </div>
            <div className="w-8 h-0.5 bg-neutral-300"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
              currentStep === 'summary' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              2
            </div>
            <div className="w-8 h-0.5 bg-neutral-300"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
              currentStep === 'complete' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          {/* Step 1: Input Customer Details and Amount */}
          {currentStep === 'input' && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Customer Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="tel"
                      value={depositData.customerPhone}
                      onChange={(e) => {
                        setDepositData(prev => ({ ...prev, customerPhone: e.target.value }));
                        if (e.target.value.length >= 10) {
                          searchUserByPhone(e.target.value);
                        }
                      }}
                      placeholder="+254701234567"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors duration-200"
                    />
                    {isSearchingUser && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Customer Details Display */}
                {depositData.customer && (
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">Customer Details</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {depositData.customer.firstName} {depositData.customer.lastName}
                        </p>
                        <p className="text-sm text-neutral-600">{depositData.customer.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer not found message */}
                {depositData.customerPhone && !depositData.customer && !isSearchingUser && depositData.customerPhone.length >= 10 && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-yellow-800">
                        Customer not found in system. They will be prompted to register when receiving the deposit notification.
                      </p>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      UGX Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="number"
                        value={ugxAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="Enter UGX amount"
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Equivalent USDC
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        value={depositData.amount.usdc.toFixed(2)}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 font-mono transition-colors duration-200"
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Rate: 1 USDC = {EXCHANGE_RATE.toLocaleString()} UGX
                    </p>
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleConfirmDeposit}
                    disabled={!depositData.customerPhone || depositData.amount.ugx <= 0}
                    className="bg-neutral-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                  >
                    <span>Confirm Deposit</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Summary */}
          {currentStep === 'summary' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Deposit Summary</h2>
              
              <div className="space-y-6">
                {/* Customer Summary */}
                <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                  <h3 className="text-sm font-medium text-neutral-700 mb-4">Customer Information</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-neutral-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900">
                        {depositData.customer ? `${depositData.customer.firstName} ${depositData.customer.lastName}` : 'New Customer'}
                      </p>
                      <p className="text-sm text-neutral-600">{depositData.customerPhone}</p>
                      {!depositData.customer && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Will be prompted to register
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                  <h3 className="text-sm font-medium text-neutral-700 mb-4">Deposit Amount</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">UGX Amount:</span>
                      <span className="font-bold text-neutral-900 font-mono text-lg">
                        {formatCurrency(depositData.amount.ugx, 'UGX')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">USDC Equivalent:</span>
                      <span className="font-bold text-neutral-900 font-mono text-lg">
                        {formatCurrency(depositData.amount.usdc, 'USDC')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep('input')}
                    disabled={isProcessing}
                    className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleProcessDeposit}
                    disabled={isProcessing}
                    className="flex-1 bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Deposit...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Process Deposit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Completion */}
          {currentStep === 'complete' && (
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Deposit Completed!</h2>
                <p className="text-neutral-600 mb-6">
                  The deposit has been successfully processed and recorded.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">Transaction Summary</h3>
                    <div className="space-y-2 text-sm text-green-700">
                      <p><strong>Customer:</strong> {depositData.customer ? `${depositData.customer.firstName} ${depositData.customer.lastName}` : depositData.customerPhone}</p>
                      <p><strong>Amount:</strong> <span className="font-mono">{formatCurrency(depositData.amount.ugx, 'UGX')}</span></p>
                      <p><strong>Transaction ID:</strong> <span className="font-mono">DEP{Date.now().toString().slice(-6)}</span></p>
                      <p><strong>Completed:</strong> {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-neutral-500">
                  Redirecting to new deposit in a few seconds...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ProcessDeposit;
