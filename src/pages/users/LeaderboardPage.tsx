import { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { AfriTokenService, TokenBalance } from '../../services/afriTokenService';
import { useDemoMode } from '../../context/DemoModeContext';
import { DemoDataService } from '../../services/demoDataService';

export default function LeaderboardPage() {
  const { isDemoMode } = useDemoMode();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSupply, setTotalSupply] = useState(0);

  useEffect(() => {
    loadLeaderboard();
  }, [isDemoMode]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        // Use demo data
        const demoLeaderboard = DemoDataService.generateDAOLeaderboard(20);
        setLeaderboard(demoLeaderboard);
        const supply = await AfriTokenService.getTotalSupply();
        setTotalSupply(supply);
      } else {
        const data = await AfriTokenService.getLeaderboard(10);
        const supply = await AfriTokenService.getTotalSupply();
        setLeaderboard(data);
        setTotalSupply(supply);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-500">#{index + 1}</span>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getPercentage = (balance: number) => {
    return ((balance / totalSupply) * 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Supply</p>
            <p className="text-2xl font-bold font-mono text-gray-900">
              {formatNumber(totalSupply)} AFRI
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Top Holders</p>
            <p className="text-2xl font-bold font-mono text-gray-900">{leaderboard.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Largest Holder</p>
            <p className="text-2xl font-bold font-mono text-gray-900">
              {leaderboard[0] ? `${getPercentage(leaderboard[0].balance)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Top Token Holders</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No token holders found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leaderboard.map((holder, index) => (
                <div
                  key={index}
                  className={`p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                    index < 3 ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 flex justify-center">{getRankIcon(index)}</div>

                  {/* Holder Info */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{holder.name || holder.userId || 'Anonymous'}</p>
                    <p className="text-sm text-gray-600">
                      {holder.votingPower || `${getPercentage(holder.balance)}% of total supply`}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono text-gray-900">
                      {formatNumber(holder.balance)}
                    </p>
                    <p className="text-sm text-gray-600">AFRI</p>
                  </div>

                  {/* Activity or Locked */}
                  {holder.proposalsCreated ? (
                    <div className="text-right">
                      <p className="text-sm font-mono text-blue-600">
                        {holder.proposalsCreated} proposals
                      </p>
                      <p className="text-xs text-gray-500">{holder.votesParticipated} votes</p>
                    </div>
                  ) : holder.locked > 0 ? (
                    <div className="text-right">
                      <p className="text-sm font-mono text-orange-600">
                        {formatNumber(holder.locked)} locked
                      </p>
                      <p className="text-xs text-gray-500">In governance</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This leaderboard shows neurons staked in SNS governance. Token
            holders who haven't staked their tokens in neurons are not displayed.
          </p>
        </div>
    </div>
  );
}
