/**
 * AfriTokeni Real-World Financial System Test Suite
 * Tests all core financial flows to ensure the system works without hardcoded data
 */

import { BalanceService } from './src/services/BalanceService.js';
import { TransactionService } from './src/services/TransactionService.js';

class FinancialSystemTester {
  constructor() {
    this.testResults = [];
    this.userId1 = 'test_user_001';
    this.userId2 = 'test_user_002';
    this.agentId = 'test_agent_001';
  }

  log(test, status, message) {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
  }

  async runAllTests() {
    console.log('🚀 Starting AfriTokeni Financial System Tests...\n');

    try {
      await this.testInitialBalances();
      await this.testDepositFlow();
      await this.testBalanceCalculation();
      await this.testSendMoneyFlow();
      await this.testWithdrawalFlow();
      await this.testMultiCurrencySupport();
      await this.testTransactionHistory();
      
      this.printSummary();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testInitialBalances() {
    console.log('📊 Testing Initial Balance System...');
    
    // Test 1: New users should have zero balance
    const initialBalance = BalanceService.calculateBalance(this.userId1, 'NGN');
    if (initialBalance === 0) {
      this.log('Initial Balance', 'PASS', 'New users start with zero balance');
    } else {
      this.log('Initial Balance', 'FAIL', `Expected 0, got ${initialBalance}`);
    }

    // Test 2: Multi-currency balances should all be zero initially
    const allBalances = BalanceService.calculateAllBalances(this.userId1);
    const hasNonZeroBalance = Object.values(allBalances).some(balance => balance !== 0);
    if (!hasNonZeroBalance) {
      this.log('Multi-Currency Initial', 'PASS', 'All currencies start at zero');
    } else {
      this.log('Multi-Currency Initial', 'FAIL', 'Found non-zero initial balances');
    }
  }

  async testDepositFlow() {
    console.log('💰 Testing Deposit Flow...');

    // Test 3: Process a deposit
    const depositAmount = 50000;
    const depositTx = BalanceService.processDeposit(this.userId1, depositAmount, 'NGN', this.agentId);
    
    if (depositTx && depositTx.type === 'deposit') {
      this.log('Deposit Transaction', 'PASS', 'Deposit transaction created successfully');
    } else {
      this.log('Deposit Transaction', 'FAIL', 'Failed to create deposit transaction');
      return;
    }

    // Test 4: Verify balance updated correctly
    const balanceAfterDeposit = BalanceService.calculateBalance(this.userId1, 'NGN');
    if (balanceAfterDeposit === depositAmount) {
      this.log('Balance After Deposit', 'PASS', `Balance correctly updated to ${depositAmount}`);
    } else {
      this.log('Balance After Deposit', 'FAIL', `Expected ${depositAmount}, got ${balanceAfterDeposit}`);
    }
  }

  async testBalanceCalculation() {
    console.log('🧮 Testing Balance Calculations...');

    // Test 5: Multiple deposits should accumulate
    const secondDeposit = 25000;
    BalanceService.processDeposit(this.userId1, secondDeposit, 'NGN', this.agentId);
    
    const totalExpected = 50000 + 25000;
    const actualBalance = BalanceService.calculateBalance(this.userId1, 'NGN');
    
    if (actualBalance === totalExpected) {
      this.log('Cumulative Balance', 'PASS', `Multiple deposits correctly accumulated to ${totalExpected}`);
    } else {
      this.log('Cumulative Balance', 'FAIL', `Expected ${totalExpected}, got ${actualBalance}`);
    }

    // Test 6: Sufficient balance check
    const hasSufficient = BalanceService.hasSufficientBalance(this.userId1, 30000, 'NGN');
    if (hasSufficient) {
      this.log('Sufficient Balance Check', 'PASS', 'Correctly identified sufficient balance');
    } else {
      this.log('Sufficient Balance Check', 'FAIL', 'Failed to identify sufficient balance');
    }
  }

  async testSendMoneyFlow() {
    console.log('💸 Testing Send Money Flow...');

    // Setup: Give user2 some initial balance for testing
    BalanceService.processDeposit(this.userId2, 10000, 'NGN', this.agentId);

    // Test 7: Send money using TransactionService
    try {
      const sendResult = await TransactionService.processSendMoney({
        fromUserId: this.userId1,
        toUserPhone: '+234801234567',
        amount: 20000,
        currency: 'NGN',
        description: 'Test transfer'
      });

      if (sendResult.success) {
        this.log('Send Money Transaction', 'PASS', 'Send money processed successfully');
      } else {
        this.log('Send Money Transaction', 'FAIL', `Send failed: ${sendResult.message}`);
        return;
      }
    } catch (error) {
      this.log('Send Money Transaction', 'FAIL', `Send error: ${error.message}`);
      return;
    }

    // Test 8: Verify sender balance decreased
    const senderBalance = BalanceService.calculateBalance(this.userId1, 'NGN');
    const expectedSenderBalance = 75000 - 20000; // 75000 from deposits minus 20000 sent
    
    if (senderBalance === expectedSenderBalance) {
      this.log('Sender Balance Update', 'PASS', `Sender balance correctly reduced to ${senderBalance}`);
    } else {
      this.log('Sender Balance Update', 'FAIL', `Expected ${expectedSenderBalance}, got ${senderBalance}`);
    }
  }

  async testWithdrawalFlow() {
    console.log('🏧 Testing Withdrawal Flow...');

    // Test 9: Process withdrawal using TransactionService
    try {
      const withdrawResult = await TransactionService.processWithdrawal(
        this.userId1, 
        15000, 
        'NGN', 
        this.agentId
      );

      if (withdrawResult.success && withdrawResult.withdrawalCode) {
        this.log('Withdrawal Transaction', 'PASS', `Withdrawal processed with code: ${withdrawResult.withdrawalCode}`);
      } else {
        this.log('Withdrawal Transaction', 'FAIL', `Withdrawal failed: ${withdrawResult.message}`);
        return;
      }
    } catch (error) {
      this.log('Withdrawal Transaction', 'FAIL', `Withdrawal error: ${error.message}`);
      return;
    }

    // Test 10: Verify balance decreased after withdrawal
    const balanceAfterWithdrawal = BalanceService.calculateBalance(this.userId1, 'NGN');
    const expectedBalance = 55000 - 15000; // Previous balance minus withdrawal
    
    if (balanceAfterWithdrawal === expectedBalance) {
      this.log('Balance After Withdrawal', 'PASS', `Balance correctly reduced to ${balanceAfterWithdrawal}`);
    } else {
      this.log('Balance After Withdrawal', 'FAIL', `Expected ${expectedBalance}, got ${balanceAfterWithdrawal}`);
    }
  }

  async testMultiCurrencySupport() {
    console.log('🌍 Testing Multi-Currency Support...');

    // Test 11: Deposit in different currency
    BalanceService.processDeposit(this.userId1, 10000, 'KES', this.agentId);
    
    const kesBalance = BalanceService.calculateBalance(this.userId1, 'KES');
    if (kesBalance === 10000) {
      this.log('Multi-Currency Deposit', 'PASS', 'KES deposit processed correctly');
    } else {
      this.log('Multi-Currency Deposit', 'FAIL', `Expected 10000 KES, got ${kesBalance}`);
    }

    // Test 12: Verify currencies are isolated
    const ngnBalance = BalanceService.calculateBalance(this.userId1, 'NGN');
    if (ngnBalance !== kesBalance) {
      this.log('Currency Isolation', 'PASS', 'Different currencies maintain separate balances');
    } else {
      this.log('Currency Isolation', 'FAIL', 'Currency balances are not properly isolated');
    }
  }

  async testTransactionHistory() {
    console.log('📋 Testing Transaction History...');

    // Test 13: Retrieve transaction history
    const transactions = TransactionService.getUserTransactions(this.userId1);
    
    if (transactions && transactions.length > 0) {
      this.log('Transaction History', 'PASS', `Retrieved ${transactions.length} transactions`);
    } else {
      this.log('Transaction History', 'FAIL', 'No transaction history found');
      return;
    }

    // Test 14: Verify transaction types are correct
    const hasDeposit = transactions.some(tx => tx.type === 'deposit');
    const hasSend = transactions.some(tx => tx.type === 'send');
    const hasWithdrawal = transactions.some(tx => tx.type === 'withdrawal');

    if (hasDeposit && hasSend && hasWithdrawal) {
      this.log('Transaction Types', 'PASS', 'All transaction types present in history');
    } else {
      this.log('Transaction Types', 'FAIL', 'Missing transaction types in history');
    }

    // Test 15: Verify balance calculation matches transaction history
    const calculatedFromHistory = transactions
      .filter(tx => tx.currency === 'NGN')
      .reduce((sum, tx) => {
        switch (tx.type) {
          case 'deposit':
          case 'receive':
            return sum + tx.amount;
          case 'withdrawal':
          case 'send':
            return sum - tx.amount;
          default:
            return sum;
        }
      }, 0);

    const currentBalance = BalanceService.calculateBalance(this.userId1, 'NGN');
    
    if (calculatedFromHistory === currentBalance) {
      this.log('Balance Consistency', 'PASS', 'Balance matches transaction history calculation');
    } else {
      this.log('Balance Consistency', 'FAIL', `History: ${calculatedFromHistory}, Balance: ${currentBalance}`);
    }
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The real-world financial system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

// Run the tests
const tester = new FinancialSystemTester();
tester.runAllTests().catch(console.error);
