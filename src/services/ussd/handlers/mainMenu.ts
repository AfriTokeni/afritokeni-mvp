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
  handleUSDC: any,
  handleDAO?: any
): Promise<string> {
  const currency = getSessionCurrency(session);
  if (!input) {
    return continueSession(`Welcome to AfriTokeni USSD Service
Please select an option:
1. Local Currency (${currency})
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. DAO Governance
5. Help`);
  }

  console.log(`Main menu input: ${input}`);
  // Extract the FIRST part of the input for main menu selection
  const inputParts = input.split("*");
  const sanitized_input = inputParts[0] || '';
  console.log(`Main menu sanitized input: "${sanitized_input}" (from ${inputParts.length} parts)`);

  switch (sanitized_input) {
    case '1':
      session.currentMenu = 'local_currency';
      session.step = 0;
      return handleLocalCurrency(input, session);
    
    case '2':
      session.currentMenu = 'bitcoin';
      session.step = 0;
      return handleBitcoin(input, session);
    
    case '3':
      session.currentMenu = 'usdc';
      session.step = 0;
      return handleUSDC(input, session);
    
    case '4':
      if (handleDAO) {
        session.currentMenu = 'dao';
        session.step = 0;
        return handleDAO(input, session);
      }
      return continueSession(`DAO Governance coming soon!`);
    
    case '5': {
      const currency = getSessionCurrency(session);
      return endSession(`AfriTokeni Help

Local Currency: Send, deposit, withdraw ${currency}
Bitcoin: Buy, sell, send ckBTC
USDC: Buy, sell, send USDC stablecoin
DAO: Vote on governance proposals

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
4. DAO Governance
5. Help`);
    }
  }
}
