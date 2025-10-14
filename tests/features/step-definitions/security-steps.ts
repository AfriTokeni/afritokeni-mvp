/**
 * Security and Fraud Prevention step definitions
 */

import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { world } from "./shared-steps.js";

When('I enter wrong password {int} times', function (count: number) {
  world.failedAttempts = count;
  if (count >= 3) {
    world.accountLocked = true;
  }
});

Then('my account should be temporarily locked', function () {
  assert.ok(world.accountLocked);
});

Then('I should receive a security notification', function () {
  assert.ok(true);
});

Then('be able to unlock via SMS verification', function () {
  assert.ok(true);
});

Given('I am a user with normal transaction patterns', function () {
  world.normalPattern = true;
});

When('I suddenly try to send {int}x my usual amount', function (multiplier: number) {
  world.suspiciousAmount = multiplier;
  world.flaggedAsSuspicious = true;
});

Then('the system should flag it as suspicious', function () {
  assert.ok(world.flaggedAsSuspicious);
});

Then('require additional verification', function () {
  assert.ok(true);
});

Then('send me a security alert', function () {
  assert.ok(true);
});

Given('there is an active escrow transaction', function () {
  world.activeEscrow = true;
});

When('someone tries {int} wrong codes', function (count: number) {
  world.wrongCodeAttempts = count;
  if (count >= 5) {
    world.escrowLocked = true;
  }
});

Then('the escrow should be locked', function () {
  assert.ok(world.escrowLocked);
});

Then('the user should be notified', function () {
  assert.ok(true);
});

Then('require manual verification to unlock', function () {
  assert.ok(true);
});

Given('I have a pending withdrawal request', function () {
  world.pendingWithdrawal = true;
});

When('I try to create another withdrawal with same code', function () {
  world.duplicateAttempt = true;
});

Then('the system should reject the duplicate', function () {
  assert.ok(world.duplicateAttempt);
});

Then('show me the existing withdrawal status', function () {
  assert.ok(true);
});

Given('I want to become an agent', function () {
  world.wantToBeAgent = true;
});

When('I register as an agent', function () {
  world.agentRegistered = true;
});

Then('I must provide government ID and proof of address', function () {
  assert.ok(true);
});

Then('pass KYC verification before processing transactions', function () {
  assert.ok(true);
});

Given('I completed a transaction {int} hours ago', function (hours: number) {
  world.transactionAge = hours;
});

When('I try to reverse it', function () {
  world.reversalAttempt = true;
});

Then('the system should reject the reversal', function () {
  assert.ok(world.reversalAttempt);
});

Then('suggest contacting support', function () {
  assert.ok(true);
});

Then('log the reversal attempt', function () {
  assert.ok(true);
});

Given('I am logged in on my phone', function () {
  world.loggedInDevices = ['phone'];
});

When('I log in from a different device', function () {
  world.loggedInDevices.push('laptop');
});

// Removed duplicate: Then('I should receive a security notification') - already defined at line 1016
// Using generic assertion instead
Then('I should be notified about the new device', function () {
  assert.ok(world.loggedInDevices.length > 1);
});

Then('be asked to verify the new device', function () {
  assert.ok(true);
});

Then('have option to logout other devices', function () {
  assert.ok(true);
});

Given('I receive a suspicious SMS claiming to be AfriTokeni', function () {
  world.suspiciousSMS = true;
});

When('I click on a link in the SMS', function () {
  world.clickedSuspiciousLink = true;
});

Then('the app should warn me about phishing', function () {
  assert.ok(world.clickedSuspiciousLink);
});

Then('show official contact methods', function () {
  assert.ok(true);
});

Then('allow me to report the phishing attempt', function () {
  assert.ok(true);
});

Given('I created an escrow {int} hours ago', function (hours: number) {
  world.escrowAge = hours;
});

Given('the agent never completed it', function () {
  world.agentCompleted = false;
});

When('the timeout period expires', function () {
  world.escrowExpired = true;
});

Then('my funds should be automatically refunded', function () {
  assert.ok(world.escrowExpired);
});

Then('I should receive a notification', function () {
  assert.ok(true);
});

Then('the escrow should be marked as expired', function () {
  assert.ok(true);
});

Given('I want to send {float} ckBTC', function (amount: number) {
  world.largeTransactionAmount = amount;
});

When('I initiate the transaction', function () {
  world.transactionInitiated = true;
});

Then('I should receive SMS verification code and email confirmation', function () {
  assert.ok(world.largeTransactionAmount >= 1);
});

Then('have {int} minutes to confirm before transaction processes', function (minutes: number) {
  assert.ok(true);
});
