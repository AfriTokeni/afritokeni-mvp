/**
 * USSD Handlers Index
 * Central export point for all USSD handlers
 */

export * from './registration.js';
export * from './pinManagement.js';
export * from './mainMenu.js';
export * from './localCurrency.js';
export * from './agents.js';
export * from './deposit.js';
export * from './withdraw.js';
export * from './sendMoney.js';
export * from './bitcoin.js';
export * from './usdc.js';

// Export init functions
export { initBitcoinHandlers } from './bitcoin.js';
export { initUSDCHandlers } from './usdc.js';

// Note: USDC handlers should be REMOVED per business logic
// AfriTokeni is Bitcoin ↔ African currencies ONLY, no stablecoins
