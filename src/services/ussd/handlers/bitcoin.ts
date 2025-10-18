/**
 * Bitcoin (ckBTC) Handlers  
 * Handles all Bitcoin operations: balance, rates, buy, sell, send
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { getSessionCurrency } from '../utils/currency.js';
import { WebhookDataService as DataService, Agent } from '../../webHookServices.js';
import { CkBTCService } from '../../ckBTCService.js';
import { CkBTCUtils } from '../../../types/ckbtc.js';
import { verifyUserPin } from './pinManagement.js';
import { TranslationService } from '../../translations.js';

// These will be injected by the caller
let sendSMSNotification: (phone: string, msg: string) => Promise<any>;
let handleMainMenu: any;

export function initBitcoinHandlers(smsFunc: any, mainMenuFunc: any) {
  sendSMSNotification = smsFunc;
  handleMainMenu = mainMenuFunc;
}

async function handleBitcoin(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  // If coming from main menu with chained input (e.g., "2*2.1*1234"), extract the second part
  // Otherwise extract the last part for direct navigation
  const currentInput = (inputParts.length > 1 && inputParts[0] === '2') 
    ? inputParts[1] 
    : inputParts[inputParts.length - 1] || '';
  
  console.log(`🔵 handleBitcoin called - input: "${input}", currentInput: "${currentInput}", session.currentMenu: ${session.currentMenu}, session.step: ${session.step}`);
  
  if (!currentInput) {
    return continueSession(`Bitcoin (ckBTC)
Please select an option:
1. Check Balance
2. Bitcoin Rate
3. Buy Bitcoin
4. Sell Bitcoin
5. Send Bitcoin
0. Back to Main Menu`);
  }
  
  switch (currentInput) {
    case '1':
      console.log(`🟢 Changing menu from ${session.currentMenu} to btc_balance`);
      session.currentMenu = 'btc_balance';
      session.step = 1;
      console.log(`🟢 Menu changed to: ${session.currentMenu}, step: ${session.step}`);
      console.log(`🔍 Input analysis: inputParts=${JSON.stringify(inputParts)}, length=${inputParts.length}`);
      console.log(`🔍 inputParts[length-2]="${inputParts[inputParts.length - 2]}", pinVerified=${session.data.pinVerified}`);
      
      // Skip PIN if already verified
      if (session.data.pinVerified) {
        console.log(`✅ PIN already verified, calling handleBTCBalance`);
        return await handleBTCBalance(input, session);
      }
      // Check if PIN was provided in the same input (for testing/simulators)
      if (inputParts.length > 2 && inputParts[inputParts.length - 2] === '1') {
        console.log(`✅ PIN in same request detected, calling handleBTCBalance`);
        return await handleBTCBalance(input, session);
      }
      console.log(`⏸️ Requesting PIN from user`);
      return continueSession('Check Balance\nEnter your 4-digit PIN:');
    
    case '2':
      session.currentMenu = 'btc_rate';
      session.step = 1;
      // Skip PIN if already verified
      if (session.data.pinVerified) {
        return await handleBTCRate('', session);
      }
      return continueSession('Bitcoin Rate\nEnter your 4-digit PIN:');
    
    case '3':
      session.currentMenu = 'btc_buy';
      session.step = 1;
      const currency = getSessionCurrency(session);
      return continueSession(`Buy Bitcoin\nEnter ${currency} amount to spend:`);
    
    case '4':
      session.currentMenu = 'btc_sell';
      session.step = 1;
      return await handleBTCSell('', session);
    
    case '5':
      session.currentMenu = 'btc_send';
      session.step = 1;
      return continueSession('Send Bitcoin\nEnter your 4-digit PIN:');
    
    case '0':
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
    
    default:
      return continueSession(`Invalid option. Please try again:
1. Check Balance
2. Bitcoin Rate
3. Buy Bitcoin
4. Sell Bitcoin
5. Send Bitcoin
0. Back to Main Menu`);
  }
}

// Bitcoin balance handler - matches USDC pattern exactly
async function handleBTCBalance(input: string, session: USSDSession): Promise<string> {
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
      
      // Get Bitcoin balance using CkBTCService
      try {
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please try again later.');
        }
        
        // Use the user's Principal ID for ICP blockchain operations
        const currency = getSessionCurrency(session);
        const principalId = user.principalId || user.id;
        
        console.log(`📊 Fetching ckBTC balance for Principal: ${principalId}`);
        
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          principalId, 
          currency, 
          true // Use satellite for SMS/USSD operations
        );
        
        return endSession(`Your ckBTC Balance

₿${balance.balanceBTC} BTC
≈ ${currency} ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

Last Updated: ${balance.lastUpdated.toLocaleString()}

ckBTC provides instant Bitcoin transfers with minimal fees on the Internet Computer blockchain.

Thank you for using AfriTokeni!`);
        
      } catch (error) {
        console.error('Error retrieving ckBTC balance:', error);
        return endSession('Error retrieving ckBTC balance.\nPlease try again later.');
      }
    }
    
    default:
      return endSession('Invalid session state. Please try again.');
  }
}

async function handleBTCRate(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  
  // If PIN already verified, skip to showing rate
  if (session.data.pinVerified || session.step === 0) {
    session.step = 2;
  }
  
  if (session.step === 1) {
    // PIN verification step
    if (!/^\d{4}$/.test(sanitized_input)) {
      return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
    }
    
    // Verify PIN
    const pinCorrect = await verifyUserPin(session.phoneNumber, sanitized_input);
    if (!pinCorrect) {
      return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
    }
    
    session.step = 2;
  }
  
  if (session.step === 2) {
    // Display current BTC rate using getExchangeRate
    try {
      const exchangeRate = await CkBTCService.getExchangeRate(getSessionCurrency(session));
      const lastUpdated = exchangeRate.lastUpdated.toLocaleString();
      
      return endSession(`Bitcoin Exchange Rate

1 BTC = ${getSessionCurrency(session)} ${exchangeRate.rate.toLocaleString()}

Last Updated: ${lastUpdated}
Source: ${exchangeRate.source}

Rates include platform fees
Buy/Sell spreads may apply

ckBTC provides instant Bitcoin transfers with minimal fees on ICP.

Thank you for using AfriTokeni!`);
      
    } catch (error) {
      console.error('Error retrieving BTC rate:', error);
      return endSession(`Error retrieving BTC rate.
Please try again later.

Thank you for using AfriTokeni!`);
    }
  }
  
  // Default case
  session.currentMenu = 'bitcoin';
  session.step = 0;
  return handleBitcoin('', session);
}

async function handleBTCBuy(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  const lang = session.language || 'en';
  
  switch (session.step) {
    case 1: {
      // Enter amount to spend
      const currency = getSessionCurrency(session);
      if (!currentInput) {
        return continueSession(`Buy BTC\nEnter ${currency} amount to spend:\n\n${TranslationService.translate('press_zero_back', lang)}`);
      }
      
      // Handle cancel
      if (currentInput === '0') {
        session.currentMenu = 'bitcoin';
        session.step = 0;
        session.data = {};
        return continueSession('__SHOW_BITCOIN_MENU__');
      }
      
      const ugxAmount = parseInt(currentInput);
      if (isNaN(ugxAmount) || ugxAmount <= 0) {
        return continueSession(`${TranslationService.translate('invalid_amount', lang)}\nEnter ${currency} amount to spend:\n\n${TranslationService.translate('press_zero_back', lang)}`);
      }
      
      if (ugxAmount < 10000) {
        return continueSession(`Minimum purchase: ${currency} 10,000\nEnter ${currency} amount to spend:`);
      }
      
      // Check user balance first
      const userBalance = await DataService.getUserBalance(`+${session.phoneNumber}`);
      if (!userBalance || userBalance.balance < ugxAmount) {
        const currentBalance = userBalance ? userBalance.balance : 0;
        return endSession(`Insufficient balance!
Your balance: ${currency} ${currentBalance.toLocaleString()}
Required: ${currency} ${ugxAmount.toLocaleString()}

Thank you for using AfriTokeni!`);
      }
      
      // Calculate BTC amount and fees with real rate
      const exchangeRate = await CkBTCService.getExchangeRate(getSessionCurrency(session));
      const btcRate = exchangeRate.rate;
      const fee = Math.round(ugxAmount * 0.025); // 2.5% fee
      const netAmount = ugxAmount - fee;
      const btcAmount = netAmount / btcRate;
      
      session.data.ugxAmount = ugxAmount;
      session.data.btcAmount = btcAmount;
      session.data.fee = fee;
      session.step = 2;
      
      // Get available agents for Bitcoin exchange
      console.log('Getting available agents for Bitcoin purchase...');
      try {
        const agents = await DataService.getAvailableAgents();
        const availableAgents = agents.filter((agent: Agent) => 
          agent.isActive
          // agent.cashBalance >= ugxAmount
        );
        
        if (availableAgents.length === 0) {
          return endSession(`No agents available for Bitcoin purchase at this time.

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
        session.data.availableAgents = availableAgents;
        
        let agentList = `BTC Purchase Quote

Spend: ${currency} ${ugxAmount.toLocaleString()}
Fee (2.5%): ${currency} ${fee.toLocaleString()}
Net: ${currency} ${netAmount.toLocaleString()}
Receive: ₿${btcAmount.toFixed(8)} BTC

Select an agent:
`;
        
        availableAgents.slice(0, 5).forEach((agent: Agent, index: number) => {
          agentList += `${index + 1}. ${agent.businessName}\n   ${agent.location?.city || 'Location'}\n`;
        });
        
        agentList += '0. Cancel';
        
        return continueSession(agentList);
        
      } catch (error) {
        console.error('Error getting agents for Bitcoin purchase:', error);
        return endSession('Error loading agents. Please try again later.');
      }
    }
    
    case 2: {
      // Agent selection
      const agentChoice = parseInt(currentInput);
      
      if (agentChoice === 0) {
        session.currentMenu = 'bitcoin';
        session.step = 0;
        return handleBitcoin('', session);
      }
      
      const agents = session.data.availableAgents;
      if (!agents || isNaN(agentChoice) || agentChoice < 1 || agentChoice > agents.length) {
        return continueSession('Invalid selection.\nSelect an agent (1-' + (agents?.length || 0) + ') or 0 to cancel:');
      }
      
      const selectedAgent = agents[agentChoice - 1];
      session.data.selectedAgent = selectedAgent;
      session.step = 3;
      
      const currency = getSessionCurrency(session);
      const ugxAmount = session.data.ugxAmount || 0;
      const btcAmount = session.data.btcAmount || 0;
      const fee = session.data.fee || 0;
      
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location?.city || 'Location'}, ${selectedAgent.location?.address || ''}

Purchase Details:
Amount: ${currency} ${ugxAmount.toLocaleString()}
Fee: ${currency} ${fee.toLocaleString()}
Receive: ₿${btcAmount.toFixed(8)} BTC

Enter your PIN to confirm:
${TranslationService.translate('press_zero_back', lang)}`);
    }
    
    case 3: {
      // PIN verification and process Bitcoin purchase
      
      // Handle cancel
      if (currentInput === '0') {
        session.currentMenu = 'bitcoin';
        session.step = 0;
        session.data = {};
        return endSession(`${TranslationService.translate('transaction_failed', lang)}\nTransaction cancelled.\n\nThank you for using AfriTokeni!`);
      }
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
        const ugxAmount = session.data.ugxAmount || 0;
        
        // Generate a unique purchase code for the user to give to agent
        const purchaseCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        session.data.purchaseCode = purchaseCode;
        
        // Process ckBTC purchase through agent using CkBTCService.exchange
        const currency = getSessionCurrency(session);
        const exchangeResult = await CkBTCService.exchange({
          amount: ugxAmount,
          currency: currency,
          type: 'buy',
          userId: user.id,
          agentId: selectedAgent.id
        }, true); // Use satellite for SMS/USSD operations
        
        if (exchangeResult.success && exchangeResult.transactionId) {
          const btcAmount = exchangeResult.amountBTC;
          
          // Send SMS with purchase details and code
          const smsMessage = `AfriTokeni ckBTC Purchase
Code: ${purchaseCode}
Amount: ${currency} ${ugxAmount.toLocaleString()}
ckBTC to receive: ₿${btcAmount.toFixed(8)}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}
Transaction ID: ${exchangeResult.transactionId}

Give this code and payment to the agent to complete your ckBTC purchase.`;

          console.log(`Sending ckBTC purchase SMS to ${session.phoneNumber}`);

          try {
            await sendSMSNotification(session.phoneNumber, smsMessage);
          } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue even if SMS fails
          }
          
          return endSession(`✅ ckBTC Purchase Initiated!

Purchase Code: ${purchaseCode}
Transaction ID: ${exchangeResult.transactionId}
You will receive: ₿${btcAmount.toFixed(8)} ckBTC
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
        console.error('Error processing ckBTC purchase:', error);
        return endSession('Error processing purchase. Please try again later.');
      }
    }
    
    default:
      session.currentMenu = 'bitcoin';
      session.step = 0;
      return handleBitcoin('', session);
  }
}

async function handleBTCSell(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  const lang = session.language || 'en';
  
  switch (session.step) {
    case 1: {
      // Show ckBTC balance and currency option if no input
      if (!currentInput) {
        try {
          const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
          if (!user) {
            return endSession('User not found. Please contact support.');
          }
          
          // Get ckBTC balance with local currency equivalent
          const currency = getSessionCurrency(session);
          const principalId = user.principalId || user.id;
          // Handle cancel
          if (currentInput === '0') {
            session.currentMenu = 'bitcoin';
            session.step = 0;
            session.data = {};
            return continueSession('__SHOW_BITCOIN_MENU__');
          }
          
          const balance = await CkBTCService.getBalanceWithLocalCurrency(
            principalId, 
            currency, 
            true // Use satellite for SMS/USSD operations
          );
          
          if (balance.balanceSatoshis <= 0) {
            return endSession(`No ckBTC available to sell.

ckBTC Balance: ₿0.00000000
≈ ${getSessionCurrency(session)} 0

Thank you for using AfriTokeni!`);
          }
          
          return continueSession(`Sell ckBTC

Your ckBTC Balance:
₿${balance.balanceBTC} BTC
≈ ${getSessionCurrency(session)} ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

Choose amount type:
1. Enter ${getSessionCurrency(session)} amount
2. Enter BTC amount
0. Cancel`);
          
        } catch (error) {
          console.error('Error checking ckBTC balance:', error);
          return endSession('Error checking balance. Please try again later.');
        }
      }
      
      // Handle currency selection
      if (currentInput === '1') {
        session.data.amountType = 'ugx';
        session.step = 2;
        const currency = getSessionCurrency(session);
        return continueSession(`Enter ${currency} amount to receive (min: ${currency} 1,000):`);
      } else if (currentInput === '2') {
        session.data.amountType = 'btc';
        session.step = 2;
        return continueSession('Enter BTC amount to sell (min: ₿0.00001):');
      } else if (currentInput === '0') {
        session.currentMenu = 'bitcoin';
        session.step = 0;
        return handleBitcoin('', session);
      } else {
        return continueSession(`Invalid selection.

Choose amount type:
1. Enter ${getSessionCurrency(session)} amount
2. Enter BTC amount
0. Cancel`);
      }
    }
    
    case 2: {
      // Handle amount input based on selected type
      const amountType = session.data.amountType;
      let btcAmount: number;
      let ugxAmount: number;
      
      if (amountType === 'ugx') {
        // User entered local currency amount, convert to BTC
        const currency = getSessionCurrency(session);
        ugxAmount = parseFloat(currentInput);
        if (isNaN(ugxAmount) || ugxAmount <= 0) {
          return continueSession(`Invalid amount.\nEnter ${currency} amount to receive (min: ${currency} 1,000):`);
        }
        
        if (ugxAmount < 1000) {
          return continueSession(`Minimum sale: ${currency} 1,000\nEnter ${currency} amount to receive:`);
        }
        
        // Get exchange rate and calculate BTC amount (before fees)
        const exchangeRate = await CkBTCService.getExchangeRate(getSessionCurrency(session));
        const btcRate = exchangeRate.rate;
        
        // Calculate gross UGX needed (including fees) to get the desired net amount
        const feeRate = 0.025; // 2.5% fee
        const ugxGross = ugxAmount / (1 - feeRate); // Reverse calculate gross amount
        btcAmount = ugxGross / btcRate;
        
      } else {
        // User entered BTC amount directly
        btcAmount = parseFloat(currentInput);
        if (isNaN(btcAmount) || btcAmount <= 0) {
          return continueSession('Invalid amount.\nEnter BTC amount to sell (min: ₿0.00001):');
        }
        
        if (btcAmount < 0.00001) {
          return continueSession('Minimum sale: ₿0.00001 BTC\nEnter BTC amount to sell:');
        }
        
        // Calculate UGX amount
        const exchangeRate = await CkBTCService.getExchangeRate(getSessionCurrency(session));
        const btcRate = exchangeRate.rate;
        ugxAmount = btcAmount * btcRate;
      }
      
      // Check if user has sufficient ckBTC balance
      try {
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please contact support.');
        }
        
        const currency = getSessionCurrency(session);
        const principalId = user.principalId || user.id;
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          principalId, 
          currency, 
          true // Use satellite for SMS/USSD operations
        );
        
        if (balance.balanceSatoshis < (btcAmount * 100000000)) { // Convert BTC to satoshis for comparison
          return continueSession(`Insufficient ckBTC balance!

Your balance: ₿${balance.balanceBTC} BTC
≈ ${getSessionCurrency(session)} ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

Required: ₿${btcAmount.toFixed(8)} BTC

Enter a smaller amount:`);
        }
        
      } catch (error) {
        console.error('Error checking Bitcoin balance:', error);
        return endSession('Error checking balance. Please try again later.');
      }
      
      // Calculate fees and net amounts
      const exchangeRate = await CkBTCService.getExchangeRate(getSessionCurrency(session));
      const btcRate = exchangeRate.rate;
      const ugxGross = btcAmount * btcRate;
      const fee = Math.round(ugxGross * 0.025); // 2.5% fee
      const ugxNet = ugxGross - fee;
      
      session.data.btcAmount = btcAmount;
      session.data.ugxGross = ugxGross;
      session.data.ugxNet = ugxNet;
      session.data.fee = fee;
      session.step = 3;
      
      // Get available agents for Bitcoin exchange
      console.log('Getting available agents for Bitcoin sale...');
      try {
        const agents = await DataService.getAvailableAgents();
        const availableAgents = agents.filter((agent: Agent) => 
          agent.isActive
          // agent.services?.includes('bitcoin_exchange') &&
          // agent.cashBalance >= ugxNet // Agent needs enough cash to pay user
        );
        
        if (availableAgents.length === 0) {
          return endSession(`No agents available for Bitcoin sale at this time.

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
        session.data.availableAgents = availableAgents;
        
        let agentList = `BTC Sale Quote

Sell: ₿${btcAmount.toFixed(8)} BTC
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
        console.error('Error getting agents for Bitcoin sale:', error);
        return endSession('Error loading agents. Please try again later.');
      }
    }
    
    case 3: {
      // Agent selection
      const agentChoice = parseInt(currentInput);
      
      if (agentChoice === 0) {
        session.currentMenu = 'bitcoin';
        session.step = 0;
        return handleBitcoin('', session);
      }
      
      const agents = session.data.availableAgents;
      if (!agents || isNaN(agentChoice) || agentChoice < 1 || agentChoice > agents.length) {
        return continueSession('Invalid selection.\nSelect an agent (1-' + (agents?.length || 0) + ') or 0 to cancel:');
      }
      
      const selectedAgent = agents[agentChoice - 1];
      session.data.selectedAgent = selectedAgent;
      session.step = 4;
      
      const btcAmount = session.data.btcAmount || 0;
      const ugxNet = session.data.ugxNet || 0;
      const fee = session.data.fee || 0;
      
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location?.city || 'Location'}, ${selectedAgent.location?.address || ''}

Sale Details:
Sell: ₿${btcAmount.toFixed(8)} BTC
Fee: ${getSessionCurrency(session)} ${fee.toLocaleString()}
You receive: ${getSessionCurrency(session)} ${ugxNet.toLocaleString()}

Enter your PIN to confirm:`);
    }
    
    case 4: {
      // PIN verification and process Bitcoin sale
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
        const btcAmount = session.data.btcAmount || 0;
        
        // Generate a unique sale code for the user to give to agent
        const saleCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        session.data.saleCode = saleCode;
        
        // Process Bitcoin to local currency exchange through agent
        const exchangeResult = await CkBTCService.exchange({
          userId: user.id,
          agentId: selectedAgent.id,
          amount: CkBTCUtils.btcToSatoshis(btcAmount),
          currency: getSessionCurrency(session),
          type: 'sell'
        }, true);
        
        if (exchangeResult.success && exchangeResult.transactionId) {
          const ugxAmount = exchangeResult.localCurrencyAmount || 0;
          
          // Send SMS with sale details and code
          const smsMessage = `AfriTokeni BTC Sale
Code: ${saleCode}
BTC to sell: ₿${btcAmount.toFixed(8)}
You will receive: ${getSessionCurrency(session)} ${ugxAmount.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}
Transaction ID: ${exchangeResult.transactionId}

Give this code to the agent to complete your Bitcoin sale and collect cash.`;

          console.log(`Sending Bitcoin sale SMS to ${session.phoneNumber}`);

          try {
            await sendSMSNotification(session.phoneNumber, smsMessage);
          } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue even if SMS fails
          }
          
          return endSession(`✅ BTC Sale Initiated!

Sale Code: ${saleCode}
Transaction ID: ${exchangeResult.transactionId}
Selling: ₿${btcAmount.toFixed(8)} BTC
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
        console.error('Error processing Bitcoin sale:', error);
        return endSession('Error processing sale. Please try again later.');
      }
    }
    
    default:
      session.currentMenu = 'bitcoin';
      session.step = 0;
      return handleBitcoin('', session);
  }
}

async function handleBTCSend(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  const lang = session.language || 'en';
  
  switch (session.step) {
    case 1: {
      // PIN verification step
      
      // Handle cancel
      if (currentInput === '0') {
        session.currentMenu = 'bitcoin';
        session.step = 0;
        session.data = {};
        return continueSession('__SHOW_BITCOIN_MENU__');
      }
      
      if (!/^\d{4}$/.test(currentInput)) {
        return continueSession(`Invalid PIN format.\nEnter your 4-digit PIN:\n\n${TranslationService.translate('press_zero_back', lang)}`);
      }
      
      // Verify PIN
      const pinCorrect = await verifyUserPin(session.phoneNumber, currentInput);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      // PIN is correct, proceed to get balance and show send options
      try {
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please contact support.');
        }
        
        // Get ckBTC balance with local currency equivalent
        const currency = getSessionCurrency(session);
        const principalId = user.principalId || user.id;
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          principalId, 
          currency, 
          true // Use satellite for SMS/USSD operations
        );
        
        if (balance.balanceSatoshis <= 0) {
          return endSession(`Insufficient ckBTC balance!

Your balance: ₿${balance.balanceBTC} BTC
≈ ${getSessionCurrency(session)} ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

You need ckBTC to send. Please buy some first.

Thank you for using AfriTokeni!`);
        }
        
        session.data.userBalance = balance;
        session.step = 2;
        
        return continueSession(`Send ckBTC

Your Balance: ₿${balance.balanceBTC} BTC
≈ ${getSessionCurrency(session)} ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

Enter recipient phone number:
(e.g. 256700123456)

Press 0 to go back`);
        
      } catch (error) {
        console.error('Error checking ckBTC balance:', error);
        return endSession('Error checking balance. Please try again later.');
      }
    }
    
    case 2: {
      // Recipient phone number entry
      if (!currentInput) {
        return continueSession('Enter recipient phone number:\n(e.g. 256700123456)\n\nPress 0 to go back');
      }
      
      // Validate and format phone number
      let recipientPhone = currentInput.trim();
      
      // Add + if missing
      if (!recipientPhone.startsWith('+')) {
        if (recipientPhone.startsWith('256')) {
          recipientPhone = '+' + recipientPhone;
        } else if (recipientPhone.startsWith('0')) {
          recipientPhone = '+256' + recipientPhone.substring(1);
        } else if (recipientPhone.length === 9) {
          recipientPhone = '+256' + recipientPhone;
        } else {
          return continueSession('Invalid phone number format.\nEnter recipient phone:\n(e.g. 256700123456)\n\nPress 0 to go back');
        }
      }
      
      // Basic validation
      if (!/^\+256[0-9]{9}$/.test(recipientPhone)) {
        return continueSession('Invalid phone number format.\nEnter recipient phone:\n(e.g. 256700123456)\n\nPress 0 to go back');
      }
      
      // Check if recipient is same as sender
      if (recipientPhone === `+${session.phoneNumber}`) {
        return continueSession('Cannot send to yourself.\nEnter different phone:\n(e.g. 256700123456)\n\nPress 0 to go back');
      }
      
      // Check if recipient is registered
      try {
        const recipientUser = await DataService.findUserByPhoneNumber(recipientPhone);
        if (!recipientUser) {
          return continueSession(`Recipient ${recipientPhone} is not registered with AfriTokeni.\nThey need to register first.\n\nEnter different phone:\n(e.g. 256700123456)\n\nPress 0 to go back`);
        }
        
        session.data.recipientPhone = recipientPhone;
        session.data.recipientUser = recipientUser;
        session.step = 3;
        
        return continueSession(`Recipient: ${recipientPhone}
Name: ${recipientUser.firstName} ${recipientUser.lastName}

Enter BTC amount to send:
(Min: ₿0.00001, Max: ₿${session.data.userBalance.balanceBTC})`);
        
      } catch (error) {
        console.error('Error checking recipient:', error);
        return continueSession('Error checking recipient.\nEnter recipient phone:\n(e.g. 256700123456)\n\nPress 0 to go back');
      }
    }
    
    case 3: {
      // BTC amount entry
      const btcAmount = parseFloat(currentInput);
      
      if (isNaN(btcAmount) || btcAmount <= 0) {
        return continueSession('Invalid amount.\nEnter BTC amount to send:\n(Min: ₿0.00001)');
      }
      
      if (btcAmount < 0.00001) {
        return continueSession('Minimum send: ₿0.00001 BTC\nEnter BTC amount to send:');
      }
      
      const userBalance = session.data.userBalance;
      if (btcAmount > parseFloat(userBalance.balanceBTC)) {
        return continueSession(`Insufficient balance!
Your balance: ₿${userBalance.balanceBTC} BTC
Enter BTC amount to send:\n(Max: ₿${userBalance.balanceBTC})`);
      }
      
      // Calculate fees and equivalent amounts
      try {
        const exchangeRate = await CkBTCService.getExchangeRate(getSessionCurrency(session));
        const btcRate = exchangeRate.rate;
        const ugxEquivalent = btcAmount * btcRate;
        const networkFee = 0.000001; // 1 satoshi network fee
        const totalBTC = btcAmount + networkFee;
        
        if (totalBTC > parseFloat(userBalance.balanceBTC)) {
          return continueSession(`Insufficient balance for amount + network fee!
Amount: ₿${btcAmount.toFixed(8)} BTC
Network fee: ₿${networkFee.toFixed(8)} BTC
Total needed: ₿${totalBTC.toFixed(8)} BTC
Your balance: ₿${userBalance.balanceBTC} BTC

Enter smaller amount:`);
        }
        
        session.data.sendAmount = btcAmount;
        session.data.networkFee = networkFee;
        session.data.totalBTC = totalBTC;
        session.data.ugxEquivalent = ugxEquivalent;
        session.step = 4;
        
        const recipientPhone = session.data.recipientPhone;
        const recipientUser = session.data.recipientUser;
        
        return continueSession(`Send ckBTC Confirmation

To: ${recipientPhone}
Name: ${recipientUser.firstName} ${recipientUser.lastName}
Amount: ₿${btcAmount.toFixed(8)} BTC
≈ ${getSessionCurrency(session)} ${ugxEquivalent.toLocaleString()}
Network fee: ₿${networkFee.toFixed(8)} BTC
Total: ₿${totalBTC.toFixed(8)} BTC

Enter your PIN to confirm:`);
        
      } catch (error) {
        console.error('Error calculating send details:', error);
        return continueSession('Error calculating fees. Please try again.\nEnter BTC amount to send:');
      }
    }
    
    case 4: {
      // Final PIN verification and send transaction
      if (!/^\d{4}$/.test(currentInput)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      const pinCorrect = await verifyUserPin(session.phoneNumber, currentInput);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      // Process the BTC send transaction
      try {
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please contact support.');
        }
        
        const recipientUser = session.data.recipientUser;
        const sendAmount = session.data.sendAmount;
        const networkFee = session.data.networkFee;
        const ugxEquivalent = session.data.ugxEquivalent;
        
        // Generate transaction ID for tracking
        const transactionId = `btc_send_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        // Use CkBTCService to process the send transaction
        const sendResult = await CkBTCService.transfer({
          senderId: user.id,
          recipient: recipientUser.id,
          amountSatoshis: CkBTCUtils.btcToSatoshis(sendAmount),
          memo: `BTC send via USSD - ${transactionId}`
        }, true); // Use satellite for SMS operations
        
        if (sendResult.success && sendResult.transactionId) {
          // Send SMS notifications to both sender and recipient
          const senderSMS = `AfriTokeni BTC Sent ✅

Sent: ₿${sendAmount.toFixed(8)} BTC
≈ ${getSessionCurrency(session)} ${ugxEquivalent.toLocaleString()}
To: ${session.data.recipientPhone}
Transaction ID: ${sendResult.transactionId}
Network fee: ₿${networkFee.toFixed(8)} BTC

Your new balance will be updated shortly.`;

          const recipientSMS = `AfriTokeni BTC Received 🎉

Received: ₿${sendAmount.toFixed(8)} BTC
≈ ${getSessionCurrency(session)} ${ugxEquivalent.toLocaleString()}
From: +${session.phoneNumber}
Transaction ID: ${sendResult.transactionId}

Check your balance by dialing *255#`;

          try {
            await sendSMSNotification(session.phoneNumber, senderSMS);
            if (session.data.recipientPhone) {
              await sendSMSNotification(session.data.recipientPhone.replace('+', ''), recipientSMS);
            }
          } catch (smsError) {
            console.error('SMS notification failed:', smsError);
            // Continue even if SMS fails
          }
          
          return endSession(`✅ BTC Sent Successfully!

Sent: ₿${sendAmount.toFixed(8)} BTC
≈ ${getSessionCurrency(session)} ${ugxEquivalent.toLocaleString()}
To: ${session.data.recipientPhone}
Transaction ID: ${sendResult.transactionId}

SMS notifications sent to both parties.

Thank you for using AfriTokeni!`);
        } else {
          return endSession(`❌ Send failed: ${sendResult.error || 'Unknown error'}

Please try again later.

Thank you for using AfriTokeni!`);
        }
        
      } catch (error) {
        console.error('Error processing BTC send:', error);
        return endSession('Error processing send. Please try again later.');
      }
    }
    
    default:
      session.currentMenu = 'bitcoin';
      session.step = 0;
      return handleBitcoin('', session);
  }
}

// Export all handlers
export { handleBitcoin, handleBTCBalance, handleBTCRate, handleBTCBuy, handleBTCSell, handleBTCSend };
