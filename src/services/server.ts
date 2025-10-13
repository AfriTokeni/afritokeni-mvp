

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

// Types for our server
interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  currentMenu: 'registration_check' | 'user_registration' | 'verification' | 'pin_check' | 'pin_setup' | 'main' | 'local_currency' | 'send_money' | 'withdraw' | 'check_balance' | 'transaction_history' | 'deposit' | 'find_agent' | 'bitcoin' | 'btc_balance' | 'btc_rate' | 'btc_buy' | 'btc_sell' | 'btc_send' | 'usdc' | 'usdc_balance' | 'usdc_rate' | 'usdc_buy' | 'usdc_sell' | 'usdc_send';
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
    pinVerified?: boolean; // Track if user has verified PIN in current session
    recipientPhoneNumber?: string;
    // New registration fields
    firstName?: string;
    lastName?: string;
    verificationCode?: string;
    verificationAttempts?: number;
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

// In-memory storage for verification codes and USSD sessions
const verificationCodes = new Map<string, VerificationData>();
const ussdSessions = new Map<string, USSDSession>();

// USSD Session Management Class
class USSDSessionImpl implements USSDSession {
  sessionId: string;
  phoneNumber: string;
  currentMenu: 'registration_check' | 'user_registration' | 'verification' | 'pin_check' | 'pin_setup' | 'main' | 'send_money' | 'withdraw' | 'check_balance' | 'transaction_history' | 'deposit' | 'bitcoin' | 'btc_balance' | 'btc_rate' | 'btc_buy' | 'btc_sell' | 'btc_buy' | 'btc_sell' | 'usdc' | 'usdc_balance' | 'usdc_rate' | 'usdc_buy' | 'usdc_sell';
  data: Record<string, any>;
  step: number;
  lastActivity: number;

