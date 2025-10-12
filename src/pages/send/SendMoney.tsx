import React, { useState } from 'react';
import { Send, Bitcoin, DollarSign, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../../context/AuthenticationContext';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { useDemoMode } from '../../context/DemoModeContext';
import { CentralizedDemoService } from '../../services/centralizedDemoService';
import { CurrencySelector } from '../../components/CurrencySelector';
import { CkBTCBalanceCard } from '../../components/CkBTCBalanceCard';
import { CkUSDCBalanceCard } from '../../components/CkUSDCBalanceCard';
import { formatCurrencyAmount, AfricanCurrency } from '../../types/currency';
import { DataService } from '../../services/dataService';

type SendType = 'local' | 'ckbtc' | 'ckusdc';
type SendStep = 'amount' | 'recipient' | 'confirmation';

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserCurrency } = useAuthentication();
  const { isDemoMode } = useDemoMode();
  const { balance } = useAfriTokeni();

  const [currentStep, setCurrentStep] = useState<SendStep>('amount');
  const [sendType, setSendType] = useState<SendType>('local');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [localAmount, setLocalAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [transactionCode, setTransactionCode] = useState<string>('');

  // Get user's preferred currency
  const currentUser = user.user;
  const defaultCurrency = currentUser?.preferredCurrency || 'UGX';
  const userCurrency = selectedCurrency || defaultCurrency;

  // Get balance from CentralizedDemoService or real balance
  const [displayBalance, setDisplayBalance] = React.useState(0);
  React.useEffect(() => {
    const loadBalance = async () => {
      if (isDemoMode && user?.user?.id) {
        const demoBalance = await CentralizedDemoService.getBalance(user.user.id);
        setDisplayBalance(demoBalance?.digitalBalance || 0);
      } else if (balance) {
        setDisplayBalance(balance.balance);
      }
    };
    loadBalance();
  }, [isDemoMode, user, balance]);

  const getDisplayBalance = (): number => {
    return displayBalance;
  };

  // Calculate fee (1%)
  const calculateFee = (amount: number): number => {
    return Math.round(amount * 0.01);
  };

  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    setError('');

    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const userBalance = getDisplayBalance();
    const fee = calculateFee(amount);
    const totalRequired = amount + fee;

    if (totalRequired > userBalance) {
      setError(`Insufficient balance. You need ${formatCurrencyAmount(totalRequired, userCurrency as AfricanCurrency)} (including 1% fee)`);
    }
  };

  const handleContinueToRecipient = () => {
    const amount = parseFloat(localAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const userBalance = getDisplayBalance();
    const fee = calculateFee(amount);
    const totalRequired = amount + fee;

    if (totalRequired > userBalance) {
      setError(`Insufficient balance. You need ${formatCurrencyAmount(totalRequired, userCurrency as AfricanCurrency)}`);
      return;
    }

    setCurrentStep('recipient');
  };

  const handleSendMoney = async () => {
    if (!recipientPhone.trim()) {
      setError('Please enter recipient phone number');
      return;
    }

    // Generate transaction code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTransactionCode(code);

    if (isDemoMode) {
      // Demo mode - just show confirmation
      console.log('🎭 Demo send:', {
        type: sendType,
        amount: localAmount,
        currency: userCurrency,
        recipient: recipientPhone,
        code
      });
      setCurrentStep('confirmation');
    } else {
      // Real transaction
      try {
        const amount = parseFloat(localAmount);
        const fee = calculateFee(amount);

        await DataService.createTransaction({
          userId: currentUser?.id || '',
          type: 'send',
          amount: amount,
          currency: userCurrency,
          recipientPhone: recipientPhone,
          recipientName: recipientName || recipientPhone,
          status: 'completed',
          description: `Sent ${formatCurrencyAmount(amount, userCurrency as AfricanCurrency)} to ${recipientPhone}`,
          completedAt: new Date(),
          metadata: {
            sendType,
            fee,
            transactionCode: code
          }
        });

        setCurrentStep('confirmation');
      } catch (err) {
        console.error('Error sending money:', err);
        setError('Failed to send money. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Amount Step */}
      {currentStep === 'amount' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Send Amount</h2>

            {/* Balance Cards - Reusing Dashboard Components */}
            <div className="mb-6 space-y-4">
              {/* Primary Balance Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-neutral-500">{userCurrency}</span>
                      <span className="text-xs text-neutral-400">Primary Balance</span>
                    </div>
                    <p className="text-3xl font-bold text-neutral-900 font-mono">
                      {userCurrency} {formatCurrencyAmount(getDisplayBalance(), userCurrency as AfricanCurrency).replace(userCurrency, '').trim()}
                    </p>
                  </div>
                  <CurrencySelector
                    currentCurrency={userCurrency}
                    onCurrencyChange={(currency) => setSelectedCurrency(currency)}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Active
                  </span>
                </div>
              </div>

              {/* ckBTC and ckUSDC Balance Cards */}
              {isDemoMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CkBTCBalanceCard
                    principalId={user?.user?.id || "demo-user"}
                    preferredCurrency={userCurrency}
                    showActions={false}
                    isAgent={false}
                  />
                  <CkUSDCBalanceCard
                    principalId={user?.user?.id || "demo-user"}
                    preferredCurrency={userCurrency}
                    showActions={false}
                    isAgent={false}
                  />
                </div>
              )}
            </div>

            {/* Send Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">What would you like to send?</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setSendType('local')}
                  className={`p-6 border-2 rounded-2xl text-left transition-all ${
                    sendType === 'local'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      sendType === 'local' ? 'bg-gray-100' : 'bg-gray-50'
                    }`}>
                      <Send className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Send Local Currency</h3>
                      <p className="text-sm text-gray-600">Send {userCurrency} to another user</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSendType('ckbtc')}
                  className={`p-6 border-2 rounded-2xl text-left transition-all ${
                    sendType === 'ckbtc'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50">
                      <Bitcoin className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Send ckBTC</h3>
                      <p className="text-sm text-gray-600">Send Chain Key Bitcoin</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSendType('ckusdc')}
                  className={`p-6 border-2 rounded-2xl text-left transition-all ${
                    sendType === 'ckusdc'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Send ckUSDC</h3>
                      <p className="text-sm text-gray-600">Send Chain Key USDC</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <CurrencySelector
                  currentCurrency={userCurrency}
                  onCurrencyChange={(currency) => {
                    updateUserCurrency(currency);
                  }}
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  id="amount"
                  value={localAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg font-mono"
                  placeholder="0"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Available: {formatCurrencyAmount(getDisplayBalance(), userCurrency as AfricanCurrency)}
              </p>
            </div>

            {/* Fee Summary */}
            {localAmount && parseFloat(localAmount) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrencyAmount(parseFloat(localAmount), userCurrency as AfricanCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Fee (1%):</span>
                  <span className="font-medium text-orange-600">{formatCurrencyAmount(calculateFee(parseFloat(localAmount)), userCurrency as AfricanCurrency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrencyAmount(parseFloat(localAmount) + calculateFee(parseFloat(localAmount)), userCurrency as AfricanCurrency)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleContinueToRecipient}
              disabled={!localAmount || parseFloat(localAmount) <= 0 || !!error}
              className="w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

      {/* Recipient Step */}
      {currentStep === 'recipient' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Recipient Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Phone Number *
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Transaction Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrencyAmount(parseFloat(localAmount), userCurrency as AfricanCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee (1%):</span>
                  <span className="font-medium text-orange-600">{formatCurrencyAmount(calculateFee(parseFloat(localAmount)), userCurrency as AfricanCurrency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrencyAmount(parseFloat(localAmount) + calculateFee(parseFloat(localAmount)), userCurrency as AfricanCurrency)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('amount')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSendMoney}
                disabled={!recipientPhone.trim()}
                className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send Money
              </button>
            </div>
          </div>
        )}

      {/* Confirmation Step */}
      {currentStep === 'confirmation' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Money Sent Successfully!</h2>
            <p className="text-gray-600 mb-6">
              {formatCurrencyAmount(parseFloat(localAmount), userCurrency as AfricanCurrency)} has been sent to {recipientPhone}
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Code:</span>
                  <span className="font-mono font-bold">{transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium">{recipientName || recipientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrencyAmount(parseFloat(localAmount), userCurrency as AfricanCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium">{formatCurrencyAmount(calculateFee(parseFloat(localAmount)), userCurrency as AfricanCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/users/dashboard')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentStep('amount');
                  setLocalAmount('');
                  setRecipientPhone('');
                  setRecipientName('');
                  setError('');
                }}
                className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Send Another
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default SendMoney;
