

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

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import AfricasTalking from 'africastalking';
import { WebhookDataService as DataService } from './webHookServices.js';





dotenv.config();

// Types for our server
interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  currentMenu: 'pin_check' | 'pin_setup' | 'main' | 'send_money' | 'withdraw' | 'check_balance';
  data: {
    amount?: number;
    withdrawAmount?: number;
    availableBalance?: number;
    withdrawFee?: number;
    availableAgents?: any[];
    selectedAgent?: any;
    withdrawalCode?: string;
    transactionId?: string;
    pinAttempts?: number;
    recipientPhoneNumber?: string;
    [key: string]: any;
  };
  step: number;
  lastActivity: number;
  
  isExpired(): boolean;
  updateActivity(): void;
}

interface VerificationData {
  code: string;
  userId: string;
  timestamp: number;
}

// AfricasTalking configuration
const credentials = {
    username: process.env.VITE_AT_USERNAME || "",
    apiKey: process.env.VITE_AT_API_KEY || ""
};
const africastalking = AfricasTalking(credentials);
const sms = africastalking.SMS;

const app = express();
const PORT = process.env.VITE_PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for verification codes and USSD sessions
const verificationCodes = new Map<string, VerificationData>();
const ussdSessions = new Map<string, USSDSession>();

// USSD Session Management Class
class USSDSessionImpl implements USSDSession {
  sessionId: string;
  phoneNumber: string;
  currentMenu: 'pin_check' | 'pin_setup' | 'main' | 'send_money' | 'withdraw' | 'check_balance';
  data: Record<string, any>;
  step: number;
  lastActivity: number;

  constructor(sessionId: string, phoneNumber: string) {
    this.sessionId = sessionId;
    this.phoneNumber = phoneNumber.replace('+', '');
    this.currentMenu = 'pin_check'; // Start with PIN check
    this.data = {};
    this.step = 0;
    this.lastActivity = Date.now();
  }
  
  isExpired(): boolean {
    return Date.now() - this.lastActivity > 180000; // 3 minutes
  }
  
  updateActivity(): void {
    this.lastActivity = Date.now();
  }
}

function getOrCreateSession(sessionId: string, phoneNumber: string): USSDSession {
  const cleanPhoneNumber = phoneNumber.replace('+', '');
  if (!ussdSessions.has(sessionId) || ussdSessions.get(sessionId)!.isExpired()) {
    ussdSessions.set(sessionId, new USSDSessionImpl(sessionId, cleanPhoneNumber));
  }
  const session = ussdSessions.get(sessionId)!;
  session.updateActivity();
  return session;
}

// USSD Response helpers
function continueSession(message: string): string {
  return `CON ${message}`;
}

function endSession(message: string): string {
  return `END ${message}`;
}

// Cleanup expired codes and sessions every minute
setInterval(() => {
  const now = Date.now();
  
  // Clean verification codes
  for (const [key, value] of verificationCodes.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutes expiry
      verificationCodes.delete(key);
    }
  }
  
  // Clean expired USSD sessions
  for (const [sessionId, session] of ussdSessions.entries()) {
    if (session.isExpired()) {
      ussdSessions.delete(sessionId);
      console.log(`🧹 Cleaned up expired USSD session: ${sessionId}`);
    }
  }
}, 60000);



// Helper functions for PIN management (integrated with DataService)
async function hasUserPin(phoneNumber: string): Promise<boolean> {
  try {
    console.log(`Checking if user has PIN for: ${phoneNumber}`);
    const userPin = await DataService.getUserPin(`+${phoneNumber}`);
    console.log(`PIN check result for ${phoneNumber}:`, userPin ? 'PIN found' : 'No PIN found');
    return userPin !== null && userPin.isSet;
  } catch (error) {
    console.error('Error checking user PIN:', error);
    return false;
  }
}

async function setUserPin(phoneNumber: string, pin: string): Promise<boolean> {
    console.log(`Setting PIN for ${phoneNumber}`);
  try {
    const success = await DataService.createOrUpdateUserPin(`+${phoneNumber}`, pin);
    if (success) {
      console.log(`✅ PIN set successfully for ${phoneNumber}`);
    } else {
      console.error(`❌ Failed to set PIN for ${phoneNumber}`);
    }
    return success;
  } catch (error) {
    console.error('Error setting user PIN:', error);
    return false;
  }
}

async function verifyUserPin(phoneNumber: string, pin: string): Promise<boolean> {
    console.log(`Verifying PIN for ${phoneNumber} ${pin}`);
  try {
    const userPin = await DataService.getUserPin(`+${phoneNumber}`);
    return userPin !== null && userPin.pin === pin;
  } catch (error) {
    console.error('Error verifying user PIN:', error);
    return false;
  }
}

