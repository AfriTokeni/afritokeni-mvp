import React, { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';

interface ComparisonRow {
  amount: string;
  afritokeni: string;
  westernUnion: string;
  moneyGram: string;
  worldRemit: string;
  savings: string;
}

const SavingsComparisonTable: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState('100');

  const comparisonData: Record<string, ComparisonRow> = {
    '50': {
      amount: '$50',
      afritokeni: '$0.05',
      westernUnion: '$4.99',
      moneyGram: '$4.99',
      worldRemit: '$3.99',
      savings: '99%'
    },
    '100': {
      amount: '$100',
      afritokeni: '$0.10',
      westernUnion: '$9.99',
      moneyGram: '$9.99',
      worldRemit: '$7.99',
      savings: '99%'
    },
    '500': {
      amount: '$500',
      afritokeni: '$2.50',
      westernUnion: '$24.99',
      moneyGram: '$24.99',
      worldRemit: '$19.99',
      savings: '90%'
    },
    '1000': {
      amount: '$1,000',
      afritokeni: '$5.00',
      westernUnion: '$49.99',
      moneyGram: '$49.99',
      worldRemit: '$39.99',
      savings: '90%'
    }
  };

  const data = comparisonData[selectedAmount];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Zap className="w-4 h-4" />
            Save Up to 99% on Fees
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            See How Much You Save
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Compare AfriTokeni's Lightning Network fees with traditional money transfer services
          </p>
        </div>

        {/* Amount Selector */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-12 flex-wrap">
          {Object.keys(comparisonData).map((amount) => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedAmount === amount
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {comparisonData[amount].amount}
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 sm:px-6 text-gray-600 font-semibold text-sm sm:text-base">
                  Provider
                </th>
                <th className="text-center py-4 px-4 sm:px-6 text-gray-600 font-semibold text-sm sm:text-base">
                  Transfer Fee
                </th>
                <th className="text-center py-4 px-4 sm:px-6 text-gray-600 font-semibold text-sm sm:text-base">
                  Speed
                </th>
                <th className="text-center py-4 px-4 sm:px-6 text-gray-600 font-semibold text-sm sm:text-base">
                  SMS Access
                </th>
              </tr>
            </thead>
            <tbody>
              {/* AfriTokeni Row */}
              <tr className="border-b border-gray-100 bg-green-50">
                <td className="py-6 px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-base sm:text-lg">AfriTokeni</div>
                      <div className="text-xs sm:text-sm text-gray-600">Lightning Network</div>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">{data.afritokeni}</div>
                  <div className="text-xs sm:text-sm text-green-700 font-semibold mt-1">
                    Save {data.savings}
                  </div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm sm:text-base">
                    <Check className="w-5 h-5" />
                    Instant
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">&lt;1 second</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm sm:text-base">
                    <Check className="w-5 h-5" />
                    Yes
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">Any phone</div>
                </td>
              </tr>

              {/* Western Union Row */}
              <tr className="border-b border-gray-100">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">Western Union</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{data.westernUnion}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-red-600">
                    <X className="w-5 h-5" />
                  </div>
                </td>
              </tr>

              {/* MoneyGram Row */}
              <tr className="border-b border-gray-100">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">MoneyGram</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{data.moneyGram}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Hours</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-red-600">
                    <X className="w-5 h-5" />
                  </div>
                </td>
              </tr>

              {/* WorldRemit Row */}
              <tr className="border-b border-gray-100">
                <td className="py-6 px-4 sm:px-6">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">WorldRemit</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{data.worldRemit}</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="text-sm sm:text-base text-gray-600">Minutes - Days</div>
                </td>
                <td className="py-6 px-4 sm:px-6 text-center">
                  <div className="inline-flex items-center gap-1 text-red-600">
                    <X className="w-5 h-5" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            * Fees based on {data.amount} transfer to Uganda. Lightning Network fees for transfers under $100. 
            Traditional services may have additional hidden exchange rate markups.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Zap className="w-5 h-5" />
            Start Saving Today
          </a>
        </div>
      </div>
    </section>
  );
};

export default SavingsComparisonTable;
