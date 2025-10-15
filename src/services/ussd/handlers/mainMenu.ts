/**
 * Main Menu Handler
 * Handles the main USSD menu navigation
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { getSessionCurrency } from '../utils/currency.js';

/**
 * Handle main menu - top-level USSD menu
 */
export async function handleMainMenu(
  input: string, 
  session: USSDSession,
  handleLocalCurrency: any,
  handleBitcoin: any,
  handleUSDC: any
): Promise<string> {
  const currency = getSessionCurrency(session);
  if (!input) {
    return continueSession(`Welcome to AfriTokeni USSD Service
Please select an option:
1. Local Currency (${currency})
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
    
    case '4': {
      const currency = getSessionCurrency(session);
      return endSession(`AfriTokeni Help

Local Currency: Send, deposit, withdraw ${currency}
Bitcoin: Buy, sell, send ckBTC
USDC: Buy, sell, send USDC stablecoin

For support: Call +256-XXX-XXXX
Visit: afritokeni.com

Thank you for using AfriTokeni!`);
    }
    
    default: {
      const currency = getSessionCurrency(session);
      return continueSession(`Invalid option. Please try again:
1. Local Currency (${currency})
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`);
    }
  }
}
