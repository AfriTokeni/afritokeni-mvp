import React, { useState, useEffect } from 'react';
import { QrCode, Bitcoin, Copy, CheckCircle, Clock, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { BitcoinService } from '../../services/bitcoinService';
import { EscrowService, Agent as EscrowAgent, EscrowTransaction } from '../../services/escrowService';
import { AfricanCurrency, AFRICAN_CURRENCIES } from '../../types/currency';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';


interface DepositState {
  amount?: string;
  currency?: AfricanCurrency;
  selectedAgent?: EscrowAgent;
}

const BitcoinDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAfriTokeni();
  const [step, setStep] = useState<'amount' | 'agent' | 'deposit' | 'confirm'>('amount');
  const [btcAmount, setBtcAmount] = useState('');
  const [localAmount, setLocalAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<AfricanCurrency>('NGN');
  const [selectedAgent, setSelectedAgent] = useState<EscrowAgent | null>(null);
  const [escrowTransaction, setEscrowTransaction] = useState<EscrowTransaction | null>(null);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [copied, setCopied] = useState(false);
  const [depositAddress, setDepositAddress] = useState('');
  const [transactionId, setTransactionId] = useState('');
  
  // Get agents from escrow service
  const [availableAgents, setAvailableAgents] = useState<EscrowAgent[]>([]);

  useEffect(() => {
    loadExchangeRate();
    loadAvailableAgents();
    // Check if we came from another page with state
    const state = location.state as DepositState;
    if (state?.amount) setBtcAmount(state.amount);
    if (state?.currency) setSelectedCurrency(state.currency);
    if (state?.selectedAgent) {
      setSelectedAgent(state.selectedAgent);
      setStep('deposit');
    }
  }, [location.state, selectedCurrency]);

  const loadAvailableAgents = async () => {
    try {
      const agents = await EscrowService.getAvailableAgents();
      setAvailableAgents(agents);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const rate = await BitcoinService.getExchangeRate(selectedCurrency);
      setExchangeRate(rate.btcToLocal);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      setExchangeRate(45000000); // Fallback rate
    }
  };

  const formatCurrency = (amount: number, currency: AfricanCurrency): string => {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency === 'XOF' || currency === 'XAF' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleBtcAmountChange = (value: string) => {
    setBtcAmount(value);
    const btcNum = parseFloat(value);
    if (!isNaN(btcNum) && btcNum > 0) {
      const localValue = Math.round(btcNum * exchangeRate);
      setLocalAmount(localValue.toString());
    } else {
      setLocalAmount('');
    }
  };

  const handleLocalAmountChange = (value: string) => {
    setLocalAmount(value);
    const localNum = parseFloat(value);
    if (!isNaN(localNum) && localNum > 0) {
      const btcValue = (localNum / exchangeRate).toFixed(8);
      setBtcAmount(btcValue);
    } else {
      setBtcAmount('');
    }
  };

  const selectAgent = async (agent: EscrowAgent) => {
    try {
      if (!user?.user?.id) return;

      // Create escrow transaction
      const transaction = await EscrowService.createEscrowTransaction(
        user.user.id,
        agent.id,
        parseFloat(btcAmount) * 100000000, // Convert BTC to satoshis
        parseFloat(localAmount),
        selectedCurrency
      );

      setSelectedAgent(agent);
      setEscrowTransaction(transaction);
      setDepositAddress(transaction.escrowAddress);
      setStep('deposit');
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
    }
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

  const confirmDeposit = () => {
    if (escrowTransaction) {
      setTransactionId(escrowTransaction.id);
      setStep('confirm');
    }
  };

  const renderAmountStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">How much Bitcoin?</h2>
        <p className="text-neutral-600">Enter the amount you want to exchange for cash</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bitcoin Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.00000001"
                value={btcAmount}
                onChange={(e) => handleBtcAmountChange(e.target.value)}
                placeholder="0.001"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg"
              />
              <div className="absolute right-3 top-3 text-neutral-500 font-medium">
                ₿ BTC
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              You'll receive (approx.)
            </label>
            <div className="relative">
              <input
                type="number"
                value={localAmount}
                onChange={(e) => handleLocalAmountChange(e.target.value)}
                placeholder="45000"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg"
              />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as AfricanCurrency)}
                className="absolute right-3 top-3 bg-transparent border-none text-neutral-500 font-medium focus:outline-none"
              >
                {Object.entries(AFRICAN_CURRENCIES).slice(0, 5).map(([code]) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {btcAmount && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Exchange rate:</span>
              <span className="font-mono">1 BTC = {formatCurrency(exchangeRate, selectedCurrency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-neutral-600">Agent fee (≈2.5%):</span>
              <span className="font-mono">≈ {formatCurrency(parseFloat(localAmount) * 0.025, selectedCurrency)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setStep('agent')}
          disabled={!btcAmount || parseFloat(btcAmount) <= 0}
          className="w-full mt-6 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find Agent
        </button>
      </div>
    </div>
  );

  const renderAgentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Choose an Agent</h2>
        <p className="text-neutral-600">Select a trusted agent near you for cash exchange</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {availableAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => selectAgent(agent)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">
                    {agent.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
                  <p className="text-sm text-neutral-600">{agent.location}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-yellow-500 mb-1">
                  <span className="text-sm font-medium">{agent.rating}</span>
                  <span className="text-xs">★</span>
                </div>
                <div className="text-xs text-green-600 font-medium">{agent.fee}% fee</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">You send:</span>
                <span className="font-mono">₿{btcAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">You receive:</span>
                <span className="font-mono text-green-600">
                  {formatCurrency(parseFloat(localAmount) * (1 - agent.fee / 100), selectedCurrency)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center text-orange-600">
              <ArrowRight className="w-4 h-4" />
              <span className="ml-2 text-sm font-medium">Select Agent</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep('amount')}
        className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
      >
        ← Back to Amount
      </button>
    </div>
  );

  const renderDepositStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Send Bitcoin</h2>
        <p className="text-neutral-600">Send Bitcoin from your wallet to complete the exchange</p>
      </div>

      {selectedAgent && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold">
                {selectedAgent.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">{selectedAgent.name}</h3>
              <p className="text-sm text-neutral-600">{selectedAgent.location}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-center mb-4">
                <div className="w-32 h-32 bg-white border-2 border-orange-300 rounded-lg mx-auto flex items-center justify-center mb-3">
                  <QrCode className="w-16 h-16 text-orange-600" />
                </div>
                <p className="text-sm text-neutral-600">Scan QR code with your wallet app</p>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Amount to send:</span>
                <div className="font-mono font-semibold">₿{btcAmount}</div>
              </div>
              <div>
                <span className="text-neutral-600">You'll receive:</span>
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

          <button
            onClick={confirmDeposit}
            className="w-full mt-6 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            I've Sent the Bitcoin
          </button>
        </div>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Exchange Initiated!</h2>
        <p className="text-neutral-600">Your Bitcoin exchange is being processed</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Transaction ID:</span>
            <span className="font-mono text-sm">{transactionId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Status:</span>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-600 font-medium">Waiting for confirmation</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Agent:</span>
            <span className="font-medium">{selectedAgent?.name}</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Next Steps:</p>
              <ul className="space-y-1 text-xs">
                <li>• Wait for Bitcoin transaction confirmation (≈10 minutes)</li>
                <li>• Agent will contact you to arrange cash pickup</li>
                <li>• Bring valid ID for verification</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate('/users/transactions')}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            View Transaction History
          </button>
          <button
            onClick={() => {
              setStep('amount');
              setBtcAmount('');
              setLocalAmount('');
              setSelectedAgent(null);
              setTransactionId('');
            }}
            className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Make Another Exchange
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { key: 'amount', label: 'Amount', icon: Bitcoin },
              { key: 'agent', label: 'Agent', icon: ArrowRight },
              { key: 'deposit', label: 'Send', icon: QrCode },
              { key: 'confirm', label: 'Confirm', icon: CheckCircle }
            ].map(({ key, label, icon: Icon }, index) => (
              <div key={key} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step === key 
                    ? 'bg-orange-600 text-white' 
                    : index < ['amount', 'agent', 'deposit', 'confirm'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-200 text-neutral-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step === key ? 'text-orange-600' : 'text-neutral-500'
                }`}>
                  {label}
                </span>
                {index < 3 && <ArrowRight className="w-4 h-4 text-neutral-300 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 'amount' && renderAmountStep()}
        {step === 'agent' && renderAgentStep()}
        {step === 'deposit' && renderDepositStep()}
        {step === 'confirm' && renderConfirmStep()}
      </div>
    </PageLayout>
  );
};

export default BitcoinDepositPage;
