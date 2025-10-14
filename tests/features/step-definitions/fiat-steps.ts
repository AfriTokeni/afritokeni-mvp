import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { world } from './shared-steps.js';

// Generic steps removed - handled by multi-currency-steps.ts

Then('my {word} balance should be {int}', function (currency: string, expected: number) {
  assert.equal(world.balance, expected, `Expected ${currency} balance ${expected}, got ${world.balance}`);
});

// Duplicate removed - using error-handling-steps.ts

Then('I should see an error message', function () {
  assert.ok(world.error, 'Should have an error message');
});
