import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, User, Star, Plus, CheckCircle } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import TransactionCodeDisplay from '../../components/TransactionCodeDisplay';
import { useAuthentication } from '../../context/AuthenticationContext';
import { CurrencySelector } from '../../components/CurrencySelector';
import { AFRICAN_CURRENCIES, formatCurrencyAmount, type AfricanCurrency } from '../../types/currency';
import type { Agent } from '../withdraw/types';
import { DataService } from '../../services/dataService';

interface DepositRequest {
  id: string;
  userId: string;
  agentId: string;
  amount: {
    local: number;
    currency: string;
  };
  depositCode: string;
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: Date;
}

const DepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthentication();
  const [step, setStep] = useState<'amount' | 'agent' | 'confirmation'>('amount');
  const [amount, setAmount] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(user.user?.preferredCurrency || 'UGX');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [depositCode, setDepositCode] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  const currencyInfo = AFRICAN_CURRENCIES[selectedCurrency as keyof typeof AFRICAN_CURRENCIES];

  // Load agents function using real datastore data
  const loadAgents = useCallback(async () => {
    if (!userLocation) {
      console.log('User location not available yet');
      return;
    }

    setIsLoadingAgents(true);
    setError('');
    
    try {
      // Get nearby agents from the datastore
      // Radius of 10km, include available and busy agents
      const nearbyAgents = await DataService.getNearbyAgents(
        userLocation.lat, 
        userLocation.lng, 
        10, 
        ['available', 'busy']
      );

      // Transform the Agent data from datastore to the UI Agent type
      const transformedAgents: Agent[] = nearbyAgents.map(dbAgent => ({
        id: dbAgent.id,
        name: dbAgent.businessName || `Agent ${dbAgent.id.slice(0, 8)}`,
        location: `${dbAgent.location.city}, ${dbAgent.location.state}`,
        phone: '+256700000000', // Would need to get from user data
        rating: 4.5, // Default rating - would be calculated from reviews
        available: dbAgent.status === 'available'
      }));

      console.log(`Loaded ${transformedAgents.length} agents from datastore`);
      setAgents(transformedAgents);

      if (transformedAgents.length === 0) {
        setError('No agents available in your area. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      setError('Failed to load agents. Please try again.');
      
      // Fallback to mock data if datastore fails
      const fallbackAgents: Agent[] = [
        {
          id: 'agent_fallback_1',
          name: 'Local Agent',
          location: 'Kampala Central',
          phone: '+256700123456',
          rating: 4.5,
          available: true
        }
      ];
      setAgents(fallbackAgents);
    } finally {
      setIsLoadingAgents(false);
    }
  }, [userLocation]);

  // Get user location for nearby agents
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          console.log('User location:', location);
        },
        (error) => {
          console.error('Location error:', error);
          // Set default location (Kampala, Uganda) if geolocation fails
          setUserLocation({ lat: 0.3476, lng: 32.5825 });
        }
      );
    } else {
      // Set default location if geolocation is not supported
      setUserLocation({ lat: 0.3476, lng: 32.5825 });
    }
  }, []);

  // Load agents when step changes to agent selection and location is available
  useEffect(() => {
    if (step === 'agent' && userLocation) {
      loadAgents();
    }
  }, [step, userLocation, loadAgents]);

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);
    
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (numAmount < 1000) {
      setError(`Minimum deposit amount is ${formatCurrencyAmount(1000, selectedCurrency as AfricanCurrency)}`);
      return false;
    }
    
    if (numAmount > 1000000) {
      setError(`Maximum deposit amount is ${formatCurrencyAmount(1000000, selectedCurrency as AfricanCurrency)}`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleAmountContinue = () => {
    if (validateAmount()) {
      setStep('agent');
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    createDepositRequest(agent);
  };

  const createDepositRequest = async (agent: Agent) => {
    if (!user.user) return;
    
    setIsCreating(true);
    try {
      // Generate 6-digit deposit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const depositRequest: DepositRequest = {
        id: `dep_${Date.now()}`,
        userId: user.user.id,
        agentId: agent.id,
        amount: {
          local: parseFloat(amount),
          currency: selectedCurrency
        },
        depositCode: code,
        status: 'pending',
        createdAt: new Date()
      };

      // In production, this would create the deposit request in the backend
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deposit request created:', depositRequest);
      
      setDepositCode(code);
      setStep('confirmation');
    } catch (error) {
      console.error('Failed to create deposit request:', error);
      setError('Failed to create deposit request. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderAmountStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Deposit Cash</h2>
          <p className="text-neutral-600">Add money to your AfriTokeni account via local agents</p>
        </div>

        <div className="space-y-6">
          {/* Currency Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-neutral-700">
                Select Currency
              </label>
              <CurrencySelector
                currentCurrency={selectedCurrency}
                onCurrencyChange={(currency) => {
                  setSelectedCurrency(currency);
                  setAmount('');
                  setError('');
                }}
              />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-neutral-200">
                <span className="text-neutral-700 font-semibold text-xs">
                  {selectedCurrency}
                </span>
              </div>
              <div>
                <p className="text-neutral-900 font-medium text-sm">
                  {currencyInfo?.name}
                </p>
                <p className="text-neutral-500 text-xs">
                  {currencyInfo?.symbol} • {currencyInfo?.country}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-3">
              Deposit Amount
            </label>
            <div className="relative">
              {/* <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 font-medium">
                {currencyInfo?.symbol}
              </span> */}
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200 font-mono text-lg"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Minimum: {formatCurrencyAmount(1000, selectedCurrency as AfricanCurrency)} • 
              Maximum: {formatCurrencyAmount(1000000, selectedCurrency as AfricanCurrency)}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleAmountContinue}
            disabled={!amount}
            className="w-full bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            Find Nearby Agents
          </button>
        </div>
      </div>
    </div>
  );

  const renderAgentStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Select Agent</h2>
          <p className="text-neutral-600">
            Choose an agent to deposit {formatCurrencyAmount(parseFloat(amount), selectedCurrency as AfricanCurrency)}
          </p>
        </div>

        {isLoadingAgents ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900"></div>
              <span>Finding nearby agents...</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent) => (
            <div
              key={agent.id}
              className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors cursor-pointer"
              onClick={() => handleAgentSelect(agent)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-neutral-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{agent.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{agent.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-600">Available</p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {isCreating && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center space-x-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900"></div>
              <span>Creating deposit request...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Deposit Request Created</h2>
          <p className="text-neutral-600">Meet your agent to complete the deposit</p>
        </div>

        <div className="space-y-6">
          {/* Deposit Code */}
          <div className="bg-neutral-50 rounded-lg p-6 text-center">
            <p className="text-sm font-medium text-neutral-700 mb-2">Your Deposit Code</p>
            <div className="text-3xl font-mono font-bold text-neutral-900 tracking-wider">
              {depositCode}
            </div>
            <p className="text-xs text-neutral-500 mt-2">Show this code to your agent</p>
          </div>

          {/* Transaction Details */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-900 mb-4">Transaction Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Amount</span>
                <span className="font-semibold">{formatCurrencyAmount(parseFloat(amount), selectedCurrency as AfricanCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Agent</span>
                <span className="font-semibold">{selectedAgent?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Location</span>
                <span className="font-semibold">{selectedAgent?.location}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
            <TransactionCodeDisplay
              code={depositCode}
              title="Your Deposit Code"
              description="Show this code to the agent when making your deposit"
              className="mb-6"
            />
            
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-700">
              <li>Bring your cash to the agent&apos;s location</li>
              <li>Show your deposit code or QR code to the agent</li>
              <li>Agent will verify and add money to your account</li>
              <li>You&apos;ll receive a confirmation notification</li>
            </ol>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/users/dashboard')}
              className="flex-1 bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => {
                setStep('amount');
                setAmount('');
                setSelectedAgent(null);
                setDepositCode('');
                setError('');
              }}
              className="flex-1 bg-white border border-neutral-300 text-neutral-700 py-3 px-4 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              Make Another Deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout>
      <div className="min-h-screen bg-neutral-50 py-8">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8 px-4">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'amount' ? 'bg-neutral-900 text-white' : 
                ['agent', 'confirmation'].includes(step) ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-neutral-700">Amount</span>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'agent' ? 'bg-neutral-900 text-white' : 
                step === 'confirmation' ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-neutral-700">Select Agent</span>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirmation' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium text-neutral-700">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Render Current Step */}
        <div className="px-4">
          {step === 'amount' && renderAmountStep()}
          {step === 'agent' && renderAgentStep()}
          {step === 'confirmation' && renderConfirmationStep()}
        </div>
      </div>
    </PageLayout>
  );
};

export default DepositPage;
