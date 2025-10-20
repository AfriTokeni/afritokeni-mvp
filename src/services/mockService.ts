/**
 * Centralized Mock Service
 * Single source of truth for mock data in unit tests and playground
 */

/**
 * Check if we should use mocks
 */
export function shouldUseMocks(): boolean {
  // Unit test mode
  if (process.env.NODE_ENV === 'unit-test') {
    return true;
  }
  
  // Playground mode (browser only)
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return true;
  }
  
  return false;
}

/**
 * Mock ckBTC balance
 */
export const MOCK_CKBTC_BALANCE = {
  balanceSatoshis: 50000,
  balanceBTC: '0.0005',
  localCurrencyEquivalent: 193208,
  lastUpdated: new Date()
};

/**
 * Mock ckUSDC balance
 */
export const MOCK_CKUSDC_BALANCE = {
  balanceUSDC: '100.00',
  balanceCents: 10000,
  localCurrencyEquivalent: 380000,
  lastUpdated: new Date()
};

/**
 * Mock BTC exchange rate (1 BTC = 386M UGX)
 */
export const MOCK_BTC_RATE = {
  rate: 386416858,
  lastUpdated: new Date(),
  source: 'Mock',
  currency: 'UGX'
};

/**
 * Mock USDC exchange rate (1 USDC = 3800 UGX)
 */
export const MOCK_USDC_RATE = {
  rate: 3800,
  lastUpdated: new Date(),
  source: 'Mock',
  currency: 'UGX'
};

/**
 * Mock user balance (1M UGX)
 */
export const MOCK_USER_BALANCE = {
  userId: 'mock-user',
  balance: 1000000,
  currency: 'UGX' as const,
  lastUpdated: new Date()
};
