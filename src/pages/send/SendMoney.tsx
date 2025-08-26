import React, { useState, useEffect, useRef } from 'react';
import { 
  Check,
  Phone,
  DollarSign,
  ArrowLeft,
  User,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { DataService } from '../../services/dataService';
import { User as UserType } from '../../types/auth';
import PageLayout from '../../components/PageLayout';

const EXCHANGE_RATE = 3800; // 1 USDT = 3800 UGX

interface TransactionResult {
  id: string;
  amount: number;
  fee: number;
  recipient: UserType;
  timestamp: Date;
}

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const { balance, user, sendMoney, calculateFee } = useAfriTokeni();
  
  const [ugxAmount, setUgxAmount] = useState<string>('');
  const [usdcAmount, setUsdcAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [sendStep, setSendStep] = useState<number>(1);
  const [recipient, setRecipient] = useState<UserType | null>(null);
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
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

  // Handle USDT amount change
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

  // Send money transaction
  const handleSendMoney = async () => {
    if (!user || !recipient || !ugxAmount) return;

    setIsProcessing(true);
    try {
      const sendAmount = parseFloat(ugxAmount);
      
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
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8">
          {/* Step 1: Enter recipient and amount */}
          {sendStep === 1 && (
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
                
                {/* UGX Input */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    UGX (Ugandan Shilling)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={ugxAmount}
                      onChange={(e) => handleUgxAmountChange(e.target.value)}
                      placeholder="10,000"
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-neutral-500">
                    Available: {formatCurrency(balance?.balance || 0)}
                  </p>
                </div>

                {/* USDT Input */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    USDT (Tether Equivalent)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={usdcAmount}
                      onChange={(e) => handleUsdcAmountChange(e.target.value)}
                      placeholder="25.00"
                      step="0.01"
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-neutral-500">
                    Available: ${((balance?.balance || 0) * 0.00026).toFixed(2)} USDT
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-neutral-600 font-medium">Exchange Rate</p>
                  <p className="text-sm text-neutral-800">1 USDT = {EXCHANGE_RATE.toLocaleString()} UGX</p>
                  {(ugxAmount || usdcAmount) && (
                    <p className="text-xs text-neutral-600 mt-1 sm:mt-2">
                      {ugxAmount ? `${parseFloat(ugxAmount).toLocaleString()} UGX` : ''} 
                      {ugxAmount && usdcAmount ? ' ≈ ' : ''}
                      {usdcAmount ? `$${parseFloat(usdcAmount).toFixed(2)} USDT` : ''}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSendStep(2)}
                disabled={!recipientPhone || !recipient || (!ugxAmount && !usdcAmount)}
                className="w-full bg-neutral-900 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Transaction summary */}
          {sendStep === 2 && (
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
                      {ugxAmount && (
                        <div>{parseFloat(ugxAmount).toLocaleString()} UGX</div>
                      )}
                      {ugxAmount && usdcAmount && (
                        <div className="text-xs sm:text-sm text-neutral-500">
                          ≈ ${parseFloat(usdcAmount).toFixed(2)} USDT
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Fee Row */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                    <span className="text-neutral-600 text-sm sm:text-base flex-shrink-0">Fee (1%):</span>
                    <span className="font-medium text-orange-600 text-sm sm:text-base font-mono break-words">
                      {ugxAmount && `${calculateFee(parseFloat(ugxAmount)).toLocaleString()} UGX`}
                    </span>
                  </div>
                  
                  {/* Total Row */}
                  <div className="border-t border-neutral-200 pt-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                      <span className="text-neutral-900 font-semibold text-sm sm:text-base flex-shrink-0">Total:</span>
                      <span className="text-neutral-900 font-mono font-semibold text-sm sm:text-base break-words">
                        {ugxAmount && `${(parseFloat(ugxAmount) + calculateFee(parseFloat(ugxAmount))).toLocaleString()} UGX`}
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

          {/* Step 3: Success */}
          {sendStep === 3 && transactionResult && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">Money Sent Successfully!</h3>
              <p className="text-neutral-600 mb-4 sm:mb-6 font-mono text-sm sm:text-base px-2 sm:px-4 break-words">
                <span className="font-semibold">{transactionResult.amount.toLocaleString()} UGX</span> has been sent to{' '}
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
                    <span className="font-mono">{transactionResult.fee.toLocaleString()} UGX</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-neutral-900 pt-1 border-t border-neutral-200">
                    <span>Total:</span>
                    <span className="font-mono">{(transactionResult.amount + transactionResult.fee).toLocaleString()} UGX</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setSendStep(1);
                    setRecipientPhone('');
                    setRecipient(null);
                    setUgxAmount('');
                    setUsdcAmount('');
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
