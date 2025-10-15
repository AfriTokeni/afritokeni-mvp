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

// Note: Bitcoin and USDC handlers are still in server.ts
// They need to be extracted following the same pattern
// Bitcoin handler: ~1000 lines (lines 1473-2450 in server.ts)
// USDC handler: ~850 lines (lines 2452-3278 in server.ts) - Consider removing per business logic
