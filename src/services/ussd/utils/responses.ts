/**
 * USSD Response Helpers
 * Functions to format USSD responses
 */

/**
 * Continue the USSD session with a message
 */
export function continueSession(message: string): string {
  return `CON ${message}`;
}

/**
 * End the USSD session with a final message
 */
export function endSession(message: string): string {
  return `END ${message}`;
}
