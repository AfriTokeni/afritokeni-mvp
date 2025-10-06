import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import AmountStep from './AmountStep';
import AgentStep from './AgentStep';
import ConfirmationStep from './ConfirmationStep';
import { useAuthentication } from '../../context/AuthenticationContext';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { DataService } from '../../services/dataService';

import type { WithdrawStep } from './types';
import { Agent as DBAgent } from '../../services/dataService';

const WithdrawPage: React.FC = () => {
  const { user } = useAuthentication();
  const { balance } = useAfriTokeni();

  // Refresh data when withdraw page loads to ensure latest balance
  // useEffect(() => {
  //   if (user?.user?.id) {
  //     console.log('💰 WithdrawPage - Refreshing data for user:', user.user.id);
  //     console.log('💰 WithdrawPage - Current balance:', balance);
  //     refreshData();
  //   }
  // }, [user?.user?.id, refreshData, balance]);
  
  // Real balance calculation from datastore
  const getBalanceForCurrency = (): number => {
    if (!balance) return 0;
    // Return the balance if it matches the user's currency, otherwise return 0
    return balance.currency === userCurrency ? balance.balance : 0;
  };
  const [currentStep, setCurrentStep] = useState<WithdrawStep>('amount');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<DBAgent | null>(null);
  const [withdrawalCode, setWithdrawalCode] = useState<string>('');
  const [finalLocalAmount, setFinalLocalAmount] = useState<number>(0);
  const [finalBtcAmount, setFinalBtcAmount] = useState<string>('');
  const [withdrawType, setWithdrawType] = useState<'cash' | 'bitcoin'>('cash');
  const [withdrawalFee, setWithdrawalFee] = useState<number>(0);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Get user's preferred currency or default to UGX (same as dashboard)
  const currentUser = user.user;
  const userCurrency = currentUser?.preferredCurrency || 'UGX';
  
  // Mock Bitcoin exchange rate - would be live in production
  const getBtcExchangeRate = (currency: string) => {
    const rates: Record<string, number> = {
      'NGN': 67500000, // 1 BTC = 67.5M NGN
      'KES': 6450000,  // 1 BTC = 6.45M KES
      'GHS': 540000,   // 1 BTC = 540K GHS
      'ZAR': 774000,   // 1 BTC = 774K ZAR
      'EGP': 1333000   // 1 BTC = 1.33M EGP
    };
    return rates[currency] || 67500000;
  };
  
  const exchangeRate = getBtcExchangeRate(userCurrency);

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

  const handleAgentSelect = async (agent: DBAgent) => {
    if (!user.user?.id) {
      setTransactionError('User not authenticated');
      return;
    }

    setIsCreatingTransaction(true);
    setTransactionError(null);

    try {
      // Generate withdrawal code
      const code = generateWithdrawalCode();
      
      // Create withdrawal request in Juno backend
      await DataService.createWithdrawalRequest(
        user.user.id,
        agent.id,
        finalLocalAmount,
        userCurrency,
        code,
        withdrawalFee
      );

      // Set selected agent and proceed to confirmation
      setSelectedAgent(agent);
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error creating withdraw transaction:', error);
      setTransactionError('Failed to create withdrawal. Please try again.');
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  const handleMakeAnotherWithdrawal = () => {
    setCurrentStep('amount');
    setSelectedAgent(null);
    setWithdrawalCode('');
    setFinalLocalAmount(0);
    setFinalBtcAmount('');
    setWithdrawType('cash');
    setTransactionError(null);
    setIsCreatingTransaction(false);
  };



  return (
    <div className="space-y-6">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
            <div className={`flex items-center space-x-2 ${currentStep === 'amount' ? 'text-gray-900' : currentStep === 'agent' || currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold ${currentStep === 'amount' ? 'bg-gray-900 text-white' : currentStep === 'agent' || currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">Enter Amount</span>
            </div>
            
            <div className={`w-4 sm:w-8 h-0.5 ${currentStep === 'agent' || currentStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'agent' ? 'text-gray-900' : currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold ${currentStep === 'agent' ? 'bg-gray-900 text-white' : currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">Select Agent</span>
            </div>
            
            <div className={`w-4 sm:w-8 h-0.5 ${currentStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'confirmation' ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold ${currentStep === 'confirmation' ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Render Current Step */}
        {currentStep === 'amount' && (
          <AmountStep
            exchangeRate={exchangeRate}
            userBalance={getBalanceForCurrency()}
            preferredCurrency={userCurrency}
            onContinue={(localAmount: string, btcAmount: string, fee: number, withdrawType: 'cash' | 'bitcoin') => {
              // Store the amounts for the confirmation step
              setFinalLocalAmount(parseFloat(localAmount) || 0);
              setFinalBtcAmount(btcAmount);
              setWithdrawType(withdrawType);
              setWithdrawalFee(fee);
              // Note: selectedCurrency is now ignored since we use user's preferred currency
              setCurrentStep(withdrawType === 'cash' ? 'agent' : 'confirmation');
            }}
          />
        )}
        {currentStep === 'agent' && (
          <AgentStep
            userLocation={userLocation}
            locationError={locationError}
            localAmount={finalLocalAmount}
            btcAmount={finalBtcAmount}
            userCurrency={userCurrency}
            onBackToAmount={() => setCurrentStep('amount')}
            onAgentSelect={handleAgentSelect}
            isCreatingTransaction={isCreatingTransaction}
            transactionError={transactionError}
          />
        )}
        {currentStep === 'confirmation' && (withdrawType === 'cash' ? selectedAgent : true) && (
          <ConfirmationStep
            localAmount={finalLocalAmount}
            btcAmount={finalBtcAmount}
            withdrawType={withdrawType}
            userCurrency={userCurrency}
            fee={withdrawalFee}
            userLocation={userLocation}
            selectedAgent={selectedAgent || undefined}
            withdrawalCode={withdrawalCode}
            onMakeAnotherWithdrawal={handleMakeAnotherWithdrawal}
          />
        )}
    </div>
  );
};

export default WithdrawPage;