import React, { useState } from 'react';
import { Check, TrendingDown, DollarSign, X, Zap, Bitcoin } from 'lucide-react';
import { getActiveCurrencies, AfricanCurrency, AFRICAN_CURRENCIES } from '../types/currency';

const SavingsComparisonTable: React.FC = () => {
  const [amount, setAmount] = useState('100');
  const [toCountry, setToCountry] = useState<AfricanCurrency>('UGX');
  const [location, setLocation] = useState<'urban' | 'suburban' | 'rural' | 'remote'>('urban');

  const activeCurrencies = getActiveCurrencies().filter(c => c.code !== 'BTC');
  const toCurrency = AFRICAN_CURRENCIES[toCountry];
  
  const numAmount = parseFloat(amount) || 0;
  const useCkUSDC = numAmount < 100; // ckUSDC for small amounts (<$100), ckBTC for larger

  // AfriTokeni fees based on location (from TariffPage - REAL fees)
  const feeMap = {
    urban: 3.25,      // 2.5-4% average
    suburban: 4,      // 3-5% average
    rural: 5.5,       // 4-7% average
    remote: 9.5       // 7-12% average
  };
  const afriTokeniFeePercent = feeMap[location];
  const afriTokeniFee = (numAmount * afriTokeniFeePercent) / 100;

  // International remittance (NO SMS) - flat fees
  const westernUnionFee = numAmount < 100 ? 4.99 : numAmount < 500 ? 9.99 : numAmount < 1000 ? 24.99 : 49.99;
  const moneyGramFee = numAmount < 100 ? 4.99 : numAmount < 500 ? 9.99 : numAmount < 1000 ? 24.99 : 49.99;
  const worldRemitFee = numAmount < 100 ? 3.99 : numAmount < 500 ? 7.99 : numAmount < 1000 ? 19.99 : 39.99;
  
  // African mobile money (WITH SMS) - percentage fees
  const mPesaFee = numAmount * 0.13; // ~13% (10% fee + 3% FX markup)
  const mtnFee = numAmount * 0.11; // ~11%
  const airtelFee = numAmount * 0.10; // ~10%

  const avgCompetitorFee = (westernUnionFee + moneyGramFee + worldRemitFee + mPesaFee + mtnFee + airtelFee) / 6;
  const savingsDollar = Math.max(0, avgCompetitorFee - afriTokeniFee);
  const savings = avgCompetitorFee > 0 ? Math.max(0, Math.round((savingsDollar / avgCompetitorFee) * 100)) : 0;

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-green-50 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
            Save Up to {savings}% on Transfer Fees
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 sm:px-0">
            See How Much You Save
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
            Compare AfriTokeni with traditional money transfer services across 39 African countries
          </p>
        </div>

        {/* Calculator */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 lg:mb-12 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Amount */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Transfer Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Only allow numbers
                    if (val === '' || /^\d+$/.test(val)) {
                      setAmount(val);
                    }
                  }}
                  onBlur={() => {
                    // Ensure minimum value on blur
                    const num = parseFloat(amount) || 10;
                    if (num < 10) setAmount('10');
                  }}
                  placeholder="100"
                  className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Sending To
              </label>
              <select
                value={toCountry}
                onChange={(e) => setToCountry(e.target.value as AfricanCurrency)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base"
              >
                {activeCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.country} ({currency.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Type */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Recipient Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as 'urban' | 'suburban' | 'rural' | 'remote')}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base"
              >
                <option value="urban">Urban (City) - 2.5-4%</option>
                <option value="suburban">Suburban - 3-5%</option>
                <option value="rural">Rural (Village) - 4-7%</option>
                <option value="remote">Remote Area - 7-12%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comparison Table - Mobile Responsive */}
        <div className="block sm:hidden">
          {/* Mobile Card Layout */}
          <div className="space-y-3 sm:space-y-4">
            {/* AfriTokeni Card */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-lg flex items-center justify-center font-bold text-white text-sm">A</div>
                <div>
                  <div className="font-bold text-gray-900 text-sm sm:text-base">AfriTokeni</div>
                  <div className="text-xs text-gray-600 capitalize">{location} Rate</div>
                </div>
                <div className="ml-auto">
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                    BEST
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div><span className="font-semibold">Fee:</span> ${afriTokeniFee.toFixed(2)} ({afriTokeniFeePercent}%)</div>
                <div><span className="font-semibold">Speed:</span> Instant</div>
                <div><span className="font-semibold">USSD:</span> Yes</div>
                <div><span className="font-semibold">Countries:</span> 39</div>
              </div>
            </div>

            {/* Western Union Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <div className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Western Union</div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div><span className="font-semibold">Fee:</span> ${westernUnionFee.toFixed(2)}</div>
                <div><span className="font-semibold">Speed:</span> Minutes-Hours</div>
                <div><span className="font-semibold">USSD:</span> No</div>
                <div><span className="font-semibold">Countries:</span> 200+</div>
              </div>
            </div>

            {/* MoneyGram Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <div className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">MoneyGram</div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div><span className="font-semibold">Fee:</span> ${moneyGramFee.toFixed(2)}</div>
                <div><span className="font-semibold">Speed:</span> Minutes-Hours</div>
                <div><span className="font-semibold">USSD:</span> No</div>
                <div><span className="font-semibold">Countries:</span> 200+</div>
              </div>
            </div>

            {/* WorldRemit Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <div className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">WorldRemit</div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div><span className="font-semibold">Fee:</span> ${worldRemitFee.toFixed(2)}</div>
                <div><span className="font-semibold">Speed:</span> Minutes-Days</div>
                <div><span className="font-semibold">USSD:</span> No</div>
                <div><span className="font-semibold">Countries:</span> 150+</div>
              </div>
            </div>

            {/* M-Pesa Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <div className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">M-Pesa</div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div><span className="font-semibold">Fee:</span> ${mPesaFee.toFixed(2)}</div>
                <div><span className="font-semibold">Speed:</span> Minutes-Hours</div>
                <div><span className="font-semibold">USSD:</span> Yes</div>
                <div><span className="font-semibold">Countries:</span> East Africa</div>
              </div>
            </div>

            {/* MTN MoMo Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <div className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">MTN MoMo</div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div><span className="font-semibold">Fee:</span> ${mtnFee.toFixed(2)}</div>
                <div><span className="font-semibold">Speed:</span> Minutes-Hours</div>
                <div><span className="font-semibold">USSD:</span> Yes</div>
                <div><span className="font-semibold">Countries:</span> West/Central</div>
              </div>
            </div>

            {/* Airtel Money Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-semibold text-gray-900 mb-2">Airtel Money</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">Fee:</span> ${airtelFee.toFixed(2)}</div>
                <div><span className="font-semibold">Speed:</span> Minutes-Hours</div>
                <div><span className="font-semibold">USSD:</span> Yes</div>
                <div><span className="font-semibold">Countries:</span> 14</div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-xl shadow-lg overflow-hidden min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 lg:px-6 text-gray-700 font-bold text-xs sm:text-sm lg:text-base">
                  Provider
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-3 lg:px-4 text-gray-700 font-bold text-xs sm:text-sm lg:text-base">
                  Fee
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-3 lg:px-4 text-gray-700 font-bold text-xs sm:text-sm lg:text-base">
                  Speed
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-3 lg:px-4 text-gray-700 font-bold text-xs sm:text-sm lg:text-base">
                  USSD
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-3 lg:px-4 text-gray-700 font-bold text-xs sm:text-sm lg:text-base">
                  Bitcoin
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-3 lg:px-4 text-gray-700 font-bold text-xs sm:text-sm lg:text-base">
                  Coverage
                </th>
              </tr>
            </thead>
            <tbody>
              {/* AfriTokeni Row */}
              <tr className="border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 relative">
                <td className="py-4 sm:py-5 lg:py-6 px-3 sm:px-4 lg:px-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg">
                      A
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg flex items-center gap-2">
                        AfriTokeni
                        <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">BEST</span>
                      </div>
                      <div className="text-xs text-gray-600 capitalize">{location} Rate</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-6 text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-green-600">
                    ${afriTokeniFee.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-700 font-semibold mt-1">
                    {afriTokeniFeePercent}% fee
                  </div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold text-xs sm:text-sm">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <span className="hidden sm:inline">Instant</span>
                    <span className="sm:hidden">Fast</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">&lt;1 sec</div>
                  <div className="text-xs text-green-600 mt-1 font-semibold">{useCkUSDC ? 'ckUSDC' : 'ckBTC'}</div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-4 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold text-xs sm:text-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    Yes
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">*229#</div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-4 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold text-xs sm:text-sm">
                    <Bitcoin className="w-3 h-3 sm:w-4 sm:h-4" />
                    Yes
                  </div>
                  <div className="text-xs text-orange-600 mt-1 font-semibold">ckBTC</div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-4 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold text-xs sm:text-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    39
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">All Africa</div>
                </td>
              </tr>

              {/* Western Union Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 sm:py-5 lg:py-6 px-3 sm:px-4 lg:px-6">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg">Western Union</div>
                  <div className="text-xs text-gray-500">International</div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-6 text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">${westernUnionFee.toFixed(2)}</div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-6 text-center">
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">Min - Hours</div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-4 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-4 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-4 sm:py-5 lg:py-6 px-2 sm:px-3 lg:px-4 text-center">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">200+</div>
                </td>
              </tr>

              {/* MoneyGram Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">MoneyGram</div>
                  <div className="text-xs text-gray-500">International</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${moneyGramFee.toFixed(2)}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">200+</div>
                </td>
              </tr>

              {/* WorldRemit Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">WorldRemit</div>
                  <div className="text-xs text-gray-500">International</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${worldRemitFee.toFixed(2)}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Days</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">150+</div>
                </td>
              </tr>

              {/* M-Pesa Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">M-Pesa</div>
                  <div className="text-xs text-gray-500">International Transfer</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${mPesaFee.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">~13% total</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    Yes
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">East Africa</div>
                </td>
              </tr>

              {/* MTN Mobile Money Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">MTN MoMo</div>
                  <div className="text-xs text-gray-500">Cross-border</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${mtnFee.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">~11% total</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    Yes
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">West/Central</div>
                </td>
              </tr>

              {/* Airtel Money Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">Airtel Money</div>
                  <div className="text-xs text-gray-500">International</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${airtelFee.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">~10% total</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    Yes
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs sm:text-sm">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    No
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">14</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Savings Summary */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 lg:p-8 border border-green-200">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-green-600 mb-2">
              Save ${savingsDollar.toFixed(2)}
            </div>
            <div className="text-base sm:text-lg lg:text-xl text-gray-700">
              That&apos;s <span className="font-bold text-green-600">{savings}% less</span> than average competitor
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-2">
              Sending ${numAmount} to {toCurrency.country} ({location} area)
              {useCkUSDC && <span className="text-green-600 font-semibold"> • ckUSDC (Stablecoin)</span>}
              {!useCkUSDC && <span className="text-green-600 font-semibold"> • ckBTC (ICP Bitcoin)</span>}
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-xs sm:text-sm text-gray-500 max-w-3xl mx-auto leading-relaxed">
            * AfriTokeni uses ICP-native ckBTC (Bitcoin) and ckUSDC (stablecoin) for instant transfers. 
            Fees: 2.5-4% urban, 4-7% rural, 7-12% remote (fair agent compensation). 
            Mobile money: M-Pesa ~13%, MTN MoMo ~11%, Airtel Money ~10% (includes FX markups). 
            AfriTokeni works via USSD across all 39 African currencies.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            Start Saving Today
          </a>
        </div>
      </div>
    </section>
  );
};

export default SavingsComparisonTable;
