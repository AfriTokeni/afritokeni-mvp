import React, { useState, useEffect, useCallback } from 'react';
import { Bitcoin, ArrowRight, CheckCircle, QrCode } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BitcoinService } from '../../services/bitcoinService';
import { EscrowService, EscrowTransaction } from '../../services/escrowService';
import { Agent, DataService } from '../../services/dataService';
import { AfricanCurrency } from '../../types/currency';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import {
  BitcoinAmountStep,
  BitcoinAgentStep,
  BitcoinDepositStep,
  BitcoinConfirmStep
} from './bitcoin-deposit';


interface DepositState {
  amount?: string;
  currency?: AfricanCurrency;
  selectedAgent?: Agent;
}

const BitcoinDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAfriTokeni();
  const [step, setStep] = useState<'amount' | 'agent' | 'deposit' | 'confirm'>('amount');
  const [btcAmount, setBtcAmount] = useState('');
  const [localAmount, setLocalAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<AfricanCurrency>('UGX');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [escrowTransaction, setEscrowTransaction] = useState<EscrowTransaction | null>(null);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [depositAddress, setDepositAddress] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  
  // Get agents from escrow service
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);

  const loadAvailableAgents = useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      // Use user location if available, otherwise default to Kampala
      const lat = userLocation?.[0] || 0.3476;
      const lng = userLocation?.[1] || 32.5825;
      const agents = await DataService.getNearbyAgents(lat, lng, 50, ['available', 'busy']); // 50km radius
      setAvailableAgents(agents);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setIsLoadingAgents(false);
    }
  }, [userLocation]);

  const loadExchangeRate = useCallback(async () => {
    try {
      const rate = await BitcoinService.getExchangeRate(selectedCurrency);
      setExchangeRate(rate.btcToLocal);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      setExchangeRate(45000000); // Fallback rate
    }
  }, [selectedCurrency]);

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
  }, [location.state, selectedCurrency, loadExchangeRate, loadAvailableAgents]);

  // Get user location for agent selection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Default to Kampala, Uganda if geolocation fails
          setUserLocation([0.3476, 32.5825]);
        }
      );
    } else {
      // Default location if geolocation not supported
      setUserLocation([0.3476, 32.5825]);
    }
  }, []);

  // Recalculate amounts when exchange rate changes
  useEffect(() => {
    if (btcAmount && parseFloat(btcAmount) > 0 && exchangeRate > 0) {
      const btcNum = parseFloat(btcAmount);
      const localValue = Math.round(btcNum * exchangeRate);
      setLocalAmount(localValue.toString());
    }
  }, [exchangeRate, btcAmount]);

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

  const handleCurrencyChange = async (currency: AfricanCurrency) => {
    setSelectedCurrency(currency);
    // Reload exchange rate for new currency and recalculate amounts
    try {
      const rate = await BitcoinService.getExchangeRate(currency);
      setExchangeRate(rate.btcToLocal);
      
      // Recalculate local amount if BTC amount exists
      if (btcAmount && parseFloat(btcAmount) > 0) {
        const btcNum = parseFloat(btcAmount);
        const localValue = Math.round(btcNum * rate.btcToLocal);
        setLocalAmount(localValue.toString());
      }
    } catch (error) {
      console.error('Error loading exchange rate for currency change:', error);
      setExchangeRate(45000000); // Fallback rate
    }
  };

  const selectAgent = async (agent: Agent) => {
    setIsCreatingTransaction(true);
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
    } finally {
      setIsCreatingTransaction(false);
    }
  };

    const confirmDeposit = () => {
    if (escrowTransaction) {
      setTransactionId(escrowTransaction.id);
      setStep('confirm');
    }
  };

  return (
    <div className="space-y-6">
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
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step === key ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {index < 3 && <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 'amount' && (
          <BitcoinAmountStep
            btcAmount={btcAmount}
            localAmount={localAmount}
            selectedCurrency={selectedCurrency}
            exchangeRate={exchangeRate}
            onBtcAmountChange={handleBtcAmountChange}
            onLocalAmountChange={handleLocalAmountChange}
            onCurrencyChange={handleCurrencyChange}
            onNext={() => setStep('agent')}
          />
        )}
        {step === 'agent' && (
          <BitcoinAgentStep
            agents={availableAgents}
            selectedAgent={selectedAgent}
            btcAmount={btcAmount}
            localAmount={localAmount}
            selectedCurrency={selectedCurrency}
            userLocation={userLocation}
            isLoading={isLoadingAgents}
            isCreating={isCreatingTransaction}
            onAgentSelect={selectAgent}
            onBack={() => setStep('amount')}
          />
        )}
        {step === 'deposit' && (
          <BitcoinDepositStep
            selectedAgent={selectedAgent}
            escrowTransaction={escrowTransaction}
            btcAmount={btcAmount}
            localAmount={localAmount}
            selectedCurrency={selectedCurrency}
            depositAddress={depositAddress}
            onConfirm={confirmDeposit}
            onBack={() => setStep('agent')}
          />
        )}
        {step === 'confirm' && (
          <BitcoinConfirmStep
            selectedAgent={selectedAgent}
            transactionId={transactionId}
            onViewTransactions={() => navigate('/users/history')}
            onMakeAnother={() => {
              setStep('amount');
              setBtcAmount('');
              setLocalAmount('');
              setSelectedAgent(null);
              setTransactionId('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BitcoinDepositPage;
