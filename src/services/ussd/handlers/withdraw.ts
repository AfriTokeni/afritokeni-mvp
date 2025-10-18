/**
 * Withdraw Handler
 * Handles withdrawal flow with agent selection
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { getSessionCurrency } from '../utils/currency.js';
import { WebhookDataService as DataService } from '../../webHookServices.js';
import { TranslationService } from '../../translations.js';

/**
 * Handle withdraw flow
 */
export async function handleWithdraw(input: string, session: USSDSession, sendSMS: (phone: string, msg: string) => Promise<any>, handleMainMenu: any): Promise<string> {
  const lang = session.language || 'en';
  
  switch (session.step) {
    case 1: {
      // Step 1: Get amount to withdraw
      if (!input) {
        const currency = getSessionCurrency(session);
        return continueSession(`${TranslationService.translate('withdraw', lang)}\nEnter amount (${currency}):`);
      }
      const inputParts = input.split('*');
      const sanitized_input = inputParts[inputParts.length - 1] || '';

      console.log(`Withdraw amount: ${sanitized_input}`);

      // Handle cancel
      if (sanitized_input === '0') {
        session.currentMenu = 'local_currency';
        session.step = 0;
        session.data = {};
        return continueSession('__SHOW_LOCAL_CURRENCY_MENU__');
      }
      
      const amount = parseInt(sanitized_input);
      if (isNaN(amount) || amount <= 0) {
        const currency = getSessionCurrency(session);
        return continueSession(`${TranslationService.translate('invalid_amount', lang)}\nEnter amount (${currency}):`);
      }
      
      if (amount < 1000) {
        const currency = getSessionCurrency(session);
        return continueSession(`Minimum withdrawal: ${currency} 1,000\nEnter amount (${currency}):`);
      }
      
      if (amount > 2000000) {
        const currency = getSessionCurrency(session);
        return continueSession(`Maximum withdrawal: ${currency} 2,000,000\nEnter amount (${currency}):`);
      }

      session.data.withdrawAmount = amount;
      session.step = 2;
      
      // Step 2: Check user balance
      console.log(`Checking balance for ${session.phoneNumber}`);
      try {
        const userBalance = await DataService.getUserBalance(`+${session.phoneNumber}`);
        
        if (!userBalance) {
          return endSession('Unable to check balance. Please try again later.');
        }
        
        const totalRequired = amount + Math.round(amount * 0.01); // Include 1% fee
        
        if (userBalance.balance < totalRequired) {
          return endSession(`Insufficient balance.
Available: ${getSessionCurrency(session)} ${userBalance.balance.toLocaleString()}
Required: ${getSessionCurrency(session)} ${totalRequired.toLocaleString()} (including fee)

Thank you for using AfriTokeni!`);
        }
        
        session.data.availableBalance = userBalance.balance;
        session.data.withdrawFee = Math.round(amount * 0.01);
        session.step = 3;
        
        // Step 3: Get list of available agents
        console.log('Getting available agents...');
        const agents = await DataService.getAvailableAgents();
        
        if (agents.length === 0) {
          return endSession('No agents available at the moment. Please try again later.');
        }
        
        // Display only the first 2 agents
        const displayAgents = agents.slice(0, 2);
        session.data.availableAgents = displayAgents;
        
        let agentList = `Select an agent:
Amount: ${getSessionCurrency(session)} ${amount.toLocaleString()}
Fee: ${getSessionCurrency(session)} ${session.data.withdrawFee.toLocaleString()}
Total: ${getSessionCurrency(session)} ${totalRequired.toLocaleString()}

`;
        
        displayAgents.forEach((agent, index) => {
          agentList += `${index + 1}. ${agent.businessName}
   ${agent.location.city}, ${agent.location.address}
`;
        });
        
        agentList += `\n\n${TranslationService.translate('back_or_menu', lang)}`;
        
        return continueSession(agentList);
        
      } catch (error) {
        console.error('Error checking balance:', error);
        return endSession('Unable to process withdrawal. Please try again later.');
      }
    }
      
    case 3: {
      // Step 4: Agent selection
      const inputParts = input.split('*');
      const sanitized_choice = inputParts[inputParts.length - 1] || '';
      const agentChoice = parseInt(sanitized_choice);
      
      if (agentChoice === 0 || sanitized_choice === '0') {
        session.currentMenu = 'local_currency';
        session.step = 0;
        session.data = {};
        return continueSession('__SHOW_LOCAL_CURRENCY_MENU__');
      }
      
      const agents = session.data.availableAgents;
      if (!agents || isNaN(agentChoice) || agentChoice < 1 || agentChoice > agents.length) {
        return continueSession(`Invalid selection. Choose agent number or 0 to cancel:\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      const selectedAgent = agents[agentChoice - 1];
      session.data.selectedAgent = selectedAgent;
      session.step = 4;
      
      const withdrawAmount = session.data.withdrawAmount || 0;
      const withdrawFee = session.data.withdrawFee || 0;
      
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location.city}, ${selectedAgent.location.address}

Amount: ${getSessionCurrency(session)} ${withdrawAmount.toLocaleString()}
Fee: ${getSessionCurrency(session)} ${withdrawFee.toLocaleString()}

Enter your 4-digit PIN to confirm:
${TranslationService.translate('back_or_menu', lang)}`);
    }
      
    case 4: {
      // Step 5: PIN verification
      const inputParts = input.split('*');
      const sanitized_input = inputParts[inputParts.length - 1] || '';
      console.log(`Verifying PIN input: ${sanitized_input.length}`);
      
      // Handle cancel
      if (sanitized_input === '0') {
        session.currentMenu = 'local_currency';
        session.step = 0;
        session.data = {};
        return endSession(`${TranslationService.translate('transaction_failed', lang)}\nTransaction cancelled.\n\nThank you for using AfriTokeni!`);
      }
      
      if (!sanitized_input || sanitized_input.length !== 4) {
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        
        if (session.data.pinAttempts >= 3) {
          return endSession('Too many incorrect PIN attempts. Transaction cancelled for security.');
        }
        
        return continueSession(`Invalid PIN format. Enter 4-digit PIN:
Attempts remaining: ${3 - session.data.pinAttempts}`);
      }
      
      console.log(`Verifying PIN for ${session.phoneNumber}`);
      try {
        const pinValid = await DataService.verifyUserPin(session.phoneNumber, sanitized_input);
        
        if (!pinValid) {
          session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
          
          if (session.data.pinAttempts >= 3) {
            return endSession('Incorrect PIN. Too many attempts. Transaction cancelled for security.');
          }
          
          return continueSession(`Incorrect PIN. Try again:
Attempts remaining: ${3 - session.data.pinAttempts}`);
        }
        
        session.step = 5;
        
        // Step 6: Create pending withdrawal transaction with WD- prefix
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const withdrawalCode = `WD-${randomCode}`;
        session.data.withdrawalCode = withdrawalCode;
        
        console.log(`Creating withdrawal transaction for ${session.phoneNumber}`);
        
        // Get user to get their ID
        const user = await DataService.findUserByPhoneNumber(session.phoneNumber);
        if (!user) {
          return endSession('User not found. Please try again later.');
        }
        
        const withdrawAmount = session.data.withdrawAmount || 0;
        const selectedAgent = session.data.selectedAgent;
        
        if (!selectedAgent) {
          return endSession('Agent not selected. Please try again.');
        }
        
        const transactionId = await DataService.createWithdrawTransaction(
          user.id,
          withdrawAmount,
          selectedAgent.id,
          withdrawalCode
        );
        
        if (!transactionId) {
          return endSession('Failed to create withdrawal transaction. Please try again later.');
        }
        
        session.data.transactionId = transactionId;
        
        const withdrawFee = session.data.withdrawFee || 0;
        
        // Send SMS with withdrawal details
        const smsMessage = `AfriTokeni Withdrawal
Code: ${withdrawalCode}
Amount: ${getSessionCurrency(session)} ${withdrawAmount.toLocaleString()}
Fee: ${getSessionCurrency(session)} ${withdrawFee.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location.city}
Valid: 24 hours
Transaction ID: ${transactionId}

Show this code to the agent with your ID to collect cash.`;

        console.log(`Sending withdrawal SMS to ${session.phoneNumber}`);

        try {
          await sendSMS(session.phoneNumber, smsMessage);
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Continue even if SMS fails
        }
        
        return endSession(`✅ Withdrawal Created!

Code: ${withdrawalCode}
Amount: ${getSessionCurrency(session)} ${withdrawAmount.toLocaleString()}
Fee: ${getSessionCurrency(session)} ${withdrawFee.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location.city}

Valid for 24 hours. Show this code and your ID to the agent to collect cash.

SMS sent with details.
Transaction ID: ${transactionId}

Thank you for using AfriTokeni!`);
        
      } catch (error) {
        console.error('Error verifying PIN or creating transaction:', error);
        return endSession('Unable to process withdrawal. Please try again later.');
      }
    }
    
    default:
      // Reset to main menu if something goes wrong
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
  }
}
