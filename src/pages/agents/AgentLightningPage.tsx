/**
 * Agent Lightning Network Page
 * Agents can process Lightning payments for users
 */

import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Clock, DollarSign, Users, CheckCircle } from 'lucide-react';
import { BitcoinRoutingService } from '../../services/bitcoinRoutingService';

const AgentLightningPage: React.FC = () => {
  const [stats, setStats] = useState({
    lightningTransfers: 0,
    totalVolume: 0,
    commission: 0,
    avgFee: 0,
  });

  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentTransfers();
  }, []);

  const loadStats = async () => {
    const routingStats = await BitcoinRoutingService.getRoutingStats();
    setStats({
      lightningTransfers: routingStats.lightningTransfers,
      totalVolume: routingStats.lightningTransfers * 5000, // Mock
      commission: routingStats.lightningTransfers * 50, // Mock 1% commission
      avgFee: routingStats.avgLightningFee,
    });
  };

  const loadRecentTransfers = () => {
    // Mock data - in production, fetch from backend
    setRecentTransfers([
      { id: '1', amount: 5000, currency: 'NGN', status: 'completed', time: '2 min ago' },
      { id: '2', amount: 10000, currency: 'UGX', status: 'completed', time: '5 min ago' },
      { id: '3', amount: 3000, currency: 'KES', status: 'completed', time: '10 min ago' },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lightning Network</h1>
            <p className="text-gray-600">Process instant Bitcoin payments</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Lightning Transfers</div>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.lightningTransfers}</div>
          <div className="text-sm text-green-600 mt-1">+12% this week</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Volume</div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalVolume.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">NGN</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Commission Earned</div>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.commission.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">NGN</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Avg Fee</div>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">$0.001</div>
          <div className="text-sm text-gray-500 mt-1">per transfer</div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* How It Works */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How Lightning Works for Agents</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">User Requests Transfer</div>
                <div className="text-sm text-gray-600">User wants to send money via Lightning</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Instant Processing</div>
                <div className="text-sm text-gray-600">Payment routes through Lightning Network</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Earn Commission</div>
                <div className="text-sm text-gray-600">You earn 1% on each Lightning transfer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Benefits for Agents</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="text-gray-700">Instant settlements (&lt; 1 second)</div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="text-gray-700">Lower operational costs</div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="text-gray-700">No blockchain confirmation wait</div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="text-gray-700">Higher transaction volume</div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="text-gray-700">Automated processing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Lightning Transfers</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{recentTransfers.length} transfers today</span>
          </div>
        </div>

        <div className="space-y-3">
          {recentTransfers.map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {transfer.amount.toLocaleString()} {transfer.currency}
                  </div>
                  <div className="text-sm text-gray-600">{transfer.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    +{(transfer.amount * 0.01).toLocaleString()} {transfer.currency}
                  </div>
                  <div className="text-xs text-gray-500">Commission</div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span>Completed</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recentTransfers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No Lightning transfers yet</div>
            <div className="text-sm">Transfers will appear here when users make Lightning payments</div>
          </div>
        )}
      </div>

      {/* Commission Structure */}
      <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-3">💰 Commission Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600 mb-1">Lightning Transfers</div>
            <div className="font-bold text-gray-900">1% commission</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Settlement Time</div>
            <div className="font-bold text-gray-900">Instant</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Min Transfer</div>
            <div className="font-bold text-gray-900">$0.01</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLightningPage;
