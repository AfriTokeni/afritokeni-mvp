import React, { useState, useEffect } from 'react';

import 'leaflet/dist/leaflet.css';
import AmountStep from './AmountStep';
import AgentStep from './AgentStep';
import ConfirmationStep from './ConfirmationStep';
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



  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-6">Withdraw Cash</h1>
        
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep === 'amount' ? 'text-blue-600' : currentStep === 'agent' || currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'amount' ? 'bg-blue-600 text-white' : currentStep === 'agent' || currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium">Enter Amount</span>
          </div>
          
          <div className={`w-8 h-0.5 ${currentStep === 'agent' || currentStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center space-x-2 ${currentStep === 'agent' ? 'text-blue-600' : currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'agent' ? 'bg-blue-600 text-white' : currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-sm font-medium">Select Agent</span>
          </div>
          
          <div className={`w-8 h-0.5 ${currentStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center space-x-2 ${currentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
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
          />
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;