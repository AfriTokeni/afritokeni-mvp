import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface AmountStepProps {
  exchangeRate: number;
  onContinue: (ugxAmount: string, usdcAmount: string) => void;
  initialUgxAmount?: string;
  initialUsdcAmount?: string;
}

const AmountStep: React.FC<AmountStepProps> = ({
  exchangeRate,
  onContinue,
  initialUgxAmount = '',
  initialUsdcAmount = ''
}) => {
  const [ugxAmount, setUgxAmount] = useState<string>(initialUgxAmount);
  const [usdcAmount, setUsdcAmount] = useState<string>(initialUsdcAmount);

  // Currency conversion handlers
  const handleUgxAmountChange = (value: string) => {
    setUgxAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const usdcEquivalent = (parseFloat(value) / exchangeRate).toFixed(2);
      setUsdcAmount(usdcEquivalent);
    } else {
      setUsdcAmount('');
    }
  };

  const handleUsdcAmountChange = (value: string) => {
    setUsdcAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const ugxEquivalent = (parseFloat(value) * exchangeRate).toFixed(0);
      setUgxAmount(ugxEquivalent);
    } else {
      setUgxAmount('');
    }
  };

  const handleContinue = () => {
    onContinue(ugxAmount, usdcAmount);
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
      <h2 className="text-xl font-bold text-neutral-900 mb-6">Enter Withdrawal Amount</h2>
      
      <div className="space-y-6">
        {/* UGX Input */}
        <div>
          <label htmlFor="ugx-amount" className="block text-sm font-medium text-neutral-700 mb-3">
            Amount in UGX (Ugandan Shilling)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="number"
              id="ugx-amount"
              value={ugxAmount}
              onChange={(e) => handleUgxAmountChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
              placeholder="10,000"
            />
          </div>
        </div>

        <div className="text-center text-neutral-500 font-medium">OR</div>

        {/* USDC Input */}
        <div>
          <label htmlFor="usdc-amount" className="block text-sm font-medium text-neutral-700 mb-3">
            Amount in USDC (US Dollar Coin)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="number"
              id="usdc-amount"
              value={usdcAmount}
              onChange={(e) => handleUsdcAmountChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
              placeholder="25.00"
              step="0.01"
            />
          </div>
        </div>

        {/* Amount Summary */}
        {(ugxAmount || usdcAmount) && (
          <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-sm text-neutral-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">UGX Amount:</span>
                <span className="font-mono font-bold">{parseFloat(ugxAmount || '0').toLocaleString()} UGX</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">USDC Amount:</span>
                <span className="font-mono font-bold">{parseFloat(usdcAmount || '0').toFixed(2)} USDC</span>
              </div>
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-xs text-neutral-500">Exchange rate: 1 USDC = {exchangeRate.toLocaleString()} UGX</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!ugxAmount && !usdcAmount}
          className="w-full mt-6 bg-neutral-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Continue to Select Agent
        </button>
      </div>
    </div>
  );
};

export default AmountStep;
