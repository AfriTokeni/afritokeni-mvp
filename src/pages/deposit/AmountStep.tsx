import React from 'react';
import { CurrencySelector } from '../../components/CurrencySelector';
import { formatCurrencyAmount,AFRICAN_CURRENCIES, type AfricanCurrency } from '../../types/currency';
import { AmountStepProps } from '../../types/depositTypes';

const AmountStep: React.FC<AmountStepProps> = ({
  amount,
  selectedCurrency,
  error,
  onAmountChange,
  onCurrencyChange,
  onContinue,
  onError,
}) => {
  const currencyInfo = AFRICAN_CURRENCIES[selectedCurrency as keyof typeof AFRICAN_CURRENCIES];
  const handleAmountContinue = () => {
    const amountValue = parseFloat(amount);
    
    if (!amount || amountValue <= 0) {
      onError('Please enter a valid amount');
      return;
    }
    
    if (amountValue < 1000) {
      onError('Minimum deposit amount is ' + formatCurrencyAmount(1000, selectedCurrency as AfricanCurrency));
      return;
    }
    
    if (amountValue > 1000000) {
      onError('Maximum deposit amount is ' + formatCurrencyAmount(1000000, selectedCurrency as AfricanCurrency));
      return;
    }
    
    onContinue();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Money</h2>
          <p className="text-gray-600">Enter the amount you want to deposit</p>
        </div>

        <div className="space-y-6">
          {/* Currency Selection */}

                    <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Currency
              </label>
             <CurrencySelector
                currentCurrency={selectedCurrency}
                onCurrencyChange={onCurrencyChange}
              />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-gray-700 font-semibold text-xs">
                  {selectedCurrency}
                </span>
              </div>
              <div>
                <p className="text-gray-900 font-medium text-sm">
                  {currencyInfo?.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {currencyInfo?.symbol} • {currencyInfo?.country}
                </p>
              </div>
            </div>
          </div>
          {/* <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-3">
              Select Currency
            </label>
            <div className="relative">
              <CurrencySelector
                currentCurrency={selectedCurrency}
                onCurrencyChange={onCurrencyChange}
              />
            </div>
          </div> */}

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-3">
              Deposit Amount
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => {
                  onAmountChange(e.target.value);
                  onError('');
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 font-mono text-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Minimum: {formatCurrencyAmount(1000, selectedCurrency as AfricanCurrency)} • 
              Maximum: {formatCurrencyAmount(1000000, selectedCurrency as AfricanCurrency)}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleAmountContinue}
            disabled={!amount}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Find Nearby Agents
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmountStep;