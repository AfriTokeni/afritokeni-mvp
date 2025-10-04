import React, { useState } from 'react';
import { Check, X, TrendingDown, DollarSign } from 'lucide-react';
import { getActiveCurrencies, AfricanCurrency, AFRICAN_CURRENCIES } from '../types/currency';

const SavingsComparisonTable: React.FC = () => {
  const [amount, setAmount] = useState(100);
  const [fromLocation, setFromLocation] = useState<'abroad' | 'africa'>('abroad');
  const [toCountry, setToCountry] = useState<AfricanCurrency>('UGX');
  const [location, setLocation] = useState<'urban' | 'suburban' | 'rural' | 'remote'>('urban');

  const activeCurrencies = getActiveCurrencies().filter(c => c.code !== 'BTC');
  const toCurrency = AFRICAN_CURRENCIES[toCountry];

  // AfriTokeni fees based on location (from TariffPage - REAL fees)
  const feeMap = {
    urban: 3.25,      // 2.5-4% average
    suburban: 4,      // 3-5% average
    rural: 5.5,       // 4-7% average
    remote: 9.5       // 7-12% average
  };
  const afriTokeniFeePercent = feeMap[location];
  const afriTokeniFee = (amount * afriTokeniFeePercent) / 100;

  // Competitor fees (real averages)
  const westernUnionFee = amount < 100 ? 4.99 : amount < 500 ? 9.99 : amount < 1000 ? 24.99 : 49.99;
  const moneyGramFee = amount < 100 ? 4.99 : amount < 500 ? 9.99 : amount < 1000 ? 24.99 : 49.99;
  const worldRemitFee = amount < 100 ? 3.99 : amount < 500 ? 7.99 : amount < 1000 ? 19.99 : 39.99;

  const avgCompetitorFee = (westernUnionFee + moneyGramFee + worldRemitFee) / 3;
  const savings = Math.round(((avgCompetitorFee - afriTokeniFee) / avgCompetitorFee) * 100);

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <TrendingDown className="w-4 h-4" />
            Save Up to {savings}% on Transfer Fees
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            See How Much You Save
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Compare AfriTokeni with traditional money transfer services across 39 African countries
          </p>
        </div>

        {/* Calculator */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-12 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transfer Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  min="10"
                  max="10000"
                />
              </div>
            </div>

            {/* From */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sending From
              </label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value as 'abroad' | 'africa')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="abroad">Outside Africa</option>
                <option value="africa">Within Africa</option>
              </select>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sending To
              </label>
              <select
                value={toCountry}
                onChange={(e) => setToCountry(e.target.value as AfricanCurrency)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {activeCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.country} ({currency.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recipient Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as 'urban' | 'suburban' | 'rural' | 'remote')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="urban">Urban (City) - 2.5-4%</option>
                <option value="suburban">Suburban - 3-5%</option>
                <option value="rural">Rural (Village) - 4-7%</option>
                <option value="remote">Remote Area - 7-12%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-xl shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 sm:px-6 text-gray-700 font-bold text-sm sm:text-base">
                  Provider
                </th>
                <th className="text-center py-4 px-4 sm:px-6 text-gray-700 font-bold text-sm sm:text-base">
                  Transfer Fee
                </th>
                <th className="text-center py-4 px-4 sm:px-6 text-gray-700 font-bold text-sm sm:text-base">
                  Speed
                </th>
                <th className="text-center py-4 px-4 sm:px-6 text-gray-700 font-bold text-sm sm:text-base">
                  SMS Access
                </th>
                <th className="text-center py-4 px-4 sm:px-6 text-gray-700 font-bold text-sm sm:text-base">
                  39 Countries
                </th>
              </tr>
            </thead>
            <tbody>
              {/* AfriTokeni Row */}
              <tr className="border-b border-gray-100 bg-green-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center font-bold text-white">
                      A
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-base sm:text-lg">AfriTokeni</div>
                      <div className="text-xs sm:text-sm text-gray-600 capitalize">{location} Rate</div>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    ${afriTokeniFee.toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-green-700 font-semibold mt-1">
                    {afriTokeniFeePercent}% fee
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm sm:text-base">
                    <Check className="w-5 h-5" />
                    Instant
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">Real-time</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm sm:text-base">
                    <Check className="w-5 h-5" />
                    Yes
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">Any phone</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm sm:text-base">
                    <Check className="w-5 h-5" />
                    Yes
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">All Africa</div>
                </td>
              </tr>

              {/* Western Union Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">Western Union</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${westernUnionFee.toFixed(2)}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-red-600">
                    <X className="w-5 h-5" />
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Limited</div>
                </td>
              </tr>

              {/* MoneyGram Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">MoneyGram</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${moneyGramFee.toFixed(2)}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-red-600">
                    <X className="w-5 h-5" />
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Limited</div>
                </td>
              </tr>

              {/* WorldRemit Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">WorldRemit</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${worldRemitFee.toFixed(2)}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Days</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-red-600">
                    <X className="w-5 h-5" />
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Limited</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Savings Summary */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">
              Save ${(avgCompetitorFee - afriTokeniFee).toFixed(2)}
            </div>
            <div className="text-lg sm:text-xl text-gray-700">
              That's <span className="font-bold text-green-600">{savings}% less</span> than traditional services
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Sending ${amount} to {toCurrency.country} ({location} area)
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 max-w-3xl mx-auto">
            * AfriTokeni fees vary by location (2.5-4% urban, 4-7% rural) to fairly compensate agents. 
            Traditional services may have additional hidden exchange rate markups. 
            All transfers work via SMS on any phone - no internet required.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <TrendingDown className="w-5 h-5" />
            Start Saving Today
          </a>
        </div>
      </div>
    </section>
  );
};

export default SavingsComparisonTable;
