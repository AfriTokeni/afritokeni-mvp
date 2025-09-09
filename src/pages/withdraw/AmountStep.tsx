import React, { useState } from 'react';
import { DollarSign, AlertCircle, Bitcoin } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { AFRICAN_CURRENCIES, formatCurrencyAmount } from '../../types/currency';
import { CurrencySelector } from '../../components/CurrencySelector';

interface AmountStepProps {
  exchangeRate: number; // BTC to local currency rate
  userBalance: number; // User's current balance in local currency
  onContinue: (localAmount: string, btcAmount: string, fee: number, withdrawType: 'cash' | 'bitcoin', selectedCurrency: string) => void;
  initialLocalAmount?: string;
  initialBtcAmount?: string;
}

const AmountStep: React.FC<AmountStepProps> = ({
  exchangeRate,
  userBalance,
  onContinue,
  initialLocalAmount = '',
  initialBtcAmount = ''
}) => {
  const { user } = useAuthentication();
  const [localAmount, setLocalAmount] = useState<string>(initialLocalAmount);
  const [btcAmount, setBtcAmount] = useState<string>(initialBtcAmount);
  const [withdrawType, setWithdrawType] = useState<'cash' | 'bitcoin'>('cash');
  const [error, setError] = useState<string>('');
  
  // Get user's preferred currency or default to NGN
  const currentUser = user.user;
  const defaultCurrency = currentUser?.preferredCurrency || 'NGN';
  const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultCurrency);
  const currencyInfo = AFRICAN_CURRENCIES[selectedCurrency as keyof typeof AFRICAN_CURRENCIES];

  // Calculate 1% fee
  const calculateFee = (amount: number): number => {
    return Math.round(amount * 0.01);
  };

  // Validate withdrawal amount
  const validateAmount = (amount: number): boolean => {
    const fee = calculateFee(amount);
    const totalRequired = amount + fee;
    
    if (totalRequired > userBalance) {
      setError(`Insufficient balance. You need ${formatCurrencyAmount(totalRequired, selectedCurrency as any)} (including 1% fee) but only have ${formatCurrencyAmount(userBalance, selectedCurrency as any)}`);
      return false;
    }
    
    if (amount < 1000) {
      setError(`Minimum withdrawal amount is ${formatCurrencyAmount(1000, selectedCurrency as any)}`);
      return false;
    }
    
    setError('');
    return true;
  };

  // Currency conversion handlers
  const handleLocalAmountChange = (value: string) => {
    setLocalAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const amount = parseFloat(value);
      validateAmount(amount);
      if (withdrawType === 'bitcoin') {
        // Convert local currency to Bitcoin
        const btcEquivalent = (amount / exchangeRate).toFixed(8);
        setBtcAmount(btcEquivalent);
      }
    } else {
      setBtcAmount('');
      setError('');
    }
  };

  const handleBtcAmountChange = (value: string) => {
    setBtcAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const localEquivalent = (parseFloat(value) * exchangeRate).toFixed(0);
      setLocalAmount(localEquivalent);
      validateAmount(parseFloat(localEquivalent));
    } else {
      setLocalAmount('');
      setError('');
    }
  };

  const handleContinue = () => {
    const amount = parseFloat(localAmount);
    const fee = calculateFee(amount);
    if (validateAmount(amount)) {
      onContinue(localAmount, btcAmount, fee, withdrawType, selectedCurrency);
    }
  };

  const currentAmount = parseFloat(localAmount || '0');
  const currentFee = calculateFee(currentAmount);
  const totalRequired = currentAmount + currentFee;
  const isValidAmount = currentAmount > 0 && !error;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 sm:p-6 lg:p-8">
      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 mb-4 sm:mb-6">Enter Withdrawal Amount</h2>
      
      {/* Current Balance Display */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
          <span className="text-xs sm:text-sm font-medium text-blue-700">Current Balance:</span>
          <span className="text-sm sm:text-base lg:text-lg font-bold text-blue-900 font-mono">{formatCurrencyAmount(userBalance, selectedCurrency as any)}</span>
        </div>
      </div>

      {/* Withdrawal Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-3">What would you like to withdraw?</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setWithdrawType('cash');
              setBtcAmount('');
            }}
            className={`p-4 border rounded-lg text-left transition-all duration-200 ${
              withdrawType === 'cash'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                withdrawType === 'cash' ? 'bg-blue-100' : 'bg-neutral-100'
              }`}>
                <DollarSign className={`w-5 h-5 ${
                  withdrawType === 'cash' ? 'text-blue-600' : 'text-neutral-600'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Withdraw Cash</h3>
                <p className="text-sm text-neutral-600">Get local currency cash from nearby agents</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setWithdrawType('bitcoin');
              if (localAmount) {
                const btcEquivalent = (parseFloat(localAmount) / exchangeRate).toFixed(8);
                setBtcAmount(btcEquivalent);
              }
            }}
            className={`p-4 border rounded-lg text-left transition-all duration-200 ${
              withdrawType === 'bitcoin'
                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                withdrawType === 'bitcoin' ? 'bg-orange-100' : 'bg-neutral-100'
              }`}>
                <Bitcoin className={`w-5 h-5 ${
                  withdrawType === 'bitcoin' ? 'text-orange-600' : 'text-neutral-600'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Convert to Bitcoin</h3>
                <p className="text-sm text-neutral-600">Exchange local currency for Bitcoin</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Currency Selection */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <label className="block text-xs sm:text-sm font-medium text-neutral-700">
              Select Currency
            </label>
            <CurrencySelector
              currentCurrency={selectedCurrency}
              onCurrencyChange={(currency) => {
                setSelectedCurrency(currency);
                setLocalAmount('');
                setBtcAmount('');
                setError('');
              }}
            />
          </div>
          <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-neutral-200">
              <span className="text-neutral-700 font-semibold text-xs">
                {selectedCurrency}
              </span>
            </div>
            <div>
              <p className="text-neutral-900 font-medium text-sm">
                {currencyInfo?.name}
              </p>
              <p className="text-neutral-500 text-xs">
                {currencyInfo?.symbol} • {currencyInfo?.country}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-700 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Local Currency Input */}
        <div>
          <label htmlFor="local-amount" className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2 sm:mb-3">
            Amount in {selectedCurrency} ({currencyInfo?.name})
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
            <input
              type="number"
              id="local-amount"
              value={localAmount}
              onChange={(e) => handleLocalAmountChange(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              placeholder="10,000"
            />
          </div>
        </div>

        {withdrawType === 'bitcoin' && (
          <>
            <div className="text-center text-neutral-500 font-medium text-xs sm:text-sm lg:text-base">OR</div>

            {/* Bitcoin Input */}
            <div>
              <label htmlFor="btc-amount" className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2 sm:mb-3">
                Amount in Bitcoin
              </label>
              <div className="relative">
                <Bitcoin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                <input
                  type="number"
                  id="btc-amount"
                  value={btcAmount}
                  onChange={(e) => handleBtcAmountChange(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200 text-sm sm:text-base font-mono"
                  placeholder="0.00232558"
                  step="0.00000001"
                />
              </div>
            </div>
          </>
        )}

        {/* Amount Summary */}
        {localAmount && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-xs sm:text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-700">Withdrawal Amount:</span>
                <span className="font-mono font-bold text-xs sm:text-sm lg:text-base">{formatCurrencyAmount(currentAmount, selectedCurrency as any)}</span>
              </div>
              {withdrawType === 'bitcoin' && btcAmount && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-neutral-700">Bitcoin Equivalent:</span>
                  <span className="font-mono font-bold text-xs sm:text-sm lg:text-base text-orange-600">₿{parseFloat(btcAmount).toFixed(8)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-700">Transaction Fee (1%):</span>
                <span className="font-mono font-bold text-red-600 text-xs sm:text-sm lg:text-base">{formatCurrencyAmount(currentFee, selectedCurrency as any)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-neutral-700">Total Required:</span>
                  <span className="font-mono font-bold text-xs sm:text-sm lg:text-base">{formatCurrencyAmount(totalRequired, selectedCurrency as any)}</span>
                </div>
              </div>
              {withdrawType === 'bitcoin' && (
                <div className="pt-2 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">Exchange rate: 1 BTC = {formatCurrencyAmount(exchangeRate, selectedCurrency as any)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!isValidAmount}
          className="w-full mt-4 sm:mt-6 bg-neutral-900 text-white py-2.5 sm:py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200 text-xs sm:text-sm lg:text-base"
        >
          {withdrawType === 'cash' ? 'Continue to Select Agent' : 'Continue to Bitcoin Conversion'}
        </button>
      </div>
    </div>
  );
};

export default AmountStep;
