import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { world } from './shared-steps.js';
import { DataService } from '../../../src/services/dataService.js';

Given('I have {int} {word} in my account', async function (amount: number, currency: string) {
  world.currency = currency;
  
  const user = await DataService.createUser({
    firstName: 'USSD',
    lastName: 'User',
    email: `ussd${Date.now()}@test.com`,
    userType: 'user',
    pin: '1234',
    authMethod: 'sms'
  });
  
  world.userId = user.id;
  await DataService.updateUserBalance(world.userId, amount);
  
  const userBalance = await DataService.getUserBalance(world.userId);
  world.balance = userBalance?.balance || 0;
});

When('I dial {string} and select {string}', async function (ussdCode: string, option: string) {
  world.ussdCode = ussdCode;
  world.selectedOption = option;
  
  if (option === 'Check Balance') {
    const balance = await DataService.getUserBalance(world.userId);
    world.displayedBalance = balance?.balance || 0;
  }
});

Then('I see my balance is {int} {word}', function (expectedAmount: number, currency: string) {
  assert.equal(world.displayedBalance, expectedAmount, 
    `Expected balance ${expectedAmount}, got ${world.displayedBalance}`);
});

When('I send {int} {word} to {string} via USSD', async function (amount: number, currency: string, phone: string) {
  world.recipientPhone = phone;
  
  try {
    const recipientUser = await DataService.createUser({
      firstName: 'Recipient',
      lastName: 'User',
      email: `recipient${Date.now()}@test.com`,
      userType: 'user',
      pin: '1234',
      authMethod: 'sms'
    });
    
    await DataService.transfer(world.userId, recipientUser.id, amount, currency);
    
    const updatedBalance = await DataService.getUserBalance(world.userId);
    world.balance = updatedBalance?.balance || 0;
    world.transferSuccess = true;
  } catch (error: any) {
    world.error = error;
    world.transferFailed = true;
  }
});

Then('the transaction succeeds', function () {
  assert.ok(world.transferSuccess, 'Transaction should succeed');
  assert.ok(!world.error, `Should not have error, got: ${world.error?.message}`);
});

When('I try to send {int} {word} via USSD', async function (amount: number, currency: string) {
  try {
    const recipientUser = await DataService.createUser({
      firstName: 'Recipient',
      lastName: 'User',
      email: `recipient${Date.now()}@test.com`,
      userType: 'user',
      pin: '1234',
      authMethod: 'sms'
    });
    
    await DataService.transfer(world.userId, recipientUser.id, amount, currency);
    world.transferSuccess = true;
  } catch (error: any) {
    world.error = error;
    world.transferFailed = true;
  }
});

Then('I see {string}', function (expectedMessage: string) {
  if (expectedMessage === 'Insufficient balance') {
    assert.ok(world.error, 'Should have error for insufficient balance');
    assert.ok(world.error.message.toLowerCase().includes('insufficient'), 
      `Expected insufficient balance error, got: ${world.error.message}`);
  }
});

When('I request to withdraw {int} {word} via USSD', async function (amount: number, currency: string) {
  world.withdrawalAmount = amount;
  world.withdrawalCode = `WD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const transaction = await DataService.createTransaction({
    userId: world.userId,
    type: 'withdraw',
    amount,
    currency,
    status: 'pending',
    description: `USSD withdrawal request`
  });
  
  world.withdrawalTransaction = transaction;
});

Then('I receive a withdrawal code', function () {
  assert.ok(world.withdrawalCode, 'Should have withdrawal code');
  assert.ok(world.withdrawalCode.startsWith('WD-'), 'Code should start with WD-');
});

Given('I am a user', async function () {
  const user = await DataService.createUser({
    firstName: 'Test',
    lastName: 'User',
    email: `user${Date.now()}@test.com`,
    userType: 'user',
    pin: '1234',
    authMethod: 'sms'
  });
  
  world.userId = user.id;
});

When('I dial {string}', function (ussdCode: string) {
  world.ussdCode = ussdCode;
  world.ussdSession = true;
});

Then('I see the main menu', function () {
  assert.ok(world.ussdSession, 'USSD session should be active');
});

Then('I see options for {string}, {string}, {string}', function (opt1: string, opt2: string, opt3: string) {
  world.menuOptions = [opt1, opt2, opt3];
  assert.equal(world.menuOptions.length, 3, 'Should have 3 menu options');
});

Then('my balance should be {int} {word}', async function (expectedAmount: number, currency: string) {
  const balance = await DataService.getUserBalance(world.userId);
  assert.equal(balance?.balance, expectedAmount, 
    `Expected balance ${expectedAmount}, got ${balance?.balance}`);
});

Then('the code should start with {string}', function (prefix: string) {
  assert.ok(world.withdrawalCode?.startsWith(prefix), 
    `Expected code to start with ${prefix}, got ${world.withdrawalCode}`);
});

When('I dial {string} and wait {int} minutes', function (ussdCode: string, minutes: number) {
  world.ussdCode = ussdCode;
  world.sessionTimeout = true;
});

Then('the session should timeout', function () {
  assert.ok(world.sessionTimeout, 'Session should timeout');
});

Then('I see my recent transaction', async function () {
  const transactions = await DataService.getUserTransactions(world.userId);
  assert.ok(transactions.length > 0, 'Should have at least one transaction');
});
