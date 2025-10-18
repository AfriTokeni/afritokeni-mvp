/**
 * Deposit Handler
 * Handles deposit flow with agent selection
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { getSessionCurrency } from '../utils/currency.js';
import { WebhookDataService as DataService } from '../../webHookServices.js';
import { TranslationService } from '../../translations.js';

/**
 * Handle deposit flow
 */
export async function handleDeposit(input: string, session: USSDSession, sendSMS: (phone: string, msg: string) => Promise<any>): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  const lang = session.language || 'en';
  
  switch (session.step) {
    case 1: {
      // Step 1: Enter deposit amount
      const currency = getSessionCurrency(session);
      if (!currentInput) {
        return continueSession(`Deposit Money\nEnter amount (${currency}):\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      // Handle cancel
      if (currentInput === '0') {
        session.currentMenu = 'local_currency';
        session.step = 0;
        session.data = {};
        return continueSession('__SHOW_LOCAL_CURRENCY_MENU__');
      }
      
      const amount = parseInt(currentInput);
      if (isNaN(amount) || amount <= 0) {
        return continueSession(`Invalid amount.\nEnter amount to deposit (${currency}):\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      if (amount < 1000) {
        return continueSession(`Minimum deposit: ${currency} 1,000\nEnter amount to deposit (${currency}):\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      if (amount > 5000000) {
        return continueSession(`Maximum deposit: ${currency} 5,000,000\nEnter amount to deposit (${currency}):\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }

      session.data.depositAmount = amount;
      session.step = 2;
      
      // Get list of available agents
      console.log('Getting available agents for deposit...');
      try {
        const agents = await DataService.getAvailableAgents();
        
        if (agents.length === 0) {
          return endSession('No agents available at the moment. Please try again later.');
        }
        
        // Display only the first 2 agents
        const displayAgents = agents.slice(0, 2);
        session.data.availableAgents = displayAgents;
        
        let agentList = `Select an agent for deposit:
Amount: ${currency} ${amount.toLocaleString()}

`;
        
        displayAgents.forEach((agent, index) => {
          agentList += `${index + 1}. ${agent.businessName}
   ${agent.location.city}, ${agent.location.address}
`;
        });
        
        agentList += '\n0. Cancel deposit';
        
        return continueSession(agentList);
        
      } catch (error) {
        console.error('Error getting agents:', error);
        return endSession('Unable to get agents. Please try again later.');
      }
    }
    
    case 2: {
      // Step 2: Agent selection
      
      // Handle cancel
      if (currentInput === '0') {
        session.currentMenu = 'local_currency';
        session.step = 0;
        session.data = {};
        return continueSession('__SHOW_LOCAL_CURRENCY_MENU__');
      }
      
      const agentChoice = parseInt(currentInput);
      
      if (agentChoice === 0) {
        return endSession('Deposit cancelled.\n\nThank you for using AfriTokeni!');
      }
      
      const agents = session.data.availableAgents;
      if (!agents || isNaN(agentChoice) || agentChoice < 1 || agentChoice > agents.length) {
        return continueSession(`Invalid selection. Choose agent number or 0 to cancel:\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      const selectedAgent = agents[agentChoice - 1];
      session.data.selectedAgent = selectedAgent;
      session.step = 3;
      
      const depositAmount = session.data.depositAmount || 0;
      
      const currency = getSessionCurrency(session);
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location.city}, ${selectedAgent.location.address}

Deposit Amount: ${currency} ${depositAmount.toLocaleString()}

Enter your 4-digit PIN to confirm:\n\n${TranslationService.translate('back_or_menu', lang)}`);
    }
    
    case 3: {
      // Step 3: PIN verification and deposit code generation
      
      // Handle cancel
      if (currentInput === '0') {
        session.currentMenu = 'local_currency';
        session.step = 0;
        session.data = {};
        return endSession(`${TranslationService.translate('transaction_failed', lang)}\nTransaction cancelled.\n\nThank you for using AfriTokeni!`);
      }
      
      if (!currentInput || currentInput.length !== 4) {
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        
        if (session.data.pinAttempts >= 3) {
          return endSession('Too many incorrect PIN attempts. Deposit cancelled for security.');
        }
        
        return continueSession(`Invalid PIN format. Enter 4-digit PIN:
Attempts remaining: ${3 - session.data.pinAttempts}\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      console.log(`Verifying PIN for deposit: ${session.phoneNumber}`);
      try {
        const pinValid = await DataService.verifyUserPin(session.phoneNumber, currentInput);
        
        if (!pinValid) {
          session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
          
          if (session.data.pinAttempts >= 3) {
            return endSession('Incorrect PIN. Too many attempts. Deposit cancelled for security.');
          }
          
          return continueSession(`Incorrect PIN. Try again:
Attempts remaining: ${3 - session.data.pinAttempts}\n\n${TranslationService.translate('back_or_menu', lang)}`);
        }
        
        // Generate deposit code with DEP- prefix
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const depositCode = `DEP-${randomCode}`;
        session.data.depositCode = depositCode;
        
        console.log(`Creating deposit request for ${session.phoneNumber}`);
        
        // Get user to get their ID
        const user = await DataService.findUserByPhoneNumber(session.phoneNumber);
        if (!user) {
          return endSession('User not found. Please try again later.');
        }
        
        const depositAmount = session.data.depositAmount || 0;
        const selectedAgent = session.data.selectedAgent;
        
        if (!selectedAgent) {
          return endSession('Agent not selected. Please try again.');
        }
        
        // Create pending deposit request in datastore
        const currency = getSessionCurrency(session);
        let depositId: string;
        try {
          depositId = await DataService.createDepositRequest(
            user.id,
            selectedAgent.id,
            depositAmount,
            currency,
            depositCode
          );
          session.data.depositId = depositId;
          console.log(`✅ Deposit request ${depositId} created successfully`);
        } catch (createError) {
          console.error('❌ Failed to create deposit request:', createError);
          return endSession('Failed to create deposit request. Please try again later.');
        }
        
        // Send SMS with deposit details
        const smsMessage = `AfriTokeni Deposit
Code: ${depositCode}
Amount: ${currency} ${depositAmount.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location.city}
Valid: 24 hours
Deposit ID: ${depositId}

Give this code and cash to the agent to complete deposit.`;

        console.log(`Sending deposit SMS to ${session.phoneNumber}`);

        try {
          await sendSMS(session.phoneNumber, smsMessage);
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Continue even if SMS fails
        }
        
        return endSession(`✅ Deposit Request Created!

Code: ${depositCode}
Amount: ${currency} ${depositAmount.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location.city}

Valid for 24 hours. Give this code and cash to the agent to complete your deposit.

SMS sent with details.
Deposit ID: ${depositId}

Thank you for using AfriTokeni!`);
        
      } catch (error) {
        console.error('Error verifying PIN or creating deposit:', error);
        return endSession('Unable to process deposit. Please try again later.');
      }
    }
    
    default:
      return endSession('Deposit process error. Please try again.');
  }
}
