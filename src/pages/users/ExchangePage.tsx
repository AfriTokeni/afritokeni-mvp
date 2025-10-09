import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Bitcoin, DollarSign, Users, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BitcoinService } from '../../services/bitcoinService';
import { AfricanCurrency, AFRICAN_CURRENCIES } from '../../types/currency';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';

interface Agent {
  id: string;
  name: string;
  location: string;
}

const ExchangePage: React.FC = () => {
  const navigate = useNavigate();
  const { } = useAfriTokeni();
  const [exchangeType, setExchangeType] = useState<'buy' | 'sell'>('sell');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<AfricanCurrency>('UGX');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [nearbyAgents] = useState<Agent[]>([
    { id: '1', name: 'John Mukasa', location: 'Kampala Central' },
    { id: '2', name: 'Sarah Nakato', location: 'Wandegeya' },
    { id: '3', name: 'David Okello', location: 'Ntinda' }
  ]);

  useEffect(() => {
    loadExchangeRate();
  }, [selectedCurrency]);

  const loadExchangeRate = async () => {
    try {
      const rate = await BitcoinService.getExchangeRate(selectedCurrency);
      setExchangeRate(rate.btcToLocal);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    }
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

  const calculateExchange = () => {
    const numAmount = parseFloat(amount) || 0;
    if (exchangeType === 'sell') {
      // Selling Bitcoin for local currency
      const btcAmount = numAmount / 100000000; // Convert satoshis to BTC
      return btcAmount * exchangeRate;
    } else {
      // Buying Bitcoin with local currency
      return numAmount / exchangeRate;
    }
  };

  const handleExchange = () => {
    if (exchangeType === 'sell') {
      navigate('/users/exchange/sell', { 
        state: { 
          amount, 
          currency: selectedCurrency, 
          rate: exchangeRate 
        } 
      });
    } else {
      navigate('/users/exchange/buy', { 
        state: { 
          amount, 
          currency: selectedCurrency, 
          rate: exchangeRate 
        } 
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Bitcoin Exchange
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Exchange Bitcoin</h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">Buy or sell Bitcoin for local African currencies through our agent network</p>
        </div>

        {/* Exchange Type Selector */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="bg-gray-100 rounded-lg p-0.5 sm:p-1 flex w-full max-w-sm">
              <button
                onClick={() => setExchangeType('sell')}
                className={`flex-1 px-4 sm:px-6 py-2 rounded-md font-medium text-xs sm:text-sm transition-colors ${
                  exchangeType === 'sell'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sell Bitcoin
              </button>
              <button
                onClick={() => setExchangeType('buy')}
                className={`flex-1 px-4 sm:px-6 py-2 rounded-md font-medium text-xs sm:text-sm transition-colors ${
                  exchangeType === 'buy'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Buy Bitcoin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Exchange Form */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {exchangeType === 'sell' ? 'Bitcoin Amount (Satoshis)' : 'Local Currency Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={exchangeType === 'sell' ? '50000' : '100000'}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono pr-12 sm:pr-16"
                  />
                  <div className="absolute right-2 sm:right-3 top-2.5 sm:top-3 text-gray-500 text-xs sm:text-sm">
                    {exchangeType === 'sell' ? 'sats' : selectedCurrency}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as AfricanCurrency)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(AFRICAN_CURRENCIES).map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.name} ({code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exchange Preview */}
              {amount && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">You {exchangeType}:</span>
                    <span className="font-mono font-semibold text-sm sm:text-base">
                      {exchangeType === 'sell' 
                        ? `${amount} sats` 
                        : formatCurrency(parseFloat(amount) || 0, selectedCurrency)
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">You receive:</span>
                    <span className="font-mono font-semibold text-green-600 text-sm sm:text-base">
                      {exchangeType === 'sell'
                        ? formatCurrency(calculateExchange(), selectedCurrency)
                        : `₿${calculateExchange().toFixed(8)}`
                      }
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Exchange rate:</span>
                      <span className="text-right">1 BTC = {formatCurrency(exchangeRate, selectedCurrency)}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleExchange}
                disabled={!amount}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {`${exchangeType === 'sell' ? 'Sell' : 'Buy'} Bitcoin`}
              </button>
            </div>

            {/* Exchange Info */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <Bitcoin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">How it works</h3>
                </div>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">1</span>
                    </div>
                    <span>Choose amount and currency</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">2</span>
                    </div>
                    <span>Find nearby agent for cash exchange</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">3</span>
                    </div>
                    <span>Complete exchange with agent</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">4</span>
                    </div>
                    <span>Bitcoin transferred instantly</span>
                  </div>
                </div>
              </div>

              {/* Nearby Agents */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Nearby Agents</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {nearbyAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-semibold text-xs">
                            {agent.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{agent.name}</p>
                          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{agent.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center space-x-1 text-xs text-green-600">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/users/agents')}
                  className="w-full mt-3 sm:mt-4 text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
                >
                  View all agents →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Alternative */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
              <span className="text-blue-600 font-semibold text-xs sm:text-sm">SMS</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Exchange via SMS</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-base">
                You can also exchange Bitcoin using SMS commands from any phone:
              </p>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded border text-xs sm:text-sm">
                  <strong>BTC SELL 50000 {selectedCurrency}</strong> - Sell 50,000 satoshis for {selectedCurrency}
                </div>
                <div className="font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded border text-xs sm:text-sm">
                  <strong>BTC BUY 100000 {selectedCurrency}</strong> - Buy Bitcoin with 100,000 {selectedCurrency}
                </div>
                <div className="font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded border text-xs sm:text-sm">
                  <strong>BTC RATE {selectedCurrency}</strong> - Get current exchange rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">~2 min</div>
            <div className="text-gray-600 text-xs sm:text-sm">Average exchange time</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{nearbyAgents.length}+</div>
            <div className="text-gray-600 text-xs sm:text-sm">Active agents</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">2.5%</div>
            <div className="text-gray-600 text-xs sm:text-sm">Exchange fee</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;
