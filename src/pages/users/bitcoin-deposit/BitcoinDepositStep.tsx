import React, { useState } from 'react';
import { QrCode, Copy, CheckCircle, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { AfricanCurrency } from '../../../types/currency';
import { Agent, EscrowTransaction } from '../../../services/escrowService';

interface BitcoinDepositStepProps {
  selectedAgent: Agent | null;
  escrowTransaction: EscrowTransaction | null;
  btcAmount: string;
  localAmount: string;
  selectedCurrency: AfricanCurrency;
  depositAddress: string;
  onConfirm: () => void;
  onBack: () => void;
}

const BitcoinDepositStep: React.FC<BitcoinDepositStepProps> = ({
  selectedAgent,
  escrowTransaction,
  btcAmount,
  localAmount,
  selectedCurrency,
  depositAddress,
  onConfirm,
  onBack,
}) => {
  const [copied, setCopied] = useState(false);

  const formatCurrency = (amount: number, currency: AfricanCurrency): string => {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency === 'XOF' || currency === 'XAF' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!selectedAgent) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">No agent selected. Please go back and select an agent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Agent Selection</span>
        </button>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Send Bitcoin</h2>
        <p className="text-neutral-600">Send Bitcoin from your wallet to complete the exchange</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        {/* Agent Info */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-semibold">
              {selectedAgent.name.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{selectedAgent.name}</h3>
            <p className="text-sm text-neutral-600">{selectedAgent.location}</p>
            <div className="flex items-center text-sm text-yellow-500">
              <span className="font-medium">{selectedAgent.rating}</span>
              <span className="ml-1">★</span>
              <span className="ml-2 text-neutral-600">• {selectedAgent.fee}% fee</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* QR Code Section */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-center mb-4">
              <div className="w-32 h-32 bg-white border-2 border-orange-300 rounded-lg mx-auto flex items-center justify-center mb-3">
                <QrCode className="w-16 h-16 text-orange-600" />
              </div>
              <p className="text-sm text-neutral-600">Scan QR code with your wallet app</p>
            </div>
          </div>

          {/* Bitcoin Address */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bitcoin Address
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={depositAddress}
                readOnly
                className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(depositAddress)}
                className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-600">Amount to send:</span>
              <div className="font-mono font-semibold">₿{btcAmount}</div>
            </div>
            <div>
              <span className="text-neutral-600">You&apos;ll receive:</span>
              <div className="font-mono font-semibold text-green-600">
                {formatCurrency(parseFloat(localAmount) * (1 - selectedAgent.fee / 100), selectedCurrency)}
              </div>
            </div>
          </div>
        </div>

        {/* Escrow Protection Info */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">🔒 Secure Escrow Protection:</p>
              <ul className="space-y-1 text-xs">
                <li>• Your Bitcoin is held safely by AfriTokeni until cash is received</li>
                <li>• Agent cannot access Bitcoin without your exchange code</li>
                <li>• Automatic refund if transaction expires (24 hours)</li>
                <li>• Both parties protected by our escrow system</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Exchange Code */}
        {escrowTransaction && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-orange-800 font-medium mb-2">Your Exchange Code:</p>
              <div className="text-2xl font-mono font-bold text-orange-900 bg-white px-4 py-2 rounded border-2 border-orange-300">
                {escrowTransaction.exchangeCode}
              </div>
              <p className="text-xs text-orange-700 mt-2">
                Show this code to the agent to receive your cash
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Next Steps:</p>
              <ul className="space-y-1 text-xs">
                <li>• Send exactly ₿{btcAmount} to the escrow address above</li>
                <li>• Agent will be notified when Bitcoin is confirmed (≈10 minutes)</li>
                <li>• Meet agent and show your exchange code to receive cash</li>
                <li>• Bitcoin is released to agent only after code verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className="w-full mt-6 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
        >
          I&apos;ve Sent the Bitcoin
        </button>
      </div>
    </div>
  );
};

export default BitcoinDepositStep;