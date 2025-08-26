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
import { getDoc } from '@junobuild/core';
import { DataService } from '../../services/dataService';
import { User as UserType } from '../../types/auth';
import PageLayout from '../../components/PageLayout';

const EXCHANGE_RATE = 3800; // 1 USDT = 3800 UGX

interface TransactionResult {
  id: string;
  amount: number;
  fee: number;
  recipient: UserType;
  timestamp: Date;
}

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const { balance, user } = useAfriTokeni();
  
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

  // Search for user by phone number
  const searchUserByPhone = async (phone: string) => {
    if (!phone || phone.length < 10) {
      setRecipient(null);
      return;
    }
    
    setIsSearchingUser(true);
    try {
      // Format phone number
      const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
      
      // Search for user in Juno datastore using getDoc
      const userDoc = await getDoc({
        collection: 'users',
        key: formattedPhone
      });

      if (userDoc && userDoc.data) {
        setRecipient(userDoc.data as UserType);
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

    if (recipientPhone.length >= 10) {
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

  // Calculate transaction fee (1% of amount)
  const calculateFee = (amount: number): number => {
    return amount * 0.01;
  };

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

  // Handle USDT amount change
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
      const fee = calculateFee(sendAmount);
      const totalAmount = sendAmount + fee;

      // Check if sender has sufficient balance
      const senderBalance = await DataService.getUserBalance(user.id);
      if (!senderBalance || senderBalance.balance < totalAmount) {
        alert('Insufficient balance');
        return;
      }

      // Create send transaction
      const sendTransaction = await DataService.createTransaction({
        userId: user.id,
        type: 'send',
        amount: sendAmount,
        currency: 'UGX',
        recipientId: recipient.id,
        recipientPhone: recipientPhone,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        status: 'completed',
        description: `Money sent to ${recipient.firstName} ${recipient.lastName}`,
        completedAt: new Date(),
        metadata: {
          smsReference: `SEND${Date.now().toString().slice(-6)}`
        }
      });

      // Create receive transaction for recipient
      await DataService.createTransaction({
        userId: recipient.id,
        type: 'receive',
        amount: sendAmount,
        currency: 'UGX',
        status: 'completed',
        description: `Money received from ${user.firstName} ${user.lastName}`,
        completedAt: new Date(),
        metadata: {
          smsReference: `RCV${Date.now().toString().slice(-6)}`
        }
      });

      // Update sender balance (deduct amount + fee)
      await DataService.updateUserBalance(user.id, senderBalance.balance - totalAmount);

      // Update recipient balance (add amount)
      const recipientBalance = await DataService.getUserBalance(recipient.id);
      const newRecipientBalance = (recipientBalance?.balance || 0) + sendAmount;
      await DataService.updateUserBalance(recipient.id, newRecipientBalance);

      // Send SMS notifications
      try {
        // SMS to sender
        const senderSMS = `AfriTokeni: You sent UGX ${sendAmount.toLocaleString()} to ${recipient.firstName} ${recipient.lastName} (${recipientPhone}). Fee: UGX ${fee.toLocaleString()}. New balance: UGX ${(senderBalance.balance - totalAmount).toLocaleString()}. Ref: ${sendTransaction.id}`;
        await fetch(`${process.env.VITE_API_URL}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: user.email,
            message: senderSMS,
            transactionId: sendTransaction.id
          })
        });

        // SMS to recipient
        const recipientSMS = `AfriTokeni: You received UGX ${sendAmount.toLocaleString()} from ${user.firstName} ${user.lastName} (${user.email}). New balance: UGX ${newRecipientBalance.toLocaleString()}. Ref: ${sendTransaction.id}`;
        await fetch(`${process.env.VITE_API_URL}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: recipientPhone,
            message: recipientSMS,
            transactionId: sendTransaction.id
          })
        });
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }

      setTransactionResult({
        id: sendTransaction.id,
        amount: sendAmount,
        fee: fee,
        recipient: recipient,
        timestamp: new Date()
      });

      setSendStep(3);
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
                  Recipient Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+256701234567"
                    className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                  />
                  {isSearchingUser && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 animate-spin" />
                  )}
                </div>
                
                {/* Display found user */}
                {recipient && (
                  <div className="mt-3 bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">
                          {recipient.firstName} {recipient.lastName}
                        </p>
                        <p className="text-sm text-green-700">{recipient.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* User not found message */}
                {recipientPhone && !recipient && !isSearchingUser && recipientPhone.length >= 10 && (
                  <div className="mt-3 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-yellow-800">
                        User not found. Please verify the phone number.
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
                                {/* USDT Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-800 mb-2">
                    USDT (Tether Equivalent)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                      value={usdcAmount}
                      onChange={(e) => handleUsdcAmountChange(e.target.value)}
                      step="0.01"
                      min="0"
                    />
                    <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Available: ${((balance?.balance || 0) * 0.00026).toFixed(2)} USDT
                  </div>
                </div>

                {/* Exchange Rate and Summary */}
                <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-neutral-800">1 USDT = {EXCHANGE_RATE.toLocaleString()} UGX</p>
                  {(ugxAmount || usdcAmount) && (
                    <p className="text-sm text-neutral-600 mt-2">
                      {ugxAmount ? `UGX ${parseFloat(ugxAmount).toLocaleString()}` : ''}
                      {ugxAmount && usdcAmount ? ' ≈ ' : ''}
                      {usdcAmount ? `$${parseFloat(usdcAmount).toFixed(2)} USDT` : ''}
                    </p>
                  )}
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
