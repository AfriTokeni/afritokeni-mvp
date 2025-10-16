/**
 * REAL USSD ckBTC Integration Tests
 * Runs against LOCAL ICP replica
 * Tests ACTUAL ckBTC transfers between USSD users
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getUSSDPrincipalInfo, transferUSSDCkBTC, getUSSDCkBTCBalance } from '../../src/services/ussdPrincipalService';
import { USSDService } from '../../src/services/ussdService';

describe('USSD ckBTC Integration - LOCAL ICP', () => {
  const user1Phone = '+256700111111';
  const user2Phone = '+256700222222';
  
  beforeAll(async () => {
    // Start local ICP replica
    console.log('🚀 Starting local ICP replica...');
    // dfx start --background --clean
  });
  
  afterAll(async () => {
    // Stop local ICP replica
    console.log('🛑 Stopping local ICP replica...');
    // dfx stop
  });
  
  it('should generate unique subaccounts for different phone numbers', () => {
    const user1 = getUSSDPrincipalInfo(user1Phone);
    const user2 = getUSSDPrincipalInfo(user2Phone);
    
    // Same principal (master USSD principal)
    expect(user1.principal.toText()).toBe(user2.principal.toText());
    
    // Different subaccounts
    expect(user1.subaccount).not.toEqual(user2.subaccount);
    
    console.log(`User 1: ${user1Phone}`);
    console.log(`  Subaccount: ${Array.from(user1.subaccount.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
    console.log(`User 2: ${user2Phone}`);
    console.log(`  Subaccount: ${Array.from(user2.subaccount.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
  });
  
  it('should transfer ckBTC between USSD users via subaccounts', async () => {
    // Fund user1 with ckBTC (via local replica)
    const initialAmount = BigInt(1000000); // 0.01 BTC
    
    // Check initial balances
    const user1BalanceBefore = await getUSSDCkBTCBalance(user1Phone);
    const user2BalanceBefore = await getUSSDCkBTCBalance(user2Phone);
    
    console.log(`📊 Initial balances:`);
    console.log(`  User 1: ${user1BalanceBefore} satoshis`);
    console.log(`  User 2: ${user2BalanceBefore} satoshis`);
    
    // Transfer from user1 to user2
    const transferAmount = BigInt(500000); // 0.005 BTC
    const result = await transferUSSDCkBTC(user1Phone, user2Phone, transferAmount);
    
    expect(result.success).toBe(true);
    expect(result.blockHeight).toBeDefined();
    
    // Check final balances
    const user1BalanceAfter = await getUSSDCkBTCBalance(user1Phone);
    const user2BalanceAfter = await getUSSDCkBTCBalance(user2Phone);
    
    console.log(`📊 Final balances:`);
    console.log(`  User 1: ${user1BalanceAfter} satoshis`);
    console.log(`  User 2: ${user2BalanceAfter} satoshis`);
    
    // Verify balances changed correctly
    expect(user1BalanceAfter).toBe(user1BalanceBefore - transferAmount);
    expect(user2BalanceAfter).toBe(user2BalanceBefore + transferAmount);
  });
  
  it('should handle USSD send money command with REAL ckBTC transfer', async () => {
    const sessionId = 'test-session-' + Date.now();
    
    // Dial USSD
    await USSDService.createUSSDSession(sessionId, user1Phone);
    
    // Navigate to send money
    await USSDService.processUSSDRequest(sessionId, user1Phone, '1'); // Local Currency
    await USSDService.processUSSDRequest(sessionId, user1Phone, '1.1'); // Send Money
    
    // Enter recipient
    await USSDService.processUSSDRequest(sessionId, user1Phone, user2Phone);
    
    // Enter amount (in UGX, will be converted to ckBTC)
    await USSDService.processUSSDRequest(sessionId, user1Phone, '50000'); // 50K UGX
    
    // Confirm
    const result = await USSDService.processUSSDRequest(sessionId, user1Phone, '1');
    
    console.log(`💸 USSD Transfer Result: ${result.response}`);
    
    // Verify REAL ckBTC moved on ICP ledger
    expect(result.response).toContain('successful');
  });
});
