/**
 * ckUSDC Balance Card Component
 * 
 * Displays user's ckUSDC balance with local currency equivalent
 * Provides quick actions for deposit, send, and exchange
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Send, Download, RefreshCw } from 'lucide-react';
import { CkUSDCService } from '../services/ckUSDCService';
import { CkUSDCBalance } from '../types/ckusdc';
import { useDemoMode } from '../context/DemoModeContext';
import { DemoDataService } from '../services/demoDataService';

interface CkUSDCBalanceCardProps {
  /** User's Principal ID */
  principalId: string;
  /** User's preferred currency */
  preferredCurrency?: string;
  /** Show quick actions */
  showActions?: boolean;
  /** Callback for deposit action */
  onDeposit?: () => void;
  /** Callback for send action */
  onSend?: () => void;
  /** Callback for exchange action */
  onExchange?: () => void;
}

export const CkUSDCBalanceCard: React.FC<CkUSDCBalanceCardProps> = ({
  principalId,
  preferredCurrency = 'UGX',
  showActions = true,
  onDeposit,
  onSend,
  onExchange,
}) => {
  const { isDemoMode } = useDemoMode();
  const [balance, setBalance] = useState<CkUSDCBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      setError(null);
      
      if (isDemoMode) {
        // Use demo data
        const demoUser = DemoDataService.getDemoUser();
        if (demoUser) {
          const exchangeRate = await CkUSDCService.getExchangeRate(preferredCurrency);
          setBalance({
            balance: demoUser.ckUSDCBalance * 1000000, // Convert to smallest unit
            balanceFormatted: demoUser.ckUSDCBalance.toFixed(2),
            localCurrencyEquivalent: demoUser.ckUSDCBalance * exchangeRate.rate,
            localCurrency: preferredCurrency,
            lastUpdated: new Date(),
          });
        }
      } else {
        const balanceData = await CkUSDCService.getBalanceWithLocalCurrency(
          principalId,
          preferredCurrency
        );
        setBalance(balanceData);
      }
    } catch (err: any) {
      console.error('Error fetching ckUSDC balance:', err);
      setError(err.message || 'Failed to load balance');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [principalId, preferredCurrency, isDemoMode]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalance();
  };

  const formatLocalCurrency = (amount: number | undefined) => {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-neutral-200 rounded w-32"></div>
            <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
          </div>
          <div className="h-10 bg-neutral-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">ckUSDC Balance</h3>
          <div className="p-2 bg-red-50 rounded-full">
            <DollarSign className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">ckUSDC Balance</h3>
          <p className="text-xs text-neutral-600 mt-1">Stable Value Storage</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh balance"
          >
            <RefreshCw className={`w-5 h-5 text-green-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="p-2 bg-green-100 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-neutral-900 font-mono">
            ${balance?.balanceFormatted || '0.00'}
          </span>
          <span className="text-sm text-neutral-600 font-semibold">ckUSDC</span>
        </div>
        
        {balance?.localCurrencyEquivalent !== undefined && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <TrendingUp className="w-4 h-4" />
            <span>
              ≈ {formatLocalCurrency(balance.localCurrencyEquivalent)} {balance.localCurrency}
            </span>
          </div>
        )}
      </div>

      {/* Info Badge */}
      <div className="mb-4 p-3 bg-white/60 rounded-lg border border-green-200">
        <p className="text-xs text-neutral-700">
          <span className="font-semibold">Stable Value:</span> ckUSDC is pegged 1:1 with USD, 
          protecting you from Bitcoin volatility.
        </p>
      </div>

      {/* Quick Actions */}
      {showActions && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onDeposit}
            className="flex flex-col items-center gap-1 p-3 bg-white hover:bg-green-50 rounded-lg border border-green-200 transition-colors"
          >
            <Download className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-neutral-900">Deposit</span>
          </button>
          
          <button
            onClick={onSend}
            className="flex flex-col items-center gap-1 p-3 bg-white hover:bg-green-50 rounded-lg border border-green-200 transition-colors"
          >
            <Send className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-neutral-900">Send</span>
          </button>
          
          <button
            onClick={onExchange}
            className="flex flex-col items-center gap-1 p-3 bg-white hover:bg-green-50 rounded-lg border border-green-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-neutral-900">Exchange</span>
          </button>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-400 mt-3">
        Last updated: {balance?.lastUpdated.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};
