import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { world } from './shared-steps.js';

// Generic steps removed - handled by multi-currency-steps.ts

Then('my {word} balance should be {int}', function (currency: string, expected: number) {
  // Check the appropriate balance based on currency
  const balanceKey = currency.toLowerCase() + 'Balance';
  const actual = (world as any)[balanceKey] !== undefined ? (world as any)[balanceKey] : (world.balance !== undefined ? world.balance : 0);
  assert.equal(actual, expected, `Expected ${currency} balance ${expected}, got ${actual}`);
});

// Duplicate removed - using error-handling-steps.ts

Then('I should see an error message', function () {
  assert.ok(world.error, 'Should have an error message');
});
