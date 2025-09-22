import React from 'react';
import { AfricanCurrency, AFRICAN_CURRENCIES } from '../../../types/currency';

interface BitcoinAmountStepProps {
  btcAmount: string;
  localAmount: string;
  selectedCurrency: AfricanCurrency;
  exchangeRate: number;
  onBtcAmountChange: (value: string) => void;
  onLocalAmountChange: (value: string) => void;
  onCurrencyChange: (currency: AfricanCurrency) => void;
  onNext: () => void;
}

const BitcoinAmountStep: React.FC<BitcoinAmountStepProps> = ({
  btcAmount,
  localAmount,
  selectedCurrency,
  exchangeRate,
  onBtcAmountChange,
  onLocalAmountChange,
  onCurrencyChange,
  onNext,
}) => {
  const formatCurrency = (amount: number, currency: AfricanCurrency): string => {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency === 'XOF' || currency === 'XAF' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">How much Bitcoin?</h2>
        <p className="text-neutral-600">Enter the amount you want to exchange for cash</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bitcoin Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.00000001"
                value={btcAmount}
                onChange={(e) => onBtcAmountChange(e.target.value)}
                placeholder="0.001"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg"
              />
              <div className="absolute right-3 top-3 text-neutral-500 font-medium">
                ₿ BTC
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              You'll receive (approx.)
            </label>
            <div className="relative">
              <input
                type="number"
                value={localAmount}
                onChange={(e) => onLocalAmountChange(e.target.value)}
                placeholder="45000"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg"
              />
              <select
                value={selectedCurrency}
                onChange={(e) => onCurrencyChange(e.target.value as AfricanCurrency)}
                className="absolute right-3 top-3 bg-transparent border-none text-neutral-500 font-medium focus:outline-none"
              >
                {Object.entries(AFRICAN_CURRENCIES).slice(0, 5).map(([code]) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {btcAmount && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Exchange rate:</span>
              <span className="font-mono">1 BTC = {formatCurrency(exchangeRate, selectedCurrency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-neutral-600">Agent fee (≈2.5%):</span>
              <span className="font-mono">≈ {formatCurrency(parseFloat(localAmount) * 0.025, selectedCurrency)}</span>
            </div>
          </div>
        )}

        <button
          onClick={onNext}
          disabled={!btcAmount || parseFloat(btcAmount) <= 0}
          className="w-full mt-6 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find Agent
        </button>
      </div>
    </div>
  );
};

export default BitcoinAmountStep;