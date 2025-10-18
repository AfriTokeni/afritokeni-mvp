import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';

// Background steps
Given('I have a valid phone number {string}', function (phoneNumber: string) {
  this.phoneNumber = phoneNumber;
});

Given('I have set my PIN to {string}', async function (pin: string) {
  // PIN is set during test execution when needed
  this.pin = pin;
});

// Navigation steps
When('I select {string} for USDC', async function (option: string) {
  this.lastResponse = await this.ussdService.processUSSDRequest(this.phoneNumber, option);
});

When('I select {string} to show current menu', async function (option: string) {
  this.lastResponse = await this.ussdService.processUSSDRequest(this.phoneNumber, option);
});
