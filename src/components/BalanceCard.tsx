import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatCurrencyAmount, AfricanCurrency } from '../types/currency';
import { CurrencySelector } from './CurrencySelector';

interface BalanceCardProps {
  title: string;
  subtitle?: string;
  balance: number;
  currency: string;
  showBalance: boolean;
  onToggleBalance: () => void;
  onCurrencyChange?: (currency: string) => void;
  showCurrencySelector?: boolean;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  subtitle,
  balance,
  currency,
  showBalance,
  onToggleBalance,
  onCurrencyChange,
  showCurrencySelector = false,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 md:p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
          </div>
          <div className="flex items-center space-x-3">
            <p className="font-mono text-3xl font-bold text-gray-900">
              {showBalance
                ? formatCurrencyAmount(balance, currency as AfricanCurrency)
                : "••••••"}
            </p>
            <button
              onClick={onToggleBalance}
              className="text-gray-400 hover:text-gray-600"
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {showCurrencySelector && onCurrencyChange && (
          <CurrencySelector
            currentCurrency={currency}
            onCurrencyChange={onCurrencyChange}
          />
        )}
      </div>
    </div>
  );
};
