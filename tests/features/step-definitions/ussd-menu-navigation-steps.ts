import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { world } from './shared-steps.js';
import { USSDTestHelper } from '../../helpers/ussdTestHelpers';

// Background steps
Given('I have a valid phone number {string}', function (phoneNumber: string) {
  world.ussdPhoneNumber = phoneNumber;
  world.ussdSessionId = world.ussdSessionId || USSDTestHelper.generateSessionId();
});

Given('I have a phone number {string}', function (phoneNumber: string) {
  world.ussdPhoneNumber = phoneNumber;
  world.ussdSessionId = world.ussdSessionId || USSDTestHelper.generateSessionId();
});

Given('I have set my PIN to {string}', async function (pin: string) {
  world.pin = pin;
  
  // Set PIN for the user in the system
  const { WebhookDataService } = await import('../../../src/services/webHookServices.js');
  await WebhookDataService.createOrUpdateUserPin(world.ussdPhoneNumber, pin);
});

// Navigation steps
When('I select {string} for USDC', async function (option: string) {
  const result = await USSDTestHelper.simulateUSSDRequest(
    world.ussdSessionId,
    world.ussdPhoneNumber,
    option
  );
  
  world.ussdResponse = result.response;
  world.ussdContinueSession = result.continueSession;
});

When('I select {string} for USDC Rate', async function (option: string) {
  const result = await USSDTestHelper.simulateUSSDRequest(
    world.ussdSessionId,
    world.ussdPhoneNumber,
    option
  );
  
  world.ussdResponse = result.response;
  world.ussdContinueSession = result.continueSession;
});

When('I select {string} to show current menu', async function (option: string) {
  const result = await USSDTestHelper.simulateUSSDRequest(
    world.ussdSessionId,
    world.ussdPhoneNumber,
    option
  );
  
  world.ussdResponse = result.response;
  world.ussdContinueSession = result.continueSession;
});
