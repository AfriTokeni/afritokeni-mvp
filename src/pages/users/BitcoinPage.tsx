import React, { useState, useEffect } from 'react';
import { Bitcoin, Copy, QrCode, RefreshCw, Send, ArrowDown, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BitcoinService } from '../../services/bitcoinService';
import { AfricanCurrency, AFRICAN_CURRENCIES } from '../../types/currency';

const BitcoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [bitcoinBalance, setBitcoinBalance] = useState(0);
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [selectedCurrency, setSelectedCurrency] = useState<AfricanCurrency>('UGX');
  const [loading, setLoading] = useState(true);
  const [addressCopied, setAddressCopied] = useState(false);

  useEffect(() => {
    loadBitcoinData();
  }, []);

  const loadBitcoinData = async () => {
    try {
      setLoading(true);
      
      // Generate or load Bitcoin wallet
      const wallet = await BitcoinService.createBitcoinWallet('user-wallet-id');
      setBitcoinAddress(wallet.address);
      
      // Get Bitcoin balance
      const balance = await BitcoinService.getBitcoinBalance(wallet.address);
      setBitcoinBalance(balance);
      
      // Load exchange rates for popular currencies
      const currencies: AfricanCurrency[] = ['UGX', 'KES', 'NGN', 'ZAR', 'GHS', 'EGP'];
      const rates: Record<string, number> = {};
      
      for (const currency of currencies) {
        const rate = await BitcoinService.getExchangeRate(currency);
        rates[currency] = rate.btcToLocal;
      }
      
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error loading Bitcoin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(bitcoinAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const formatBitcoin = (satoshis: number): string => {
    return BitcoinService.satoshisToBtc(satoshis).toFixed(8);
  };

  const formatCurrency = (amount: number, currency: AfricanCurrency): string => {
    const currencyInfo = AFRICAN_CURRENCIES[currency];
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency === 'XOF' || currency === 'XAF' ? 'XOF' : currency,
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals
    }).format(amount);
  };

  const getBitcoinValueInCurrency = (currency: AfricanCurrency): number => {
    const rate = exchangeRates[currency] || 0;
    return BitcoinService.satoshisToBtc(bitcoinBalance) * rate;
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-64 sm:min-h-96">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">Loading Bitcoin wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-100 text-orange-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <Bitcoin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Real Bitcoin Integration
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Bitcoin Wallet</h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">Manage your Bitcoin and exchange for local currencies</p>
        </div>

        {/* Bitcoin Balance Card */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Bitcoin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Bitcoin Balance</h2>
                <p className="text-gray-600 text-xs sm:text-sm">Real Bitcoin wallet</p>
              </div>
            </div>
            <button
              onClick={loadBitcoinData}
              className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
              title="Refresh balance"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono mb-2">
                ₿{formatBitcoin(bitcoinBalance)}
              </div>
              <div className="text-base sm:text-lg text-gray-600">
                ≈ {formatCurrency(getBitcoinValueInCurrency(selectedCurrency), selectedCurrency)}
              </div>
            </div>
            
            {/* Currency Selector */}
            <div className="flex justify-center">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as AfricanCurrency)}
                className="bg-white border border-orange-200 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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

        {/* Bitcoin Address Card */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Your Bitcoin Address</h3>
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="font-mono text-xs sm:text-sm text-gray-900 break-all mb-2 sm:mb-3">
              {bitcoinAddress}
            </div>
            <button
              onClick={copyAddress}
              className={`inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                addressCopied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {addressCopied ? 'Copied!' : 'Copy Address'}
            </button>
          </div>
          
          <p className="text-gray-600 text-xs sm:text-sm">
            Send Bitcoin to this address to add funds to your wallet. Only send Bitcoin (BTC) to this address.
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bitcoin Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/users/bitcoin/send')}
              className="bg-white border border-gray-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-blue-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-200 transition-colors">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Send Bitcoin</span>
            </button>

            <button
              onClick={() => navigate('/users/bitcoin/receive')}
              className="bg-white border border-gray-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-green-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-green-200 transition-colors">
                <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Receive Bitcoin</span>
            </button>

            <button
              onClick={() => navigate('/users/bitcoin/deposit')}
              className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-orange-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-orange-200 transition-colors">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Exchange Bitcoin</div>
              <div className="text-xs sm:text-sm text-gray-600">Send from external wallet for cash</div>
            </button>

            <button
              onClick={() => navigate('/users/exchange')}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center group hover:border-blue-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-200 transition-colors">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Buy Bitcoin</div>
              <div className="text-xs sm:text-sm text-gray-600">Purchase with cash</div>
            </button>

          </div>
        </div>

        {/* Exchange Rates */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Live Exchange Rates</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Current Bitcoin prices in African currencies</p>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(exchangeRates).map(([currency, rate]) => {
                const currencyInfo = AFRICAN_CURRENCIES[currency as AfricanCurrency];
                return (
                  <div key={currency} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <span className="font-mono text-xs bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                          {currency}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600 truncate">{currencyInfo?.name}</span>
                      </div>
                    </div>
                    <div className="font-mono text-sm sm:text-lg font-semibold text-gray-900">
                      1 BTC = {formatCurrency(rate, currency as AfricanCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SMS Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
              <span className="text-blue-600 font-semibold text-xs sm:text-sm">SMS</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Use Bitcoin via SMS</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-base">
                You can also manage Bitcoin using SMS commands from any phone:
              </p>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded border text-xs sm:text-sm">
                  <strong>BTC BAL</strong> - Check Bitcoin balance
                </div>
                <div className="font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded border text-xs sm:text-sm">
                  <strong>BTC RATE {selectedCurrency}</strong> - Get exchange rate
                </div>
                <div className="font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded border text-xs sm:text-sm">
                  <strong>BTC SELL 50000 {selectedCurrency}</strong> - Sell Bitcoin for local currency
                </div>
                <div className="font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded border text-xs sm:text-sm">
                  <strong>BTC BUY 100000 {selectedCurrency}</strong> - Buy Bitcoin with local currency
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinPage;
