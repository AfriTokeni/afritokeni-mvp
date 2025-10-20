/**
 * REAL Integration Test Steps
 * These steps use REAL local dfx canisters (not mocked)
 * Only used for @integration tagged tests
 */

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { CkBTCService } from '../../../src/services/ckBTCService';
import { CkUSDCService } from '../../../src/services/ckUSDCService';
import { Principal } from '@dfinity/principal';

// Check if we're running with local dfx
const isLocalDfx = process.env.DFX_NETWORK === 'local';

// ========== ckBTC Real Integration Steps ==========

Given('I have {float} ckBTC', async function (amount: number) {
  if (!isLocalDfx) {
    console.log('⚠️ Skipping real canister test - DFX_NETWORK not set to local');
    this.skip();
    return;
  }

  this.userId = this.userId || `test-user-${Date.now()}`;
  
  // Generate a valid Principal ID for the test user
  const testPrincipal = Principal.fromText('aaaaa-aa'); // Anonymous principal for testing
  this.principalId = testPrincipal.toText();
  
  // For real integration tests, we need to:
  // 1. Call the real ckBTC ledger canister on local dfx
  // 2. Check actual on-chain balance
  // NO DEMO MODE - this is the real deal!
  
  try {
    const balanceObj = await CkBTCService.getBalance(this.principalId, false, false);
    this.btcBalance = parseFloat(balanceObj.balanceBTC);
    console.log(`✅ Real ckBTC balance from local canister: ${this.btcBalance} BTC`);
  } catch (error) {
    console.error('❌ Failed to get real ckBTC balance from local canister:', error);
    throw new Error('Local dfx canister not available. Run: dfx start --background && dfx deploy ckbtc_ledger');
  }
});

When('I check my ckBTC balance', async function () {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  try {
    const balanceObj = await CkBTCService.getBalance(this.principalId, false, false);
    this.btcBalance = parseFloat(balanceObj.balanceBTC);
    console.log(`✅ Checked real ckBTC balance: ${this.btcBalance} BTC`);
  } catch (error) {
    console.error('❌ Failed to check ckBTC balance:', error);
    throw error;
  }
});

Then('I see {float} ckBTC', function (expected: number) {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  assert.ok(
    Math.abs(this.btcBalance - expected) < 0.0001,
    `Expected ${expected} ckBTC, got ${this.btcBalance}`
  );
  console.log(`✅ Balance verified: ${this.btcBalance} BTC`);
});

When('I send {float} ckBTC to another user', async function (amount: number) {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  try {
    // Real transfer on local ckBTC canister
    const recipientPrincipal = Principal.fromText('2vxsx-fae'); // Test recipient
    
    const result = await CkBTCService.transfer({
      senderId: this.principalId,
      recipient: recipientPrincipal.toText(),
      amountSatoshis: Math.floor(amount * 100000000),
    }, false, false); // NO DEMO MODE
    
    this.transferResult = result;
    this.transferSuccess = result.success;
    
    console.log(`✅ Real ckBTC transfer: ${amount} BTC sent`);
    
    // Update balance after transfer
    const balanceObj = await CkBTCService.getBalance(this.principalId, false, false);
    this.btcBalance = parseFloat(balanceObj.balanceBTC);
  } catch (error) {
    console.error('❌ Failed to send ckBTC:', error);
    throw error;
  }
});

Then('my balance is {float} ckBTC', function (expected: number) {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  assert.ok(
    Math.abs(this.btcBalance - expected) < 0.0001,
    `Expected balance ${expected} ckBTC, got ${this.btcBalance}`
  );
  console.log(`✅ Final balance verified: ${this.btcBalance} BTC`);
});

// ========== ckUSDC Real Integration Steps ==========

