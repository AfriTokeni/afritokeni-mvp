/**
 * DAO Dashboard
 * Main governance interface for AfriTokeni DAO
 */

import React, { useState, useEffect } from 'react';
import { Vote as VoteIcon, TrendingUp, Users, Coins, Plus, CheckCircle, XCircle, Clock, HelpCircle, ChevronDown, ChevronUp, DollarSign, Globe, Shield, FileText, Lightbulb } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { AfriTokenService, TokenBalance } from '../../services/afriTokenService';
import { GovernanceService, Proposal } from '../../services/governanceService';
import { CentralizedDemoService } from '../../services/centralizedDemoService';
import CreateProposalModal from '../../components/CreateProposalModal';

const DAODashboard: React.FC = () => {
  const { user } = useAuthentication();
  const { isDemoMode } = useDemoMode();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<'proposals' | 'my-tokens' | 'leaderboard'>('proposals');
  const [, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [totalHolders, setTotalHolders] = useState(0);
  const [showEarnInfo, setShowEarnInfo] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [totalSupply, setTotalSupply] = useState(0);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use demo data if in demo mode
      if (isDemoMode) {
        const stats = CentralizedDemoService.getDemoDAOStats();
        setTokenBalance({
          balance: 1000,
        } as TokenBalance);
        const proposals = await CentralizedDemoService.getDemoProposals();
        const leaderboard = await CentralizedDemoService.getDemoLeaderboard();
        setProposals(proposals as any);
        setLeaderboard(leaderboard);
        setTotalHolders(stats.totalHolders);
        setTotalSupply(stats.totalSupply);
      } else {
        // Load real data from SNS
        if (user?.user?.id || user?.agent?.id) {
          const userId = user?.user?.id || user?.agent?.id;
          const balance = await AfriTokenService.getBalance(userId!);
          setTokenBalance(balance);
        }
        const activeProposals = await GovernanceService.getActiveProposals();
        setProposals(activeProposals);
        
        // Load leaderboard data
        const leaderboardData = await AfriTokenService.getLeaderboard(10);
        setLeaderboard(leaderboardData);
        setTotalHolders(leaderboardData.length);
        
        // Load total supply
        const supply = await AfriTokenService.getTotalSupply();
        setTotalSupply(supply);
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
      // Success - no alert needed, just refresh
    } catch (error) {
      console.error('Error voting:', error);
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

  const getProposalTypeLabel = (type: string) => {
    switch (type) {
      case 'fee_adjustment': return { label: 'Fee Adjustment', color: 'bg-green-100 text-green-700', icon: DollarSign };
      case 'currency_addition': return { label: 'Add Currency', color: 'bg-blue-100 text-blue-700', icon: Globe };
      case 'agent_standards': return { label: 'Agent Standards', color: 'bg-purple-100 text-purple-700', icon: Shield };
      case 'treasury': return { label: 'Treasury', color: 'bg-orange-100 text-orange-700', icon: FileText };
      case 'other': return { label: 'Other', color: 'bg-gray-100 text-gray-700', icon: Lightbulb };
      default: return { label: 'Other', color: 'bg-gray-100 text-gray-700', icon: Lightbulb };
    }
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Token Balance Card - Same style as Dashboard */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
              <Coins className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AFRI Token Balance</h3>
              <p className="text-sm text-gray-600">Your voting power</p>
            </div>
          </div>
          <button
            onClick={() => setShowEarnInfo(!showEarnInfo)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How to earn?</span>
          </button>
        </div>
        
        <div className="mb-4">
          <span className="text-5xl font-bold text-gray-900 font-mono">
            {tokenBalance?.balance.toLocaleString() || 0}
          </span>
          <span className="text-2xl text-gray-600 ml-2">AFRI</span>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-gray-600 text-sm">{tokenBalance?.locked || 0} locked in active votes</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600 font-medium text-sm">Active</span>
          </div>
        </div>
        
        {/* Earn Info Dropdown */}
        {showEarnInfo && (
          <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold text-lg mb-3 text-gray-900">How to Earn AFRI Tokens</h3>
            <ul className="space-y-2 text-sm text-gray-700">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
              <VoteIcon className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{proposals.length}</div>
              <div className="text-sm text-gray-600">Active Proposals</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {tokenBalance?.balance || 0}
              </div>
              <div className="text-sm text-gray-600">AFRI Balance</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {totalHolders > 0 ? totalHolders.toLocaleString() : '—'}
              </div>
              <div className="text-sm text-gray-600">Token Holders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Distribution Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
        <button
          onClick={() => setShowDistribution(!showDistribution)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-start gap-3">
            <Coins className="w-6 h-6 text-purple-600 mt-1" />
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-1">AFRI Token Distribution</h3>
              <p className="text-sm text-gray-700">
                Total Supply: <span className="font-mono font-semibold">1,000,000,000 AFRI</span>
              </p>
            </div>
          </div>
          {showDistribution ? (
            <ChevronUp className="w-5 h-5 text-purple-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-600" />
          )}
        </button>
        
        {showDistribution && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-3">Community (45%)</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex justify-between">
                <span>• Agents</span>
                <span className="font-mono font-semibold">250M (25%)</span>
              </li>
              <li className="flex justify-between">
                <span>• Users</span>
                <span className="font-mono font-semibold">200M (20%)</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-3">Investors (10%)</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex justify-between">
                <span>• Seed Round</span>
                <span className="font-mono font-semibold">50M (5%)</span>
              </li>
              <li className="flex justify-between">
                <span>• Strategic</span>
                <span className="font-mono font-semibold">50M (5%)</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-3">Team & Advisors (20%)</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex justify-between">
                <span>• Core Team</span>
                <span className="font-mono font-semibold">150M (15%)</span>
              </li>
              <li className="flex justify-between">
                <span>• Advisors</span>
                <span className="font-mono font-semibold">50M (5%)</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-3">Ecosystem (25%)</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex justify-between">
                <span>• Treasury</span>
                <span className="font-mono font-semibold">150M (15%)</span>
              </li>
              <li className="flex justify-between">
                <span>• Liquidity</span>
                <span className="font-mono font-semibold">100M (10%)</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Tokens are distributed through SMS transactions, agent activities, governance participation, and referrals to ensure widespread adoption across Africa's unbanked population.
          </p>
        </div>
        </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-colors ${
            activeTab === 'proposals'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Proposals
        </button>
        <button
          onClick={() => setActiveTab('my-tokens')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'my-tokens'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Tokens
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-colors ${
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
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active Proposals</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Proposal
            </button>
          </div>

          {proposals.map((proposal) => {
            const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
            const yesPercentage = calculateVotePercentage(proposal.votes.yes, totalVotes);
            const noPercentage = calculateVotePercentage(proposal.votes.no, totalVotes);
            const typeInfo = getProposalTypeLabel(proposal.type);
            const TypeIcon = typeInfo.icon;

            return (
              <div key={proposal.id} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${typeInfo.color}`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        {typeInfo.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)}`}>
                        {proposal.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{proposal.id}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{proposal.title}</h3>
                    <p className="text-gray-600 mb-4">{proposal.description}</p>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
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
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden xs:inline">Vote </span>Yes
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'no')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden xs:inline">Vote </span>No
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'abstain')}
                      className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                    >
                      Abstain
                    </button>
                  </div>
                )}

                {/* Time Remaining */}
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
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
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Token Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">From Transactions</span>
                <span className="font-semibold text-gray-900">
                  {isDemoMode ? '250' : (tokenBalance.earned?.transactions || 0).toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">From Agent Activity</span>
                <span className="font-semibold text-gray-900">
                  {isDemoMode ? '500' : (tokenBalance.earned?.agentActivity || 0).toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">From Referrals</span>
                <span className="font-semibold text-gray-900">
                  {isDemoMode ? '150' : (tokenBalance.earned?.referrals || 0).toLocaleString()} AFRI
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">From Staking</span>
                <span className="font-semibold text-gray-900">
                  {isDemoMode ? '100' : (tokenBalance.earned?.staking || 0).toLocaleString()} AFRI
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-bold text-gray-900">Total Balance</span>
                <span className="font-bold text-gray-900 text-xl">
                  {tokenBalance.balance.toLocaleString()} AFRI
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">📱 Earn AFRI via SMS</h3>
            <div className="space-y-2 font-mono text-sm">
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
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Token Holders</h3>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading leaderboard data...
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((holder, index) => {
                const rank = holder.rank || index + 1;
                const displayName = holder.name || holder.userId || 'Anonymous';
                const votingPower = holder.votingPower || `${((holder.balance / totalSupply) * 100).toFixed(2)}%`;
                
                return (
                  <div key={holder.address || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        rank === 2 ? 'bg-gray-300 text-gray-700' :
                        rank === 3 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {rank}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{displayName}</div>
                        <div className="text-sm text-gray-500">
                          {holder.proposalsCreated ? `${holder.proposalsCreated} proposals • ${holder.votesParticipated} votes` : 'Token Holder'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {holder.balance.toLocaleString()} AFRI
                      </div>
                      <div className="text-sm text-gray-500">
                        {votingPower} voting power
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
