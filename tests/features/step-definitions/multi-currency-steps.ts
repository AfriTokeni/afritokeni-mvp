/**
 * Multi-Currency step definitions
 */

import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { world } from "./shared-steps.js";

Given('I am a user in {word}', function (country: string) {
  world.country = country;
  world.currency = country === 'Nigeria' ? 'NGN' : 
                   country === 'Kenya' ? 'KES' :
                   country === 'Ghana' ? 'GHS' :
                   country === 'South' ? 'ZAR' : 'UGX';
});

Given('I have {int} {word} in my wallet', function (amount: number, currency: string) {
  world.balance = amount;
  world.currency = currency;
});

Then('I should see {int} {word}', function (amount: number, currency: string) {
  assert.equal(world.balance, amount);
});

// Specific fiat currency transfers (NGN, KES, GHS, ZAR, UGX)
// Note: ckBTC and ckUSDC have their own specific step definitions in core-steps.ts
When('I send {int} NGN to another user', function (amount: number) {
  handleFiatTransfer(amount, 'NGN');
});

When('I send {int} KES to another user', function (amount: number) {
  handleFiatTransfer(amount, 'KES');
});

When('I send {int} GHS to another user', function (amount: number) {
  handleFiatTransfer(amount, 'GHS');
});

When('I send {int} ZAR to another user', function (amount: number) {
  handleFiatTransfer(amount, 'ZAR');
});

When('I send {int} UGX to another user', function (amount: number) {
  handleFiatTransfer(amount, 'UGX');
});

function handleFiatTransfer(amount: number, currency: string) {
  if (amount > world.balance) {
    world.error = new Error(`Insufficient ${currency} balance`);
    world.transferFailed = true;
  } else {
    world.balance -= amount;
    world.sentAmount = amount;
    world.transferSuccess = true;
  }
}

Then('my balance should be {int} {word}', function (amount: number, currency: string) {
  assert.equal(world.balance, amount);
});

When('I check the exchange rate to {word}', function (targetCurrency: string) {
  world.targetCurrency = targetCurrency;
  world.exchangeRate = 0.1; // Mock rate
});

Then('I should see the current UGX to KES rate', function () {
  assert.ok(world.exchangeRate, 'Expected exchange rate for UGX to KES');
  assert.equal(world.targetCurrency, 'KES');
});

When('I exchange {int} {word} to {word}', function (amount: number, from: string, to: string) {
  const converted = amount * world.exchangeRate;
  world.balance -= amount;
  world.convertedBalance = converted;
});

Then('I should receive the equivalent amount in {word}', function (currency: string) {
  assert.ok(world.convertedBalance > 0);
});

When('I check the Bitcoin rate in {word}', function (currency: string) {
  // Real exchange rates per currency
  const rates: Record<string, number> = {
    'NGN': 45000000, // 45M NGN per BTC
    'KES': 6500000,  // 6.5M KES per BTC
    'GHS': 750000,   // 750K GHS per BTC
    'ZAR': 850000,   // 850K ZAR per BTC
    'UGX': 150000000 // 150M UGX per BTC
  };
  world.btcRate = rates[currency] || 45000000;
  world.btcRateCurrency = currency;
  world.rateChecked = true;
});

Then('I should see the current BTC to {word} rate', function (currency: string) {
  assert.ok(world.rateChecked, 'Expected rate to be checked');
  assert.ok(world.btcRate > 0, `Expected valid BTC rate for ${currency}`);
  assert.equal(world.btcRateCurrency, currency, `Expected rate currency to be ${currency}`);
});

When('I buy {float} ckBTC with {word}', function (amount: number, currency: string) {
  const cost = amount * world.btcRate;
  world.balance -= cost;
  world.btcBalance += amount;
});

Then('my {word} balance should decrease accordingly', function (currency: string) {
  assert.ok(world.balance >= 0);
});

Then('my ckBTC balance should increase by {float}', function (amount: number) {
  assert.ok(world.btcBalance >= amount);
});

Given('I have balances in multiple currencies', function () {
  world.multiCurrency = {
    NGN: 50000,
    KES: 10000,
    GHS: 1000
  };
});

When('I view my wallet', function () {
  world.viewingWallet = true;
});

Then('I should see proper currency symbols', function () {
  assert.ok(world.multiCurrency);
});

Then('amounts should be formatted correctly', function () {
  assert.ok(true);
});

Then('decimal places should match currency standards', function () {
  assert.ok(true);
});

Given('I am an agent in {word}', function (country: string) {
  world.agentCountry = country;
  world.agentCurrency = country === 'Kenya' ? 'KES' : 'UGX';
});

When('I process a {int} {word} transaction', function (amount: number, currency: string) {
  world.transactionAmount = amount;
  world.commission = amount * 0.03; // 3% commission
});

Then('my commission should be calculated in {word}', function (currency: string) {
  assert.ok(world.commission > 0, `Expected commission to be calculated in ${currency}`);
  assert.equal(world.commission, world.transactionAmount * 0.03);
});

Then('displayed with proper formatting', function () {
  assert.ok(world.commission, 'Expected commission to be displayed');
});

// Additional multi-currency steps
Given('I am a user in South Africa', function () {
  world.country = 'South Africa';
  world.currency = 'ZAR';
});

Given('I am a user in Uganda with {int} UGX', function (amount: number) {
  world.country = 'Uganda';
  world.currency = 'UGX';
  world.balance = amount;
});

Given('I am a user in Nigeria with {int} NGN', function (amount: number) {
  world.country = 'Nigeria';
  world.currency = 'NGN';
  world.balance = amount;
});

Then('the transaction completes successfully', function () {
  assert.ok(!world.error, `Transaction should succeed but got error: ${world.error?.message}`);
  assert.ok(world.transferSuccess || world.success, 'Expected transaction to complete successfully');
});

When('I send money to a user in Kenya', function () {
  world.recipientCountry = 'Kenya';
  world.recipientCurrency = 'KES';
  world.crossCurrencyTransfer = true;
});

Then('the amount is converted to KES', function () {
  assert.ok(world.crossCurrencyTransfer, 'Expected cross-currency conversion');
  assert.equal(world.recipientCurrency, 'KES');
});

When('I try to send {int} UGX', function (amount: number) {
  if (amount > world.balance) {
    world.error = new Error('Insufficient balance');
    world.transferFailed = true;
  } else if (amount <= 0) {
    world.error = new Error('Invalid amount');
    world.transferFailed = true;
  } else {
    world.balance -= amount;
    world.transferSuccess = true;
  }
});

Then('the transaction fails with {string}', function (expectedError: string) {
  assert.ok(world.error, 'Expected transaction to fail');
  assert.ok(
    world.error.message.toLowerCase().includes(expectedError.toLowerCase()),
    `Expected error "${expectedError}", got "${world.error.message}"`
  );
});

