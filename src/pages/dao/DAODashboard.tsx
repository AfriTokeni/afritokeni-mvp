/**
 * DAO Dashboard
 * Main governance interface for AfriTokeni DAO
 */

import React, { useState, useEffect } from 'react';
import { Vote as VoteIcon, TrendingUp, Users, Coins, Plus, CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { AfriTokenService, TokenBalance } from '../../services/afriTokenService';
import { GovernanceService, Proposal } from '../../services/governanceService';
import CreateProposalModal from '../../components/CreateProposalModal';

const DAODashboard: React.FC = () => {
  const { user } = useAuthentication();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<'proposals' | 'my-tokens' | 'leaderboard'>('proposals');
  const [, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [totalHolders, setTotalHolders] = useState(0);
  const [showEarnInfo, setShowEarnInfo] = useState(false);

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
      
      // Load real leaderboard data
      const leaderboardData = await AfriTokenService.getLeaderboard(10);
      setLeaderboard(leaderboardData);
      setTotalHolders(leaderboardData.length);
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
      case 'executed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Token Balance Card - Same style as Dashboard */}
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg md:rounded-xl flex items-center justify-center">
              <Coins className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">AFRI Token Balance</h3>
              <p className="text-xs md:text-sm text-gray-600">Your voting power</p>
            </div>
          </div>
          <button
            onClick={() => setShowEarnInfo(!showEarnInfo)}
            className="flex items-center gap-2 text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors self-start sm:self-auto"
          >
            <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
            <span>How to earn?</span>
          </button>
        </div>
        
        <div className="mb-3 md:mb-4">
          <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 font-mono">
            {tokenBalance?.balance.toLocaleString() || 0}
          </span>
          <span className="text-lg sm:text-xl md:text-2xl text-gray-600 ml-2">AFRI</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 md:pt-4 border-t border-gray-100 space-y-2 sm:space-y-0">
          <span className="text-gray-600 text-xs md:text-sm">{tokenBalance?.locked || 0} locked in active votes</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600 font-medium text-xs md:text-sm">Active</span>
          </div>
        </div>
        
        {/* Earn Info Dropdown */}
        {showEarnInfo && (
          <div className="mt-3 md:mt-4 p-4 md:p-6 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200">
            <h3 className="font-bold text-lg md:text-xl lg:text-2xl mb-2 md:mb-3 text-gray-900">How to Earn AFRI Tokens</h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span><strong>Make Transactions:</strong> Earn 10 AFRI per transaction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span><strong>Agent Activity:</strong> Agents earn 50 AFRI per customer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span><strong>Vote on Proposals:</strong> Earn 5 AFRI for participating</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span><strong>Referrals:</strong> Earn 100 AFRI per new user</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center">
              <VoteIcon className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{proposals.length}</div>
              <div className="text-xs md:text-sm text-gray-600">Active Proposals</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-green-50 rounded-lg md:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {tokenBalance?.earned.transactions || 0}
              </div>
              <div className="text-xs md:text-sm text-gray-600">AFRI Earned</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-lg md:rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {totalHolders > 0 ? totalHolders.toLocaleString() : '—'}
              </div>
              <div className="text-xs md:text-sm text-gray-600">Token Holders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 md:gap-2 mb-4 md:mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'proposals'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Proposals
        </button>
        <button
          onClick={() => setActiveTab('my-tokens')}
          className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'my-tokens'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Tokens
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4 space-y-3 sm:space-y-0">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">Active Proposals</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm md:text-base self-start sm:self-auto"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              Create Proposal
            </button>
          </div>

          {proposals.map((proposal) => {
            const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
            const yesPercentage = calculateVotePercentage(proposal.votes.yes, totalVotes);
            const noPercentage = calculateVotePercentage(proposal.votes.no, totalVotes);

            return (
              <div key={proposal.id} className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 md:mb-4 space-y-3 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-2">
                      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)} w-fit`}>
                        {proposal.status.toUpperCase()}
                      </span>
                      <span className="text-xs md:text-sm text-gray-500">{proposal.id}</span>
                    </div>
                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2">{proposal.title}</h3>
                    <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{proposal.description}</p>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="mb-3 md:mb-4">
                  <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                    <span className="text-gray-600">Voting Progress</span>
                    <span className="text-gray-900 font-semibold">
                      {totalVotes.toLocaleString()} votes
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500"
                      style={{ width: `${yesPercentage}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${noPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs md:text-sm">
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
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, 'yes')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
                    >
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                      Vote Yes
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'no')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
                    >
                      <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                      Vote No
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'abstain')}
                      className="sm:flex-initial px-4 md:px-6 py-2 md:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                    >
                      Abstain
                    </button>
                  </div>
                )}

                {/* Time Remaining */}
                <div className="flex items-center gap-2 mt-3 md:mt-4 text-xs md:text-sm text-gray-500">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
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
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">Token Breakdown</h2>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600">From Transactions</span>
                <span className="font-semibold text-sm md:text-base text-gray-900">
                  {tokenBalance.earned.transactions.toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600">From Agent Activity</span>
                <span className="font-semibold text-sm md:text-base text-gray-900">
                  {tokenBalance.earned.agentActivity.toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600">From Referrals</span>
                <span className="font-semibold text-sm md:text-base text-gray-900">
                  {tokenBalance.earned.referrals.toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600">From Staking</span>
                <span className="font-semibold text-sm md:text-base text-gray-900">
                  {tokenBalance.earned.staking.toLocaleString()} AFRI
                </span>
              </div>
              <div className="pt-2 md:pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-bold text-sm md:text-base text-gray-900">Total Balance</span>
                <span className="font-bold text-gray-900 text-lg md:text-xl">
                  {tokenBalance.balance.toLocaleString()} AFRI
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-blue-200">
            <h3 className="font-semibold text-base md:text-lg lg:text-xl text-gray-900 mb-2 md:mb-3">📱 Earn AFRI via SMS</h3>
            <div className="space-y-2 font-mono text-xs md:text-sm">
              <div className="text-gray-700">
                <span className="text-blue-600">AFRI</span> - Check your AFRI balance
              </div>
              <div className="text-gray-700">
                <span className="text-blue-600">VOTE YES PROP-001</span> - Vote on proposals
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200">
          <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">Top Token Holders</h2>
          {leaderboard.length === 0 ? (
            <div className="text-center py-6 md:py-8 text-gray-500 text-sm md:text-base">
              Loading leaderboard data...
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {leaderboard.map((holder, index) => {
                const rank = index + 1;
                const totalSupply = AfriTokenService.getTotalSupply();
                const percentage = ((holder.balance / totalSupply) * 100).toFixed(2);
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                        rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        rank === 2 ? 'bg-gray-300 text-gray-700' :
                        rank === 3 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {rank}
                      </div>
                      <div>
                        <div className="font-semibold text-sm md:text-base text-gray-900">{holder.userId}</div>
                        <div className="text-xs md:text-sm text-gray-500">
                          {holder.locked > 0 ? `${holder.locked.toLocaleString()} locked` : 'Token Holder'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm md:text-base text-gray-900">
                        {holder.balance.toLocaleString()} AFRI
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {percentage}% of supply
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={user?.user?.id || ''}
        userTokens={tokenBalance?.balance || 0}
        onSuccess={loadData}
      />
    </div>
  );
};

export default DAODashboard;
