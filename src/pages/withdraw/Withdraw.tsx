import React, { useState, useEffect } from 'react';

import 'leaflet/dist/leaflet.css';
import AmountStep from './AmountStep';
import AgentStep from './AgentStep';
import ConfirmationStep from './ConfirmationStep';
import PageLayout from '../../components/PageLayout';
import type { Agent, WithdrawStep } from './types';



const WithdrawPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WithdrawStep>('amount');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [withdrawalCode, setWithdrawalCode] = useState<string>('');
  const [finalUgxAmount, setFinalUgxAmount] = useState<number>(0);
  const [finalUsdcAmount, setFinalUsdcAmount] = useState<number>(0);

  // Exchange rate (mock)
  const exchangeRate = 3750; // 1 USDC = 3750 UGX

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          setLocationError(`Error getting location: ${error.message}`);
          setUserLocation([0.3136, 32.5811]);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setUserLocation([0.3136, 32.5811]);
    }
  }, []);

  // Generate withdrawal code
  const generateWithdrawalCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setWithdrawalCode(code);
    return code;
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setCurrentStep('confirmation');
    generateWithdrawalCode();
  };

  const handleMakeAnotherWithdrawal = () => {
    setCurrentStep('amount');
    setSelectedAgent(null);
    setWithdrawalCode('');
    setFinalUgxAmount(0);
    setFinalUsdcAmount(0);
  };



  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-8">Withdraw Cash</h1>
        
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep === 'amount' ? 'text-neutral-900' : currentStep === 'agent' || currentStep === 'confirmation' ? 'text-green-600' : 'text-neutral-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'amount' ? 'bg-neutral-900 text-white' : currentStep === 'agent' || currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-neutral-200'}`}>
              1
            </div>
            <span className="text-sm font-medium">Enter Amount</span>
          </div>
          
          <div className={`w-8 h-0.5 ${currentStep === 'agent' || currentStep === 'confirmation' ? 'bg-green-600' : 'bg-neutral-200'}`}></div>
          
          <div className={`flex items-center space-x-2 ${currentStep === 'agent' ? 'text-neutral-900' : currentStep === 'confirmation' ? 'text-green-600' : 'text-neutral-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'agent' ? 'bg-neutral-900 text-white' : currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-neutral-200'}`}>
              2
            </div>
            <span className="text-sm font-medium">Select Agent</span>
          </div>
          
          <div className={`w-8 h-0.5 ${currentStep === 'confirmation' ? 'bg-green-600' : 'bg-neutral-200'}`}></div>
          
          <div className={`flex items-center space-x-2 ${currentStep === 'confirmation' ? 'text-neutral-900' : 'text-neutral-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'confirmation' ? 'bg-neutral-900 text-white' : 'bg-neutral-200'}`}>
              3
            </div>
            <span className="text-sm font-medium">Confirmation</span>
          </div>
        </div>

        {/* Render Current Step */}
        {currentStep === 'amount' && (
          <AmountStep
            exchangeRate={exchangeRate}
            onContinue={(ugxAmount: string, usdcAmount: string) => {
              // Store the amounts for the confirmation step
              setFinalUgxAmount(parseFloat(ugxAmount) || 0);
              setFinalUsdcAmount(parseFloat(usdcAmount) || 0);
              setCurrentStep('agent');
            }}
          />
        )}
        {currentStep === 'agent' && (
          <AgentStep
            userLocation={userLocation}
            locationError={locationError}
            ugxAmount={finalUgxAmount}
            usdcAmount={finalUsdcAmount}
            onBackToAmount={() => setCurrentStep('amount')}
            onAgentSelect={handleAgentSelect}
          />
        )}
        {currentStep === 'confirmation' && selectedAgent && (
          <ConfirmationStep
            ugxAmount={finalUgxAmount}
            usdcAmount={finalUsdcAmount}
            userLocation={userLocation}
            selectedAgent={selectedAgent}
            withdrawalCode={withdrawalCode}
            onMakeAnotherWithdrawal={handleMakeAnotherWithdrawal}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default WithdrawPage;