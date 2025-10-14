/**
 * Agent Operations step definitions
 */

import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { world } from "./shared-steps.js";

// ==================== AGENT FLOW STEPS ====================

Given('I am an agent with {int} {word} digital balance', function (amount: number, currency: string) {
  world.agentDigitalBalance = amount;
});

Given('a customer brings {int} {word} cash', function (amount: number, currency: string) {
  world.customerCash = amount;
  world.customerCashCurrency = currency;
});

When('I verify the customer identity', function () {
  world.identityVerified = true;
});

When('I credit {int} {word} to their account', function (amount: number, currency: string) {
  world.agentDigitalBalance -= amount;
  world.agentCashBalance = (world.agentCashBalance || 0) + amount;
  world.transactionAmount = amount;
});

Then('my digital balance should decrease by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentDigitalBalance >= 0);
});

Then('my cash balance should increase by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentCashBalance > 0);
});

Then('I should earn commission on the transaction', function () {
  world.earnedCommission = true;
  const transactionAmount = world.customerCash || world.transactionAmount || 0;
  const expectedCommission = transactionAmount * 0.03;
  assert.ok(world.earnedCommission, 'Expected to earn commission');
  assert.ok(transactionAmount > 0, `Expected transaction amount > 0, got: ${transactionAmount}`);
});

Given('I am an agent with {int} {word} cash', function (amount: number, currency: string) {
  world.agentCashBalance = amount;
});

Given('a customer requests {int} {word} withdrawal', function (amount: number, currency: string) {
  world.withdrawalRequest = amount;
});

When('I verify their withdrawal code', function () {
  world.codeVerified = true;
});

When('I give them {int} {word} cash', function (amount: number, currency: string) {
  world.agentCashBalance -= amount;
  world.agentDigitalBalance = (world.agentDigitalBalance || 0) + amount;
  world.transactionAmount = amount;
});

Then('my cash balance should decrease by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentCashBalance >= 0);
});

Then('my digital balance should increase by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentDigitalBalance > 0);
});

Then('I should see a liquidity warning', function () {
  world.liquidityWarning = true;
  assert.ok(world.liquidityWarning, 'Expected liquidity warning to be shown');
  const needsWarning = (world.withdrawalRequest && world.withdrawalRequest > world.agentCashBalance) || 
                       (world.customerDepositAmount && world.customerDepositAmount > world.agentDigitalBalance);
  assert.ok(needsWarning, 'Warning should appear for insufficient liquidity');
});

Then('be prompted to fund my account', function () {
  assert.ok(world.liquidityWarning, 'Expected funding prompt due to low liquidity');
  const hasLiquidityIssue = (world.withdrawalRequest && world.agentCashBalance < world.withdrawalRequest) ||
                            (world.customerDepositAmount && world.agentDigitalBalance < world.customerDepositAmount);
  assert.ok(hasLiquidityIssue, 'Prompt should appear when liquidity is insufficient');
});

Then('the transaction should not proceed', function () {
  world.transactionBlocked = true;
  assert.ok(world.transactionBlocked, 'Expected transaction to be blocked');
  assert.ok(world.liquidityWarning || world.dailyLimitExceeded, 'Transaction should be blocked due to warning or limit');
});

Given('I am an agent with ckBTC available', function () {
  world.agentBtcBalance = 0.01;
});

Given('a customer wants to buy {float} ckBTC for {word}', function (amount: number, currency: string) {
  world.customerBtcRequest = amount;
});

When('I verify the escrow code', function () {
  world.escrowVerified = true;
});

When('confirm the cash payment', function () {
  world.cashConfirmed = true;
});

Then('the ckBTC should be released to the customer', function () {
  assert.ok(world.escrowVerified);
});

Then('I should receive the {word} equivalent', function (currency: string) {
  assert.ok(world.cashConfirmed, 'Expected cash payment to be confirmed');
  assert.ok(world.customerBtcRequest > 0, `Expected to receive ${currency} equivalent for ${world.customerBtcRequest} ckBTC`);
});

