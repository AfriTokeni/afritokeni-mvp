/**
 * DAO Dashboard
 * Main governance interface for AfriTokeni DAO
 */

import React, { useState, useEffect } from 'react';
import { Vote as VoteIcon, TrendingUp, Users, Coins, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { AfriTokenService, TokenBalance } from '../../services/afriTokenService';
import { GovernanceService, Proposal } from '../../services/governanceService';

const DAODashboard: React.FC = () => {
  const { user } = useAuthentication();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<'proposals' | 'my-tokens' | 'leaderboard'>('proposals');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user?.user?.id) {
        const balance = await AfriTokenService.getBalance(user.user.id);
        setTokenBalance(balance);
      }
      const activeProposals = await GovernanceService.getActiveProposals();
      setProposals(activeProposals);
    } catch (error) {
      console.error('Error loading DAO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, choice: 'yes' | 'no' | 'abstain') => {
    if (!user?.user?.id || !tokenBalance) return;

    try {
      await GovernanceService.vote(proposalId, user.user.id, choice, tokenBalance.balance);
      await loadData();
      alert(`Vote cast: ${choice.toUpperCase()}`);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to cast vote');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'passed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'executed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <VoteIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">AfriTokeni DAO</h1>
            <p className="text-neutral-600">Community Governance</p>
          </div>
        </div>

        {/* Token Balance Card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">Your Voting Power</div>
              <div className="text-4xl font-bold font-mono">
                {tokenBalance?.balance.toLocaleString() || 0} AFRI
              </div>
              <div className="text-sm opacity-75 mt-2">
                {tokenBalance?.locked || 0} locked in active votes
              </div>
            </div>
            <Coins className="w-16 h-16 opacity-20" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <VoteIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">{proposals.length}</div>
              <div className="text-sm text-neutral-600">Active Proposals</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {tokenBalance?.earned.transactions || 0}
              </div>
              <div className="text-sm text-neutral-600">AFRI Earned</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">1.2M</div>
              <div className="text-sm text-neutral-600">Total Holders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'proposals'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Proposals
        </button>
        <button
          onClick={() => setActiveTab('my-tokens')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'my-tokens'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          My Tokens
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900">Active Proposals</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4" />
              Create Proposal
            </button>
          </div>

          {proposals.map((proposal) => {
            const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
            const yesPercentage = calculateVotePercentage(proposal.votes.yes, totalVotes);
            const noPercentage = calculateVotePercentage(proposal.votes.no, totalVotes);

            return (
              <div key={proposal.id} className="bg-white rounded-xl p-6 border border-neutral-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)}`}>
                        {proposal.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-neutral-500">{proposal.id}</span>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{proposal.title}</h3>
                    <p className="text-neutral-600 mb-4">{proposal.description}</p>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-neutral-600">Voting Progress</span>
                    <span className="text-neutral-900 font-semibold">
                      {totalVotes.toLocaleString()} votes
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500"
                      style={{ width: `${yesPercentage}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${noPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-green-600 font-semibold">
                      {yesPercentage}% Yes ({proposal.votes.yes.toLocaleString()})
                    </span>
                    <span className="text-red-600 font-semibold">
                      {noPercentage}% No ({proposal.votes.no.toLocaleString()})
                    </span>
                  </div>
                </div>

                {/* Voting Buttons */}
                {proposal.status === 'active' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, 'yes')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Vote Yes
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'no')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Vote No
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'abstain')}
                      className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                    >
                      Abstain
                    </button>
                  </div>
                )}

                {/* Time Remaining */}
                <div className="flex items-center gap-2 mt-4 text-sm text-neutral-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    Ends: {new Date(proposal.votingEndsAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My Tokens Tab */}
      {activeTab === 'my-tokens' && tokenBalance && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Token Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">From Transactions</span>
                <span className="font-semibold text-neutral-900">
                  {tokenBalance.earned.transactions.toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">From Agent Activity</span>
                <span className="font-semibold text-neutral-900">
                  {tokenBalance.earned.agentActivity.toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">From Referrals</span>
                <span className="font-semibold text-neutral-900">
                  {tokenBalance.earned.referrals.toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">From Staking</span>
                <span className="font-semibold text-neutral-900">
                  {tokenBalance.earned.staking.toLocaleString()} AFRI
                </span>
              </div>
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="font-bold text-neutral-900">Total Balance</span>
                <span className="font-bold text-purple-600 text-xl">
                  {tokenBalance.balance.toLocaleString()} AFRI
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-neutral-900 mb-3">📱 Earn AFRI via SMS</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="text-neutral-700">
                <span className="text-blue-600">AFRI</span> - Check your AFRI balance
              </div>
              <div className="text-neutral-700">
                <span className="text-blue-600">VOTE YES PROP-001</span> - Vote on proposals
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Top Token Holders</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((rank) => (
              <div key={rank} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                    rank === 2 ? 'bg-gray-300 text-gray-700' :
                    rank === 3 ? 'bg-orange-400 text-orange-900' :
                    'bg-neutral-200 text-neutral-600'
                  }`}>
                    {rank}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">User {rank}</div>
                    <div className="text-sm text-neutral-500">Agent/User</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-neutral-900">
                    {(15000 - rank * 1000).toLocaleString()} AFRI
                  </div>
                  <div className="text-sm text-neutral-500">
                    {((15000 - rank * 1000) / 10000).toFixed(1)}% of supply
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DAODashboard;
