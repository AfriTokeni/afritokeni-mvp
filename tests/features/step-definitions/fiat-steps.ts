import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { world } from './shared-steps.js';
// DataService eliminated - using specialized services

Given('I have {int} {word}', async function (amount: number, currency: string) {
  world.userId = `test-user-${Date.now()}`;
  world.currency = currency;
  
  const user = await DataService.createUser({
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@test.com`,
    userType: 'user',
    pin: '1234',
    authMethod: 'sms'
  });
  
  world.userId = user.id;
  
  await DataService.updateUserBalance(world.userId, amount);
  
  const userBalance = await DataService.getUserBalance(world.userId);
  world.balance = userBalance?.balance || 0;
  
  assert.equal(world.balance, amount, `Failed to set initial balance. Expected ${amount}, got ${world.balance}`);
});

When('I send {int} {word} to another user', async function (amount: number, currency: string) {
  world.recipientId = `test-recipient-${Date.now()}`;
  
  try {
    await DataService.transfer(
      world.userId,
      world.recipientId,
      amount,
      currency
    );
    
    world.balance = await DataService.getBalance(world.userId, currency);
    world.transferSuccess = true;
  } catch (error: any) {
    world.error = error;
    world.transferFailed = true;
  }
});

When('I send money to a user in Kenya', async function () {
  world.recipientId = `test-recipient-kenya-${Date.now()}`;
  world.recipientCurrency = 'KES';
  
  try {
    await DataService.transferWithConversion(
      world.userId,
      world.recipientId,
      50000,
      'UGX',
      'KES'
    );
    
    world.crossCurrencySuccess = true;
  } catch (error: any) {
    world.error = error;
  }
});

When('I try to send {int} {word}', async function (amount: number, currency: string) {
  world.recipientId = `test-recipient-${Date.now()}`;
  
  try {
    await DataService.transfer(
      world.userId,
      world.recipientId,
      amount,
      currency
    );
    world.transferSuccess = true;
  } catch (error: any) {
    world.error = error;
    world.transferFailed = true;
  }
});

Then('the transaction completes successfully', async function () {
  assert.ok(!world.error, `Transaction should succeed but got error: ${world.error?.message}`);
  assert.ok(world.transferSuccess, 'Transfer should be marked as successful');
  
  const currentBalance = await DataService.getBalance(world.userId, world.currency);
  assert.ok(currentBalance < 500000, `Balance should have decreased, got ${currentBalance}`);
});

Then('the amount is converted to KES', async function () {
  assert.ok(world.crossCurrencySuccess, 'Cross-currency transfer should succeed');
  
  const recipientBalance = await DataService.getBalance(world.recipientId, 'KES');
  assert.ok(recipientBalance > 0, `Recipient should have KES balance, got ${recipientBalance}`);
});

Then('the transaction fails with {string}', function (expectedError: string) {
  assert.ok(world.error, 'Expected transaction to fail with error');
  assert.ok(world.transferFailed, 'Transfer should be marked as failed');
  
  const errorMsg = world.error.message.toLowerCase();
  assert.ok(
    errorMsg.includes(expectedError.toLowerCase()),
    `Expected error "${expectedError}", got "${world.error.message}"`
  );
});