// Get user balance from DataService
async function getUserBalance(phoneNumber: string): Promise<number | null> {
  try {
    console.log(`Getting balance for user: ${phoneNumber}`);
    const balance = await DataService.getUserBalance(`+${phoneNumber}`);
    
    if (balance) {
      console.log(`✅ Balance retrieved: UGX ${balance.balance}`);
      return balance.balance;
    } else {
      console.log(`ℹ️ No balance found for ${phoneNumber}, defaulting to 0`);
      return 0; // Default balance if none found
    }
  } catch (error) {
    console.error('Error getting user balance:', error);
    return null;
  }
}

// SMS notification helper
async function sendSMSNotification(phoneNumber: string, message: string): Promise<any> {
  console.log(`📱 Sending SMS notification to ${phoneNumber}: ${message}`);
  try {
    const response = await sms.send({
      to: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
      message: message,
      from: process.env.VITE_AT_SHORT_CODE || "AfriTokeni"
    });
    console.log("SMS sent successfully:", response);
    return response;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return null;
  }
}

// USSD Menu Handlers

// PIN checking and setup handlers
async function handlePinCheck(input: string, session: USSDSession): Promise<string> {
  if (!input) {
    // First time - check if user has PIN
    if (await hasUserPin(session.phoneNumber)) {
      // User has PIN - go directly to main menu
      session.currentMenu = 'main';
      session.step = 0;
      return continueSession(`Welcome back to AfriTokeni USSD Service
Please select an option:
1. Send Money
2. Check Balance
3. Withdraw Money
4. Transaction History
5. Help`);
    } else {
      // User doesn't have PIN - set it up
      session.currentMenu = 'pin_setup';
      session.step = 1;
      return continueSession('Welcome to AfriTokeni!\nYou need to set up a 4-digit PIN to secure your account.\nPlease enter your new PIN:');
    }
  }
  
  // This shouldn't be reached, but just in case
  return continueSession('Welcome to AfriTokeni!\nPlease wait...');
}

async function handlePinSetup(input: string, session: USSDSession): Promise<string> {
  const sanitized_input = input.split("*")[1];
  switch (session.step) {
    case 1:
      // First PIN entry
      if (!/^\d{4}$/.test(input)) {
        return continueSession('Invalid PIN format.\nPlease enter exactly 4 digits:');
      }
      session.data.newPin = input;
      session.step = 2;
      return continueSession('Please confirm your PIN by entering it again:');
    
    case 2:
      // PIN confirmation
      { console.log(`Confirming PIN for ${input} ${session.data.newPin}`);

      if (sanitized_input !== session.data.newPin) {
        // Reset PIN setup
        session.step = 1;
        session.data = {};
        return continueSession('PINs do not match.\nPlease enter your new 4-digit PIN again:');
      }

      console.log(`New PIN set for ${session.phoneNumber}`);

      // Save PIN and proceed to main menu
      const pinSaved = await setUserPin(session.phoneNumber, sanitized_input);
      if (pinSaved) {
        session.currentMenu = 'main';
        session.step = 0;
        session.data = {};
        
        return continueSession(`PIN set successfully!

Welcome to AfriTokeni USSD Service
Please select an option:
1. Send Money
2. Check Balance
3. Withdraw Money
4. Transaction History
5. Help`);
      } else {
        // PIN save failed, retry
        session.step = 1;
        session.data = {};
        return continueSession('Error saving PIN. Please try again.\nEnter your new 4-digit PIN:');
      }
    }  
    
    default:
      session.currentMenu = 'pin_check';
      session.step = 0;
      return handlePinCheck('', session);
  }
}

