/**
 * SMS Data Adapter
 * Bridges SMS commands with real DataService methods
 * Handles multi-currency and pan-African support
 */

import { DataService } from './dataService';
import { BitcoinService } from './bitcoinService';
import { getCurrencyFromPhone } from '../utils/africanPhoneNumbers';
import { AfricanCurrency } from '../types/currency';

export class SMSDataAdapter {
  /**
   * Get user by phone number (SMS users)
   */
  static async getUserByPhone(phoneNumber: string) {
    return await DataService.getUser(phoneNumber);
  }

  /**
   * Create SMS user
   */
  static async createUser(phoneNumber: string, name: string) {
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    return await DataService.createUser({
      firstName,
      lastName,
      email: phoneNumber, // Phone stored as email for SMS users
      userType: 'user',
      kycStatus: 'not_started',
      authMethod: 'sms',
    });
  }

  /**
   * Get user balance with currency detection
   */
  static async getBalance(userId: string, phoneNumber?: string): Promise<{ amount: number; currency: AfricanCurrency }> {
    const balanceData = await DataService.getUserBalance(userId);
    
    // Detect currency from phone number if available
    let currency: AfricanCurrency = 'UGX'; // Default
    if (phoneNumber) {
      const detectedCurrency = getCurrencyFromPhone(phoneNumber);
      if (detectedCurrency) {
        currency = detectedCurrency as AfricanCurrency;
      }
    }
    
    // Use balance currency if available
    if (balanceData && balanceData.currency) {
      currency = balanceData.currency;
    }
    
    return {
      amount: balanceData?.balance || 0,
      currency,
    };
  }

  /**
   * Transfer money between users
   */
  static async transferMoney(
    senderId: string,
    recipientId: string,
    amount: number,
    currency: AfricanCurrency
  ): Promise<void> {
    // Create send transaction
    await DataService.createTransaction({
      userId: senderId,
      type: 'send',
      amount,
      currency,
      recipientId,
      status: 'completed',
    });

    // Create receive transaction
    await DataService.createTransaction({
      userId: recipientId,
      type: 'receive',
      amount,
      currency,
      status: 'completed',
    });

    // Update balances
    const senderBalance = await DataService.getUserBalance(senderId);
    const recipientBalance = await DataService.getUserBalance(recipientId);

    await DataService.updateUserBalance(
      senderId,
      (senderBalance?.balance || 0) - amount
    );

    await DataService.updateUserBalance(
      recipientId,
      (recipientBalance?.balance || 0) + amount
    );
  }

  /**
   * Get Bitcoin balance
   */
  static async getBitcoinBalance(userId: string): Promise<number> {
    return await BitcoinService.getBitcoinBalance(userId);
  }

  /**
   * Get Bitcoin exchange rate (returns BTC to local currency rate)
   */
  static async getBitcoinRate(currency: AfricanCurrency): Promise<number> {
    const exchangeRate = await BitcoinService.getExchangeRate(currency);
    return exchangeRate.btcToLocal;
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(userId: string, limit: number = 5) {
    const allTransactions = await DataService.getUserTransactions(userId);
    return allTransactions.slice(0, limit);
  }

  /**
   * Create withdrawal request
   */
  static async createWithdrawalRequest(data: {
    userId: string;
    amount: number;
    currency: AfricanCurrency;
    code: string;
  }) {
    return await DataService.createTransaction({
      userId: data.userId,
      type: 'withdraw',
      amount: data.amount,
      currency: data.currency,
      status: 'pending',
      metadata: {
        withdrawalCode: data.code,
      },
    });
  }

  /**
   * Store pending transaction (for Bitcoin confirmations)
   */
  static async storePendingTransaction(data: {
    userId: string;
    type: string;
    amount: number;
    currency: AfricanCurrency;
    fee: number;
    confirmationCode: string;
    expiresAt: Date;
  }) {
    // Store as pending transaction
    return await DataService.createTransaction({
      userId: data.userId,
      type: data.type as any,
      amount: data.amount,
      currency: data.currency,
      fee: data.fee,
      status: 'pending',
      metadata: {
        confirmationCode: data.confirmationCode,
        expiresAt: data.expiresAt.toISOString(),
      },
    });
  }

  /**
   * Get pending transaction by confirmation code
   */
  static async getPendingTransaction(userId: string, code: string) {
    const transactions = await DataService.getUserTransactions(userId);
    return transactions.find(
      (txn) =>
        txn.status === 'pending' &&
        txn.metadata?.confirmationCode === code
    );
  }

  /**
   * Execute pending transaction
   */
  static async executePendingTransaction(transactionId: string) {
    return await DataService.updateTransaction(transactionId, {
      status: 'completed',
    });
  }

  /**
   * Log SMS message
   */
  static async logSMSMessage(data: {
    userId: string;
    phoneNumber: string;
    message: string;
    direction: 'inbound' | 'outbound';
    command?: string;
  }) {
    return await DataService.logSMSMessage({
      userId: data.userId,
      phoneNumber: data.phoneNumber,
      message: data.message,
      direction: data.direction,
      command: data.command,
      status: 'delivered',
    });
  }
}
