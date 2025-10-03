import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { AfriTokenService, TokenBalance } from '../../services/afriTokenService';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSupply, setTotalSupply] = useState(0);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await AfriTokenService.getLeaderboard(10);
      const supply = AfriTokenService.getTotalSupply();
      setLeaderboard(data);
      setTotalSupply(supply);
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
    return <span className="text-lg font-bold text-neutral-500">#{index + 1}</span>;
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
    <PageLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-neutral-900">AFRI Token Leaderboard</h1>
          </div>
          <p className="text-neutral-600">Top AFRI token holders in the AfriTokeni DAO</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-1">Total Supply</p>
            <p className="text-2xl font-bold font-mono text-neutral-900">
              {formatNumber(totalSupply)} AFRI
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-1">Top Holders</p>
            <p className="text-2xl font-bold font-mono text-neutral-900">{leaderboard.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-1">Largest Holder</p>
            <p className="text-2xl font-bold font-mono text-neutral-900">
              {leaderboard[0] ? `${getPercentage(leaderboard[0].balance)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-xl font-bold text-neutral-900">Top Token Holders</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-neutral-600">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">No token holders found</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {leaderboard.map((holder, index) => (
                <div
                  key={index}
                  className={`p-6 flex items-center gap-4 hover:bg-neutral-50 transition-colors ${
                    index < 3 ? 'bg-gradient-to-r from-orange-50/50 to-transparent' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 flex justify-center">{getRankIcon(index)}</div>

                  {/* Holder Info */}
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900">{holder.userId}</p>
                    <p className="text-sm text-neutral-600">
                      {getPercentage(holder.balance)}% of total supply
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono text-neutral-900">
                      {formatNumber(holder.balance)}
                    </p>
                    <p className="text-sm text-neutral-600">AFRI</p>
                  </div>

                  {/* Locked */}
                  {holder.locked > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-mono text-orange-600">
                        {formatNumber(holder.locked)} locked
                      </p>
                      <p className="text-xs text-neutral-500">In governance</p>
                    </div>
                  )}
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
    </PageLayout>
  );
}
