import React, { useState, useEffect, useRef } from 'react';
import { 
  Check,
  Phone,
  DollarSign
} from 'lucide-react';
import { UserData, Currency } from '../../types/user_dashboard';

// Mock recipient data
const RECIPIENTS = [
  { name: 'Jane Doe', phone: '+256701111111' },
  { name: 'Samuel Okello', phone: '+256702222222' },
  { name: 'Amina Yusuf', phone: '+256703333333' },
  { name: 'Peter Otieno', phone: '+256704444444' },
];
const EXCHANGE_RATE = 3800; // 1 USDC = 3800 UGX

const SendMoney: React.FC = () => {
  const [ugxAmount, setUgxAmount] = useState<string>('');
  const [usdcAmount, setUsdcAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [sendStep, setSendStep] = useState<number>(1);
  const [recipientResults, setRecipientResults] = useState<typeof RECIPIENTS>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{name: string, phone: string} | null>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);
  
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

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (recipientPhone.length >= 7) {
      searchTimeoutRef.current = window.setTimeout(() => {
        setShowResults(true);
        setRecipientResults(
          RECIPIENTS.filter(r => 
            r.phone.includes(recipientPhone) || 
            r.name.toLowerCase().includes(recipientPhone.toLowerCase())
          )
        );
      }, 300); // 300ms debounce
    } else {
      setShowResults(false);
      setRecipientResults([]);
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [recipientPhone]);

  // Recipient phone search handler
  const handleRecipientSearch = (value: string) => {
    setRecipientPhone(value);
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
                  onChange={(e) => handleRecipientSearch(e.target.value)}
                  placeholder="+256701234567"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* Recipient search results dropdown */}
                {showResults && recipientResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {recipientResults.map(r => (
                      <button
                        key={r.phone}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between"
                        onClick={() => {
                          setRecipientPhone(r.phone);
                          setSelectedRecipient(r);
                          setShowResults(false);
                        }}
                      >
                        <span className="font-medium text-gray-800">{r.name}</span>
                        <span className="text-gray-500 text-sm">{r.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Amount to Send
              </label>
              
              {/* UGX Input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  UGX (Ugandan Shilling)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={ugxAmount}
                    onChange={(e) => handleUgxAmountChange(e.target.value)}
                    placeholder="10,000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Available: {formatCurrency(user.balances.UGX, 'UGX')}
                </p>
              </div>

              {/* USDC Input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  USDC (US Dollar Coin)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={usdcAmount}
                    onChange={(e) => handleUsdcAmountChange(e.target.value)}
                    placeholder="25.00"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Available: {formatCurrency(user.balances.USDC, 'USDC')}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">Exchange Rate</p>
                <p className="text-sm text-blue-800">1 USDC = {EXCHANGE_RATE.toLocaleString()} UGX</p>
                {(ugxAmount || usdcAmount) && (
                  <p className="text-xs text-blue-600 mt-1">
                    {ugxAmount ? `${parseFloat(ugxAmount).toLocaleString()} UGX` : ''} 
                    {ugxAmount && usdcAmount ? ' ≈ ' : ''}
                    {usdcAmount ? `${parseFloat(usdcAmount).toFixed(2)} USDC` : ''}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSendStep(2)}
              disabled={!recipientPhone || (!ugxAmount && !usdcAmount)}
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
                  <span className="font-medium">
                    {selectedRecipient ? (
                      <div className="text-right">
                        <div>{selectedRecipient.name}</div>
                        <div className="text-sm text-gray-500">{selectedRecipient.phone}</div>
                      </div>
                    ) : (
                      recipientPhone
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {ugxAmount && `${parseFloat(ugxAmount).toLocaleString()} UGX`}
                    {ugxAmount && usdcAmount && ' ≈ '}
                    {usdcAmount && `${parseFloat(usdcAmount).toFixed(2)} USDC`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>
                    {ugxAmount && `${parseFloat(ugxAmount).toLocaleString()} UGX`}
                    {ugxAmount && usdcAmount && ' ≈ '}
                    {usdcAmount && `${parseFloat(usdcAmount).toFixed(2)} USDC`}
                  </span>
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
              {ugxAmount && `${parseFloat(ugxAmount).toLocaleString()} UGX`}
              {ugxAmount && usdcAmount && ' ≈ '}
              {usdcAmount && `${parseFloat(usdcAmount).toFixed(2)} USDC`} has been sent to {selectedRecipient ? selectedRecipient.name : recipientPhone}
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