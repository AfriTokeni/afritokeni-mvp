import React, { useState } from 'react';

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Enter Withdrawal Amount</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="ugx-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount in UGX
          </label>
          <input
            type="number"
            id="ugx-amount"
            value={ugxAmount}
            onChange={(e) => handleUgxAmountChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder="Enter amount in UGX"
          />
        </div>

        <div className="text-center text-gray-500 font-medium">OR</div>

        <div>
          <label htmlFor="usdc-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount in USDC
          </label>
          <input
            type="number"
            id="usdc-amount"
            value={usdcAmount}
            onChange={(e) => handleUsdcAmountChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder="Enter amount in USDC"
          />
        </div>

        {(ugxAmount || usdcAmount) && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>UGX Amount:</strong> {parseFloat(ugxAmount || '0').toLocaleString()} UGX</p>
              <p><strong>USDC Amount:</strong> {parseFloat(usdcAmount || '0').toFixed(2)} USDC</p>
              <p className="text-xs text-gray-500 mt-2">Exchange rate: 1 USDC = {exchangeRate.toLocaleString()} UGX</p>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!ugxAmount && !usdcAmount}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue to Select Agent
        </button>
      </div>
    </div>
  );
};

export default AmountStep;