async function handleMainMenu(input: string, session: USSDSession): Promise<string> {
  if (!input) {
    return continueSession(`Welcome to AfriTokeni USSD Service
Please select an option:
1. Send Money
2. Check Balance
3. Withdraw Money
4. Transaction History
5. Help`);
  }

  console.log(`Main menu input: ${input}`);
  const sanitized_input = input.split("*")[2] ? input.split("*")[2] : input;

  switch (sanitized_input) {
    case '1':
      session.currentMenu = 'send_money';
      session.step = 1;
      return continueSession('Send Money\nEnter amount to send (UGX):');
    
    case '2':
      session.currentMenu = 'check_balance';
      session.step = 1;
      return continueSession('Check Balance\nEnter your 4-digit PIN:');
    
    case '3':
      session.currentMenu = 'withdraw';
      session.step = 1;
      return continueSession('Withdraw Money\nEnter amount (UGX):');
    
    case '4':
      return endSession(`Last 5 Transactions:

1. Received: UGX 200,000 - 25/08/2025
2. Sent: UGX 150,000 - 24/08/2025  
3. Withdraw: UGX 100,000 - 23/08/2025
4. Received: UGX 300,000 - 22/08/2025
5. Sent: UGX 50,000 - 21/08/2025

Thank you for using AfriTokeni!`);
    
    case '5':
      return endSession('Help: Call +256700000000 for support\nSMS: help to 6969');
    
    default:
      return continueSession(`Invalid option. Please try again:
1. Send Money
2. Check Balance
3. Withdraw Money
4. Transaction History
5. Help`);
  }
}

async function handleCheckBalance(input: string, session: USSDSession): Promise<string> {
  console.log(`Check balance input: ${input}`);
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
      
      // PIN is correct, get user balance
      try {
        // const cleanPhone = session.phoneNumber.replace('+', '');
        const balance = await getUserBalance(session.phoneNumber);
        
        if (balance !== null) {
          return endSession(`Your Account Balance
Amount: UGX ${balance.toLocaleString()}
Available: UGX ${balance.toLocaleString()}

Thank you for using AfriTokeni!`);
        } else {
          // No balance found, assume 0
          return endSession(`Your Account Balance
Amount: UGX 0
Available: UGX 0

Thank you for using AfriTokeni!`);
        }
      } catch (error) {
        console.error('Error retrieving balance:', error);
        return endSession(`Error retrieving balance.
Please try again later.

Thank you for using AfriTokeni!`);
      }
    }
    
    default:
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
  }
}

async function handleSendMoney(input: string, session: USSDSession): Promise<string> {
  // Parse input for multi-step USSD
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // Step 1: Enter amount and validate user has enough balance
      const amount = parseFloat(currentInput);
      if (isNaN(amount) || amount <= 0) {
        return continueSession('Invalid amount.\nEnter amount to send (UGX):');
      }

      // Calculate fee (1% of amount)
      const fee = Math.round(amount * 0.01);
      const totalRequired = amount + fee;

      // Check user balance
      const userBalance = await DataService.getUserBalance(`+${session.phoneNumber}`);
      if (!userBalance || userBalance.balance < totalRequired) {
        const currentBalance = userBalance ? userBalance.balance : 0;
        return endSession(`Insufficient balance!
Your balance: UGX ${currentBalance.toLocaleString()}
Required: UGX ${totalRequired.toLocaleString()} (Amount: ${amount.toLocaleString()} + Fee: ${fee.toLocaleString()})

Thank you for using AfriTokeni!`);
      }

      // Store amount and fee for next step
      session.data.amount = amount;
      session.data.fee = fee;
      session.step = 2;
      return continueSession(`Amount: UGX ${amount.toLocaleString()}
Fee: UGX ${fee.toLocaleString()}
Total: UGX ${totalRequired.toLocaleString()}

Enter recipient phone number (256XXXXXXXXX):`);
    }
    
    case 2: {
      // Step 2: Enter recipient phone number and verify they exist
    //   if (!currentInput.match(/^256\d{9}$/)) {
    //     return continueSession('Invalid phone number format.\nEnter recipient phone (256XXXXXXXXX):');
    //   }

    console.log(`Searching for user by phone number: ${currentInput}`);

      // Use the new findUserByPhoneNumber method that handles both SMS and web users
      let recipient = await DataService.findUserByPhoneNumber(currentInput);
      
      if (!recipient) {
        // Try with + prefix
        recipient = await DataService.findUserByPhoneNumber(`+${currentInput}`);
      }
      
      if (!recipient) {
        // Try direct key lookup as fallback
        recipient = await DataService.getUserByKey(currentInput);
      }
      
      if (!recipient) {
        // Try with + prefix as key
        recipient = await DataService.getUserByKey(`+${currentInput}`);
      }

      if (!recipient) {
        return continueSession(`Phone number ${currentInput} is not registered with AfriTokeni.
        
Please enter a valid recipient phone number (256XXXXXXXXX):`);
      }

      session.data.recipientPhone = currentInput;
      session.data.recipientId = recipient.id;
      session.data.recipientName = `${recipient.firstName} ${recipient.lastName}`;
      session.step = 3;
      
      const amount = session.data.amount || 0;
      const fee = session.data.fee || 0;
      
      return continueSession(`Recipient: ${recipient.firstName} ${recipient.lastName}
Phone: ${currentInput}
Amount: UGX ${amount.toLocaleString()}
Fee: UGX ${fee.toLocaleString()}
Total: UGX ${(amount + fee).toLocaleString()}

Enter your PIN to confirm:`);
    }
    
    case 3: {
      // Step 3: Verify PIN and process transaction
      const isValidPin = await verifyUserPin(session.phoneNumber, currentInput);
      if (!isValidPin) {
        // Increment pin attempts
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        
        if (session.data.pinAttempts >= 3) {
          return endSession(`Too many incorrect PIN attempts.
Transaction cancelled for security.

Thank you for using AfriTokeni!`);
        }
        
        return continueSession(`Incorrect PIN. ${3 - session.data.pinAttempts} attempts remaining.
Enter your PIN:`);
      }

      // PIN is correct, process the transaction
      console.log(`💳 Processing money transfer: ${session.phoneNumber} -> ${session.data.recipientPhone}, Amount: ${session.data.amount}, Fee: ${session.data.fee}`);
      
      const senderPhone = `+${session.phoneNumber}`;
      const recipientPhone = session.data.recipientPhone || '';
      const amount = session.data.amount || 0;
      const fee = session.data.fee || 0;
      
      const transferResult = await DataService.processSendMoney(
        senderPhone,
        recipientPhone,
        amount,
        fee
      );

      console.log(`Transfer result: ${JSON.stringify(transferResult)}`);

      if (!transferResult.success) {
        return endSession(`❌ Transaction Failed!
${transferResult.error}

Thank you for using AfriTokeni!`);
      }

      const transactionId = transferResult.transactionId;
      const recipientName = session.data.recipientName || 'Unknown';
      
      // Send SMS to sender
      await sendSMSNotification(
        session.phoneNumber,
        `Money sent successfully!
Amount: UGX ${amount.toLocaleString()}
To: ${recipientName} (${recipientPhone})
Fee: UGX ${fee.toLocaleString()}
Reference: ${transactionId}
Thank you for using AfriTokeni!`
      );
      
      // Send SMS to recipient
      await sendSMSNotification(
        recipientPhone,
        `You received money!
Amount: UGX ${amount.toLocaleString()}
From: ${session.phoneNumber}
Reference: ${transactionId}
Thank you for using AfriTokeni!`
      );

      return endSession(`✅ Transaction Successful!

Sent: UGX ${amount.toLocaleString()}
To: ${recipientName}
Phone: ${recipientPhone}
Fee: UGX ${fee.toLocaleString()}
Reference: ${transactionId}

Thank you for using AfriTokeni!`);
    }
    
    default:
      session.currentMenu = 'main';
      session.step = 0;
      session.data = {};
      return continueSession('Enter amount to send (UGX):');
  }
}