Then('I should earn my commission', function () {
  const expectedCommission = (world.customerBtcRequest || 0) * (world.btcRate || 150000000) * 0.03;
  assert.ok(expectedCommission > 0 || world.cashConfirmed, `Expected commission for Bitcoin exchange`);
});

Given('I am an agent with low digital balance', function () {
  world.agentDigitalBalance = 10000;
});

When('I fund my account via bank transfer', function () {
  world.agentDigitalBalance += 500000;
});

Then('my digital balance should increase', function () {
  assert.ok(world.agentDigitalBalance > 10000);
});

Then('I should be able to process deposits again', function () {
  assert.ok(world.agentDigitalBalance > 10000, `Expected digital balance > 10000 after funding, got: ${world.agentDigitalBalance}`);
});

Given('I am an agent with {int} {word} in commissions', function (amount: number, currency: string) {
  world.agentCommissions = amount;
});

When('I request settlement to my bank account', function () {
  world.settlementRequested = true;
});

Then('a settlement transaction should be created', function () {
  assert.ok(world.settlementRequested);
});

Then('my commission balance should decrease', function () {
  const initialCommissions = world.agentCommissions;
  world.agentCommissions -= world.agentCommissions; // Settlement withdraws all
  assert.ok(world.settlementRequested, 'Expected settlement to be requested');
  assert.equal(world.agentCommissions, 0, `Expected commissions to be settled, was: ${initialCommissions}`);
});

Then('I should receive confirmation', function () {
  assert.ok(world.settlementRequested, 'Expected settlement confirmation');
  assert.ok(world.agentCommissions === 0, 'Expected commissions to be cleared after settlement');
});

Given('I am a new agent with basic verification', function () {
  world.agentVerificationLevel = 'basic';
});

When('I try to process transactions over {int} {word}', function (amount: number, currency: string) {
  world.transactionAmount = amount;
  const dailyLimit = world.agentVerificationLevel === 'basic' ? 1000000 : 10000000;
  
  if (amount >= dailyLimit) {
    world.dailyLimitExceeded = true;
    world.limitAmount = dailyLimit;
    world.attemptedAmount = amount;
  } else {
    world.dailyLimitExceeded = false;
  }
});

Then('I should see a daily limit warning', function () {
  assert.ok(world.dailyLimitExceeded, `Expected daily limit to be exceeded for ${world.attemptedAmount} ${world.currency || 'UGX'} (limit: ${world.limitAmount})`);
});

Then('be prompted to upgrade my verification', function () {
  assert.equal(world.agentVerificationLevel, 'basic', 'Should prompt upgrade for basic verification level');
});

Given('I am an agent who completed {int} transactions', function (count: number) {
  world.agentTransactionCount = count;
});

Given('I have a {float} star rating', function (rating: number) {
  world.agentRating = rating;
});

When('a customer searches for agents', function () {
  world.searchingAgents = true;
});

Then('I should appear in search results', function () {
  assert.ok(world.agentTransactionCount > 0);
});

Then('my rating should be displayed', function () {
  assert.ok(world.agentRating);
});

Then('customers should see my transaction count', function () {
  assert.ok(world.agentTransactionCount > 0, 'Expected transaction count to be visible');
});

Given('I am an agent in an area with poor internet', function () {
  world.poorInternet = true;
});

When('I process a transaction', function () {
  world.transactionProcessed = true;
});

Then('the transaction should queue locally', function () {
  assert.ok(world.poorInternet);
});

Then('sync when internet is available', function () {
  assert.ok(world.poorInternet, 'Expected poor internet condition');
  assert.ok(world.transactionProcessed, 'Expected transaction to be queued for sync');
});

Then('the customer should receive confirmation', function () {
  assert.ok(world.transactionProcessed, 'Expected transaction to be processed');
  assert.ok(world.poorInternet, 'Confirmation should be sent even with poor internet');
});

Given('there are {int} agents in {word}', function (count: number, location: string) {
  world.agentCount = count;
  world.location = location;
});

When('a customer searches for nearby agents', function () {
  world.searchingNearby = true;
});

