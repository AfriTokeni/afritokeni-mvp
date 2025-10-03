/**
 * Bitcoin Transfer Page
 * Unified interface for Bitcoin transfers (auto-routes between Lightning/on-chain)
 */

import React, { useState, useEffect } from 'react';
import { Bitcoin, Send, QrCode, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext';
import { LightningService, LightningInvoice } from '../../services/lightningService';
import { BitcoinRoutingService } from '../../services/bitcoinRoutingService';
import { AfricanCurrency } from '../../types/currency';

const LightningPage: React.FC = () => {
  const { user } = useAuthentication();
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<AfricanCurrency>('NGN');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [invoice, setInvoice] = useState<LightningInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [routingMethod, setRoutingMethod] = useState<'lightning' | 'onchain' | null>(null);

  const [stats, setStats] = useState({
    lightningTransfers: 0,
    avgFee: 0,
    totalSaved: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const routingStats = await BitcoinRoutingService.getRoutingStats();
    setStats({
      lightningTransfers: routingStats.lightningTransfers,
      avgFee: routingStats.avgLightningFee,
      totalSaved: routingStats.totalSaved,
    });
  };

  const handleSend = async () => {
    if (!amount || !recipientPhone) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const amountNum = parseFloat(amount);
      
      // Auto-decide routing method
      const routing = await BitcoinRoutingService.decideRouting({
        amount: amountNum,
        currency,
      });

      setRoutingMethod(routing.method);

      // Execute transfer with automatic routing
      await BitcoinRoutingService.executeTransfer({
        fromUserId: user?.user?.id || '',
        toUserId: recipientPhone,
        amount: amountNum,
        currency,
        urgency: 'instant',
      });

      setSuccess(true);
      setAmount('');
      setRecipientPhone('');
      
      setTimeout(() => {
        setSuccess(false);
        setRoutingMethod(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!amount) {
      setError('Please enter amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const amountNum = parseFloat(amount);
      
      const newInvoice = await LightningService.createInvoice({
        amount: amountNum,
        currency,
        description: `Payment to ${user?.user?.firstName} ${user?.user?.lastName}`,
        userId: user?.user?.id || '',
      });

      setInvoice(newInvoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Bitcoin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Send Bitcoin</h1>
            <p className="text-gray-600">Auto-optimized for speed and cost</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.lightningTransfers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Transfers</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">$0.001</div>
            <div className="text-sm text-gray-600">Avg Fee</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">&lt;1s</div>
            <div className="text-sm text-gray-600">Speed</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors ${
            activeTab === 'send'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          Send Bitcoin
        </button>
        <button
          onClick={() => setActiveTab('receive')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors ${
            activeTab === 'receive'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <QrCode className="w-4 h-4 inline mr-2" />
          Receive Bitcoin
        </button>
      </div>

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Bitcoin Payment</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone Number
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+2348153353131"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as AfricanCurrency)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="NGN">🇳🇬 NGN</option>
                  <option value="KES">🇰🇪 KES</option>
                  <option value="UGX">🇺🇬 UGX</option>
                  <option value="ZAR">🇿🇦 ZAR</option>
                </select>
              </div>
            </div>

            {/* Fee Preview */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  {routingMethod === 'lightning' ? (
                    <><Zap className="w-4 h-4 text-yellow-600" /><span>Instant Transfer</span></>
                  ) : routingMethod === 'onchain' ? (
                    <><Bitcoin className="w-4 h-4 text-orange-600" /><span>On-chain Transfer</span></>
                  ) : (
                    <><Zap className="w-4 h-4 text-yellow-600" /><span>Auto-optimized</span></>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {routingMethod === 'lightning' ? 'Fee: ~$0.001' : routingMethod === 'onchain' ? 'Fee: ~$5-10' : 'Best rate selected'}
                  </div>
                  <div className="text-gray-600">
                    {routingMethod === 'lightning' ? 'Time: <1 second' : routingMethod === 'onchain' ? 'Time: 10-60 min' : 'Instant or secure'}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span>
                  {routingMethod === 'lightning' ? '⚡ Payment sent instantly!' : '🔗 Bitcoin transfer initiated!'}
                </span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Bitcoin
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Receive Tab */}
      {activeTab === 'receive' && (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Receive Bitcoin Payment</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as AfricanCurrency)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="NGN">🇳🇬 NGN</option>
                  <option value="KES">🇰🇪 KES</option>
                  <option value="UGX">🇺🇬 UGX</option>
                  <option value="ZAR">🇿🇦 ZAR</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateInvoice}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Payment Request'}
            </button>

            {invoice && (
              <div className="mt-6 space-y-4">
                {/* QR Code */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                    <div className="text-xs text-gray-500 absolute">QR Code Here</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Scan with Lightning wallet</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {invoice.amountLocal.toLocaleString()} {invoice.currency}
                  </div>
                  <div className="text-sm text-gray-500">
                    ≈ {invoice.amountBTC.toFixed(8)} BTC
                  </div>
                </div>

                {/* Invoice String */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Lightning Invoice
                  </div>
                  <div className="font-mono text-xs text-gray-700 break-all">
                    {invoice.paymentRequest}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(invoice.paymentRequest)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Copy Invoice
                  </button>
                </div>

                {/* Expiry */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Expires: {invoice.expiresAt.toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          How Auto-Optimized Bitcoin Transfers Work
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Enter Details</h4>
            <p className="text-sm text-gray-600">
              Just enter recipient and amount - we handle the rest
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Auto-Route</h4>
            <p className="text-sm text-gray-600">
              System picks best method: instant Lightning or secure on-chain
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Delivered</h4>
            <p className="text-sm text-gray-600">
              Optimized for speed and cost automatically
            </p>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="mt-8 bg-white rounded-2xl p-8 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Transfer Methods Comparison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Feature</th>
                <th className="text-center py-3 px-4 text-yellow-600 font-semibold">⚡ Lightning</th>
                <th className="text-center py-3 px-4 text-gray-600 font-semibold">On-Chain</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Speed</td>
                <td className="py-4 px-4 text-center font-semibold text-green-600">&lt; 1 second</td>
                <td className="py-4 px-4 text-center text-gray-600">10-60 minutes</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Fee</td>
                <td className="py-4 px-4 text-center font-semibold text-green-600">~$0.001</td>
                <td className="py-4 px-4 text-center text-gray-600">$5-20</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Best For</td>
                <td className="py-4 px-4 text-center text-gray-700">&lt; $50</td>
                <td className="py-4 px-4 text-center text-gray-600">&gt; $50</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Use Case</td>
                <td className="py-4 px-4 text-center text-gray-700">Daily payments</td>
                <td className="py-4 px-4 text-center text-gray-600">Large transfers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SMS Alternative */}
      <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-3">📱 Use via SMS (No Internet)</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="text-gray-700">
            <span className="text-blue-600">BTC SEND</span> +234... 5000 NGN - Auto-optimized transfer
          </div>
          <div className="text-gray-700">
            <span className="text-blue-600">BTC BAL</span> - Check Bitcoin balance
          </div>
          <div className="text-gray-700">
            <span className="text-blue-600">*AFRI#</span> - Show all commands
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightningPage;
