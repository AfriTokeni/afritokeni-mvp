import React, { useState, useEffect, useRef } from 'react';
import { 
  Check,
  Phone,
  DollarSign,
  ArrowLeft,
  User,
  Loader2,
  Globe,
  Bitcoin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../../context/AuthenticationContext';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { DataService } from '../../services/dataService';
import { User as UserType } from '../../types/auth';
import { AFRICAN_CURRENCIES, formatCurrencyAmount } from '../../types/currency';
import PageLayout from '../../components/PageLayout';

// Bitcoin exchange rates will be fetched dynamically from BitcoinService

interface TransactionResult {
  id: string;
  amount: number;
  fee: number;
  recipient: UserType | InternationalRecipient;
  timestamp: Date;
}

interface InternationalRecipient {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  currency: string;
}

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthentication();
  const { balance, user, sendMoney, calculateFee } = useAfriTokeni();
  
  // Get user's preferred currency or default to NGN
  const currentUser = authUser.user;
  const userCurrency = currentUser?.preferredCurrency || 'NGN';
  const currencyInfo = AFRICAN_CURRENCIES[userCurrency as keyof typeof AFRICAN_CURRENCIES];
  
  const [sendType, setSendType] = useState<'user' | 'bitcoin' | 'international' | null>(null);
  const [localAmount, setLocalAmount] = useState<string>('');
  const [btcAmount, setBtcAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [internationalRecipient, setInternationalRecipient] = useState<InternationalRecipient>({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    currency: 'NGN'
  });
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [sendStep, setSendStep] = useState<number>(0); // Start at 0 for type selection
  const [recipient, setRecipient] = useState<UserType | null>(null);
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, userCurrency as any);
  };

  // Mock exchange rates - would be live in production
  const btcToUsd = 43000;
  const getUsdToLocalRate = (currency: string) => {
    const rates: Record<string, number> = {
      'NGN': 1580, 'KES': 150, 'GHS': 12, 'ZAR': 18, 'EGP': 31
    };
    return rates[currency] || 1580;
  };

  const handleUsdAmountChange = (value: string) => {
    setUsdAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setBtcAmount((num / btcToUsd).toFixed(8));
    } else {
      setBtcAmount('');
    }
  };

  const handleBtcAmountChange = (value: string) => {
    setBtcAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setUsdAmount((num * btcToUsd).toFixed(2));
    } else {
      setUsdAmount('');
    }
  };

  const getLocalAmountForInternational = () => {
    if (!usdAmount || !internationalRecipient.currency) return 0;
    const usd = parseFloat(usdAmount);
    const rate = getUsdToLocalRate(internationalRecipient.currency);
    return Math.round(usd * rate);
  };

  // Search for user with debouncing
  const searchUserByPhone = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setRecipient(null);
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearchingUser(true);
    try {
      // Use the enhanced search functionality with case insensitive search
      const users = await DataService.searchUsers(searchTerm);
      
      setSearchResults(users);
      setShowSearchResults(users.length > 0);
      
      // Don't auto-select if there are multiple results
      if (users.length === 1) {
        setRecipient(users[0]);
      } else {
        setRecipient(null);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setRecipient(null);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Handle user selection from dropdown
  const handleUserSelection = (selectedUser: UserType) => {
    setRecipient(selectedUser);
    // Set the display value to show user's phone or name, but keep it searchable
    const displayValue = selectedUser.email.startsWith('+') 
      ? selectedUser.email 
      : `${selectedUser.firstName} ${selectedUser.lastName}`;
    setRecipientPhone(displayValue);
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (recipientPhone.length >= 3) {
      searchTimeoutRef.current = window.setTimeout(() => {
        searchUserByPhone(recipientPhone);
      }, 500); // 500ms debounce
    } else {
      setRecipient(null);
      setSearchResults([]);
      setShowSearchResults(false);
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [recipientPhone]);


  // Send money transaction
  const handleSendMoney = async () => {
    if (!user || !recipient || !localAmount) return;

    setIsProcessing(true);
    try {
      const sendAmount = parseFloat(localAmount);
      
      // For SMS, use the phone number from recipient.email field
      // For web users, their phone number is also stored in the email field after KYC
      const recipientPhoneNumber = recipient.email.startsWith('+') ? recipient.email : recipientPhone;
      
      // Use the sendMoney function from the hook
      const result = await sendMoney(sendAmount, recipientPhoneNumber, recipient);
      
      if (result.success && result.transaction && result.fee !== undefined) {
        setTransactionResult({
          id: result.transaction.id,
          amount: sendAmount,
          fee: result.fee,
          recipient: recipient,
          timestamp: new Date()
        });
        setSendStep(3);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error sending money:', error);
      alert('Failed to send money. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/users/dashboard')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Send Money</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          {/* Step 0: Choose transfer type */}
          {sendStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Choose Transfer Type</h2>
                <p className="text-neutral-600">What would you like to do?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Send to User */}
                <button
                  onClick={() => {
                    setSendType('user');
                    setSendStep(1);
                  }}
                  className="p-6 border border-neutral-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">Send to User</h3>
                      <p className="text-sm text-neutral-600 mb-3">Transfer money to another AfriTokeni user</p>
                      <p className="text-xs text-neutral-500">
                        Send local currency to friends, family, or contacts who have AfriTokeni accounts.
                      </p>
                    </div>
                  </div>
                </button>

                {/* International Remittance */}
                <button
                  onClick={() => {
                    setSendType('international');
                    setSendStep(1);
                  }}
                  className="p-6 border border-neutral-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                      <Globe className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">Send to Africa</h3>
                      <p className="text-sm text-neutral-600 mb-3">International Bitcoin remittances</p>
                      <p className="text-xs text-neutral-500">
                        Send Bitcoin to family in Africa who receive local currency cash via SMS.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Exchange Bitcoin for Cash */}
                <button
                  onClick={() => navigate('/users/bitcoin/deposit')}
                  className="p-6 border border-neutral-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors flex-shrink-0">
                      <Bitcoin className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">Exchange Bitcoin for Cash</h3>
                      <p className="text-sm text-neutral-600 mb-3">Convert Bitcoin to local currency via agents</p>
                      <p className="text-xs text-neutral-500">
                        Send Bitcoin from your hardware wallet and receive cash from nearby agents.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: International Recipient Form */}
          {sendStep === 1 && sendType === 'international' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Who are you sending to?</h2>
                <p className="text-neutral-600">Enter your recipient's details in Africa</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={internationalRecipient.firstName}
                      onChange={(e) => setInternationalRecipient({...internationalRecipient, firstName: e.target.value})}
                      placeholder="Enter first name"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={internationalRecipient.lastName}
                      onChange={(e) => setInternationalRecipient({...internationalRecipient, lastName: e.target.value})}
                      placeholder="Enter last name"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="tel"
                      value={internationalRecipient.phone}
                      onChange={(e) => setInternationalRecipient({...internationalRecipient, phone: e.target.value})}
                      placeholder="+234 801 234 5678"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Include country code (e.g., +234 for Nigeria)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Country & Currency
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={internationalRecipient.currency}
                      onChange={(e) => {
                        const currency = e.target.value;
                        const currencyInfo = AFRICAN_CURRENCIES[currency as keyof typeof AFRICAN_CURRENCIES];
                        setInternationalRecipient({
                          ...internationalRecipient, 
                          currency,
                          country: currencyInfo?.name || ''
                        });
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      {Object.entries(AFRICAN_CURRENCIES).map(([code, info]) => (
                        <option key={code} value={code}>
                          {info.name} ({code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">SMS Notification</h3>
                    <p className="text-sm text-blue-700">
                      Your recipient will receive an SMS notification when the money is ready for pickup. 
                      No smartphone or app required.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSendStep(2)}
                disabled={!internationalRecipient.firstName || !internationalRecipient.lastName || !internationalRecipient.phone}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue to Amount
              </button>
            </div>
          )}

          {/* Step 1: Enter recipient and amount (User Transfer Only) */}
          {sendStep === 1 && sendType === 'user' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 sm:mb-3">
                  Recipient Search (Phone / Name)
                </label>
                <div className="relative" ref={searchContainerRef}>
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 z-10" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    placeholder="Enter phone number, first name, or last name"
                    className="w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                  />
                  {isSearchingUser && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 animate-spin z-10" />
                  )}
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                      {searchResults.map((user, index) => (
                        <div
                          key={`${user.id}-${index}`}
                          onClick={() => handleUserSelection(user)}
                          className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 text-sm sm:text-base truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-500 truncate">
                              {user.email.startsWith('+') ? user.email : 'Web User'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Display selected user */}
                {recipient && (
                  <div className="mt-2 sm:mt-3 bg-neutral-50 rounded-lg p-3 sm:p-4 border border-neutral-200">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 text-sm sm:text-base">
                          {recipient.firstName} {recipient.lastName}
                        </p>
                        <p className="text-xs sm:text-sm text-neutral-700">
                          {/* Show phone number for both web and SMS users - it's stored in email field */}
                          {recipient.email.startsWith('+') ? recipient.email : 'Web User'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* User not found message */}
                {recipientPhone && searchResults.length === 0 && !recipient && !isSearchingUser && recipientPhone.length >= 3 && (
                  <div className="mt-2 sm:mt-3 bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-xs sm:text-sm text-yellow-800">
                        User not found. Please verify the search term.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3 sm:mb-4">
                  Amount to Send
                </label>
                
                {/* Local Currency Input Only for User Transfers */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    {userCurrency} ({currencyInfo.name})
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={localAmount}
                      onChange={(e) => setLocalAmount(e.target.value)}
                      placeholder="10,000"
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-neutral-500">
                    Available: {formatCurrency(balance?.balance || 0)}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="text-blue-600 w-3 h-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 mb-1">User-to-User Transfer</p>
                      <p className="text-xs text-blue-700">
                        Send local currency directly to another AfriTokeni user's account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSendStep(2)}
                disabled={!recipientPhone || !recipient || !localAmount}
                className="w-full bg-neutral-900 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: International Amount Selection */}
          {sendStep === 2 && sendType === 'international' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">How much are you sending?</h2>
                <p className="text-neutral-600">
                  Sending to {internationalRecipient.firstName} {internationalRecipient.lastName} in {AFRICAN_CURRENCIES[internationalRecipient.currency as keyof typeof AFRICAN_CURRENCIES]?.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* USD Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Amount in USD
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      value={usdAmount}
                      onChange={(e) => handleUsdAmountChange(e.target.value)}
                      placeholder="100.00"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Bitcoin Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Amount in Bitcoin
                  </label>
                  <div className="relative">
                    <Bitcoin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input
                      type="number"
                      value={btcAmount}
                      onChange={(e) => handleBtcAmountChange(e.target.value)}
                      placeholder="0.00232558"
                      step="0.00000001"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Exchange Rate Display */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <h3 className="font-semibold text-neutral-900 mb-3">Exchange Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Bitcoin Rate:</span>
                    <span className="font-mono">1 BTC = ${btcToUsd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{internationalRecipient.currency} Rate:</span>
                    <span className="font-mono">$1 = {getUsdToLocalRate(internationalRecipient.currency)} {internationalRecipient.currency}</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Recipient receives:</span>
                      <span className="font-mono text-green-600">
                        {formatCurrencyAmount(getLocalAmountForInternational(), internationalRecipient.currency as any)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">How it works:</h3>
                <ol className="text-sm text-orange-800 space-y-1 list-decimal list-inside">
                  <li>You send Bitcoin to our secure escrow address</li>
                  <li>We notify {internationalRecipient.firstName} via SMS with pickup instructions</li>
                  <li>They visit a local agent with ID and pickup code</li>
                  <li>Agent verifies and provides cash in {internationalRecipient.currency}</li>
                  <li>Bitcoin is released to agent after confirmation</li>
                </ol>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setSendStep(1)}
                  className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setSendStep(3)}
                  disabled={!usdAmount || !btcAmount}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
                >
                  Review & Send
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Transaction summary (User Transfer) */}
          {sendStep === 2 && sendType === 'user' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-neutral-50 p-4 sm:p-6 rounded-xl border border-neutral-200">
                <h3 className="font-semibold mb-3 sm:mb-4 text-neutral-900 text-base sm:text-lg">Transaction Summary</h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* Recipient Row */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                    <span className="text-neutral-600 text-sm sm:text-base flex-shrink-0">Recipient:</span>
                    <div className="font-medium text-neutral-900 text-right sm:text-right">
                      {recipient ? (
                        <div>
                          <div className="text-sm sm:text-base break-words">{recipient.firstName} {recipient.lastName}</div>
                          <div className="text-xs sm:text-sm text-neutral-500 break-all">{recipientPhone}</div>
                        </div>
                      ) : (
                        <span className="text-sm sm:text-base break-all">{recipientPhone}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Amount Row */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                    <span className="text-neutral-600 text-sm sm:text-base flex-shrink-0">Amount:</span>
                    <div className="font-medium text-neutral-900 font-mono text-sm sm:text-base text-right break-words">
                      {localAmount && (
                        <div>{parseFloat(localAmount).toLocaleString()} {userCurrency}</div>
                      )}
                      {localAmount && btcAmount && (
                        <div className="text-xs sm:text-sm text-neutral-500">
                          ≈ ₿{parseFloat(btcAmount).toFixed(8)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Fee Row */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                    <span className="text-neutral-600 text-sm sm:text-base flex-shrink-0">Fee (1%):</span>
                    <span className="font-medium text-orange-600 text-sm sm:text-base font-mono break-words">
                      {localAmount && `${calculateFee(parseFloat(localAmount)).toLocaleString()} ${userCurrency}`}
                    </span>
                  </div>
                  
                  {/* Total Row */}
                  <div className="border-t border-neutral-200 pt-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                      <span className="text-neutral-900 font-semibold text-sm sm:text-base flex-shrink-0">Total:</span>
                      <span className="text-neutral-900 font-mono font-semibold text-sm sm:text-base break-words">
                        {localAmount && `${(parseFloat(localAmount) + calculateFee(parseFloat(localAmount))).toLocaleString()} ${userCurrency}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setSendStep(1)}
                  disabled={isProcessing}
                  className="flex-1 bg-neutral-100 text-neutral-700 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSendMoney}
                  disabled={isProcessing}
                  className="flex-1 bg-neutral-900 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-neutral-800 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Money'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: International Review & Confirmation */}
          {sendStep === 3 && sendType === 'international' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Review Your Transfer</h2>
                <p className="text-neutral-600">Please confirm the details before sending</p>
              </div>

              <div className="bg-neutral-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Recipient:</span>
                  <div className="text-right">
                    <div className="font-semibold">{internationalRecipient.firstName} {internationalRecipient.lastName}</div>
                    <div className="text-sm text-neutral-500">{internationalRecipient.phone}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">You send:</span>
                  <div className="text-right">
                    <div className="font-mono font-semibold">₿{btcAmount}</div>
                    <div className="text-sm text-neutral-500">${usdAmount}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">They receive:</span>
                  <div className="font-mono font-semibold text-green-600">
                    {formatCurrencyAmount(getLocalAmountForInternational(), internationalRecipient.currency as any)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Pickup location:</span>
                  <span className="font-semibold">{AFRICAN_CURRENCIES[internationalRecipient.currency as keyof typeof AFRICAN_CURRENCIES]?.name}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Send Bitcoin to the escrow address we provide</li>
                  <li>{internationalRecipient.firstName} will receive SMS pickup instructions</li>
                  <li>Money available for pickup within 1 hour of confirmation</li>
                  <li>Automatic refund if not picked up within 24 hours</li>
                </ol>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setSendStep(2)}
                  className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // Create mock international transaction result
                    setTransactionResult({
                      id: 'INT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                      amount: parseFloat(usdAmount),
                      fee: 0, // No fee for international - built into exchange rate
                      recipient: internationalRecipient,
                      timestamp: new Date()
                    });
                    setSendStep(4); // Different step for international success
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Create Transfer
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success (User Transfer) */}
          {sendStep === 3 && sendType === 'user' && transactionResult && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">Money Sent Successfully!</h3>
              <p className="text-neutral-600 mb-4 sm:mb-6 font-mono text-sm sm:text-base px-2 sm:px-4 break-words">
                <span className="font-semibold">{transactionResult.amount.toLocaleString()} {userCurrency}</span> has been sent to{' '}
                <span className="font-semibold">{transactionResult.recipient.firstName} {transactionResult.recipient.lastName}</span>
              </p>
              <div className="bg-neutral-50 px-3 sm:px-4 py-3 sm:py-4 rounded-lg mx-auto max-w-xs sm:max-w-sm">
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-neutral-600">
                  <div className="flex justify-between items-center">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-right break-all ml-2">{transactionResult.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fee:</span>
                    <span className="font-mono">{transactionResult.fee.toLocaleString()} {userCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-neutral-900 pt-1 border-t border-neutral-200">
                    <span>Total:</span>
                    <span className="font-mono">{(transactionResult.amount + transactionResult.fee).toLocaleString()} {userCurrency}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setSendStep(0);
                    setSendType(null);
                    setRecipientPhone('');
                    setRecipient(null);
                    setLocalAmount('');
                    setBtcAmount('');
                    setUsdAmount('');
                    setInternationalRecipient({
                      firstName: '',
                      lastName: '',
                      phone: '',
                      country: '',
                      currency: 'NGN'
                    });
                    setTransactionResult(null);
                  }}
                  className="bg-neutral-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-neutral-800 transition-colors duration-200"
                >
                  Send Another
                </button>
              </div>
            </div>
          )}

          {/* Step 4: International Success */}
          {sendStep === 4 && sendType === 'international' && transactionResult && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">International Transfer Created!</h3>
              <p className="text-neutral-600 mb-4 sm:mb-6 font-mono text-sm sm:text-base px-2 sm:px-4 break-words">
                <span className="font-semibold">${transactionResult.amount}</span> Bitcoin transfer to{' '}
                <span className="font-semibold">
                  {'firstName' in transactionResult.recipient ? 
                    `${transactionResult.recipient.firstName} ${transactionResult.recipient.lastName}` : 
                    `${(transactionResult.recipient as any).firstName} ${(transactionResult.recipient as any).lastName}`
                  }
                </span>
              </p>
              <div className="bg-neutral-50 px-3 sm:px-4 py-3 sm:py-4 rounded-lg mx-auto max-w-xs sm:max-w-sm">
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-neutral-600">
                  <div className="flex justify-between items-center">
                    <span>Transfer ID:</span>
                    <span className="font-mono text-right break-all ml-2">{transactionResult.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Recipient gets:</span>
                    <span className="font-mono text-green-600">
                      {formatCurrencyAmount(getLocalAmountForInternational(), internationalRecipient.currency as any)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <span className="text-orange-600 font-semibold">Awaiting Bitcoin</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">Next: Send Bitcoin</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Send <span className="font-mono font-semibold">₿{btcAmount}</span> to the escrow address below:
                </p>
                <div className="bg-white border border-blue-200 rounded p-3 font-mono text-sm break-all">
                  bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {internationalRecipient.firstName} will be notified via SMS once Bitcoin is confirmed.
                </p>
              </div>

              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setSendStep(0);
                    setSendType(null);
                    setRecipientPhone('');
                    setRecipient(null);
                    setLocalAmount('');
                    setBtcAmount('');
                    setUsdAmount('');
                    setInternationalRecipient({
                      firstName: '',
                      lastName: '',
                      phone: '',
                      country: '',
                      currency: 'NGN'
                    });
                    setTransactionResult(null);
                  }}
                  className="bg-neutral-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-neutral-800 transition-colors duration-200"
                >
                  Send Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SendMoney;
