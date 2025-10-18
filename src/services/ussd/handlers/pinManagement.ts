/**
 * PIN Management Handlers
 * Handles PIN setup, verification, and security
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { getSessionCurrency } from '../utils/currency.js';
import { WebhookDataService as DataService } from '../../webHookServices.js';
import { TranslationService, type Language } from '../../translations.js';

/**
 * Check if user has a PIN set
 */
export async function hasUserPin(phoneNumber: string): Promise<boolean> {
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

/**
 * Set user PIN
 */
export async function setUserPin(phoneNumber: string, pin: string): Promise<boolean> {
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

/**
 * Verify user PIN
 */
export async function verifyUserPin(phoneNumber: string, pin: string): Promise<boolean> {
  console.log(`Verifying PIN for ${phoneNumber} ${pin}`);
  try {
    const userPin = await DataService.getUserPin(`+${phoneNumber}`);
    return userPin !== null && userPin.pin === pin;
  } catch (error) {
    console.error('Error verifying user PIN:', error);
    return false;
  }
}

/**
 * Check if PIN verification is required for sensitive operations
 */
export function requiresPinVerification(session: USSDSession): boolean {
  // If PIN has already been verified in this session, no need to verify again
  return !session.data.pinVerified;
}

/**
 * Initiate PIN verification for sensitive operations
 */
export function requestPinVerification(session: USSDSession, operation: string, nextMenu: string): string {
  const lang = session.language || 'en';
  session.currentMenu = 'pin_check';
  session.step = 1;
  session.data.pendingOperation = operation;
  session.data.nextMenu = nextMenu;
  session.data.pinAttempts = 0;
  return continueSession(`${operation}\nFor security, please enter your 4-digit PIN:\n\n${TranslationService.translate('back_or_menu', lang)}`);
}

/**
 * Handle PIN check - verify existing PIN
 */
export async function handlePinCheck(input: string, session: USSDSession, handleCheckBalance: any, handleTransactionHistory: any): Promise<string> {
  const lang = session.language || 'en';
  console.log(`🔑 PIN check for ${session.phoneNumber}, step: ${session.step}, raw input: "${input}"`);
  
  // Extract the last part of USSD input (the actual PIN entered)
  const inputParts = input.split('*');
  const pinInput = inputParts[inputParts.length - 1] || '';
  console.log(`🔑 PIN input after USSD parsing: "${pinInput}"`);
  
  switch (session.step) {
    case 1: {
      // User is entering their PIN
      if (!pinInput) {
        return continueSession(`Welcome to AfriTokeni!\nPlease enter your 4-digit PIN:\n\n${TranslationService.translate('back_or_menu', lang)}`);
      }
      
      if (!/^\d{4}$/.test(pinInput)) {
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        console.log(`❌ Invalid PIN format for ${session.phoneNumber}, PIN: "${pinInput}", attempts: ${session.data.pinAttempts}`);
        
        if (session.data.pinAttempts >= 3) {
          console.log(`🚫 Max PIN attempts reached for ${session.phoneNumber}`);
          return endSession('Too many failed attempts. Please try again later.');
        }
        
        return continueSession(`${TranslationService.translate('invalid_pin_format', lang)}. ${TranslationService.translate('enter_pin_4digit', lang)}:`);
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
          session.currentMenu = nextMenu as any;
          session.step = 1;
          
          if (nextMenu === 'check_balance') {
            return await handleCheckBalance('', session);
          } else if (nextMenu === 'transaction_history') {
            return await handleTransactionHistory('', session);
          }
        }
        
        // No pending operation - go to main menu
        const currency = getSessionCurrency(session);
        session.currentMenu = 'main';
        session.step = 0;
        return continueSession(`Welcome back to AfriTokeni USSD Service
Please select an option:
1. Local Currency (${currency})
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
        return continueSession(`${TranslationService.translate('incorrect_pin', lang)}. ${remainingAttempts} ${remainingAttempts > 1 ? 'attempts' : 'attempt'} remaining.\n${TranslationService.translate('enter_pin_4digit', lang)}:`);
      }
    }
    
    default:
      // Initialize PIN check
      console.log(`🔑 Initializing PIN check for ${session.phoneNumber}`);
      session.step = 1;
      session.data.pinAttempts = 0;
      return continueSession(`Welcome to AfriTokeni!\nPlease enter your 4-digit PIN:\n\n${TranslationService.translate('back_or_menu', lang)}`);
  }
}

/**
 * Handle PIN setup - for new users or PIN reset
 */
export async function handlePinSetup(input: string, session: USSDSession, lang: string = 'en'): Promise<string> {
  const inputParts = input.split('*');
  const pinInput = inputParts[inputParts.length - 1] || '';
  console.log(`🔧 PIN setup for ${session.phoneNumber}, step: ${session.step}, input: "${pinInput}"`);
  
  switch (session.step) {
    case 1:
      // First PIN entry
      if (!/^\d{4}$/.test(pinInput)) {
        console.log(`❌ Invalid PIN format during setup for ${session.phoneNumber}: "${pinInput}"`);
        return continueSession(`Invalid PIN format.\nPlease enter exactly 4 digits:`);
      }
      session.data.newPin = pinInput;
      session.step = 2;
      console.log(`✅ First PIN entry accepted for ${session.phoneNumber}`);
      return continueSession(`Please confirm your PIN by entering it again:\n\n${TranslationService.translate('back_or_menu', lang as Language)}`);
    
    case 2:
      // PIN confirmation
      { 
        console.log(`🔄 Confirming PIN for ${session.phoneNumber}: "${pinInput}" vs "${session.data.newPin}"`);

        if (pinInput !== session.data.newPin) {
          // Reset PIN setup
          session.step = 1;
          session.data = {};
          console.log(`❌ PIN mismatch for ${session.phoneNumber}`);
          return continueSession(`PINs do not match.\nPlease enter your new 4-digit PIN again:\n\n${TranslationService.translate('back_or_menu', lang as Language)}`);
        }

        console.log(`🔑 New PIN confirmed for ${session.phoneNumber}`);

        // Save PIN and proceed to main menu
        const pinSaved = await setUserPin(session.phoneNumber, pinInput);
        if (pinSaved) {
          const currency = getSessionCurrency(session);
          session.currentMenu = 'main';
          session.step = 0;
          session.data = { preferredCurrency: currency };
          console.log(`✅ PIN setup completed successfully for ${session.phoneNumber}`);
          
          return continueSession(`PIN set successfully!

Welcome to AfriTokeni USSD Service
Please select an option:
1. Local Currency (${currency})
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
        } else {
          // PIN save failed, retry
          session.step = 1;
          session.data = {};
          console.log(`❌ Failed to save PIN for ${session.phoneNumber}`);
          return continueSession(`Error saving PIN. Please try again.\nEnter your new 4-digit PIN:\n\n${TranslationService.translate('back_or_menu', lang as Language)}`);
        }
      }  
    
    default:
      session.currentMenu = 'pin_check' as const;
      session.step = 0;
      return handlePinCheck('', session, null, null);
  }
}
