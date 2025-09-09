import React, { useState, useEffect } from 'react';
import { 
  Bitcoin, 
  Copy, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { BitcoinService } from '../../services/bitcoinService';

const AgentBitcoinPage: React.FC = () => {
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinBalance, setBitcoinBalance] = useState<number>(0);
  const [ugxValue, setUgxValue] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initializeBitcoin = async () => {
      try {
        setLoading(true);
        
        // Generate Bitcoin address for agent
        const { address } = BitcoinService.generateBitcoinAddress();
        setBitcoinAddress(address);
        
        // Get Bitcoin balance
        const balance = await BitcoinService.getBitcoinBalance(address);
        setBitcoinBalance(BitcoinService.satoshisToBtc(balance));
        
        // Get current exchange rate
        const rate = await BitcoinService.getExchangeRate('UGX');
        setExchangeRate(rate.btcToLocal);
        setUgxValue(BitcoinService.satoshisToBtc(balance) * rate.btcToLocal);
        
      } catch (error) {
        console.error('Error initializing Bitcoin:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeBitcoin();
  }, []);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(bitcoinAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const refreshBalance = async () => {
    try {
      setLoading(true);
      const balance = await BitcoinService.getBitcoinBalance(bitcoinAddress);
      setBitcoinBalance(BitcoinService.satoshisToBtc(balance));
      
      const rate = await BitcoinService.getExchangeRate('UGX');
      setExchangeRate(rate.btcToLocal);
      setUgxValue(BitcoinService.satoshisToBtc(balance) * rate.btcToLocal);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-neutral-600">Loading Bitcoin wallet...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Bitcoin Wallet</h1>
            <p className="text-neutral-600 mt-1">Manage your Bitcoin for customer exchanges</p>
          </div>
          <button
            onClick={refreshBalance}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-semibold">Refresh</span>
          </button>
        </div>

        {/* Bitcoin Balance Card */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Bitcoin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Bitcoin Balance</h2>
                <p className="text-neutral-600 text-sm">Agent Wallet</p>
              </div>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-neutral-600 text-sm mb-2">Bitcoin Amount</p>
              <p className="text-3xl font-bold text-neutral-900 font-mono">
                {showBalance ? `₿${bitcoinBalance.toFixed(8)}` : '••••••••'}
              </p>
            </div>
            
            <div>
              <p className="text-neutral-600 text-sm mb-2">UGX Value</p>
              <p className="text-xl font-semibold text-neutral-700 font-mono">
                {showBalance ? `UGX ${ugxValue.toLocaleString()}` : '••••••••'}
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                1 BTC = UGX {exchangeRate.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Bitcoin Address Card */}
        <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Your Bitcoin Address</h3>
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm text-neutral-700 break-all flex-1 mr-4">
                {bitcoinAddress}
              </p>
              <button
                onClick={copyAddress}
                className="flex items-center space-x-2 px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors duration-200 flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>
          <p className="text-neutral-500 text-sm mt-3">
            Share this address with customers who want to send you Bitcoin, or use it to receive Bitcoin from exchanges.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">Receive Bitcoin</h3>
                <p className="text-neutral-600 text-sm">From customers or exchanges</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm mb-4">
              Give your Bitcoin address to customers who want to pay with Bitcoin, or receive from crypto exchanges.
            </p>
            <button className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 font-semibold">
              Show QR Code
            </button>
          </div>

          <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">Send Bitcoin</h3>
                <p className="text-neutral-600 text-sm">To customers or exchanges</p>
              </div>
            </div>
            <p className="text-neutral-600 text-sm mb-4">
              Send Bitcoin to customers after they give you cash, or to exchanges to convert to UGX.
            </p>
            <button className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 font-semibold">
              Send Bitcoin
            </button>
          </div>
        </div>

        {/* Agent Exchange Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center space-x-2">
            <Bitcoin className="w-5 h-5 text-blue-600" />
            <span>Bitcoin Exchange for Agents</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2">How to Help Customers Buy Bitcoin:</h4>
              <ol className="list-decimal list-inside space-y-1 text-neutral-700 text-sm">
                <li>Customer gives you UGX cash</li>
                <li>Calculate Bitcoin amount using current rate (1 BTC = UGX {exchangeRate.toLocaleString()})</li>
                <li>Get customer's Bitcoin address</li>
                <li>Send Bitcoin from your wallet to their address</li>
                <li>Keep small commission (2-3% recommended)</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-2">How to Help Customers Sell Bitcoin:</h4>
              <ol className="list-decimal list-inside space-y-1 text-neutral-700 text-sm">
                <li>Customer sends Bitcoin to your address</li>
                <li>Wait for confirmation (usually 10-30 minutes)</li>
                <li>Calculate UGX amount using current rate</li>
                <li>Give customer UGX cash minus your commission</li>
                <li>Keep Bitcoin or convert to UGX later</li>
              </ol>
            </div>
          </div>
        </div>

        {/* SMS Commands for Agents */}
        <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-neutral-600" />
            <span>SMS Bitcoin Commands</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2">Check Bitcoin Balance:</h4>
              <div className="bg-white p-3 rounded-lg border border-neutral-200">
                <code className="text-sm text-neutral-700">BTC BAL</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-2">Get Bitcoin Address:</h4>
              <div className="bg-white p-3 rounded-lg border border-neutral-200">
                <code className="text-sm text-neutral-700">BTC ADDR</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-2">Send Bitcoin:</h4>
              <div className="bg-white p-3 rounded-lg border border-neutral-200">
                <code className="text-sm text-neutral-700">BTC SEND [address] [amount]</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-2">Check BTC Rate:</h4>
              <div className="bg-white p-3 rounded-lg border border-neutral-200">
                <code className="text-sm text-neutral-700">BTC RATE UGX</code>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Smartphone className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-semibold text-sm">SMS Commands Available</p>
                <p className="text-yellow-700 text-sm mt-1">
                  All Bitcoin operations can be performed via SMS when you don't have internet access. 
                  Send commands to <strong>+256-XXX-XXXX</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AgentBitcoinPage;
