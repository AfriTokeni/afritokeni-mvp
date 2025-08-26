import React, { useState } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';

interface AmountStepProps {
  exchangeRate: number;
  userBalance: number; // User's current balance in UGX
  onContinue: (ugxAmount: string, usdcAmount: string, fee: number) => void;
  initialUgxAmount?: string;
  initialUsdcAmount?: string;
}

const AmountStep: React.FC<AmountStepProps> = ({
  exchangeRate,
  userBalance,
  onContinue,
  initialUgxAmount = '',
  initialUsdcAmount = ''
}) => {
  const [ugxAmount, setUgxAmount] = useState<string>(initialUgxAmount);
  const [usdcAmount, setUsdcAmount] = useState<string>(initialUsdcAmount);
  const [error, setError] = useState<string>('');

  // Calculate 1% fee
  const calculateFee = (amount: number): number => {
    return Math.round(amount * 0.01);
  };

  // Validate withdrawal amount
  const validateAmount = (amount: number): boolean => {
    const fee = calculateFee(amount);
    const totalRequired = amount + fee;
    
    if (totalRequired > userBalance) {
      setError(`Insufficient balance. You need UGX ${totalRequired.toLocaleString()} (including 1% fee) but only have UGX ${userBalance.toLocaleString()}`);
      return false;
    }
    
    if (amount < 1000) {
      setError('Minimum withdrawal amount is UGX 1,000');
      return false;
    }
    
    setError('');
    return true;
  };

  // Currency conversion handlers
  const handleUgxAmountChange = (value: string) => {
    setUgxAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const amount = parseFloat(value);
      validateAmount(amount);
      const usdcEquivalent = (amount / exchangeRate).toFixed(2);
      setUsdcAmount(usdcEquivalent);
    } else {
      setUsdcAmount('');
      setError('');
    }
  };

  const handleUsdcAmountChange = (value: string) => {
    setUsdcAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const ugxEquivalent = (parseFloat(value) * exchangeRate).toFixed(0);
      setUgxAmount(ugxEquivalent);
      validateAmount(parseFloat(ugxEquivalent));
    } else {
      setUgxAmount('');
      setError('');
    }
  };

  const handleContinue = () => {
    const amount = parseFloat(ugxAmount);
    const fee = calculateFee(amount);
    if (validateAmount(amount)) {
      onContinue(ugxAmount, usdcAmount, fee);
    }
  };

  const currentAmount = parseFloat(ugxAmount || '0');
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
          <span className="text-sm sm:text-base lg:text-lg font-bold text-blue-900">UGX {userBalance.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-700 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* UGX Input */}
        <div>
          <label htmlFor="ugx-amount" className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2 sm:mb-3">
            Amount in UGX (Ugandan Shilling)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
            <input
              type="number"
              id="ugx-amount"
              value={ugxAmount}
              onChange={(e) => handleUgxAmountChange(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              placeholder="10,000"
            />
          </div>
        </div>

        <div className="text-center text-neutral-500 font-medium text-xs sm:text-sm lg:text-base">OR</div>

        {/* USDT Input */}
        <div>
          <label htmlFor="usdc-amount" className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2 sm:mb-3">
            Amount in USDT (Tether)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
            <input
              type="number"
              id="usdc-amount"
              value={usdcAmount}
              onChange={(e) => handleUsdcAmountChange(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              placeholder="25.00"
              step="0.01"
            />
          </div>
        </div>

        {/* Amount Summary */}
        {(ugxAmount || usdcAmount) && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-xs sm:text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-700">Withdrawal Amount:</span>
                <span className="font-mono font-bold text-xs sm:text-sm lg:text-base">{currentAmount.toLocaleString()} UGX</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-700">USDT Equivalent:</span>
                <span className="font-mono font-bold text-xs sm:text-sm lg:text-base">{parseFloat(usdcAmount || '0').toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-700">Transaction Fee (1%):</span>
                <span className="font-mono font-bold text-red-600 text-xs sm:text-sm lg:text-base">{currentFee.toLocaleString()} UGX</span>
              </div>
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-neutral-700">Total Required:</span>
                  <span className="font-mono font-bold text-xs sm:text-sm lg:text-base">{totalRequired.toLocaleString()} UGX</span>
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-xs text-neutral-500">Exchange rate: 1 USDT = {exchangeRate.toLocaleString()} UGX</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!isValidAmount}
          className="w-full mt-4 sm:mt-6 bg-neutral-900 text-white py-2.5 sm:py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200 text-xs sm:text-sm lg:text-base"
        >
          Continue to Select Agent
        </button>
      </div>
    </div>
  );
};

export default AmountStep;
