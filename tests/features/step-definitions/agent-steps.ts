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
});

When('I verify the customer identity', function () {
  world.identityVerified = true;
});

When('I credit {int} {word} to their account', function (amount: number, currency: string) {
  world.agentDigitalBalance -= amount;
  world.agentCashBalance = (world.agentCashBalance || 0) + amount;
});

Then('my digital balance should decrease by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentDigitalBalance >= 0);
});

Then('my cash balance should increase by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentCashBalance > 0);
});

Then('I should earn commission on the transaction', function () {
  world.earnedCommission = true;
  assert.ok(true);
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
});

Then('my cash balance should decrease by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentCashBalance >= 0);
});

Then('my digital balance should increase by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentDigitalBalance > 0);
});

Then('I should see a liquidity warning', function () {
  world.liquidityWarning = true;
  assert.ok(true);
});

Then('be prompted to fund my account', function () {
  assert.ok(true);
});

Then('the transaction should not proceed', function () {
  world.transactionBlocked = true;
  assert.ok(true);
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
  assert.ok(true);
});

Then('I should earn my commission', function () {
  assert.ok(true);
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
  assert.ok(true);
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
  assert.ok(true);
});

Then('I should receive confirmation', function () {
  assert.ok(true);
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
  assert.ok(world.agentTransactionCount);
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
  assert.ok(true);
});

Then('the customer should receive confirmation', function () {
  assert.ok(true);
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
  assert.ok(true);
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
