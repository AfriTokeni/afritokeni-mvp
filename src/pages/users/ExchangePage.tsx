import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Bitcoin, DollarSign, Users, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
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
    <PageLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Bitcoin Exchange
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Exchange Bitcoin</h1>
          <p className="text-neutral-600">Buy or sell Bitcoin for local African currencies through our agent network</p>
        </div>

        {/* Exchange Type Selector */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-neutral-100 rounded-lg p-1 flex">
              <button
                onClick={() => setExchangeType('sell')}
                className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                  exchangeType === 'sell'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Sell Bitcoin
              </button>
              <button
                onClick={() => setExchangeType('buy')}
                className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                  exchangeType === 'buy'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Buy Bitcoin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Exchange Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {exchangeType === 'sell' ? 'Bitcoin Amount (Satoshis)' : 'Local Currency Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={exchangeType === 'sell' ? '50000' : '100000'}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <div className="absolute right-3 top-3 text-neutral-500 text-sm">
                    {exchangeType === 'sell' ? 'sats' : selectedCurrency}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as AfricanCurrency)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">You {exchangeType}:</span>
                    <span className="font-mono font-semibold">
                      {exchangeType === 'sell' 
                        ? `${amount} sats` 
                        : formatCurrency(parseFloat(amount) || 0, selectedCurrency)
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">You receive:</span>
                    <span className="font-mono font-semibold text-green-600">
                      {exchangeType === 'sell'
                        ? formatCurrency(calculateExchange(), selectedCurrency)
                        : `₿${calculateExchange().toFixed(8)}`
                      }
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-neutral-200">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Exchange rate:</span>
                      <span>1 BTC = {formatCurrency(exchangeRate, selectedCurrency)}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleExchange}
                disabled={!amount}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {`${exchangeType === 'sell' ? 'Sell' : 'Buy'} Bitcoin`}
              </button>
            </div>

            {/* Exchange Info */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Bitcoin className="w-6 h-6 text-orange-600" />
                  <h3 className="font-semibold text-neutral-900">How it works</h3>
                </div>
                <div className="space-y-3 text-sm text-neutral-700">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">1</span>
                    </div>
                    <span>Choose amount and currency</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">2</span>
                    </div>
                    <span>Find nearby agent for cash exchange</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">3</span>
                    </div>
                    <span>Complete exchange with agent</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 font-semibold text-xs">4</span>
                    </div>
                    <span>Bitcoin transferred instantly</span>
                  </div>
                </div>
              </div>

              {/* Nearby Agents */}
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-5 h-5 text-neutral-600" />
                  <h3 className="font-semibold text-neutral-900">Nearby Agents</h3>
                </div>
                <div className="space-y-3">
                  {nearbyAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                          <span className="text-neutral-600 font-semibold text-xs">
                            {agent.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">{agent.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-neutral-500">
                            <MapPin className="w-3 h-3" />
                            <span>{agent.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-xs text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/users/agents')}
                  className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View all agents →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Alternative */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-blue-600 font-semibold text-sm">SMS</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Exchange via SMS</h3>
              <p className="text-neutral-600 mb-4">
                You can also exchange Bitcoin using SMS commands from any phone:
              </p>
              <div className="space-y-2 text-sm">
                <div className="font-mono bg-white px-3 py-2 rounded border">
                  <strong>BTC SELL 50000 {selectedCurrency}</strong> - Sell 50,000 satoshis for {selectedCurrency}
                </div>
                <div className="font-mono bg-white px-3 py-2 rounded border">
                  <strong>BTC BUY 100000 {selectedCurrency}</strong> - Buy Bitcoin with 100,000 {selectedCurrency}
                </div>
                <div className="font-mono bg-white px-3 py-2 rounded border">
                  <strong>BTC RATE {selectedCurrency}</strong> - Get current exchange rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">~2 min</div>
            <div className="text-neutral-600 text-sm">Average exchange time</div>
          </div>
          
          <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">{nearbyAgents.length}+</div>
            <div className="text-neutral-600 text-sm">Active agents</div>
          </div>
          
          <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">2.5%</div>
            <div className="text-neutral-600 text-sm">Exchange fee</div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ExchangePage;
