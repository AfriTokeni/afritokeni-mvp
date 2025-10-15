

// ========================================
// AfriTokeni SMS & USSD Webhook Server (TypeScript)
// ========================================
// This server acts as a webhook between:
// 1. Juno datastore (handled by DataService)
// 2. AfricasTalking SMS & USSD API
// 
// Architecture:
// - DataService handles all Juno datastore operations
// - This server handles SMS sending/receiving and USSD interactions
// - All transaction/balance data persists in Juno
// 
// PIN Management Integration:
// - Direct integration with DataService for PIN operations
// - PINs stored in users collection in Juno
// - Users with existing PINs go directly to main menu
// - New users must set up PIN before accessing services
// ========================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import AfricasTalking from 'africastalking';
import { WebhookDataService as DataService, Agent } from './webHookServices.js';
import { CkBTCService } from './ckBTCService.js';
import { CkUSDCService } from './ckUSDCService.js';
import { CkBTCUtils } from '../types/ckbtc.js';
import type { 
  NotificationRequest, 
  NotificationData,
  User,
  EmailContent 
} from '../types/notification.js';

// Import USSD handlers and utilities
import {
  // Types
  USSDSession,
  USSDSessionImpl,
  // Utilities
  getSessionCurrency,
  getUserCurrency,
  continueSession,
  endSession,
  ussdSessions,
  getOrCreateSession,
  startSessionCleanup,
  // Handlers
  handleRegistrationCheck,
  handleUserRegistration,
  handleVerification,
  hasUserPin,
  verifyUserPin,
  handlePinCheck,
  handlePinSetup,
  handleMainMenu,
  handleLocalCurrency,
  handleCheckBalance,
  handleTransactionHistory,
  handleFindAgent,
  handleDeposit,
  handleWithdraw,
  handleSendMoney
} from './ussd/index.js';

// Node.js process declaration
declare const process: {
  env: {
    [key: string]: string | undefined;
    PORT?: string;
    VITE_PORT?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM_DOMAIN?: string;
    AT_USERNAME?: string;
    AT_API_KEY?: string;
    AT_SHORT_CODE?: string;
    NODE_ENV?: string;
  };
  on: (event: string, listener: Function) => void;
  exit: (code?: number) => void;
  cwd: () => string;
};

// Configure dotenv with explicit path
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// AfricasTalking configuration
const credentials = {
    username: process.env.AT_USERNAME || "sandbox",
    apiKey: process.env.AT_API_KEY || ""
};

// Initialize AfricasTalking only if we have valid credentials
let africastalking: ReturnType<typeof AfricasTalking> | null = null;
let sms: any = null;

