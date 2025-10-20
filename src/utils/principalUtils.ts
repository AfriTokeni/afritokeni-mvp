/**
 * Principal ID Utilities
 * Centralized functions for generating and managing ICP Principal IDs
 */

import { Principal } from '@dfinity/principal';

/**
 * Generate a deterministic Principal ID from a phone number
 * Used for USSD users and phone-based ckBTC transfers
 * 
 * @param phoneNumber - Phone number (with or without +, spaces, etc.)
 * @returns Principal ID as string
 */
export function generatePrincipalFromPhone(phoneNumber: string): string {
  // Remove all non-digit characters
  const phoneDigits = phoneNumber.replace(/\D/g, '');
  
  // Generate Principal ID using self-authenticating method
  const hash = new TextEncoder().encode(phoneDigits);
  const principalId = Principal.selfAuthenticating(hash).toText();
  
  return principalId;
}

/**
 * Generate a deterministic Principal ID from any user identifier
 * Used for web users with email/username
 * 
 * @param identifier - Email, username, or any string identifier
 * @returns Principal ID as string
 */
export function generatePrincipalFromIdentifier(identifier: string): string {
  const hash = new TextEncoder().encode(identifier);
  const principalId = Principal.selfAuthenticating(hash).toText();
  
  return principalId;
}

/**
 * Check if a string looks like a phone number
 * 
 * @param input - String to check
 * @returns true if it looks like a phone number
 */
export function isPhoneNumber(input: string): boolean {
  return /^[\+\d\s\-\(\)]+$/.test(input);
}

/**
 * Check if a string is a valid Principal ID
 * 
 * @param input - String to check
 * @returns true if it's a valid Principal ID
 */
export function isValidPrincipal(input: string): boolean {
  try {
    Principal.fromText(input);
    return true;
  } catch {
    return false;
  }
}
