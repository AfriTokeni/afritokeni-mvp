import React, { useState } from 'react';
import { 
  Check,
  Phone,
  DollarSign
} from 'lucide-react';
import { UserData, Currency } from '../../types/user_dashboard';



const SendMoney: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('UGX');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [sendStep, setSendStep] = useState<number>(1);
  
  // Mock user data
  const [user] = useState<UserData>({
    name: 'John Kamau',
    phone: '+256701234567',
    balances: {
      UGX: 850000,
      USDC: 245.50
    },
    isVerified: true
  });


  const formatCurrency = (amount: number, currency: Currency): string => {
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

  return (
         <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Send Money</h2>
        
        {sendStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+256701234567"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Currency
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedCurrency('UGX')}
                  className={`p-4 rounded-lg border-2 flex items-center justify-center space-x-2 ${
                    selectedCurrency === 'UGX' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">UGX</span>
                  <span className="text-sm text-gray-500">Ugandan Shilling</span>
                </button>
                <button
                  onClick={() => setSelectedCurrency('USDC')}
                  className={`p-4 rounded-lg border-2 flex items-center justify-center space-x-2 ${
                    selectedCurrency === 'USDC' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">USDC</span>
                  <span className="text-sm text-gray-500">US Dollar Coin</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({selectedCurrency})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder={selectedCurrency === 'UGX' ? '10,000' : '25.00'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Available: {formatCurrency(user.balances[selectedCurrency], selectedCurrency)}
              </p>
            </div>

            <button
              onClick={() => setSendStep(2)}
              disabled={!recipientPhone || !sendAmount}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {sendStep === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Transaction Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium">{recipientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrency(parseFloat(sendAmount), selectedCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(parseFloat(sendAmount), selectedCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSendStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setSendStep(3);
                  // Simulate transaction processing
                  setTimeout(() => setSendStep(1), 2000);
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Send Money
              </button>
            </div>
          </div>
        )}

        {sendStep === 3 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Money Sent Successfully!</h3>
            <p className="text-gray-600 mb-4">
              {formatCurrency(parseFloat(sendAmount), selectedCurrency)} has been sent to {recipientPhone}
            </p>
            <div className="text-sm text-gray-500">
              Transaction ID: TXN{Date.now().toString().slice(-6)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendMoney;