/**
 * USDC Handlers
 * NOTE: Per business logic, USDC should be REMOVED from AfriTokeni
 * AfriTokeni is Bitcoin ↔ African currencies ONLY, no stablecoins
 * This file exists temporarily for backward compatibility
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { getSessionCurrency } from '../utils/currency.js';
import { WebhookDataService as DataService, Agent } from '../../webHookServices.js';
import { CkUSDCService } from '../../ckUSDCService.js';
import { verifyUserPin } from './pinManagement.js';

// These will be injected by the caller
let sendSMSNotification: (phone: string, msg: string) => Promise<any>;
let handleMainMenu: any;

export function initUSDCHandlers(smsFunc: any, mainMenuFunc: any) {
  sendSMSNotification = smsFunc;
  handleMainMenu = mainMenuFunc;
}

async function handleUSDC(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  if (!currentInput) {
    return continueSession(`USDC (ckUSDC)
Please select an option:
3.1 Check Balance
3.2 USDC Rate
3.3 Buy USDC
3.4 Sell USDC
3.5 Send USDC
0. Back to Main Menu`);
  }
  
  switch (currentInput) {
    case '3.1':
      session.currentMenu = 'usdc_balance';
      session.step = 1;
      return continueSession('Check Balance\nEnter your 4-digit PIN:');
    
    case '3.2':
      session.currentMenu = 'usdc_rate';
      session.step = 1;
      return continueSession('USDC Rate\nEnter your 4-digit PIN:');
    
    case '3.3':
      session.currentMenu = 'usdc_buy';
      session.step = 1;
      return continueSession('Buy USDC\nEnter your 4-digit PIN:');
    
    case '3.4':
      session.currentMenu = 'usdc_sell';
      session.step = 1;
      return continueSession('Sell USDC\nEnter your 4-digit PIN:');
    
    case '3.5':
      session.currentMenu = 'usdc_send';
      session.step = 1;
      return continueSession('Send USDC\nEnter your 4-digit PIN:');
    
    case '0':
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
    
    default:
      return continueSession(`Invalid option. Please try again:
3.1 Check Balance
3.2 USDC Rate
3.3 Buy USDC
3.4 Sell USDC
3.5 Send USDC
0. Back to Main Menu`);
  }
}

async function handleUSDCBalance(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // PIN verification step
      if (!/^\d{4}$/.test(sanitized_input)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      // Verify PIN
      const pinCorrect = await verifyUserPin(session.phoneNumber, sanitized_input);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      // Get USDC balance using real CkUSDCService
      try {
        // Get user from DataService to get Principal ID
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession(`User not found.
Please contact support.

Thank you for using AfriTokeni!`);
        }

        // Use the user's Principal ID for ICP blockchain operations
        const currency = getSessionCurrency(session);
        const principalId = user.principalId || user.id; // Fallback to user.id for legacy users
        
        console.log(`📊 Fetching USDC balance for Principal: ${principalId}`);
        
        const balance = await CkUSDCService.getBalanceWithLocalCurrency(
          principalId, // ICP Principal ID
          currency.toLowerCase() as any,
          true     // useSatellite = true for SMS users
        );
        
        return endSession(`Your USDC Balance

$${balance.balanceUSDC} USDC
≈ ${getSessionCurrency(session)} ${balance.localCurrencyEquivalent?.toLocaleString() || '0'}

Current Rate: 1 USDC = ${getSessionCurrency(session)} ${(await CkUSDCService.getExchangeRate('ugx')).rate.toLocaleString()}

Thank you for using AfriTokeni!`);
        
      } catch (error) {
        console.error('Error retrieving USDC balance:', error);
        return endSession(`Error retrieving USDC balance.
Please try again later.

Thank you for using AfriTokeni!`);
      }
    }
    
    default:
      session.currentMenu = 'usdc';
      session.step = 0;
      return handleUSDC('', session);
  }
}

async function handleUSDCRate(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // PIN verification step
      if (!/^\d{4}$/.test(sanitized_input)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      // Verify PIN
      const pinCorrect = await verifyUserPin(session.phoneNumber, sanitized_input);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      // Get real-time USDC to UGX rate
      try {
        const usdcRateUGX = await CkUSDCService.getExchangeRate('ugx');
        
        return endSession(`Current USDC Exchange Rate

1 USDC = ${getSessionCurrency(session)} ${usdcRateUGX.rate.toLocaleString()}
1 ${getSessionCurrency(session)} = $${(1 / usdcRateUGX.rate).toFixed(6)} USDC

Last Updated: ${new Date().toLocaleTimeString()}

Thank you for using AfriTokeni!`);
        
      } catch (error) {
        console.error('Error retrieving USDC rate:', error);
        return endSession(`Error retrieving USDC rate.
Please try again later.

Thank you for using AfriTokeni!`);
      }
    }
    
    default:
      session.currentMenu = 'usdc';
      session.step = 0;
      return handleUSDC('', session);
  }
}

async function handleUSDCBuy(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // PIN verification step
      if (!/^\d{4}$/.test(currentInput)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      // Verify PIN
      const pinCorrect = await verifyUserPin(session.phoneNumber, currentInput);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      session.step = 2;
      return continueSession('Buy USDC\nEnter amount in UGX:');
    }
    
    case 2: {
      // Amount entry step
      const amountUGX = parseFloat(currentInput);
      
      if (isNaN(amountUGX) || amountUGX <= 0) {
        return continueSession('Invalid amount.\nEnter amount in UGX:');
      }
      
      if (amountUGX < 1000) {
        const currency = getSessionCurrency(session);
        return continueSession(`Minimum purchase: ${currency} 1,000\nEnter amount in ${currency}:`);
      }
      
      // Check user balance first
      const userBalance = await DataService.getUserBalance(`+${session.phoneNumber}`);
      if (!userBalance || userBalance.balance < amountUGX) {
        const currentBalance = userBalance ? userBalance.balance : 0;
        return endSession(`Insufficient balance!
Your balance: ${getSessionCurrency(session)} ${currentBalance.toLocaleString()}
Required: ${getSessionCurrency(session)} ${amountUGX.toLocaleString()}

Thank you for using AfriTokeni!`);
      }

      try {
        // Get real available agents for USDC exchange
        console.log('Getting available agents for USDC purchase...');
        const agents = await DataService.getAvailableAgents();
        const availableAgents = agents.filter((agent: Agent) => 
          agent.isActive
          // Additional filters for USDC-capable agents could be added here
        );
        
        if (availableAgents.length === 0) {
          return endSession(`No agents available for USDC purchase at this time.

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
        session.data.usdcPurchaseAmount = amountUGX;
        session.data.availableAgents = availableAgents;
        session.step = 3;
        
        // Get current USDC rate for display
        const usdcRate = await CkUSDCService.getExchangeRate('ugx');
        const usdcAmount = amountUGX / usdcRate.rate;
        const fee = Math.round(usdcAmount * 0.025 * usdcRate.rate); // 2.5% fee in UGX
        const netAmount = amountUGX - fee;
        const finalUSDCAmount = netAmount / usdcRate.rate;
        
        let agentList = `USDC Purchase Quote

Spend: ${getSessionCurrency(session)} ${amountUGX.toLocaleString()}
Fee (2.5%): ${getSessionCurrency(session)} ${fee.toLocaleString()}
Net: ${getSessionCurrency(session)} ${netAmount.toLocaleString()}
Receive: $${finalUSDCAmount.toFixed(6)} USDC

Select an agent:
`;
        
        availableAgents.slice(0, 5).forEach((agent: Agent, index: number) => {
          agentList += `${index + 1}. ${agent.businessName}\n   ${agent.location?.city || 'Location'}\n`;
        });
        
        agentList += '0. Cancel';
        
        return continueSession(agentList);
        
      } catch (error) {
        console.error('Error getting agents for USDC purchase:', error);
        return endSession('Error loading agents. Please try again later.');
      }
    }
    
    case 3: {
      // Agent selection step
      const selection = parseInt(currentInput);
      
      if (selection === 0) {
        return endSession('USDC purchase cancelled.\nThank you for using AfriTokeni!');
      }
      
      if (selection < 1 || selection > (session.data.availableAgents?.length || 0)) {
        return continueSession('Invalid selection.\nChoose an agent number or 0 to cancel:');
      }
      
      try {
        // Get user information
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please contact support.');
        }
        
        const selectedAgent = session.data.availableAgents![selection - 1];
        const ugxAmount = session.data.usdcPurchaseAmount || 0;
        
        // Generate a unique purchase code for the user to give to agent
        const purchaseCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        session.data.purchaseCode = purchaseCode;
        
        // Process USDC purchase through agent using CkUSDCService.exchange
        const exchangeResult = await CkUSDCService.exchange({
          amount: ugxAmount,
          currency: 'ugx',
          type: 'buy',
          userId: user.id,
          agentId: selectedAgent.id
        }, true); // Use satellite for SMS/USSD operations
        
        if (exchangeResult.success && exchangeResult.transactionId) {
          const usdcAmount = exchangeResult.ckusdcAmount;
          
          // Send SMS with purchase details and code
          const smsMessage = `AfriTokeni USDC Purchase
Code: ${purchaseCode}
Amount: ${getSessionCurrency(session)} ${ugxAmount.toLocaleString()}
USDC to receive: $${usdcAmount.toFixed(6)}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}
Transaction ID: ${exchangeResult.transactionId}

Give this code and payment to the agent to complete your USDC purchase.`;

          console.log(`Sending USDC purchase SMS to ${session.phoneNumber}`);

          try {
            await sendSMSNotification(session.phoneNumber, smsMessage);
          } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue even if SMS fails
          }
          
          return endSession(`✅ USDC Purchase Initiated!

Purchase Code: ${purchaseCode}
Transaction ID: ${exchangeResult.transactionId}
You will receive: $${usdcAmount.toFixed(6)} USDC
Amount to pay: ${getSessionCurrency(session)} ${ugxAmount.toLocaleString()}

Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}

Give the code ${purchaseCode} and payment to the agent to complete your purchase.

SMS sent with details.

Thank you for using AfriTokeni!`);
        } else {
          return endSession(`❌ Purchase failed: ${exchangeResult.error || 'Unknown error'}

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
      } catch (error) {
        console.error('Error processing USDC purchase:', error);
        return endSession('Error processing purchase. Please try again later.');
      }
    }
    
    default:
      session.currentMenu = 'usdc';
      session.step = 0;
      return handleUSDC('', session);
  }
}

async function handleUSDCSell(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // PIN verification step
      if (!/^\d{4}$/.test(currentInput)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      // Verify PIN
      const pinCorrect = await verifyUserPin(session.phoneNumber, currentInput);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      session.step = 2;
      
      try {
        // Get user from DataService to get Principal ID
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession(`User not found.
Please contact support.

Thank you for using AfriTokeni!`);
        }

        // Get real USDC balance using CkUSDCService
        const balance = await CkUSDCService.getBalance(user.id, true); // useSatellite = true for SMS
        const usdcBalance = parseFloat(balance.balanceUSDC);
        
        // Store balance for later use
        session.data.usdcBalance = usdcBalance;
        
        return continueSession(`Sell USDC
Your Balance: $${usdcBalance.toFixed(2)} USDC

Enter amount to sell (USDC):
(Min: $1.00, Max: $${usdcBalance.toFixed(2)})`);
      } catch (error) {
        console.error('Error getting USDC balance:', error);
        return continueSession(`Error getting balance.
Please try again later.

Enter your 4-digit PIN:`);
      }
    }
    
    case 2: {
      // Amount entry step
      const usdcAmount = parseFloat(currentInput);
      const userBalance = session.data.usdcBalance || 0;
      
      if (isNaN(usdcAmount) || usdcAmount <= 0) {
        return continueSession('Invalid amount.\nEnter USDC amount to sell:');
      }
      
      if (usdcAmount < 1) {
        return continueSession('Minimum sale: $1.00 USDC\nEnter USDC amount to sell:');
      }
      
      if (usdcAmount > userBalance) {
        return continueSession(`Insufficient balance.
Your balance: $${userBalance.toFixed(2)} USDC
Enter USDC amount to sell:`);
      }
      
      try {
        // Get current USDC rate and calculate fees
        const usdcRate = await CkUSDCService.getExchangeRate('ugx');
        const ugxGross = usdcAmount * usdcRate.rate;
        const fee = Math.round(ugxGross * 0.025); // 2.5% fee in UGX
        const ugxNet = ugxGross - fee;
        
        session.data.usdcSellAmount = usdcAmount;
        session.data.ugxGross = ugxGross;
        session.data.ugxNet = ugxNet;
        session.data.fee = fee;
        session.step = 3;
        
        // Get available agents for USDC exchange
        console.log('Getting available agents for USDC sale...');
        const agents = await DataService.getAvailableAgents();
        const availableAgents = agents.filter((agent: Agent) => 
          agent.isActive
          // Additional filters for agents with sufficient cash could be added
        );
        
        if (availableAgents.length === 0) {
          return endSession(`No agents available for USDC sale at this time.

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
        session.data.availableAgents = availableAgents;
        
        let agentList = `USDC Sale Quote

Sell: $${usdcAmount.toFixed(6)} USDC
Gross: ${getSessionCurrency(session)} ${ugxGross.toLocaleString()}
Fee (2.5%): ${getSessionCurrency(session)} ${fee.toLocaleString()}
You receive: ${getSessionCurrency(session)} ${ugxNet.toLocaleString()}

Select an agent:
`;
        
        availableAgents.slice(0, 5).forEach((agent: Agent, index: number) => {
          agentList += `${index + 1}. ${agent.businessName}\n   ${agent.location?.city || 'Location'}\n`;
        });
        
        agentList += '0. Cancel';
        
        return continueSession(agentList);
        
      } catch (error) {
        console.error('Error getting agents for USDC sale:', error);
        return endSession('Error loading agents. Please try again later.');
      }
    }
    
    case 3: {
      // Agent selection
      const agentChoice = parseInt(currentInput);
      
      if (agentChoice === 0) {
        session.currentMenu = 'usdc';
        session.step = 0;
        return handleUSDC('', session);
      }
      
      const agents = session.data.availableAgents;
      if (!agents || isNaN(agentChoice) || agentChoice < 1 || agentChoice > agents.length) {
        return continueSession('Invalid selection.\nSelect an agent (1-' + (agents?.length || 0) + ') or 0 to cancel:');
      }
      
      const selectedAgent = agents[agentChoice - 1];
      session.data.selectedAgent = selectedAgent;
      session.step = 4;
      
      const usdcAmount = session.data.usdcSellAmount || 0;
      const ugxNet = session.data.ugxNet || 0;
      const fee = session.data.fee || 0;
      
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location?.city || 'Location'}, ${selectedAgent.location?.address || ''}

Sale Details:
Sell: $${usdcAmount.toFixed(6)} USDC
Fee: ${getSessionCurrency(session)} ${fee.toLocaleString()}
You receive: ${getSessionCurrency(session)} ${ugxNet.toLocaleString()}

Enter your PIN to confirm:`);
    }
    
    case 4: {
      // PIN verification and process USDC sale
      if (!/^\d{4}$/.test(currentInput)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      const pinCorrect = await verifyUserPin(session.phoneNumber, currentInput);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      try {
        // Get user information
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please contact support.');
        }
        
        const selectedAgent = session.data.selectedAgent;
        const usdcAmount = session.data.usdcSellAmount || 0;
        
        // Generate a unique sale code for the user to give to agent
        const saleCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        session.data.saleCode = saleCode;
        
        // Process USDC to local currency exchange through agent
        const exchangeResult = await CkUSDCService.exchange({
          userId: user.id,
          agentId: selectedAgent.id,
          amount: usdcAmount,
          currency: 'ugx',
          type: 'sell'
        }, true);
        
        if (exchangeResult.success && exchangeResult.transactionId) {
          const ugxAmount = exchangeResult.localCurrencyAmount || 0;
          
          // Send SMS with sale details and code
          const smsMessage = `AfriTokeni USDC Sale
Code: ${saleCode}
USDC to sell: $${usdcAmount.toFixed(6)}
You will receive: ${getSessionCurrency(session)} ${ugxAmount.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}
Transaction ID: ${exchangeResult.transactionId}

Give this code to the agent to complete your USDC sale and collect cash.`;

          console.log(`Sending USDC sale SMS to ${session.phoneNumber}`);

          try {
            await sendSMSNotification(session.phoneNumber, smsMessage);
          } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue even if SMS fails
          }
          
          return endSession(`✅ USDC Sale Initiated!

Sale Code: ${saleCode}
Transaction ID: ${exchangeResult.transactionId}
Selling: $${usdcAmount.toFixed(6)} USDC
You will receive: ${getSessionCurrency(session)} ${ugxAmount.toLocaleString()}

Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}

Give the code ${saleCode} to the agent to complete your sale and collect cash.

SMS sent with details.

Thank you for using AfriTokeni!`);
        } else {
          return endSession(`❌ Sale failed: ${exchangeResult.error || 'Unknown error'}

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
      } catch (error) {
        console.error('Error processing USDC sale:', error);
        return endSession('Error processing sale. Please try again later.');
      }
    }
    
    default:
      session.currentMenu = 'usdc';
      session.step = 0;
      return handleUSDC('', session);
  }
}

async function handleUSDCSend(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // PIN verification step
      if (!/^\d{4}$/.test(currentInput)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      // Verify PIN
      const pinCorrect = await verifyUserPin(session.phoneNumber, currentInput);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      session.step = 2;
      
      try {
        // Get user from DataService to get Principal ID
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession(`User not found.
Please contact support.

Thank you for using AfriTokeni!`);
        }

        // Get real USDC balance using CkUSDCService
        const balance = await CkUSDCService.getBalance(user.id, true); // useSatellite = true for SMS
        const usdcBalance = parseFloat(balance.balanceUSDC);
        
        // Store balance for later use
        session.data.usdcBalance = usdcBalance;
        
        return continueSession(`Send USDC
Your Balance: $${usdcBalance.toFixed(6)} USDC

Enter amount to send (USDC):
(Min: $0.01)`);
      } catch (error) {
        console.error('Error getting USDC balance:', error);
        return continueSession(`Error getting balance.
Please try again later.

Enter your 4-digit PIN:`);
      }
    }
    
    case 2: {
      // Amount entry step
      const usdcAmount = parseFloat(currentInput);
      const userBalance = session.data.usdcBalance || 0;
      
      if (isNaN(usdcAmount) || usdcAmount <= 0) {
        return continueSession('Invalid amount.\nEnter USDC amount to send:');
      }
      
      if (usdcAmount < 0.01) {
        return continueSession('Minimum send: $0.01 USDC\nEnter USDC amount to send:');
      }
      
      // Calculate transaction fee (0.0001 USDC)
      const transactionFee = 0.0001;
      const totalRequired = usdcAmount + transactionFee;
      
      if (totalRequired > userBalance) {
        return continueSession(`Insufficient balance.
Amount: $${usdcAmount.toFixed(6)} USDC
Fee: $${transactionFee.toFixed(6)} USDC
Total needed: $${totalRequired.toFixed(6)} USDC
Your balance: $${userBalance.toFixed(6)} USDC
Enter USDC amount to send:`);
      }
      
      session.data.usdcAmount = usdcAmount;
      session.data.transactionFee = transactionFee;
      session.step = 3;
      
      return continueSession(`Amount: $${usdcAmount.toFixed(6)} USDC
Fee: $${transactionFee.toFixed(6)} USDC
Total: $${totalRequired.toFixed(6)} USDC

Enter recipient phone number:
(Format: +256701234567)`);
    }
    
    case 3: {
      // Recipient phone number entry
      let recipientPhone = currentInput.trim();
      
      // Handle different phone number formats
      if (recipientPhone.startsWith('0')) {
        recipientPhone = '+256' + recipientPhone.substring(1);
      } else if (recipientPhone.startsWith('256')) {
        recipientPhone = '+' + recipientPhone;
      } else if (!recipientPhone.startsWith('+')) {
        recipientPhone = '+256' + recipientPhone;
      }
      
      // Basic phone number validation
      const phoneRegex = /^\+256[0-9]{9}$/;
      if (!phoneRegex.test(recipientPhone)) {
        return continueSession('Invalid phone number format.\nEnter recipient phone:\n(Format: +256701234567)');
      }
      
      // Check if recipient exists
      try {
        const recipient = await DataService.findUserByPhoneNumber(recipientPhone);
        if (!recipient) {
          return continueSession(`Recipient ${recipientPhone} not found.
Please ensure they have an AfriTokeni account.
Enter recipient phone number:`);
        }
        
        // Don't allow sending to yourself
        if (recipientPhone === `+${session.phoneNumber}`) {
          return continueSession('Cannot send to your own number.\nEnter recipient phone number:');
        }
        
        session.data.recipientPhone = recipientPhone;
        session.data.recipientName = recipient.firstName || 'User';
        session.step = 4;
        
        const usdcAmount = session.data.usdcAmount || 0;
        const transactionFee = session.data.transactionFee || 0;
        const totalAmount = usdcAmount + transactionFee;
        
        return continueSession(`Confirm USDC Transfer:

To: ${recipient.firstName || 'User'} (${recipientPhone})
Amount: $${usdcAmount.toFixed(6)} USDC
Fee: $${transactionFee.toFixed(6)} USDC
Total: $${totalAmount.toFixed(6)} USDC

Enter your PIN to confirm:`);
        
      } catch (error) {
        console.error('Error finding recipient:', error);
        return continueSession('Error verifying recipient.\nPlease try again.\nEnter recipient phone number:');
      }
    }
    
    case 4: {
      // Final PIN verification and process transfer
      if (!/^\d{4}$/.test(currentInput)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      const pinCorrect = await verifyUserPin(session.phoneNumber, currentInput);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      try {
        // Get user information
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        const recipient = session.data.recipientPhone ? 
          await DataService.findUserByPhoneNumber(session.data.recipientPhone) : null;
        
        if (!user || !recipient) {
          return endSession('User verification failed. Please try again later.');
        }
        
        const usdcAmount = session.data.usdcAmount || 0;
        const transactionFee = session.data.transactionFee || 0;
        
        // Process USDC transfer
        const transferResult = await CkUSDCService.transfer({
          senderId: user.id,
          recipient: recipient.id,
          amount: usdcAmount,
          memo: `USSD transfer to ${session.data.recipientPhone}`
        }, true); // useSatellite = true for SMS
        
        if (transferResult.success && transferResult.transactionId) {
          // Send confirmation SMS to sender
          const senderSMS = `AfriTokeni USDC Transfer Sent ✅
To: ${session.data.recipientName} (${session.data.recipientPhone})
Amount: $${usdcAmount.toFixed(6)} USDC
Fee: $${transactionFee.toFixed(6)} USDC
Transaction ID: ${transferResult.transactionId}
Time: ${new Date().toLocaleString()}`;
          
          // Send notification SMS to recipient
          const recipientSMS = `AfriTokeni USDC Received ✅
From: ${user.firstName || 'User'} (+${session.phoneNumber})
Amount: $${usdcAmount.toFixed(6)} USDC
Transaction ID: ${transferResult.transactionId}
Time: ${new Date().toLocaleString()}`;
          
          try {
            await sendSMSNotification(session.phoneNumber, senderSMS);
            if (session.data.recipientPhone) {
              await sendSMSNotification(session.data.recipientPhone.replace('+', ''), recipientSMS);
            }
          } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue even if SMS fails
          }
          
          return endSession(`✅ USDC Transfer Successful!

To: ${session.data.recipientName}
Phone: ${session.data.recipientPhone}
Amount: $${usdcAmount.toFixed(6)} USDC
Fee: $${transactionFee.toFixed(6)} USDC
Transaction ID: ${transferResult.transactionId}

SMS confirmations sent.

Thank you for using AfriTokeni!`);
        } else {
          return endSession(`❌ Transfer failed: ${transferResult.error || 'Unknown error'}

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
      } catch (error) {
        console.error('Error processing USDC transfer:', error);
        return endSession('Error processing transfer. Please try again later.');
      }
    }
    
    default:
      session.currentMenu = 'usdc';
      session.step = 0;
      return handleUSDC('', session);
  }
}

// Export all handlers
export { handleUSDC, handleUSDCBalance, handleUSDCRate, handleUSDCBuy, handleUSDCSell, handleUSDCSend };