async function handleWithdraw(input: string, session: USSDSession): Promise<string> {
  switch (session.step) {
    case 1: {
      // Step 1: Get amount to withdraw
      if (!input) {
        return continueSession('Withdraw Money\nEnter amount (UGX):');
      }
        const inputParts = input.split('*');
        const sanitized_input = inputParts[inputParts.length - 1] || '';

      console.log(`Withdraw amount: UGX ${sanitized_input}`);

      const amount = parseInt(sanitized_input);
      if (isNaN(amount) || amount <= 0) {
        return continueSession('Invalid amount.\nEnter amount (UGX):');
      }
      
      if (amount < 1000) {
        return continueSession('Minimum withdrawal: UGX 1,000\nEnter amount (UGX):');
      }
      
      if (amount > 2000000) {
        return continueSession('Maximum withdrawal: UGX 2,000,000\nEnter amount (UGX):');
      }

      session.data.withdrawAmount = amount;
      session.step = 2;
      
      // Step 2: Check user balance
      console.log(`Checking balance for ${session.phoneNumber}`);
      try {
        const userBalance = await DataService.getUserBalance(session.phoneNumber);
        
        if (!userBalance) {
          return endSession('Unable to check balance. Please try again later.');
        }
        
        const totalRequired = amount + Math.round(amount * 0.01); // Include 1% fee
        
        if (userBalance.balance < totalRequired) {
          return endSession(`Insufficient balance.
Available: UGX ${userBalance.balance.toLocaleString()}
Required: UGX ${totalRequired.toLocaleString()} (including fee)

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
        
        session.data.availableAgents = agents;
        
        let agentList = `Select an agent:
Amount: UGX ${amount.toLocaleString()}
Fee: UGX ${session.data.withdrawFee.toLocaleString()}
Total: UGX ${totalRequired.toLocaleString()}

`;
        
        agents.forEach((agent, index) => {
          agentList += `${index + 1}. ${agent.businessName}
   ${agent.location.city}, ${agent.location.address}
`;
        });
        
        agentList += '\n0. Cancel withdrawal';
        
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
      
      if (agentChoice === 0) {
        return endSession('Withdrawal cancelled.\n\nThank you for using AfriTokeni!');
      }
      
      const agents = session.data.availableAgents;
      if (!agents || isNaN(agentChoice) || agentChoice < 1 || agentChoice > agents.length) {
        return continueSession('Invalid selection. Choose agent number or 0 to cancel:');
      }
      
      const selectedAgent = agents[agentChoice - 1];
      session.data.selectedAgent = selectedAgent;
      session.step = 4;
      
      const withdrawAmount = session.data.withdrawAmount || 0;
      const withdrawFee = session.data.withdrawFee || 0;
      
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location.city}, ${selectedAgent.location.address}

Amount: UGX ${withdrawAmount.toLocaleString()}
Fee: UGX ${withdrawFee.toLocaleString()}

Enter your 4-digit PIN to confirm:`);
    }
      
    case 4: {
      // Step 5: PIN verification
      const inputParts = input.split('*');
      const sanitized_input = inputParts[inputParts.length - 1] || '';
      console.log(`Verifying PIN input: ${sanitized_input.length}`);
      console.log(`Unsanitized pin input: ${input}`);
      console.log(`Session data: ${!sanitized_input} - ${sanitized_input.length !== 4} - ${isNaN(parseInt(sanitized_input))}`);
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
        
        // Step 6: Create pending withdrawal transaction
        const withdrawalCode = Math.random().toString(36).substring(2, 8).toUpperCase();
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
Amount: UGX ${withdrawAmount.toLocaleString()}
Fee: UGX ${withdrawFee.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location.city}
Valid: 24 hours
Transaction ID: ${transactionId}

Show this code to the agent with your ID to collect cash.`;

console.log(`Sending withdrawal SMS to ${session.phoneNumber}`);

        try {
          console.log(`Sending SMS with withdrawal details to ${session.phoneNumber}`);
          await sendSMSNotification(session.phoneNumber, smsMessage);
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Continue even if SMS fails
        }
        
        return endSession(`✅ Withdrawal Created!

Code: ${withdrawalCode}
Amount: UGX ${withdrawAmount.toLocaleString()}
Fee: UGX ${withdrawFee.toLocaleString()}
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

// Mock AfricasTalking SMS sending
const sendSMS = async (phoneNumber: string, message: string) => {
    console.log(`📱 Sending SMS to ${phoneNumber}: ${message}`);
    console.log(`Using AfricasTalking credentials: ${JSON.stringify(credentials)}`);

    try {
        await sms.send({
            to: phoneNumber,
            message, 
            from: process.env.VITE_AT_SHORT_CODE || "AfriTokeni"
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
app.post('/api/send-sms', async (req, res) => {
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
app.post('/api/verify-code', (req, res) => {
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
app.post('/api/webhook/sms', (req, res) => {
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
app.post('/api/ussd', async (req, res) => {
  try {
    const { sessionId, phoneNumber, text } = req.body;
    
    console.log(`📱 USSD Request - Session: ${sessionId}, Phone: ${phoneNumber}, Text: "${text}"`);
    
    const session = getOrCreateSession(sessionId, phoneNumber);
    let response: string;

    // Route to appropriate handler based on current menu
    switch (session.currentMenu) {
      case 'pin_check':
        response = await handlePinCheck(text, session);
        break;
      case 'pin_setup':
        response = await handlePinSetup(text, session);
        break;
      case 'main':
        response = await handleMainMenu(text, session);
        break;
      case 'send_money':
        response = await handleSendMoney(text, session);
        break;
      case 'check_balance':
        response = await handleCheckBalance(text, session);
        break;
      case 'withdraw':
        response = await handleWithdraw(text, session);
        break;
      default:
        response = await handlePinCheck('', session);
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
app.post('/api/dev/pins/clear', async (_req, res) => {
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
app.get('/health', async (_req, res) => {
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

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'AfriTokeni SMS & USSD Webhook Server (TypeScript)',
    version: '2.0.0',
    description: 'SMS & USSD bridge with direct DataService integration',
    endpoints: [
      'POST /api/send-sms',
      'POST /api/verify-code',
      'POST /api/webhook/sms',
      'POST /api/ussd',
      'GET /health'
    ]
  });
});

app.listen(PORT, () => {
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