if (credentials.username && credentials.apiKey) {
  try {
    africastalking = AfricasTalking(credentials);
    sms = africastalking.SMS;
  } catch (error) {
    console.error('❌ Failed to initialize AfricasTalking:', error);
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for verification codes (used by email verification)
interface VerificationData {
  code: string;
  userId: string;
  timestamp: number;
}
const verificationCodes = new Map<string, VerificationData>();

// Start session cleanup interval
startSessionCleanup();

// SMS notification helper
async function sendSMSNotification(phoneNumber: string, message: string): Promise<any> {
  console.log(`📱 Sending SMS notification to ${phoneNumber}: ${message}`);
  try {
    const response = await sms.send({
      to: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
      message: message,
      from: process.env.AT_SHORT_CODE || "22948"
    });
    console.log("SMS sent successfully:", response);
    return response;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return null;
  }
}

// ========================================
// Bitcoin & USDC Handlers (inline - to be extracted later)
// ========================================

async function handleBitcoin(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  if (!currentInput) {
    return continueSession(`Bitcoin (ckBTC)
Please select an option:
2.1 Check Balance
2.2 Bitcoin Rate
2.3 Buy Bitcoin
2.4 Sell Bitcoin
2.5 Send Bitcoin
0. Back to Main Menu`);
  }
  
  switch (currentInput) {
    case '2.1':
      session.currentMenu = 'btc_balance';
      session.step = 1;
      return continueSession('Check Balance\nEnter your 4-digit PIN:');
    
    case '2.2':
      session.currentMenu = 'btc_rate';
      session.step = 1;
      return continueSession('Bitcoin Rate\nEnter your 4-digit PIN:');
    
    case '2.3':
      session.currentMenu = 'btc_buy';
      session.step = 1;
      const currency = getSessionCurrency(session);
      return continueSession(`Buy Bitcoin\nEnter ${currency} amount to spend:`);
    
    case '2.4':
      session.currentMenu = 'btc_sell';
      session.step = 1;
      return await handleBTCSell('', session);
    
    case '2.5':
      session.currentMenu = 'btc_send';
      session.step = 1;
      return continueSession('Send Bitcoin\nEnter your 4-digit PIN:');
    
    case '0':
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
    
    default:
      return continueSession(`Invalid option. Please try again:
2.1 Check Balance
2.2 Bitcoin Rate
2.3 Buy Bitcoin
2.4 Sell Bitcoin
2.5 Send Bitcoin
0. Back to Main Menu`);
  }
}

// In your USSD server - modified Bitcoin balance handler
async function handleBTCBalance(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // PIN verification
      if (!/^\d{4}$/.test(sanitized_input)) {
        return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
      }
      
      const pinCorrect = await verifyUserPin(session.phoneNumber, sanitized_input);
      if (!pinCorrect) {
        return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
      }
      
      try {
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please try again later.');
        }
        
        // Use CkBTCService to get balance with local currency equivalent
        const currency = getSessionCurrency(session);
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          user.id, 
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
      session.currentMenu = 'bitcoin';
      session.step = 0;
      return handleBitcoin('', session);
  }
}

async function handleBTCRate(input: string, session: USSDSession): Promise<string> {
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
    
    default:
      session.currentMenu = 'bitcoin';
      session.step = 0;
      return handleBitcoin('', session);
  }
}

