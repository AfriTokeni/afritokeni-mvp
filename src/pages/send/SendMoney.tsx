import React, { useState, useEffect, useRef } from 'react';
import { 
  Check,
  Phone,
  DollarSign,
  ArrowLeft,
  User,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { DataService } from '../../services/dataService';
import { User as UserType } from '../../types/auth';
import PageLayout from '../../components/PageLayout';

const EXCHANGE_RATE = 3800; // 1 USDC = 3800 UGX

interface TransactionResult {
  id: string;
  amount: number;
  fee: number;
  recipient: UserType;
  timestamp: Date;
}

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const { balance, user, sendMoney, calculateFee } = useAfriTokeni();
  
  const [ugxAmount, setUgxAmount] = useState<string>('');
  const [usdcAmount, setUsdcAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [sendStep, setSendStep] = useState<number>(1);
  const [recipient, setRecipient] = useState<UserType | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
  };

  // Search for user with debouncing
  const searchUserByPhone = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setRecipient(null);
      return;
    }
    
    setIsSearchingUser(true);
    try {
      // Use the enhanced search functionality with case insensitive search
      const users = await DataService.searchUsers(searchTerm);
      
      if (users.length > 0) {
        // If multiple users found, take the first one
        setRecipient(users[0]);
      } else {
        setRecipient(null);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setRecipient(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (recipientPhone.length >= 3) {
      searchTimeoutRef.current = window.setTimeout(() => {
        searchUserByPhone(recipientPhone);
      }, 500); // 500ms debounce
    } else {
      setRecipient(null);
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [recipientPhone]);

  // Handle UGX amount change
  const handleUgxAmountChange = (value: string) => {
    setUgxAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      const usdcValue = (num / EXCHANGE_RATE).toFixed(2);
      setUsdcAmount(usdcValue);
    } else {
      setUsdcAmount('');
    }
  };

  // Handle USDC amount change
  const handleUsdcAmountChange = (value: string) => {
    setUsdcAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      const ugxValue = Math.round(num * EXCHANGE_RATE).toString();
      setUgxAmount(ugxValue);
    } else {
      setUgxAmount('');
    }
  };

  // Send money transaction
  const handleSendMoney = async () => {
    if (!user || !recipient || !ugxAmount) return;

    setIsProcessing(true);
    try {
      const sendAmount = parseFloat(ugxAmount);
      
      // For SMS, use the phone number from recipient.email field
      // For web users, their phone number is also stored in the email field after KYC
      const recipientPhoneNumber = recipient.email.startsWith('+') ? recipient.email : recipientPhone;
      
      // Use the sendMoney function from the hook
      const result = await sendMoney(sendAmount, recipientPhoneNumber, recipient);
      
      if (result.success && result.transaction && result.fee !== undefined) {
        setTransactionResult({
          id: result.transaction.id,
          amount: sendAmount,
          fee: result.fee,
          recipient: recipient,
          timestamp: new Date()
        });
        setSendStep(3);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error sending money:', error);
      alert('Failed to send money. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/users/dashboard')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <h1 className="text-2xl font-semibold text-neutral-900">Send Money</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          {/* Step 1: Enter recipient and amount */}
          {sendStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Recipient Search (Phone / Name)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Enter phone number, first name, or last name"
                    className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                  />
                  {isSearchingUser && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 animate-spin" />
                  )}
                </div>
                
                {/* Display found user */}
                {recipient && (
                  <div className="mt-3 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {recipient.firstName} {recipient.lastName}
                        </p>
                        <p className="text-sm text-neutral-700">
                          {/* Show phone number for both web and SMS users - it's stored in email field */}
                          {recipient.email.startsWith('+') ? recipient.email : 'Web User'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* User not found message */}
                {recipientPhone && !recipient && !isSearchingUser && recipientPhone.length >= 3 && (
                  <div className="mt-3 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-yellow-800">
                        User not found. Please verify the search term.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-4">
                  Amount to Send
                </label>
                
                {/* UGX Input */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    UGX (Ugandan Shilling)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={ugxAmount}
                      onChange={(e) => handleUgxAmountChange(e.target.value)}
                      placeholder="10,000"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    Available: {formatCurrency(balance?.balance || 0)}
                  </p>
                </div>

                {/* USD Input */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    USD (US Dollar Equivalent)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={usdcAmount}
                      onChange={(e) => handleUsdcAmountChange(e.target.value)}
                      placeholder="25.00"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    Available: ${((balance?.balance || 0) * 0.00026).toFixed(2)} USD
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-xs text-neutral-600 font-medium">Exchange Rate</p>
                  <p className="text-sm text-neutral-800">1 USD = {EXCHANGE_RATE.toLocaleString()} UGX</p>
                  {(ugxAmount || usdcAmount) && (
                    <p className="text-xs text-neutral-600 mt-2">
                      {ugxAmount ? `${parseFloat(ugxAmount).toLocaleString()} UGX` : ''} 
                      {ugxAmount && usdcAmount ? ' ≈ ' : ''}
                      {usdcAmount ? `$${parseFloat(usdcAmount).toFixed(2)} USD` : ''}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSendStep(2)}
                disabled={!recipientPhone || !recipient || (!ugxAmount && !usdcAmount)}
                className="w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Transaction summary */}
          {sendStep === 2 && (
            <div className="space-y-6">
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                <h3 className="font-semibold mb-4 text-neutral-900">Transaction Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Recipient:</span>
                    <span className="font-medium text-neutral-900">
                      {recipient ? (
                        <div className="text-right">
                          <div>{recipient.firstName} {recipient.lastName}</div>
                          <div className="text-sm text-neutral-500">{recipientPhone}</div>
                        </div>
                      ) : (
                        recipientPhone
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Amount:</span>
                    <span className="font-medium text-neutral-900 font-mono">
                      {ugxAmount && `${parseFloat(ugxAmount).toLocaleString()} UGX`}
                      {ugxAmount && usdcAmount && ' ≈ '}
                      {usdcAmount && `$${parseFloat(usdcAmount).toFixed(2)} USD`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Transaction Fee (1%):</span>
                    <span className="font-medium text-orange-600">
                      {ugxAmount && `${calculateFee(parseFloat(ugxAmount)).toLocaleString()} UGX`}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 pt-3 flex justify-between font-semibold">
                    <span className="text-neutral-900">Total (Amount + Fee):</span>
                    <span className="text-neutral-900 font-mono">
                      {ugxAmount && `${(parseFloat(ugxAmount) + calculateFee(parseFloat(ugxAmount))).toLocaleString()} UGX`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setSendStep(1)}
                  disabled={isProcessing}
                  className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSendMoney}
                  disabled={isProcessing}
                  className="flex-1 bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Money'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {sendStep === 3 && transactionResult && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Money Sent Successfully!</h3>
              <p className="text-neutral-600 mb-6 font-mono">
                {transactionResult.amount.toLocaleString()} UGX has been sent to {transactionResult.recipient.firstName} {transactionResult.recipient.lastName}
              </p>
              <div className="space-y-2 text-sm text-neutral-500 bg-neutral-50 px-4 py-4 rounded-lg inline-block">
                <div>Transaction ID: {transactionResult.id}</div>
                <div>Fee: {transactionResult.fee.toLocaleString()} UGX</div>
                <div>Total: {(transactionResult.amount + transactionResult.fee).toLocaleString()} UGX</div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSendStep(1);
                    setRecipientPhone('');
                    setRecipient(null);
                    setUgxAmount('');
                    setUsdcAmount('');
                    setTransactionResult(null);
                  }}
                  className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-neutral-800 transition-colors duration-200"
                >
                  Send Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SendMoney;
