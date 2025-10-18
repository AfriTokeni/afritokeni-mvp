/**
 * Step definitions for USSD Language Selection
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { world } from './shared-steps.js';
import type { Language } from '../../../src/services/translations.js';

Given('my language preference is {string}', function (language: Language) {
  // Set language preference in session
  if (world.session) {
    world.session.language = language;
  } else {
    world.languagePreference = language;
  }
});

When('I select {string} for Language Selection', async function (option: string) {
  const input = option;
  world.lastResponse = await world.ussdService.processUSSDRequest(
    world.sessionId,
    world.phoneNumber,
    input
  );
});

When('I select {string} for English', async function (option: string) {
  const input = option;
  world.lastResponse = await world.ussdService.processUSSDRequest(
    world.sessionId,
    world.phoneNumber,
    input
  );
});

When('I select {string} for Luganda', async function (option: string) {
  const input = option;
  world.lastResponse = await world.ussdService.processUSSDRequest(
    world.sessionId,
    world.phoneNumber,
    input
  );
});

When('I select {string} for Swahili', async function (option: string) {
  const input = option;
  world.lastResponse = await world.ussdService.processUSSDRequest(
    world.sessionId,
    world.phoneNumber,
    input
  );
});

When('I select {string} for invalid option', async function (option: string) {
  const input = option;
  world.lastResponse = await world.ussdService.processUSSDRequest(
    world.sessionId,
    world.phoneNumber,
    input
  );
});

When('I enter chained input {string}', async function (input: string) {
  world.lastResponse = await world.ussdService.processUSSDRequest(
    world.sessionId,
    world.phoneNumber,
    input
  );
});

Then('the session language should be {string}', function (expectedLanguage: Language) {
  // Get the current session
  const session = world.ussdService.getSession(world.sessionId);
  expect(session).to.exist;
  expect(session?.language).to.equal(expectedLanguage);
});