async function handleBTCBuy(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // Enter amount to spend
      const currency = getSessionCurrency(session);
      if (!currentInput) {
        return continueSession(`Buy BTC\nEnter ${currency} amount to spend:`);
      }
      
      const ugxAmount = parseInt(currentInput);
      if (isNaN(ugxAmount) || ugxAmount <= 0) {
        return continueSession(`Invalid amount.\nEnter ${currency} amount to spend:`);
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

Enter your PIN to confirm:`);
    }
    
    case 3: {
      // PIN verification and process Bitcoin purchase
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
          const balance = await CkBTCService.getBalanceWithLocalCurrency(
            user.id, 
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
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          user.id, 
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
      
      // PIN is correct, proceed to get balance and show send options
      try {
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please contact support.');
        }
        
        // Get ckBTC balance with local currency equivalent
        const currency = getSessionCurrency(session);
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          user.id, 
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
(Format: +256XXXXXXXXX)`);
        
      } catch (error) {
        console.error('Error checking ckBTC balance:', error);
        return endSession('Error checking balance. Please try again later.');
      }
    }
    
    case 2: {
      // Recipient phone number entry
      if (!currentInput) {
        return continueSession('Enter recipient phone number:\n(Format: +256XXXXXXXXX)');
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
          return continueSession('Invalid phone number format.\nEnter recipient phone number:\n(Format: +256XXXXXXXXX)');
        }
      }
      
      // Basic validation
      if (!/^\+256[0-9]{9}$/.test(recipientPhone)) {
        return continueSession('Invalid phone number format.\nEnter recipient phone number:\n(Format: +256XXXXXXXXX)');
      }
      
      // Check if recipient is same as sender
      if (recipientPhone === `+${session.phoneNumber}`) {
        return continueSession('Cannot send to yourself.\nEnter recipient phone number:\n(Format: +256XXXXXXXXX)');
      }
      
      // Check if recipient is registered
      try {
        const recipientUser = await DataService.findUserByPhoneNumber(recipientPhone);
        if (!recipientUser) {
          return continueSession(`Recipient ${recipientPhone} is not registered with AfriTokeni.\nThey need to register first.\n\nEnter different phone number:\n(Format: +256XXXXXXXXX)`);
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
        return continueSession('Error checking recipient. Please try again.\nEnter recipient phone number:\n(Format: +256XXXXXXXXX)');
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
            await sendSMSNotification(session.data.recipientPhone.replace('+', ''), recipientSMS);
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

// ==================== USDC SERVICE HANDLERS ====================

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

        // Use CkUSDCService with satellite config for SMS users
        const balance = await CkUSDCService.getBalanceWithLocalCurrency(
          user.id, // Principal ID
          'ugx',   // Local currency
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
        const recipient = await DataService.findUserByPhoneNumber(session.data.recipientPhone);
        
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
            await sendSMSNotification(session.data.recipientPhone.replace('+', ''), recipientSMS);
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

// Mock AfricasTalking SMS sending
const sendSMS = async (phoneNumber: string, message: string) => {
    console.log(`📱 Sending SMS to ${phoneNumber}: ${message}`);
    console.log(`Using AfricasTalking credentials: ${JSON.stringify(credentials)}`);

    try {
        await sms.send({
            to: phoneNumber,
            message, 
            senderId: process.env.AT_SHORT_CODE || "22948"
        });
        return {
            status: 'Success',
            message: 'Sent to 1/1 Total Cost: KES 0.8000'
        };
    } catch (error) {
        console.log(error);
        return {
            status: 'Error',
            message: 'Failed to send SMS'
        };
    }
};

// Route to send SMS verification code
app.post('/api/send-sms', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, message, verificationCode, userId } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }
    
    // Store verification code if provided
    if (verificationCode) {
      verificationCodes.set(phoneNumber, {
        code: verificationCode,
        userId: userId || 'anonymous',
        timestamp: Date.now()
      });
    }
    
    // Send SMS
    const result = await sendSMS(phoneNumber, message);
    
    if (result.status === 'Success') {
      res.json({
        success: true,
        message: 'SMS sent successfully',
        messageId: `msg_${Date.now()}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS'
      });
    }
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Route to verify SMS code
app.post('/api/verify-code', (req: Request, res: Response) => {
    console.log('🔍 Verifying code...');
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and code are required'
      });
    }
    console.log(`🔍 Checking verification code for ${phoneNumber}: ${code}`);

    const storedData = verificationCodes.get(phoneNumber);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'No verification code found for this number'
      });
    }
    
    // Check if code has expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired'
      });
    }

    console.log(`🔍 Stored code for ${code}: ${storedData.code}`);
    
    if (storedData.code === code) {
        console.log(`🔍 Verification code matched for ${phoneNumber}`);
      // Code is correct, remove it from storage
      verificationCodes.delete(phoneNumber);
      
      res.json({
        success: true,
        message: 'Code verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Route to handle incoming SMS (webhook from AfricasTalking)
app.post('/api/webhook/sms', (req: Request, res: Response) => {
  try {
    const { from, text } = req.body;
    
    console.log(`📨 Received SMS from ${from}: ${text}`);
    
    // Process SMS commands here
    // For now, just log and acknowledge
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Route to handle USSD requests (webhook from AfricasTalking)
app.post('/api/ussd', async (req: Request, res: Response) => {
  try {
    const { sessionId, phoneNumber, text } = req.body;
    
    console.log(`📱 USSD Request - Session: ${sessionId}, Phone: ${phoneNumber}, Text: "${text}"`);
    
    const session = getOrCreateSession(sessionId, phoneNumber);
    let response: string;

    // Route to appropriate handler based on current menu
    switch (session.currentMenu) {
      case 'registration_check':
        response = await handleRegistrationCheck(text, session, sendSMSNotification, hasUserPin);
        break;
      case 'user_registration':
        response = await handleUserRegistration(text, session, sendSMSNotification);
        break;
      case 'verification':
        response = await handleVerification(text, session);
        break;
      case 'pin_check':
        response = await handlePinCheck(text, session, handleCheckBalance, handleTransactionHistory);
        break;
      case 'pin_setup':
        response = await handlePinSetup(text, session);
        break;
      case 'main':
        response = await handleMainMenu(text, session, handleLocalCurrency, handleBitcoin, handleUSDC);
        break;
      case 'local_currency':
        response = await handleLocalCurrency(text, session, handleSendMoney, handleDeposit, handleWithdraw, handleFindAgent, handleMainMenu);
        break;
      case 'find_agent':
        response = await handleFindAgent(text, session, handleLocalCurrency);
        break;
      case 'send_money':
        response = await handleSendMoney(text, session, sendSMSNotification);
        break;
      case 'check_balance':
        response = await handleCheckBalance(text, session);
        break;
      case 'transaction_history':
        response = await handleTransactionHistory(text, session);
        break;
      case 'deposit':
        response = await handleDeposit(text, session, sendSMSNotification);
        break;
      case 'bitcoin':
        response = await handleBitcoin(text, session);
        break;
      case 'btc_balance':
        response = await handleBTCBalance(text, session);
        break;
      case 'btc_rate':
        response = await handleBTCRate(text, session);
        break;
      case 'btc_buy':
        response = await handleBTCBuy(text, session);
        break;
      case 'btc_sell':
        response = await handleBTCSell(text, session);
        break;
      case 'btc_send':
        response = await handleBTCSend(text, session);
        break;
      case 'usdc':
        response = await handleUSDC(text, session);
        break;
      case 'usdc_balance':
        response = await handleUSDCBalance(text, session);
        break;
      case 'usdc_rate':
        response = await handleUSDCRate(text, session);
        break;
      case 'usdc_buy':
        response = await handleUSDCBuy(text, session);
        break;
      case 'usdc_sell':
        response = await handleUSDCSell(text, session);
        break;
      case 'usdc_send':
        response = await handleUSDCSend(text, session);
        break;
      case 'withdraw':
        response = await handleWithdraw(text, session, sendSMSNotification, handleMainMenu);
        break;
      default:
        response = await handleRegistrationCheck('', session, sendSMSNotification, hasUserPin);
    }

    // Clean up session if ended
    if (response.startsWith('END')) {
      ussdSessions.delete(sessionId);
      console.log(`🧹 Session ended and cleaned up: ${sessionId}`);
    }

    console.log(`📤 USSD Response: ${response}`);
    
    res.set('Content-Type', 'text/plain');
    res.send(response);
    
  } catch (error) {
    console.error('Error processing USSD webhook:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END Sorry, an error occurred. Please try again.');
  }
});

// Development endpoint for PIN management
app.post('/api/dev/pins/clear', async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'production') {
    // Clear in-memory sessions
    ussdSessions.clear();
    
    res.json({
      success: true,
      message: 'All sessions cleared successfully'
    });
  } else {
    res.status(403).json({
      success: false,
      error: 'Not available in production'
    });
  }
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Get PIN count from DataService if available
    try {
      // This would require implementing a method to count users with PINs
      // For now, we'll use session count as a proxy
      // Session count available via ussdSessions.size
    } catch (error) {
      console.error('Error getting PIN count:', error);
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeVerifications: verificationCodes.size,
      activeUSSDSessions: ussdSessions.size,
      dataServiceIntegrated: true,
      services: {
        sms: 'active',
        ussd: 'active',
        pin_management: 'integrated_with_dataservice',
        africastalking: credentials.username ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========================================
// Notification API Endpoint
// ========================================

// Send notification endpoint
app.post('/api/send-notification', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const request: NotificationRequest = req.body;
    console.log(`🔄 [SERVER] Processing notification for user ${request.user.id} (type: ${request.notification.type})`);

    // Validate input
    if (!request.user || !request.notification || !request.notification.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: user and notification type are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // Secure API key access from server environment
    const apiKey = process.env.RESEND_API_KEY;
    const emailDomain = process.env.EMAIL_FROM_DOMAIN || "afritokeni.com";
    
    if (!apiKey) {
      console.error(`❌ [SERVER] RESEND_API_KEY not found in environment variables`);
      return res.status(500).json({
        success: false,
        message: 'Email service not configured',
        error: 'MISSING_API_KEY'
      });
    }

    let emailResult: { id: string; status: string } | null = null;
    let smsResult: { simulated: boolean; phone: string; message: string } | null = null;

    // Only send email if user has email and uses web auth
    if (request.user.email && request.user.authMethod === 'web') {
      console.log(`📧 [SERVER] Sending email to ${request.user.email}...`);
      
      try {
        const { subject, html } = generateEmailContent(request.user, request.notification);

        const emailPayload = {
          from: `AfriTokeni <noreply@${emailDomain}>`,
          to: [request.user.email],
          subject,
          html
        };

        console.log(`📧 [SERVER] Calling Resend API...`);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`❌ [SERVER] Resend API error (${response.status}):`, errorData);
          throw new Error(`Resend API error: ${errorData}`);
        }

        const result = await response.json() as { id: string; [key: string]: unknown };
        emailResult = {
          id: result.id,
          status: 'sent'
        };
        
        console.log(`✅ [SERVER] Email sent successfully`);
        console.log(`✅ [SERVER] Message ID: ${result.id}`);
        
      } catch (emailError: unknown) {
        console.error(`❌ [SERVER] Email sending failed:`, emailError);
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error occurred';
        return res.status(500).json({
          success: false,
          message: `Failed to send email: ${errorMessage}`,
          error: 'EMAIL_SEND_ERROR'
        });
      }
    }

    // For SMS users, log for now (integrate real SMS gateway here)
    if (request.user.phone && (!request.user.email || request.user.authMethod === 'sms')) {
      const smsMessage = generateSMSContent(request.user, request.notification);
      console.log(`📱 [SERVER] SMS notification prepared for ${request.user.phone}`);
      console.log(`📱 [SERVER] Message: ${smsMessage}`);
      
      // TODO: Integrate real SMS gateway here
      smsResult = { 
        simulated: true, 
        phone: request.user.phone, 
        message: smsMessage 
      };
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [SERVER] Notification processing completed in ${totalDuration}ms`);

    res.json({ 
      success: true, 
      message: 'Notification sent successfully',
      results: { 
        email: emailResult,
        sms: smsResult
      }
    });
    
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error(`❌ [SERVER] Failed to send notification after ${duration}ms:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({ 
      success: false, 
      message: `Internal server error: ${errorMessage}`,
      error: 'INTERNAL_ERROR'
    });
  }
});

// Helper functions for email content generation
function generateEmailContent(user: User, notification: NotificationData): EmailContent {
  const name = user.firstName || 'User';
  
  switch (notification.type) {
    case 'subscription_welcome':
      return {
        subject: `🎉 Welcome to AfriTokeni! Your Journey to Bitcoin Banking Begins`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Welcome to AfriTokeni</h1>
              <p style="color: #666; font-size: 14px;">Bitcoin Banking for Everyone in Africa</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1a1a1a; margin-bottom: 15px;">Hi ${name}!</h2>
              <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
                Thank you for subscribing to AfriTokeni updates! You're now part of a revolutionary movement to bring Bitcoin banking to every African.
              </p>
              <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
                We'll keep you updated on:
              </p>
              <ul style="color: #444; margin-left: 20px; margin-bottom: 15px;">
                <li>Platform launch updates</li>
                <li>New currency support</li>
                <li>SMS banking features</li>
                <li>Security enhancements</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="https://www.afritokeni.com" 
                 style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 25px; 
                        text-decoration: none; border-radius: 6px; font-weight: 500;">
                Explore AfriTokeni
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                This is an automated welcome message from AfriTokeni.
              </p>
            </div>
          </div>
        `
      };
      
    case 'deposit':
      return {
        subject: `✅ Deposit Confirmed - ${notification.amount} ${notification.currency}`,
        html: createEmailTemplate(
          'Deposit Confirmed',
          `Your deposit of <strong>${notification.amount} ${notification.currency}</strong> has been confirmed.`,
          `Transaction ID: ${notification.transactionId}`,
          name
        )
      };

    case 'withdrawal':
      return {
        subject: `💸 Withdrawal Processed - ${notification.amount} ${notification.currency}`,
        html: createEmailTemplate(
          'Withdrawal Processed',
          `Your withdrawal of <strong>${notification.amount} ${notification.currency}</strong> has been processed.`,
          `Transaction ID: ${notification.transactionId}`,
          name
        )
      };

    default:
      return {
        subject: 'AfriTokeni Account Update',
        html: createEmailTemplate(
          'Account Update',
          notification.message || 'Your account has been updated.',
          '',
          name
        )
      };
  }
}

function generateSMSContent(user: User, notification: NotificationData): string {
  const name = user.firstName || 'User';
  
  switch (notification.type) {
    case 'subscription_welcome':
      return `AfriTokeni: Hi ${name}, welcome to Bitcoin banking for Africa! You'll receive platform updates via SMS. Start banking at afritokeni.com`;
      
    case 'deposit':
      return `AfriTokeni: Hi ${name}, your deposit of ${notification.amount} ${notification.currency} is confirmed. Balance updated. ID: ${notification.transactionId}`;

    case 'withdrawal':
      return `AfriTokeni: Hi ${name}, withdrawal of ${notification.amount} ${notification.currency} processed. Collect from agent. ID: ${notification.transactionId}`;

    default:
      return `AfriTokeni: Hi ${name}, ${notification.message || 'account updated'}. Check your dashboard at afritokeni.com`;
  }
}

function createEmailTemplate(title: string, message: string, details: string, name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a1a; margin-bottom: 10px;">AfriTokeni</h1>
        <p style="color: #666; font-size: 14px;">Secure Financial Services for Africa</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1a1a1a; margin-bottom: 15px;">Hi ${name}!</h2>
        <h3 style="color: #1a1a1a; margin-bottom: 15px;">${title}</h3>
        <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
          ${message}
        </p>
        ${details ? `<p style="color: #666; font-size: 14px; margin-bottom: 0;">${details}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="https://afritokeni.com" 
           style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 25px; 
                  text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Dashboard
        </a>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
        <p style="color: #999; font-size: 12px;">
          This is an automated message from AfriTokeni. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'AfriTokeni SMS & USSD Webhook Server (TypeScript)',
    version: '2.0.0',
    description: 'SMS & USSD bridge with direct DataService integration',
    endpoints: [
      'POST /api/send-sms',
      'POST /api/verify-code',
      'POST /api/webhook/sms',
      'POST /api/ussd',
      'POST /api/send-notification',
      'GET /health'
    ]
  });
});

const PORT = parseInt(process.env.PORT || process.env.VITE_PORT || '3001', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AfriTokeni SMS & USSD Webhook Server (TypeScript) running on port ${PORT}`);
  console.log(`📱 SMS Service: ${credentials.username ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📞 USSD Service: ✅ Active`);
  console.log(`🗄️  DataService: ✅ Integrated`);
  console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SMS & USSD API server...');
  console.log(`🧹 Cleaning up ${verificationCodes.size} verification codes and ${ussdSessions.size} USSD sessions`);
  process.exit(0);
});