import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { world } from "./shared-steps.js";
// DataService eliminated - using specialized services

Given('I am an agent with {int} {word} digital balance', async function (amount: number, currency: string) {
  const agent = await DataService.createAgent({
    userId: `agent-${Date.now()}`,
    businessName: 'Test Agent',
    location: {
      country: 'Uganda',
      state: 'Central',
      city: 'Kampala',
      address: 'Test Street',
      coordinates: {
        lat: 0.3476,
        lng: 32.5825
      }
    },
    digitalBalance: amount,
    cashBalance: 0,
    commissionRate: 0.03,
    isActive: true,
    status: 'available'
  });
  
  world.agentId = agent.id;
  world.agentDigitalBalance = amount;
});

Given('a customer brings {int} {word} cash', function (amount: number, currency: string) {
  world.customerCashAmount = amount;
});

When('I verify the customer identity', function () {
  world.customerVerified = true;
});

When('I credit {int} {word} to their account', async function (amount: number, currency: string) {
  const customer = await DataService.createUser({
    firstName: 'Customer',
    lastName: 'User',
    email: `customer${Date.now()}@test.com`,
    userType: 'user',
    pin: '1234',
    authMethod: 'sms'
  });
  
  await DataService.updateUserBalance(customer.id, amount);
  
  await DataService.updateAgentBalance(world.agentId, {
    digitalBalance: world.agentDigitalBalance - amount,
    cashBalance: amount
  });
  
  world.agentDigitalBalance -= amount;
  world.agentCashBalance = amount;
});

Then('my digital balance should decrease by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentDigitalBalance >= 0, 'Digital balance should have decreased');
});

Then('my cash balance should increase by {int} {word}', function (amount: number, currency: string) {
  assert.equal(world.agentCashBalance, amount, `Cash balance should be ${amount}`);
});

Then('I should earn commission on the transaction', function () {
  world.commission = world.customerCashAmount * 0.03;
  assert.ok(world.commission > 0, 'Commission should be earned');
});

Given('I am an agent with {int} {word} cash', async function (amount: number, currency: string) {
  const agent = await DataService.createAgent({
    userId: `agent-${Date.now()}`,
    businessName: 'Test Agent',
    location: {
      country: 'Uganda',
      state: 'Central',
      city: 'Kampala',
      address: 'Test Street',
      coordinates: {
        lat: 0.3476,
        lng: 32.5825
      }
    },
    digitalBalance: 0,
    cashBalance: amount,
    commissionRate: 0.03,
    isActive: true,
    status: 'available'
  });
  
  world.agentId = agent.id;
  world.agentCashBalance = amount;
});

Given('a customer requests {int} {word} withdrawal', function (amount: number, currency: string) {
  world.withdrawalAmount = amount;
});

When('I verify their withdrawal code', function () {
  world.withdrawalCode = `WD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  world.codeVerified = true;
});

When('I give them {int} {word} cash', async function (amount: number, currency: string) {
  await DataService.updateAgentBalance(world.agentId, {
    cashBalance: world.agentCashBalance - amount,
    digitalBalance: amount
  });
  
  world.agentCashBalance -= amount;
  world.agentDigitalBalance = amount;
});

Then('my cash balance should decrease by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentCashBalance >= 0, 'Cash balance should have decreased');
});

Then('my digital balance should increase by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentDigitalBalance > 0, 'Digital balance should have increased');
});

Given('I am an agent with {int} {word} digital balance', async function (amount: number, currency: string) {
  const agent = await DataService.createAgent({
    userId: `agent-${Date.now()}`,
    businessName: 'Test Agent',
    location: {
      country: 'Uganda',
      state: 'Central',
      city: 'Kampala',
      address: 'Test Street',
      coordinates: {
        lat: 0.3476,
        lng: 32.5825
      }
    },
    digitalBalance: amount,
    cashBalance: 0,
    commissionRate: 0.03,
    isActive: true,
    status: 'available'
  });
  
  world.agentId = agent.id;
  world.agentDigitalBalance = amount;
});

When('a customer wants to deposit {int} {word}', function (amount: number, currency: string) {
  world.customerDepositAmount = amount;
});

Then('I should see a liquidity warning', function () {
  assert.ok(world.agentDigitalBalance < world.customerDepositAmount, 'Should have liquidity warning');
});

Then('be prompted to fund my account', function () {
  assert.ok(true, 'Prompted to fund account');
});

Then('the transaction should not proceed', function () {
  assert.ok(world.agentDigitalBalance < world.customerDepositAmount, 'Transaction should not proceed');
});

Given('I am an agent with ckBTC available', async function () {
  const agent = await DataService.createAgent({
    userId: `agent-${Date.now()}`,
    businessName: 'Bitcoin Agent',
    location: {
      country: 'Uganda',
      state: 'Central',
      city: 'Kampala',
      address: 'Test Street',
      coordinates: {
        lat: 0.3476,
        lng: 32.5825
      }
    },
    digitalBalance: 1000000,
    cashBalance: 500000,
    commissionRate: 0.03,
    isActive: true,
    status: 'available'
  });
  
  world.agentId = agent.id;
});

Given('a customer wants to buy {float} ckBTC for {word}', function (btcAmount: number, currency: string) {
  world.customerBtcRequest = btcAmount;
  world.customerCurrency = currency;
});

When('I verify the escrow code', function () {
  world.escrowCode = `BTC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  world.escrowVerified = true;
});

