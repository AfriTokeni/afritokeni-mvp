/**
 * Registration Handlers
 * Handles user registration and verification flows
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { detectCurrencyFromPhone, getUserCurrency } from '../utils/currency.js';
import { WebhookDataService as DataService } from '../../webHookServices.js';
import { TranslationService } from '../../translations.js';

// In-memory storage for verification codes
const verificationCodes = new Map<string, { code: string; userId: string; timestamp: number }>();

/**
 * Check if user is registered in Juno datastore
 */
export async function isUserRegistered(phoneNumber: string): Promise<boolean> {
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

/**
 * Register new user in Juno datastore
 */
export async function registerNewUser(phoneNumber: string, firstName: string, lastName: string): Promise<boolean> {
  try {
    console.log(`Registering new user: ${firstName} ${lastName} with phone ${phoneNumber}`);
    
    // Detect currency from phone number
    const preferredCurrency = detectCurrencyFromPhone(phoneNumber);
    console.log(`Detected currency for ${phoneNumber}: ${preferredCurrency}`);
    
    await DataService.createUser({
      firstName: firstName,
      lastName: lastName,
      email: `+${phoneNumber}`, // Store phone as email for SMS users
      userType: 'user',
      kycStatus: 'not_started',
      authMethod: 'sms',
      preferredCurrency: preferredCurrency
    });
    console.log(`Successfully registered user: ${phoneNumber} with currency ${preferredCurrency}`);
    return true;
  } catch (error) {
    console.error(`Error registering user ${phoneNumber}:`, error);
    return false;
  }
}

/**
 * Generate and store verification code
 */
export function generateVerificationCode(phoneNumber: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  verificationCodes.set(phoneNumber, {
    code: code,
    userId: phoneNumber,
    timestamp: Date.now()
  });
  return code;
}

/**
 * Verify the verification code
 */
export function verifyVerificationCode(phoneNumber: string, inputCode: string): boolean {
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

/**
 * Handle registration check - first step when user dials USSD
 */
export async function handleRegistrationCheck(input: string, session: USSDSession, sendSMS: (phone: string, msg: string) => Promise<any>, hasUserPin: (phone: string) => Promise<boolean>): Promise<string> {
  const lang = session.language || 'en';
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
      return continueSession(`Welcome to AfriTokeni!\nYou are not registered yet.\nPlease enter your full name (first and last name):\n\n${TranslationService.translate('back_or_menu', lang)}`);
    } else {
      // User is registered - check if they have a PIN
      const hasPIN = await hasUserPin(session.phoneNumber);
      console.log(`🔑 User ${session.phoneNumber} PIN status: ${hasPIN ? 'Has PIN' : 'No PIN'}`);
      
      if (!hasPIN) {
        // User registered but no PIN - go to PIN setup
        session.currentMenu = 'pin_setup';
        session.step = 1;
        console.log(`➡️ Redirecting ${session.phoneNumber} to PIN setup`);
        return continueSession(`Welcome back to AfriTokeni!\nTo secure your account, please set up a 4-digit PIN:\nEnter your new PIN:\n\n${TranslationService.translate('back_or_menu', lang)}`);
      } else {
        // User registered and has PIN - load currency and go to main menu
        const currency = await getUserCurrency(session.phoneNumber);
        session.currentMenu = 'main';
        session.step = 0;
        session.data = { 
          pinVerified: false, // Track that PIN hasn't been verified yet for sensitive operations
          preferredCurrency: currency // Store user's currency in session
        };
        console.log(`➡️ User ${session.phoneNumber} has PIN, currency: ${currency}, going directly to main menu`);
        return continueSession(`Welcome back to AfriTokeni USSD Service!
Please select an option:
1. Local Currency (${currency})
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
      }
    }
  }
  
  // This shouldn't be reached, but just in case
  return continueSession(`Welcome to AfriTokeni!\nPlease wait...\n\n${TranslationService.translate('back_or_menu', lang)}`);
}

/**
 * Handle user registration - for new users
 */
export async function handleUserRegistration(input: string, session: USSDSession, sendSMS: (phone: string, msg: string) => Promise<any>): Promise<string> {
  const sanitized_input = input.split("*")[input.split("*").length - 1];
  console.log(`📝 User registration for ${session.phoneNumber}, step: ${session.step}, input: "${sanitized_input}"`);
  
  switch (session.step) {
    case 1: {
      // Getting full name
      if (!sanitized_input || sanitized_input.trim().length < 3) {
        console.log(`❌ Invalid name "${sanitized_input}" provided by ${session.phoneNumber}`);
        return continueSession(`Invalid name. Please enter your full name (first and last name):\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      const fullNameParts = sanitized_input.trim().split(/\s+/);
      if (fullNameParts.length < 2) {
        console.log(`❌ Incomplete name "${sanitized_input}" provided by ${session.phoneNumber}`);
        return continueSession(`Please enter both first and last name separated by space:\n\n${TranslationService.translate('back_or_menu', lang)}`);
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
        await sendSMS(`+${session.phoneNumber}`, 
          `AfriTokeni Verification: Your code is ${verificationCode}. Enter this code to complete registration.`);
        
        session.currentMenu = 'verification';
        session.step = 1;
        console.log(`📱 SMS sent successfully to ${session.phoneNumber}, moving to verification menu`);
        return continueSession(`Thank you ${firstName} ${lastName}!\nWe've sent a verification code to your phone.\nPlease enter the 6-digit code:\n\n${TranslationService.translate('back_or_menu', lang)}`);
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

/**
 * Handle verification - for verifying SMS code
 */
export async function handleVerification(input: string, session: USSDSession): Promise<string> {
  const lang = session.language || 'en';
  const translationService = new TranslationService();
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
        return continueSession(`Invalid code format. Please enter the 6-digit verification code:\n\n${TranslationService.translate('back_or_menu', lang)}`);
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
        return continueSession(`Invalid verification code. Please try again:\n\n${TranslationService.translate('back_or_menu', lang)}`);
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
      return continueSession(`Verification successful!\nAccount created successfully.\nNow please set up a 4-digit PIN to secure your account:\nEnter your new PIN:\n\n${TranslationService.translate('back_or_menu', lang)}`);
    }
      
    default:
      console.log(`❌ Invalid verification step ${session.step} for ${session.phoneNumber}`);
      return endSession('Verification process error. Please try again.');
  }
}
