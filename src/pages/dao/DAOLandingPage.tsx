import React from 'react';
import { Link } from 'react-router-dom';
import { Vote, Coins, Users, TrendingUp, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';

const DAOLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Vote className="w-5 h-5" />
              <span className="font-semibold">Community-Owned Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              AfriTokeni DAO
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              The first SMS-accessible DAO bringing democratic governance to 14.6 million unbanked Africans
            </p>
          </div>
        </div>
      </div>

      {/* What is DAO Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What is a DAO?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A Decentralized Autonomous Organization where every token holder has a voice in platform decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Owned</h3>
              <p className="text-gray-600">
                No single owner. Platform controlled by AFRI token holders through democratic voting.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-8 border border-cyan-100">
              <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center mb-4">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Democratic Governance</h3>
              <p className="text-gray-600">
                Vote on fees, features, and policies. 1 AFRI = 1 vote. Even via SMS for offline users.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8 border border-teal-100">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent & Secure</h3>
              <p className="text-gray-600">
                All decisions on-chain. Smart contracts execute approved proposals automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AFRI Token Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
              <Coins className="w-5 h-5" />
              <span className="font-semibold">AFRI Governance Token</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Token Allocation</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              1 Billion AFRI tokens distributed to align incentives across the ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Allocation Chart */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Distribution Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">Community (40%)</span>
                    <span className="text-gray-600">400M AFRI</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Agents: 250M | Users: 150M</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">Treasury (30%)</span>
                    <span className="text-gray-600">300M AFRI</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-cyan-500 to-teal-500 h-3 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">DAO-controlled for ecosystem growth</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">Investors (20%)</span>
                    <span className="text-gray-600">200M AFRI</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-teal-500 to-green-500 h-3 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Seed: 50M | Private: 100M | Public: 50M</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">Team (10%)</span>
                    <span className="text-gray-600">100M AFRI</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">4-year vesting with 1-year cliff</p>
                </div>
              </div>
            </div>

            {/* Token Utility */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Token Utility</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Governance Voting</h4>
                    <p className="text-gray-600 text-sm">1 AFRI = 1 vote on platform decisions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Staking Rewards</h4>
                    <p className="text-gray-600 text-sm">Earn 5 AFRI per day per 1,000 AFRI staked</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Fee Discounts</h4>
                    <p className="text-gray-600 text-sm">Token holders get reduced transaction fees</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Premium Features</h4>
                    <p className="text-gray-600 text-sm">Access advanced platform capabilities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Voting Power Multiplier</h4>
                    <p className="text-gray-600 text-sm">Longer staking = More voting power (up to 3x)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earning AFRI Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Earn AFRI Tokens</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How to Earn AFRI</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automatic rewards for platform activity - no manual claiming required
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Users */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Users</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Per Transaction</span>
                  <span className="font-bold text-blue-600">10 AFRI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Large Transaction (&gt;100K UGX)</span>
                  <span className="font-bold text-blue-600">15 AFRI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Per Referral</span>
                  <span className="font-bold text-blue-600">25 AFRI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Staking (per day per 1K AFRI)</span>
                  <span className="font-bold text-blue-600">5 AFRI</span>
                </div>
                <div className="border-t border-blue-200 pt-4 mt-4">
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-2">Example Monthly Earnings:</p>
                    <p className="text-gray-900">
                      <span className="font-semibold">10 transactions + 2 referrals + 1K AFRI staked</span>
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">300 AFRI/month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Agents */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Agents</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Per Deposit Processed</span>
                  <span className="font-bold text-green-600">50 AFRI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Per Withdrawal Processed</span>
                  <span className="font-bold text-green-600">50 AFRI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Per Bitcoin Exchange</span>
                  <span className="font-bold text-green-600">100 AFRI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Remote Service Multiplier</span>
                  <span className="font-bold text-green-600">2x</span>
                </div>
                <div className="border-t border-green-200 pt-4 mt-4">
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-2">Example Monthly Earnings (Rural):</p>
                    <p className="text-gray-900">
                      <span className="font-semibold">20 deposits + 15 withdrawals + 5 BTC exchanges</span>
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-2">4,500 AFRI/month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Governance Process */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Governance Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, transparent process for platform decisions
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Propose</h3>
              <p className="text-gray-600 text-sm">
                Any holder with 10K AFRI can create a proposal
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Vote</h3>
              <p className="text-gray-600 text-sm">
                7-day voting period. Vote via web or SMS
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Approve</h3>
              <p className="text-gray-600 text-sm">
                51% YES + 10% quorum required to pass
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Execute</h3>
              <p className="text-gray-600 text-sm">
                Smart contracts execute automatically
              </p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">What Can Be Governed?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Fee Structures</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Transaction fees</li>
                  <li>• Agent commissions</li>
                  <li>• Withdrawal fees</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Platform Features</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• New currencies</li>
                  <li>• Technical upgrades</li>
                  <li>• Agent standards</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Treasury Management</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Budget allocation</li>
                  <li>• Marketing spend</li>
                  <li>• Community grants</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Voting */}
      <div className="py-20 bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">World First</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Vote via SMS</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              The first DAO accessible to feature phone users - no internet required
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-white/20">
            <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm">
              <div className="text-green-400 mb-4">
                📱 USSD: *384*22948#
              </div>
              <div className="text-gray-300 mb-2">
                &gt; 8. DAO Governance
              </div>
              <div className="text-gray-300 mb-2">
                &gt; 2. Vote on Proposal
              </div>
              <div className="text-white mb-4">
                Proposal #42: "Reduce urban agent fees from 3% to 2.5%"
              </div>
              <div className="text-gray-400 mb-2">
                Current votes:
              </div>
              <div className="text-green-400 mb-1">
                ✅ Yes: 45,234,123 AFRI (62%)
              </div>
              <div className="text-red-400 mb-4">
                ❌ No: 27,891,456 AFRI (38%)
              </div>
              <div className="text-yellow-400 mb-2">
                Your voting power: 1,250 AFRI
              </div>
              <div className="text-white">
                1. Vote YES | 2. Vote NO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Join the AfriTokeni DAO
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start earning AFRI tokens and participate in platform governance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dao"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              View DAO Dashboard
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default DAOLandingPage;