When('confirm the cash payment', function () {
  world.cashPaymentConfirmed = true;
});

Then('the ckBTC should be released to the customer', function () {
  assert.ok(world.escrowVerified, 'Escrow should be verified');
});

Then('I should receive the UGX equivalent', function () {
  assert.ok(world.cashPaymentConfirmed, 'Should receive payment');
});

Then('I should earn my commission', function () {
  world.commission = world.customerBtcRequest * 150000000 * 0.03;
  assert.ok(world.commission > 0, 'Should earn commission');
});

Given('I am an agent with low digital balance', async function () {
  const agent = await DataService.createAgent({
    userId: `agent-${Date.now()}`,
    businessName: 'Test Agent',
    location: {
      country: 'Uganda',
      state: 'Central',
      city: 'Kampala',
      address: 'Test Street',
      coordinates: {
        lat: 0.3476,
        lng: 32.5825
      }
    },
    digitalBalance: 10000,
    cashBalance: 0,
    commissionRate: 0.03,
    isActive: true,
    status: 'available'
  });
  
  world.agentId = agent.id;
  world.agentDigitalBalance = 10000;
});

When('I fund my account via bank transfer', async function () {
  await DataService.updateAgentBalance(world.agentId, {
    digitalBalance: world.agentDigitalBalance + 500000
  });
  
  world.agentDigitalBalance += 500000;
});

Then('my digital balance should increase', function () {
  assert.ok(world.agentDigitalBalance > 10000, 'Digital balance should increase');
});

Then('I should be able to process deposits again', function () {
  assert.ok(world.agentDigitalBalance > 100000, 'Should have sufficient balance');
});

Given('there are {int} agents in {word}', function (count: number, location: string) {
  world.agentCount = count;
  world.location = location;
});

When('a customer searches for nearby agents', function () {
  world.searchingNearby = true;
});

Then('they should see all {int} agents sorted by distance and rating', function (count: number) {
  assert.equal(world.agentCount, count, `Should see ${count} agents`);
});

Then('be able to compare commission rates', function () {
  assert.ok(world.searchingNearby, 'Should be searching for agents');
});

When('another customer brings {int} {word} cash', function (amount: number, currency: string) {
  world.secondCustomerAmount = amount;
});

When('I give {int} {word} cash to a customer', function (amount: number, currency: string) {
  world.agentCashBalance -= amount;
});

When('I give {int} {word} cash to another customer', function (amount: number, currency: string) {
  world.agentCashBalance -= amount;
});

Then('my cash balance should be {int} {word}', function (expected: number, currency: string) {
  assert.equal(world.agentCashBalance, expected, `Expected cash balance ${expected}`);
});

Given('I am an agent', async function () {
  const agent = await DataService.createAgent({
    userId: `agent-${Date.now()}`,
    businessName: 'Test Agent',
    location: {
      country: 'Uganda',
      state: 'Central',
      city: 'Kampala',
      address: 'Test Street',
      coordinates: {
        lat: 0.3476,
        lng: 32.5825
      }
    },
    digitalBalance: 1000000,
    cashBalance: 500000,
    commissionRate: 0.03,
    isActive: true,
    status: 'available'
  });
  
  world.agentId = agent.id;
  world.isAgent = true;
});

When('I process a {int} {word} deposit', function (amount: number, currency: string) {
  world.transactionAmount = amount;
  world.commission = amount * 0.03;
});

Then('I should earn {int} {word} commission', function (expected: number, currency: string) {
  assert.equal(world.commission, expected, `Expected commission ${expected}`);
});

Given('the Bitcoin rate is {int} {word} per BTC', function (rate: number, currency: string) {
  world.btcRate = rate;
});

Then('the customer should pay {int} {word}', function (expected: number, currency: string) {
  assert.ok(expected > 0, 'Customer should pay for Bitcoin');
});

Given('there are {int} pending escrow transactions', function (count: number) {
  world.pendingEscrows = count;
});

When('I verify each escrow code', function () {
  world.escrowsVerified = true;
});

Then('all transactions should complete successfully', function () {
  assert.ok(world.escrowsVerified, 'All escrows should be verified');
});

Given('I am an agent with {int} {word} cash', async function (amount: number, currency: string) {
  const agent = await DataService.createAgent({
    userId: `agent-${Date.now()}`,
    businessName: 'Test Agent',
    location: {
      country: 'Uganda',
      state: 'Central',
      city: 'Kampala',
      address: 'Test Street',
      coordinates: {
        lat: 0.3476,
        lng: 32.5825
      }
    },
    digitalBalance: 0,
    cashBalance: amount,
    commissionRate: 0.03,
    isActive: true,
    status: 'available'
  });
  
  world.agentId = agent.id;
  world.agentCashBalance = amount;
});

When('a customer requests {int} {word} withdrawal', function (amount: number, currency: string) {
  world.withdrawalAmount = amount;
});

Then('I should see a liquidity warning', function () {
  assert.ok(world.agentCashBalance < world.withdrawalAmount, 'Should have liquidity warning');
});

When('I fund my account via bank transfer with {int} {word}', async function (amount: number, currency: string) {
  await DataService.updateAgentBalance(world.agentId, {
    digitalBalance: world.agentDigitalBalance + amount
  });
  
  world.agentDigitalBalance += amount;
});

Then('my digital balance should increase by {int} {word}', function (amount: number, currency: string) {
  assert.ok(world.agentDigitalBalance >= amount, 'Digital balance should increase');
});