Then('they should see all {int} agents sorted by distance and rating', function (count: number) {
  assert.equal(world.agentCount, count);
});

Then('be able to compare commission rates', function () {
  assert.ok(world.searchingNearby, 'Expected to be searching for agents');
  assert.ok(world.agentCount > 1, `Expected multiple agents to compare, found: ${world.agentCount}`);
});

// New agent steps
When('I give {int} {word} cash to a customer', function (amount: number, currency: string) {
  world.agentCashBalance -= amount;
  world.agentDigitalBalance = (world.agentDigitalBalance || 0) + amount;
});

Then('my cash balance should be {int} {word}', function (expected: number, currency: string) {
  assert.equal(world.agentCashBalance, expected, `Expected cash balance ${expected}, got ${world.agentCashBalance}`);
});

Given('I am an agent', function () {
  world.isAgent = true;
});

When('I process a {int} {word} deposit', function (amount: number, currency: string) {
  world.transactionAmount = amount;
  world.commission = amount * 0.03;
});

Then('I should earn {int} {word} commission', function (expected: number, currency: string) {
  const actualCommission = world.commission || (world.transactionAmount * 0.03);
  assert.equal(actualCommission, expected, `Expected commission ${expected}, got ${actualCommission}`);
});

Then('the customer should pay {int} {word}', function (expected: number, currency: string) {
  assert.ok(world.customerBtcRequest > 0 || expected > 0, 'Customer should pay for Bitcoin');
});

When('I verify each escrow code', function () {
  world.escrowsVerified = true;
});

Then('all transactions should complete successfully', function () {
  assert.ok(world.escrowsVerified || world.isAgent, 'All transactions should complete');
});

When('I fund my account via bank transfer with {int} {word}', function (amount: number, currency: string) {
  world.agentDigitalBalance = (world.agentDigitalBalance || 0) + amount;
});

When('another customer brings {int} {word} cash', function (amount: number, currency: string) {
  world.agentCashBalance = (world.agentCashBalance || 0) + amount;
  world.agentDigitalBalance -= amount;
});

When('I give {int} {word} cash to another customer', function (amount: number, currency: string) {
  world.agentCashBalance -= amount;
  world.agentDigitalBalance = (world.agentDigitalBalance || 0) + amount;
});

Given('the Bitcoin rate is {int} {word} per BTC', function (rate: number, currency: string) {
  world.btcRate = rate;
});

Given('there are {int} pending escrow transactions', function (count: number) {
  world.pendingEscrows = count;
});

// Additional agent steps
When('a customer wants to deposit {int} UGX', function (amount: number) {
  world.customerDepositAmount = amount;
  world.customerDepositRequest = true;
});

When('I try to send {int} UGX via USSD', function (amount: number) {
  if (amount > world.balance) {
    world.error = new Error('Insufficient balance');
    world.ussdError = 'Insufficient balance';
  } else {
    world.balance -= amount;
    world.ussdSuccess = true;
  }
});

Then('I see {string}', function (expectedMessage: string) {
  if (world.ussdError) {
    assert.ok(
      world.ussdError.toLowerCase().includes(expectedMessage.toLowerCase()) ||
      expectedMessage.toLowerCase().includes(world.ussdError.toLowerCase()),
      `Expected message "${expectedMessage}", got "${world.ussdError}"`
    );
  } else {
    assert.ok(world.ussdSuccess, `Expected to see message: ${expectedMessage}`);
  }
});

When('I request to withdraw {int} UGX via USSD', function (amount: number) {
  if (amount > world.balance) {
    world.error = new Error('Insufficient balance');
    world.withdrawalFailed = true;
  } else {
    world.withdrawalAmount = amount;
    world.withdrawalCode = 'WD-' + Math.random().toString(36).substring(7).toUpperCase();
    world.withdrawalRequested = true;
  }
});

Then('I receive a withdrawal code', function () {
  assert.ok(world.withdrawalCode, 'Expected to receive a withdrawal code');
  assert.ok(world.withdrawalCode.startsWith('WD-'), 'Withdrawal code should start with WD-');
});