  constructor(sessionId: string, phoneNumber: string) {
    this.sessionId = sessionId;
    this.phoneNumber = phoneNumber.replace('+', '');
    this.currentMenu = 'registration_check'; // Start with registration check
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
  console.log(`📋 Session management for ${sessionId}, phone: ${cleanPhoneNumber}`);
  
  if (!ussdSessions.has(sessionId) || ussdSessions.get(sessionId)!.isExpired()) {
    if (ussdSessions.has(sessionId) && ussdSessions.get(sessionId)!.isExpired()) {
      console.log(`⏰ Session ${sessionId} expired, creating new session`);
    } else {
      console.log(`🆕 Creating new session ${sessionId} for ${cleanPhoneNumber}`);
    }
    ussdSessions.set(sessionId, new USSDSessionImpl(sessionId, cleanPhoneNumber));
  } else {
    console.log(`♻️  Using existing session ${sessionId} for ${cleanPhoneNumber}`);
  }
  
  const session = ussdSessions.get(sessionId)!;
  session.updateActivity();
  console.log(`📋 Session ${sessionId} - Current menu: ${session.currentMenu}, Step: ${session.step}`);
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



// Helper functions for user registration and PIN management (integrated with DataService)

// Check if user is registered in Juno datastore
async function isUserRegistered(phoneNumber: string): Promise<boolean> {
  try {
    console.log(`Checking if user is registered for: ${phoneNumber}`);
    const user = await DataService.findUserByPhoneNumber(`+${phoneNumber}`);
    console.log(`Registration check result for ${phoneNumber}:`, user ? 'User found' : 'User not found');
    return user !== null;
  } catch (error) {
    console.error(`Error checking user registration for ${phoneNumber}:`, error);
    return false;
  }
}

// Register new user in Juno datastore
async function registerNewUser(phoneNumber: string, firstName: string, lastName: string): Promise<boolean> {
  try {
    console.log(`Registering new user: ${firstName} ${lastName} with phone ${phoneNumber}`);
    await DataService.createUser({
      firstName: firstName,
      lastName: lastName,
      email: `+${phoneNumber}`, // Store phone as email for SMS users
      userType: 'user',
      kycStatus: 'not_started',
      authMethod: 'sms'
    });
    console.log(`Successfully registered user: ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error(`Error registering user ${phoneNumber}:`, error);
    return false;
  }
}

// Generate and store verification code
function generateVerificationCode(phoneNumber: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  verificationCodes.set(phoneNumber, {
    code: code,
    userId: phoneNumber,
    timestamp: Date.now()
  });
  return code;
}

// Verify the verification code
function verifyVerificationCode(phoneNumber: string, inputCode: string): boolean {
  const storedData = verificationCodes.get(phoneNumber);
  if (!storedData) {
    return false;
  }
  
  // Check if code has expired (10 minutes)
  if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
    verificationCodes.delete(phoneNumber);
    return false;
  }
  
  const isValid = storedData.code === inputCode;
  if (isValid) {
    verificationCodes.delete(phoneNumber); // Clean up after successful verification
  }
  
  return isValid;
}

async function hasUserPin(phoneNumber: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking if user has PIN for: ${phoneNumber}`);
    const userPin = await DataService.getUserPin(`+${phoneNumber}`);
    console.log(`🔍 getUserPin result for ${phoneNumber}:`, userPin);
    
    if (userPin) {
      console.log(`🔍 UserPin details - PIN: ${userPin.pin}, isSet: ${userPin.isSet}`);
      const hasPin = userPin !== null && userPin.isSet;
      console.log(`🔍 Final hasUserPin result for ${phoneNumber}: ${hasPin}`);
      return hasPin;
    } else {
      console.log(`🔍 No userPin found for ${phoneNumber}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking user PIN:', error);
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

// Helper function to check if PIN verification is required for sensitive operations
function requiresPinVerification(session: USSDSession): boolean {
  // If PIN has already been verified in this session, no need to verify again
  return !session.data.pinVerified;
}

// Helper function to initiate PIN verification for sensitive operations
function requestPinVerification(session: USSDSession, operation: string, nextMenu: string): string {
  session.currentMenu = 'pin_check';
  session.step = 1;
  session.data.pendingOperation = operation;
  session.data.nextMenu = nextMenu;
  session.data.pinAttempts = 0;
  return continueSession(`${operation}\nFor security, please enter your 4-digit PIN:`);
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
      from: process.env.AT_SHORT_CODE || "22948"
    });
    console.log("SMS sent successfully:", response);
    return response;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return null;
  }
}

// USSD Menu Handlers

// Registration check handler - first step when user dials USSD
async function handleRegistrationCheck(input: string, session: USSDSession): Promise<string> {
  console.log(`🔍 Registration check for ${session.phoneNumber}, input: "${input}"`);
  
  if (!input) {
    // First time dialing USSD - check if user is registered
    const isRegistered = await isUserRegistered(session.phoneNumber);
    console.log(`📋 User ${session.phoneNumber} registration status: ${isRegistered ? 'Registered' : 'Not registered'}`);
    
    if (!isRegistered) {
      // User not registered - ask for their name
      session.currentMenu = 'user_registration';
      session.step = 1;
      console.log(`➡️ Redirecting ${session.phoneNumber} to registration`);
      return continueSession('Welcome to AfriTokeni!\nYou are not registered yet.\nPlease enter your full name (first and last name):');
    } else {
      // User is registered - check if they have a PIN
      const hasPIN = await hasUserPin(session.phoneNumber);
      console.log(`🔑 User ${session.phoneNumber} PIN status: ${hasPIN ? 'Has PIN' : 'No PIN'}`);
      
      if (!hasPIN) {
        // User registered but no PIN - go to PIN setup
        session.currentMenu = 'pin_setup';
        session.step = 1;
        console.log(`➡️ Redirecting ${session.phoneNumber} to PIN setup`);
        return continueSession('Welcome back to AfriTokeni!\nTo secure your account, please set up a 4-digit PIN:\nEnter your new PIN:');
      } else {
        // User registered and has PIN - go directly to main menu (no PIN verification required for menu access)
        session.currentMenu = 'main';
        session.step = 0;
        session.data = { pinVerified: false }; // Track that PIN hasn't been verified yet for sensitive operations
        console.log(`➡️ User ${session.phoneNumber} has PIN, going directly to main menu`);
        return continueSession(`Welcome back to AfriTokeni USSD Service!
Please select an option:
1. Local Currency (UGX)
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
      }
    }
  }
  
  // This shouldn't be reached, but just in case
  return continueSession('Welcome to AfriTokeni!\nPlease wait...');
}

// User registration handler - for new users
async function handleUserRegistration(input: string, session: USSDSession): Promise<string> {
  const sanitized_input = input.split("*")[input.split("*").length - 1];
  console.log(`📝 User registration for ${session.phoneNumber}, step: ${session.step}, input: "${sanitized_input}"`);
  
  switch (session.step) {
    case 1: {
      // Getting full name
      if (!sanitized_input || sanitized_input.trim().length < 3) {
        console.log(`❌ Invalid name "${sanitized_input}" provided by ${session.phoneNumber}`);
        return continueSession('Invalid name. Please enter your full name (first and last name):');
      }
      
      const fullNameParts = sanitized_input.trim().split(/\s+/);
      if (fullNameParts.length < 2) {
        console.log(`❌ Incomplete name "${sanitized_input}" provided by ${session.phoneNumber}`);
        return continueSession('Please enter both first and last name separated by space:');
      }
      
      // First word is first name, last word is last name
      const firstName = fullNameParts[0];
      const lastName = fullNameParts[fullNameParts.length - 1];
      
      session.data.firstName = firstName;
      session.data.lastName = lastName;
      
      console.log(`✅ Full name "${sanitized_input}" split into firstName: "${firstName}", lastName: "${lastName}" for ${session.phoneNumber}`);
      
      // Generate and send verification code
      const verificationCode = generateVerificationCode(session.phoneNumber);
      session.data.verificationCode = verificationCode;
      session.data.verificationAttempts = 0;
      console.log(`🔢 Generated verification code ${verificationCode} for ${session.phoneNumber}`);
      
      // Send SMS with verification code
      try {
        await sendSMSNotification(`+${session.phoneNumber}`, 
          `AfriTokeni Verification: Your code is ${verificationCode}. Enter this code to complete registration.`);
        
        session.currentMenu = 'verification';
        session.step = 1;
        console.log(`📱 SMS sent successfully to ${session.phoneNumber}, moving to verification menu`);
        return continueSession(`Thank you ${firstName} ${lastName}!\nWe've sent a verification code to your phone.\nPlease enter the 6-digit code:`);
      } catch (error) {
        console.error(`❌ Failed to send verification SMS to ${session.phoneNumber}:`, error);
        return endSession('Failed to send verification code. Please try again later.');
      }
    }
      
    default:
      console.log(`❌ Invalid registration step ${session.step} for ${session.phoneNumber}`);
      return endSession('Registration process error. Please try again.');
  }
}

// Verification handler - for verifying SMS code
async function handleVerification(input: string, session: USSDSession): Promise<string> {
  const sanitized_input = input.split("*")[input.split("*").length - 1];
  console.log(`🔍 Verification for ${session.phoneNumber}, attempt ${(session.data.verificationAttempts || 0) + 1}, input: "${sanitized_input}"`);
  
  switch (session.step) {
    case 1: {
      // Verifying the code
      if (!sanitized_input || sanitized_input.length !== 6) {
        session.data.verificationAttempts = (session.data.verificationAttempts || 0) + 1;
        console.log(`❌ Invalid code format for ${session.phoneNumber}, attempts: ${session.data.verificationAttempts}`);
        if (session.data.verificationAttempts >= 3) {
          console.log(`🚫 Max verification attempts reached for ${session.phoneNumber}`);
          return endSession('Too many failed attempts. Please dial again to restart registration.');
        }
        return continueSession('Invalid code format. Please enter the 6-digit verification code:');
      }
      
      // Verify the code
      const isValidCode = verifyVerificationCode(session.phoneNumber, sanitized_input);
      console.log(`🔐 Code verification result for ${session.phoneNumber}: ${isValidCode ? 'Valid' : 'Invalid'}`);
      
      if (!isValidCode) {
        session.data.verificationAttempts = (session.data.verificationAttempts || 0) + 1;
        console.log(`❌ Invalid verification code for ${session.phoneNumber}, attempts: ${session.data.verificationAttempts}`);
        if (session.data.verificationAttempts >= 3) {
          console.log(`🚫 Max verification attempts reached for ${session.phoneNumber}`);
          return endSession('Too many failed attempts. Please dial again to restart registration.');
        }
        return continueSession('Invalid verification code. Please try again:');
      }
      
      // Code is valid - register the user
      console.log(`✅ Valid verification code for ${session.phoneNumber}, proceeding with user registration`);
      const registrationSuccess = await registerNewUser(
        session.phoneNumber,
        session.data.firstName!,
        session.data.lastName!
      );
      
      if (!registrationSuccess) {
        console.log(`❌ User registration failed for ${session.phoneNumber}`);
        return endSession('Registration failed. Please try again later.');
      }
      
      // Registration successful - now set up PIN
      console.log(`👤 User ${session.phoneNumber} registered successfully, moving to PIN setup`);
      session.currentMenu = 'pin_setup';
      session.step = 1;
      return continueSession('Verification successful!\nAccount created successfully.\nNow please set up a 4-digit PIN to secure your account:\nEnter your new PIN:');
    }
      
    default:
      console.log(`❌ Invalid verification step ${session.step} for ${session.phoneNumber}`);
      return endSession('Verification process error. Please try again.');
  }
}

// PIN checking and setup handlers
async function handlePinCheck(input: string, session: USSDSession): Promise<string> {
  console.log(`🔑 PIN check for ${session.phoneNumber}, step: ${session.step}, raw input: "${input}"`);
  
  // Extract the last part of USSD input (the actual PIN entered)
  const inputParts = input.split('*');
  const pinInput = inputParts[inputParts.length - 1] || '';
  console.log(`🔑 PIN input after USSD parsing: "${pinInput}"`);
  
  switch (session.step) {
    case 1: {
      // User is entering their PIN
      if (!pinInput) {
        return continueSession('Welcome to AfriTokeni!\nPlease enter your 4-digit PIN:');
      }
      
      if (!/^\d{4}$/.test(pinInput)) {
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        console.log(`❌ Invalid PIN format for ${session.phoneNumber}, PIN: "${pinInput}", attempts: ${session.data.pinAttempts}`);
        
        if (session.data.pinAttempts >= 3) {
          console.log(`🚫 Max PIN attempts reached for ${session.phoneNumber}`);
          return endSession('Too many failed attempts. Please try again later.');
        }
        
        return continueSession('Invalid PIN format. Please enter exactly 4 digits:');
      }
      
      // Verify the PIN
      const isValidPin = await verifyUserPin(session.phoneNumber, pinInput);
      console.log(`🔐 PIN verification result for ${session.phoneNumber}: ${isValidPin ? 'Valid' : 'Invalid'}`);
      
      if (isValidPin) {
        // PIN is correct - check if there's a pending operation
        console.log(`✅ PIN verified successfully for ${session.phoneNumber}`);
        session.data.pinVerified = true; // Mark PIN as verified in this session
        
        // Check if there's a pending operation to complete
        if (session.data.pendingOperation && session.data.nextMenu) {
          console.log(`🔄 Completing pending operation: ${session.data.pendingOperation}`);
          const nextMenu = session.data.nextMenu;
          
          // Clear pending operation data
          delete session.data.pendingOperation;
          delete session.data.nextMenu;
          
          // Route to the appropriate handler
          session.currentMenu = nextMenu;
          session.step = 1;
          
          if (nextMenu === 'check_balance') {
            return await handleCheckBalance('', session);
          } else if (nextMenu === 'transaction_history') {
            return await handleTransactionHistory('', session);
          }
        }
        
        // No pending operation - go to main menu
        session.currentMenu = 'main';
        session.step = 0;
        return continueSession(`Welcome back to AfriTokeni USSD Service
Please select an option:
1. Local Currency (UGX)
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
      } else {
        // PIN is incorrect
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        console.log(`❌ Invalid PIN for ${session.phoneNumber}, attempts: ${session.data.pinAttempts}`);
        
        if (session.data.pinAttempts >= 3) {
          console.log(`🚫 Max PIN attempts reached for ${session.phoneNumber}`);
          return endSession('Too many failed attempts. Please try again later.');
        }
        
        const remainingAttempts = 3 - session.data.pinAttempts;
        return continueSession(`Incorrect PIN. You have ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.\nPlease enter your 4-digit PIN:`);
      }
    }
    
    default:
      // Initialize PIN check
      console.log(`🔑 Initializing PIN check for ${session.phoneNumber}`);
      session.step = 1;
      session.data.pinAttempts = 0;
      return continueSession('Welcome to AfriTokeni!\nPlease enter your 4-digit PIN:');
  }
}

async function handlePinSetup(input: string, session: USSDSession): Promise<string> {
  // Extract the last part of USSD input (the actual PIN entered)
  const inputParts = input.split('*');
  const pinInput = inputParts[inputParts.length - 1] || '';
  console.log(`🔧 PIN setup for ${session.phoneNumber}, step: ${session.step}, input: "${pinInput}"`);
  
  switch (session.step) {
    case 1:
      // First PIN entry
      if (!/^\d{4}$/.test(pinInput)) {
        console.log(`❌ Invalid PIN format during setup for ${session.phoneNumber}: "${pinInput}"`);
        return continueSession('Invalid PIN format.\nPlease enter exactly 4 digits:');
      }
      session.data.newPin = pinInput;
      session.step = 2;
      console.log(`✅ First PIN entry accepted for ${session.phoneNumber}`);
      return continueSession('Please confirm your PIN by entering it again:');
    
    case 2:
      // PIN confirmation
      { 
        console.log(`🔄 Confirming PIN for ${session.phoneNumber}: "${pinInput}" vs "${session.data.newPin}"`);

        if (pinInput !== session.data.newPin) {
          // Reset PIN setup
          session.step = 1;
          session.data = {};
          console.log(`❌ PIN mismatch for ${session.phoneNumber}`);
          return continueSession('PINs do not match.\nPlease enter your new 4-digit PIN again:');
        }

        console.log(`🔑 New PIN confirmed for ${session.phoneNumber}`);

        // Save PIN and proceed to main menu
        const pinSaved = await setUserPin(session.phoneNumber, pinInput);
        if (pinSaved) {
          session.currentMenu = 'main';
          session.step = 0;
          session.data = {};
          console.log(`✅ PIN setup completed successfully for ${session.phoneNumber}`);
          
          return continueSession(`PIN set successfully!

Welcome to AfriTokeni USSD Service
Please select an option:
1. Local Currency (UGX)
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
        } else {
          // PIN save failed, retry
          session.step = 1;
          session.data = {};
          console.log(`❌ Failed to save PIN for ${session.phoneNumber}`);
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
1. Local Currency (UGX)
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
  }

  console.log(`Main menu input: ${input}`);
  // Extract the last part of the input after splitting by '*'
  const inputParts = input.split("*");
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  console.log(`Main menu sanitized input: "${sanitized_input}"`);

  switch (sanitized_input) {
    case '1':
      session.currentMenu = 'local_currency';
      session.step = 0;
      return handleLocalCurrency('', session);
    
    case '2':
      session.currentMenu = 'bitcoin';
      session.step = 0;
      return handleBitcoin('', session);
    
    case '3':
      session.currentMenu = 'usdc';
      session.step = 0;
      return handleUSDC('', session);
    
    case '4':
      return endSession(`AfriTokeni Help

Local Currency: Send, deposit, withdraw UGX
Bitcoin: Buy, sell, send ckBTC
USDC: Buy, sell, send USDC stablecoin

For support: Call +256-XXX-XXXX
Visit: afritokeni.com

Thank you for using AfriTokeni!`);
    
    default:
      return continueSession(`Invalid option. Please try again:
1. Local Currency (UGX)
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
  }
}

async function handleLocalCurrency(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  if (!currentInput) {
    return continueSession(`Local Currency (UGX)
Please select an option:
11. Send Money
12. Check Balance
13. Deposit
14. Withdraw
15. Transactions
16. Find Agent
0. Back to Main Menu`);
  }
  
  switch (currentInput) {
    case '11':
      session.currentMenu = 'send_money';
      session.step = 1;
      return continueSession('Send Money\nEnter recipient phone number:');
    
    case '12':
      // Check Balance - requires PIN verification if not already verified
      if (requiresPinVerification(session)) {
        return requestPinVerification(session, 'Check Balance', 'check_balance');
      } else {
        // PIN already verified or not required
        session.currentMenu = 'check_balance';
        return await handleCheckBalance('', session);
      }
    
    case '13':
      session.currentMenu = 'deposit';
      session.step = 1;
      return continueSession('Deposit Money\nEnter amount to deposit (UGX):');
    
    case '14':
      session.currentMenu = 'withdraw';
      session.step = 1;
      return continueSession('Withdraw Money\nEnter amount to withdraw (UGX):');
    
    case '15':
      // Transaction History - requires PIN verification if not already verified
      if (requiresPinVerification(session)) {
        return requestPinVerification(session, 'Transaction History', 'transaction_history');
      } else {
        session.currentMenu = 'transaction_history';
        session.step = 1;
        return await handleTransactionHistory('', session);
      }
    
    case '16':
      session.currentMenu = 'find_agent';
      session.step = 1;
      return handleFindAgent('', session);
    
    case '0':
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
    
    default:
      return continueSession(`Invalid option. Please try again:
1. Send Money
2. Check Balance
3. Deposit
4. Withdraw
5. Transactions
6. Find Agent
0. Back to Main Menu`);
  }
}

async function handleFindAgent(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  try {
    // Get list of available agents
    const agents = await DataService.getAvailableAgents();
    const availableAgents = agents.filter((agent: Agent) => agent.isActive);
    
    if (availableAgents.length === 0) {
      return endSession(`No agents available at this time.

Please try again later.

Thank you for using AfriTokeni!`);
    }
    
    let agentList = `Find Agent

Available agents near you:

`;
    
    availableAgents.slice(0, 5).forEach((agent: Agent, index: number) => {
      agentList += `${index + 1}. ${agent.businessName}
   ${agent.location?.city || 'Location'}, ${agent.location?.address || ''}

`;
    });
    
    agentList += `For directions or to contact agents directly, visit them at their listed locations.

0. Back to Local Currency Menu`;
    
    if (!currentInput) {
      return continueSession(agentList);
    }
    
    if (currentInput === '0') {
      session.currentMenu = 'local_currency';
      session.step = 0;
      return handleLocalCurrency('', session);
    }
    
    // If user selects an agent number, show detailed info
    const agentChoice = parseInt(currentInput);
    if (!isNaN(agentChoice) && agentChoice >= 1 && agentChoice <= availableAgents.length) {
      const selectedAgent = availableAgents[agentChoice - 1];
      return endSession(`Agent Details

${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}
Address: ${selectedAgent.location?.address || 'N/A'}

Services:
- Deposit money
- Withdraw money
- Buy/Sell Bitcoin
- Buy/Sell USDC

Visit the agent at their location for assistance.

Thank you for using AfriTokeni!`);
    }
    
    return continueSession(`Invalid selection.
${agentList}`);
    
  } catch (error) {
    console.error('Error getting agents:', error);
    return endSession(`Error loading agents.
Please try again later.

Thank you for using AfriTokeni!`);
  }
}

async function handleCheckBalance(input: string, session: USSDSession): Promise<string> {
  console.log(`Check balance input: ${input}`);
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  
  // If PIN is already verified in session, skip PIN verification
  if (session.data.pinVerified) {
    console.log(`PIN already verified for ${session.phoneNumber}, showing balance directly`);
    try {
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

async function handleTransactionHistory(input: string, session: USSDSession): Promise<string> {
  console.log(`Transaction history input: ${input}`);
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  
  // If PIN is already verified in session, skip PIN verification
  if (session.data.pinVerified) {
    console.log(`PIN already verified for ${session.phoneNumber}, showing transaction history directly`);
    try {
      console.log(`Getting transaction history for ${session.phoneNumber}`);
      const transactions = await DataService.getUserTransactions(session.phoneNumber, 5);
      
      if (transactions.length === 0) {
        return endSession(`Transaction History:

No transactions found.

To start using AfriTokeni, send money or make a deposit through an agent.

Thank you for using AfriTokeni!`);
      }

      let transactionList = `Last ${transactions.length} Transactions:\n\n`;
      
      transactions.forEach((tx, index) => {
        const date = tx.createdAt.toLocaleDateString('en-GB');
        let description = '';
        
        switch (tx.type) {
          case 'send':
            description = `Sent: UGX ${tx.amount.toLocaleString()}`;
            if (tx.fee && tx.fee > 0) {
              description += ` (Fee: UGX ${tx.fee.toLocaleString()})`;
            }
            break;
          case 'receive':
            description = `Received: UGX ${tx.amount.toLocaleString()}`;
            break;
          case 'withdraw':
            description = `Withdraw: UGX ${tx.amount.toLocaleString()}`;
            if (tx.fee && tx.fee > 0) {
              description += ` (Fee: UGX ${tx.fee.toLocaleString()})`;
            }
            break;
          case 'deposit':
            description = `Deposit: UGX ${tx.amount.toLocaleString()}`;
            break;
          default:
            description = `${tx.description || 'Transaction'}: UGX ${tx.amount.toLocaleString()}`;
        }
        
        transactionList += `${index + 1}. ${date}\n${description}\nStatus: ${tx.status}\n\n`;
      });

      return endSession(`${transactionList}Thank you for using AfriTokeni!`);
    } catch (error) {
      console.error('Error retrieving transaction history:', error);
      return endSession(`Error retrieving transaction history.
Please try again later.

Thank you for using AfriTokeni!`);
    }
  }
  
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
      
      // PIN is correct, get transaction history
      try {
        console.log(`Getting transaction history for ${session.phoneNumber}`);
        const transactions = await DataService.getUserTransactions(session.phoneNumber, 5);
        
        if (transactions.length === 0) {
          return endSession(`Transaction History:

No transactions found.

To start using AfriTokeni, send money or make a deposit through an agent.

Thank you for using AfriTokeni!`);
        }

        let transactionList = `Last ${transactions.length} Transactions:\n\n`;
        
        transactions.forEach((tx, index) => {
          const date = tx.createdAt.toLocaleDateString('en-GB');
          let description = '';
          
          switch (tx.type) {
            case 'send':
              description = `Sent: UGX ${tx.amount.toLocaleString()}`;
              if (tx.fee && tx.fee > 0) {
                description += ` (Fee: UGX ${tx.fee.toLocaleString()})`;
              }
              break;
            case 'receive':
              description = `Received: UGX ${tx.amount.toLocaleString()}`;
              break;
            case 'withdraw':
              description = `Withdraw: UGX ${tx.amount.toLocaleString()}`;
              if (tx.fee && tx.fee > 0) {
                description += ` (Fee: UGX ${tx.fee.toLocaleString()})`;
              }
              break;
            case 'deposit':
              description = `Deposit: UGX ${tx.amount.toLocaleString()}`;
              break;
            default:
              description = `${tx.type}: UGX ${tx.amount.toLocaleString()}`;
          }
          
          transactionList += `${index + 1}. ${description} - ${date}\n`;
          
          // Add status if not completed
          if (tx.status !== 'completed') {
            transactionList += `   Status: ${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}\n`;
          }
        });

        transactionList += `\nThank you for using AfriTokeni!`;
        
        return endSession(transactionList);
      } catch (error) {
        console.error('Error getting transaction history:', error);
        return endSession(`Transaction History:

Unable to retrieve transaction history at the moment. Please try again later.

Thank you for using AfriTokeni!`);
      }
    }
    
    default:
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
  }
}

async function handleDeposit(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 1: {
      // Step 1: Enter deposit amount
      if (!currentInput) {
        return continueSession('Deposit Money\nEnter amount to deposit (UGX):');
      }
      
      const amount = parseInt(currentInput);
      if (isNaN(amount) || amount <= 0) {
        return continueSession('Invalid amount.\nEnter amount to deposit (UGX):');
      }
      
      if (amount < 1000) {
        return continueSession('Minimum deposit: UGX 1,000\nEnter amount to deposit (UGX):');
      }
      
      if (amount > 5000000) {
        return continueSession('Maximum deposit: UGX 5,000,000\nEnter amount to deposit (UGX):');
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
Amount: UGX ${amount.toLocaleString()}

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
      const agentChoice = parseInt(currentInput);
      
      if (agentChoice === 0) {
        return endSession('Deposit cancelled.\n\nThank you for using AfriTokeni!');
      }
      
      const agents = session.data.availableAgents;
      if (!agents || isNaN(agentChoice) || agentChoice < 1 || agentChoice > agents.length) {
        return continueSession('Invalid selection. Choose agent number or 0 to cancel:');
      }
      
      const selectedAgent = agents[agentChoice - 1];
      session.data.selectedAgent = selectedAgent;
      session.step = 3;
      
      const depositAmount = session.data.depositAmount || 0;
      
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location.city}, ${selectedAgent.location.address}

Deposit Amount: UGX ${depositAmount.toLocaleString()}

Enter your 4-digit PIN to confirm:`);
    }
    
    case 3: {
      // Step 3: PIN verification and deposit code generation
      if (!currentInput || currentInput.length !== 4) {
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        
        if (session.data.pinAttempts >= 3) {
          return endSession('Too many incorrect PIN attempts. Deposit cancelled for security.');
        }
        
        return continueSession(`Invalid PIN format. Enter 4-digit PIN:
Attempts remaining: ${3 - session.data.pinAttempts}`);
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
Attempts remaining: ${3 - session.data.pinAttempts}`);
        }
        
        // Generate deposit code
        const depositCode = Math.random().toString(36).substring(2, 8).toUpperCase();
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
        let depositId: string;
        try {
          depositId = await DataService.createDepositRequest(
            user.id,
            selectedAgent.id,
            depositAmount,
            'UGX',
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
Amount: UGX ${depositAmount.toLocaleString()}
Agent: ${selectedAgent.businessName}
Location: ${selectedAgent.location.city}
Valid: 24 hours
Deposit ID: ${depositId}

Give this code and cash to the agent to complete deposit.`;

        console.log(`Sending deposit SMS to ${session.phoneNumber}`);

        try {
          await sendSMSNotification(session.phoneNumber, smsMessage);
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Continue even if SMS fails
        }
        
        return endSession(`✅ Deposit Request Created!

Code: ${depositCode}
Amount: UGX ${depositAmount.toLocaleString()}
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
      // Reset to main menu if something goes wrong
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
  }
}

async function handleBitcoin(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  if (!currentInput) {
    return continueSession(`Bitcoin (ckBTC)
Please select an option:
21. Check Balance
22. Bitcoin Rate
23. Buy Bitcoin
24. Sell Bitcoin
25. Send Bitcoin
0. Back to Main Menu`);
  }
  
  switch (currentInput) {
    case '21':
      session.currentMenu = 'btc_balance';
      session.step = 1;
      return continueSession('Check Balance\nEnter your 4-digit PIN:');
    
    case '22':
      session.currentMenu = 'btc_rate';
      session.step = 1;
      return continueSession('Bitcoin Rate\nEnter your 4-digit PIN:');
    
    case '23':
      session.currentMenu = 'btc_buy';
      session.step = 1;
      return continueSession('Buy Bitcoin\nEnter UGX amount to spend:');
    
    case '24':
      session.currentMenu = 'btc_sell';
      session.step = 1;
      return await handleBTCSell('', session);
    
    case '25':
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
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          user.id, 
          'UGX', 
          true // Use satellite for SMS/USSD operations
        );
        
        return endSession(`Your ckBTC Balance

₿${balance.balanceBTC} BTC
≈ UGX ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

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

// async function handleBTCBalance(input: string, session: USSDSession): Promise<string> {
//   const inputParts = input.split('*');
//   const sanitized_input = inputParts[inputParts.length - 1] || '';
  
//   switch (session.step) {
//     case 1: {
//       // PIN verification step
//       if (!/^\d{4}$/.test(sanitized_input)) {
//         return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
//       }
      
//       // Verify PIN
//       const pinCorrect = await verifyUserPin(session.phoneNumber, sanitized_input);
//       if (!pinCorrect) {
//         return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
//       }
      
//       // Get BTC balance and real-time rate
//       try {
//         const { BitcoinRateService } = await import('./bitcoinRateService.js');
        
//         // In a real implementation, this would get actual BTC balance from datastore
//         const btcBalance = 0.00125; // Mock BTC balance
//         const btcRateUGX = await BitcoinRateService.getBitcoinRate('ugx');
//         const ugxEquivalent = btcBalance * btcRateUGX;
        
//         return endSession(`Your Bitcoin Balance

// ₿${btcBalance.toFixed(8)} BTC
// ≈ UGX ${ugxEquivalent.toLocaleString()}

// Current Rate: 1 BTC = UGX ${btcRateUGX.toLocaleString()}

// Thank you for using AfriTokeni!`);
        
//       } catch (error) {
//         console.error('Error retrieving BTC balance:', error);
//         return endSession(`Error retrieving BTC balance.
// Please try again later.

// Thank you for using AfriTokeni!`);
//       }
//     }
    
//     default:
//       session.currentMenu = 'bitcoin';
//       session.step = 0;
//       return handleBitcoin('', session);
//   }
// }

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
        const exchangeRate = await CkBTCService.getExchangeRate('UGX');
        const lastUpdated = exchangeRate.lastUpdated.toLocaleString();
        
        return endSession(`Bitcoin Exchange Rate

1 BTC = UGX ${exchangeRate.rate.toLocaleString()}

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
      // Enter UGX amount to spend
      if (!currentInput) {
        return continueSession('Buy BTC\nEnter UGX amount to spend:');
      }
      
      const ugxAmount = parseInt(currentInput);
      if (isNaN(ugxAmount) || ugxAmount <= 0) {
        return continueSession('Invalid amount.\nEnter UGX amount to spend:');
      }
      
      if (ugxAmount < 10000) {
        return continueSession('Minimum purchase: UGX 10,000\nEnter UGX amount to spend:');
      }
      
      // Check user balance first
      const userBalance = await DataService.getUserBalance(`+${session.phoneNumber}`);
      if (!userBalance || userBalance.balance < ugxAmount) {
        const currentBalance = userBalance ? userBalance.balance : 0;
        return endSession(`Insufficient balance!
Your balance: UGX ${currentBalance.toLocaleString()}
Required: UGX ${ugxAmount.toLocaleString()}

Thank you for using AfriTokeni!`);
      }
      
      // Calculate BTC amount and fees with real rate
      const exchangeRate = await CkBTCService.getExchangeRate('UGX');
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

Spend: UGX ${ugxAmount.toLocaleString()}
Fee (2.5%): UGX ${fee.toLocaleString()}
Net: UGX ${netAmount.toLocaleString()}
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
      
      const ugxAmount = session.data.ugxAmount || 0;
      const btcAmount = session.data.btcAmount || 0;
      const fee = session.data.fee || 0;
      
      return continueSession(`Selected Agent:
${selectedAgent.businessName}
${selectedAgent.location?.city || 'Location'}, ${selectedAgent.location?.address || ''}

Purchase Details:
Amount: UGX ${ugxAmount.toLocaleString()}
Fee: UGX ${fee.toLocaleString()}
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
        const exchangeResult = await CkBTCService.exchange({
          amount: ugxAmount,
          currency: 'UGX',
          type: 'buy',
          userId: user.id,
          agentId: selectedAgent.id
        }, true); // Use satellite for SMS/USSD operations
        
        if (exchangeResult.success && exchangeResult.transactionId) {
          const btcAmount = exchangeResult.amountBTC;
          
          // Send SMS with purchase details and code
          const smsMessage = `AfriTokeni ckBTC Purchase
Code: ${purchaseCode}
Amount: UGX ${ugxAmount.toLocaleString()}
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
Amount to pay: UGX ${ugxAmount.toLocaleString()}

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
          const balance = await CkBTCService.getBalanceWithLocalCurrency(
            user.id, 
            'UGX', 
            true // Use satellite for SMS/USSD operations
          );
          
          if (balance.balanceSatoshis <= 0) {
            return endSession(`No ckBTC available to sell.

ckBTC Balance: ₿0.00000000
≈ UGX 0

Thank you for using AfriTokeni!`);
          }
          
          return continueSession(`Sell ckBTC

Your ckBTC Balance:
₿${balance.balanceBTC} BTC
≈ UGX ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

Choose amount type:
1. Enter UGX amount
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
        return continueSession('Enter UGX amount to receive (min: UGX 1,000):');
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
1. Enter UGX amount
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
        // User entered UGX amount, convert to BTC
        ugxAmount = parseFloat(currentInput);
        if (isNaN(ugxAmount) || ugxAmount <= 0) {
          return continueSession('Invalid amount.\nEnter UGX amount to receive (min: UGX 1,000):');
        }
        
        if (ugxAmount < 1000) {
          return continueSession('Minimum sale: UGX 1,000\nEnter UGX amount to receive:');
        }
        
        // Get exchange rate and calculate BTC amount (before fees)
        const exchangeRate = await CkBTCService.getExchangeRate('UGX');
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
        const exchangeRate = await CkBTCService.getExchangeRate('UGX');
        const btcRate = exchangeRate.rate;
        ugxAmount = btcAmount * btcRate;
      }
      
      // Check if user has sufficient ckBTC balance
      try {
        const user = await DataService.findUserByPhoneNumber(`+${session.phoneNumber}`);
        if (!user) {
          return endSession('User not found. Please contact support.');
        }
        
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          user.id, 
          'UGX', 
          true // Use satellite for SMS/USSD operations
        );
        
        if (balance.balanceSatoshis < (btcAmount * 100000000)) { // Convert BTC to satoshis for comparison
          return continueSession(`Insufficient ckBTC balance!

Your balance: ₿${balance.balanceBTC} BTC
≈ UGX ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

Required: ₿${btcAmount.toFixed(8)} BTC

Enter a smaller amount:`);
        }
        
      } catch (error) {
        console.error('Error checking Bitcoin balance:', error);
        return endSession('Error checking balance. Please try again later.');
      }
      
      // Calculate fees and net amounts
      const exchangeRate = await CkBTCService.getExchangeRate('UGX');
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
Gross: UGX ${ugxGross.toLocaleString()}
Fee (2.5%): UGX ${fee.toLocaleString()}
You receive: UGX ${ugxNet.toLocaleString()}

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
Fee: UGX ${fee.toLocaleString()}
You receive: UGX ${ugxNet.toLocaleString()}

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
          currency: 'UGX',
          type: 'sell'
        }, true);
        
        if (exchangeResult.success && exchangeResult.transactionId) {
          const ugxAmount = exchangeResult.localCurrencyAmount || 0;
          
          // Send SMS with sale details and code
          const smsMessage = `AfriTokeni BTC Sale
Code: ${saleCode}
BTC to sell: ₿${btcAmount.toFixed(8)}
You will receive: UGX ${ugxAmount.toLocaleString()}
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
You will receive: UGX ${ugxAmount.toLocaleString()}

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
        const balance = await CkBTCService.getBalanceWithLocalCurrency(
          user.id, 
          'UGX', 
          true // Use satellite for SMS/USSD operations
        );
        
        if (balance.balanceSatoshis <= 0) {
          return endSession(`Insufficient ckBTC balance!

Your balance: ₿${balance.balanceBTC} BTC
≈ UGX ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

You need ckBTC to send. Please buy some first.

Thank you for using AfriTokeni!`);
        }
        
        session.data.userBalance = balance;
        session.step = 2;
        
        return continueSession(`Send ckBTC

Your Balance: ₿${balance.balanceBTC} BTC
≈ UGX ${(balance.localCurrencyEquivalent || 0).toLocaleString()}

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
        const exchangeRate = await CkBTCService.getExchangeRate('UGX');
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
≈ UGX ${ugxEquivalent.toLocaleString()}
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
≈ UGX ${ugxEquivalent.toLocaleString()}
To: ${session.data.recipientPhone}
Transaction ID: ${sendResult.transactionId}
Network fee: ₿${networkFee.toFixed(8)} BTC

Your new balance will be updated shortly.`;

          const recipientSMS = `AfriTokeni BTC Received 🎉

Received: ₿${sendAmount.toFixed(8)} BTC
≈ UGX ${ugxEquivalent.toLocaleString()}
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
≈ UGX ${ugxEquivalent.toLocaleString()}
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
31. Check Balance
32. USDC Rate
33. Buy USDC
34. Sell USDC
35. Send USDC
0. Back to Main Menu`);
  }
  
  switch (currentInput) {
    case '31':
      session.currentMenu = 'usdc_balance';
      session.step = 1;
      return continueSession('Check Balance\nEnter your 4-digit PIN:');
    
    case '32':
      session.currentMenu = 'usdc_rate';
      session.step = 1;
      return continueSession('USDC Rate\nEnter your 4-digit PIN:');
    
    case '33':
      session.currentMenu = 'usdc_buy';
      session.step = 1;
      return continueSession('Buy USDC\nEnter your 4-digit PIN:');
    
    case '34':
      session.currentMenu = 'usdc_sell';
      session.step = 1;
      return continueSession('Sell USDC\nEnter your 4-digit PIN:');
    
    case '35':
      session.currentMenu = 'usdc_send';
      session.step = 1;
      return continueSession('Send USDC\nEnter your 4-digit PIN:');
    
    case '0':
      session.currentMenu = 'main';
      session.step = 0;
      return handleMainMenu('', session);
    
    default:
      return continueSession(`Invalid option. Please try again:
1. Check Balance
2. USDC Rate
3. Buy USDC
4. Sell USDC
5. Send USDC
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
≈ UGX ${balance.localCurrencyEquivalent?.toLocaleString() || '0'}

Current Rate: 1 USDC = UGX ${(await CkUSDCService.getExchangeRate('ugx')).rate.toLocaleString()}

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

1 USDC = UGX ${usdcRateUGX.rate.toLocaleString()}
1 UGX = $${(1 / usdcRateUGX.rate).toFixed(6)} USDC

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
        return continueSession('Minimum purchase: UGX 1,000\nEnter amount in UGX:');
      }
      
      // Check user balance first
      const userBalance = await DataService.getUserBalance(`+${session.phoneNumber}`);
      if (!userBalance || userBalance.balance < amountUGX) {
        const currentBalance = userBalance ? userBalance.balance : 0;
        return endSession(`Insufficient balance!
Your balance: UGX ${currentBalance.toLocaleString()}
Required: UGX ${amountUGX.toLocaleString()}

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

Spend: UGX ${amountUGX.toLocaleString()}
Fee (2.5%): UGX ${fee.toLocaleString()}
Net: UGX ${netAmount.toLocaleString()}
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
Amount: UGX ${ugxAmount.toLocaleString()}
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
Amount to pay: UGX ${ugxAmount.toLocaleString()}

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
Gross: UGX ${ugxGross.toLocaleString()}
Fee (2.5%): UGX ${fee.toLocaleString()}
You receive: UGX ${ugxNet.toLocaleString()}

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
Fee: UGX ${fee.toLocaleString()}
You receive: UGX ${ugxNet.toLocaleString()}

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
You will receive: UGX ${ugxAmount.toLocaleString()}
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
You will receive: UGX ${ugxAmount.toLocaleString()}

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
      if (!currentInput.match(/^256\d{9}$/)) {
        return continueSession('Invalid phone number format.\nEnter recipient phone (256XXXXXXXXX):');
      }

      console.log(`Searching for user by phone number: ${currentInput}`);

      // Use the findUserByPhoneNumber method to find recipient
      let recipient = await DataService.findUserByPhoneNumber(currentInput);
      
      if (!recipient) {
        // Try with + prefix
        recipient = await DataService.findUserByPhoneNumber(`+${currentInput}`);
      }
      
      if (!recipient) {
        return continueSession(`Phone number ${currentInput} is not registered with AfriTokeni.
        
Please enter a valid recipient phone number (256XXXXXXXXX):`);
      }

      // Don't allow sending money to yourself
      if (currentInput === session.phoneNumber) {
        return continueSession(`You cannot send money to yourself.

Please enter a different recipient phone number (256XXXXXXXXX):`);
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
      
      try {
        const senderPhone = `+${session.phoneNumber}`;
        const recipientPhone = session.data.recipientPhone || '';
        const amount = session.data.amount || 0;
        const fee = session.data.fee || 0;
        
        // Use the existing DataService.processSendMoney method (DataService is WebhookDataService)
        const transferResult = await DataService.processSendMoney(
          senderPhone,
          recipientPhone,
          amount,
          fee
        );

        console.log(`Transfer result:`, transferResult);

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
From: ${senderPhone}
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

      } catch (error) {
        console.error('Error processing send money transaction:', error);
        return endSession(`❌ Transaction Failed!
An error occurred while processing your transaction.

Thank you for using AfriTokeni!`);
      }
    }
    
    default:
      session.currentMenu = 'main';
      session.step = 0;
      session.data = {};
      session.step = 1;
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
        
        // Display only the first 2 agents
        const displayAgents = agents.slice(0, 2);
        session.data.availableAgents = displayAgents;
        
        let agentList = `Select an agent:
Amount: UGX ${amount.toLocaleString()}
Fee: UGX ${session.data.withdrawFee.toLocaleString()}
Total: UGX ${totalRequired.toLocaleString()}

`;
        
        displayAgents.forEach((agent, index) => {
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
        response = await handleRegistrationCheck(text, session);
        break;
      case 'user_registration':
        response = await handleUserRegistration(text, session);
        break;
      case 'verification':
        response = await handleVerification(text, session);
        break;
      case 'pin_check':
        response = await handlePinCheck(text, session);
        break;
      case 'pin_setup':
        response = await handlePinSetup(text, session);
        break;
      case 'main':
        response = await handleMainMenu(text, session);
        break;
      case 'local_currency':
        response = await handleLocalCurrency(text, session);
        break;
      case 'find_agent':
        response = await handleFindAgent(text, session);
        break;
      case 'send_money':
        response = await handleSendMoney(text, session);
        break;
      case 'check_balance':
        response = await handleCheckBalance(text, session);
        break;
      case 'transaction_history':
        response = await handleTransactionHistory(text, session);
        break;
      case 'deposit':
        response = await handleDeposit(text, session);
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
        response = await handleWithdraw(text, session);
        break;
      default:
        response = await handleRegistrationCheck('', session);
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