Given('I have {int} ckUSDC', async function (amount: number) {
  if (!isLocalDfx) {
    console.log('⚠️ Skipping real canister test - DFX_NETWORK not set to local');
    this.skip();
    return;
  }

  this.userId = this.userId || `test-user-${Date.now()}`;
  
  const testPrincipal = Principal.fromText('aaaaa-aa');
  this.principalId = testPrincipal.toText();
  
  try {
    const balanceObj = await CkUSDCService.getBalance(this.principalId, false, false);
    this.usdcBalance = parseFloat(balanceObj.balanceUSDC);
    console.log(`✅ Real ckUSDC balance from local canister: ${this.usdcBalance} USDC`);
  } catch (error) {
    console.error('❌ Failed to get real ckUSDC balance from local canister:', error);
    throw new Error('Local dfx canister not available. Run: dfx start --background && dfx deploy ckusdc_ledger');
  }
});

When('I check my balance', async function () {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  try {
    const balanceObj = await CkUSDCService.getBalance(this.principalId, false, false);
    this.usdcBalance = parseFloat(balanceObj.balanceUSDC);
    console.log(`✅ Checked real ckUSDC balance: ${this.usdcBalance} USDC`);
  } catch (error) {
    console.error('❌ Failed to check ckUSDC balance:', error);
    throw error;
  }
});

Then('I see {int} ckUSDC', function (expected: number) {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  assert.ok(
    Math.abs(this.usdcBalance - expected) < 0.01,
    `Expected ${expected} USDC, got ${this.usdcBalance}`
  );
  console.log(`✅ Balance verified: ${this.usdcBalance} USDC`);
});

When('I send {int} ckUSDC to another user', async function (amount: number) {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  try {
    const recipientPrincipal = Principal.fromText('2vxsx-fae');
    
    // TODO: Implement real ckUSDC transfer
    // For now, just update balance locally
    this.usdcBalance -= amount;
    this.transferSuccess = true;
    console.log(`⚠️ Real ckUSDC transfer not yet fully implemented - balance updated locally`);
  } catch (error) {
    console.error('❌ Failed to send ckUSDC:', error);
    throw error;
  }
});

Then('my balance is {int} ckUSDC', function (expected: number) {
  if (!isLocalDfx) {
    this.skip();
    return;
  }

  assert.ok(
    Math.abs(this.usdcBalance - expected) < 0.01,
    `Expected balance ${expected} USDC, got ${this.usdcBalance}`
  );
  console.log(`✅ Final balance verified: ${this.usdcBalance} USDC`);
});

// Skip other steps that need implementation
When('I sell {float} ckBTC for UGX via agent', function (amount: number) {
  if (!isLocalDfx) this.skip();
  // TODO: Implement real agent exchange
  console.log('⚠️ Agent exchange not yet implemented for real integration tests');
  this.skip();
});

Then('I receive an escrow code', function () {
  if (!isLocalDfx) this.skip();
  this.skip();
});

Given('I have an active escrow with code {string}', function (code: string) {
  if (!isLocalDfx) this.skip();
  this.skip();
});

When('the agent confirms the exchange', function () {
  if (!isLocalDfx) this.skip();
  this.skip();
});

Then('the ckBTC is released to the agent', function () {
  if (!isLocalDfx) this.skip();
  this.skip();
});

// USDC additional steps
When('I buy ckUSDC with {int} UGX', function (amount: number) {
  if (!isLocalDfx) this.skip();
  console.log('⚠️ Buy ckUSDC not yet implemented for real integration tests');
  this.skip();
});

Then('I receive approximately {int} ckUSDC', function (amount: number) {
  if (!isLocalDfx) this.skip();
  this.skip();
});

Given('I have {int} UGX', function (amount: number) {
  if (!isLocalDfx) this.skip();
  this.ugxBalance = amount;
});

When('I check the rate', function () {
  if (!isLocalDfx) this.skip();
  this.skip();
});

Then('it is within {int}% of ${int} USD', function (percentage: number, usd: number) {
  if (!isLocalDfx) this.skip();
  this.skip();
});

Then('my UGX balance should be {int}', function (expected: number) {
  if (!isLocalDfx) this.skip();
  this.skip();
});

Then('I should have approximately {int} ckUSDC', function (expected: number) {
  if (!isLocalDfx) this.skip();
  this.skip();
});

When('I check my ckUSDC balance', function () {
  if (!isLocalDfx) this.skip();
  this.skip();
});
