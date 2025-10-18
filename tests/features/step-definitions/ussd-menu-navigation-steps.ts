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

Given('I have set my PIN to {string}', function (pin: string) {
  world.pin = pin;
  // PIN is stored in world and will be used by test scenarios
  // Tests use mocked data services, so we don't actually call createOrUpdateUserPin
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
