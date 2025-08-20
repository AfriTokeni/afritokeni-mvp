import React, { useState, useEffect, useRef } from 'react';
import { 
  Check,
  Phone,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import PageLayout from '../../components/PageLayout';

// Mock recipient data
const RECIPIENTS = [
  { name: 'Jane Doe', phone: '+256701111111' },
  { name: 'Samuel Okello', phone: '+256702222222' },
  { name: 'Amina Yusuf', phone: '+256703333333' },
  { name: 'Peter Otieno', phone: '+256704444444' },
];
const EXCHANGE_RATE = 3800; // 1 USDC = 3800 UGX

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const { balance } = useAfriTokeni();
  
  const [ugxAmount, setUgxAmount] = useState<string>('');
  const [usdcAmount, setUsdcAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [sendStep, setSendStep] = useState<number>(1);
  const [recipientResults, setRecipientResults] = useState<typeof RECIPIENTS>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{name: string, phone: string} | null>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
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
                  onChange={(e) => handleRecipientSearch(e.target.value)}
                  placeholder="+256701234567"
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                />
                {/* Recipient search results dropdown */}
                {showResults && recipientResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                    {recipientResults.map(r => (
                      <button
                        key={r.phone}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center justify-between transition-colors duration-200"
                        onClick={() => {
                          setRecipientPhone(r.phone);
                          setSelectedRecipient(r);
                          setShowResults(false);
                        }}
                      >
                        <span className="font-medium text-neutral-900">{r.name}</span>
                        <span className="text-neutral-500 text-sm">{r.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <div className="mb-6">
                <label className="block text-xs font-medium text-neutral-600 mb-2">
                  USD (US Dollar Equivalent)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="number"
                    value={usdcAmount}
                    onChange={(e) => handleUsdcAmountChange(e.target.value)}
                    placeholder="25.00"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  Available: ${((balance?.balance || 0) * 0.00026).toFixed(2)} USD
                </p>
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
              disabled={!recipientPhone || (!ugxAmount && !usdcAmount)}
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        )}

        {sendStep === 2 && (
          <div className="space-y-6">
            <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
              <h3 className="font-semibold mb-4 text-neutral-900">Transaction Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Recipient:</span>
                  <span className="font-medium text-neutral-900">
                    {selectedRecipient ? (
                      <div className="text-right">
                        <div>{selectedRecipient.name}</div>
                        <div className="text-sm text-neutral-500">{selectedRecipient.phone}</div>
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
                  <span className="text-neutral-600">Fee:</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex justify-between font-semibold">
                  <span className="text-neutral-900">Total:</span>
                  <span className="text-neutral-900 font-mono">
                    {ugxAmount && `${parseFloat(ugxAmount).toLocaleString()} UGX`}
                    {ugxAmount && usdcAmount && ' ≈ '}
                    {usdcAmount && `$${parseFloat(usdcAmount).toFixed(2)} USD`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setSendStep(1)}
                className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors duration-200"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setSendStep(3);
                  // Simulate transaction processing
                  setTimeout(() => setSendStep(1), 2000);
                }}
                className="flex-1 bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors duration-200"
              >
                Send Money
              </button>
            </div>
          </div>
        )}

        {sendStep === 3 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">Money Sent Successfully!</h3>
            <p className="text-neutral-600 mb-6 font-mono">
              {ugxAmount && `${parseFloat(ugxAmount).toLocaleString()} UGX`}
              {ugxAmount && usdcAmount && ' ≈ '}
              {usdcAmount && `$${parseFloat(usdcAmount).toFixed(2)} USD`} has been sent to {selectedRecipient ? selectedRecipient.name : recipientPhone}
            </p>
            <div className="text-sm text-neutral-500 bg-neutral-50 px-4 py-2 rounded-lg inline-block">
              Transaction ID: TXN{Date.now().toString().slice(-6)}
            </div>
          </div>
        )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SendMoney;