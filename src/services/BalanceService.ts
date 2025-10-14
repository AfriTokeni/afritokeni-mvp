import { getDoc, setDoc } from '@junobuild/core';
import { TransactionService } from './TransactionService';

export interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export class BalanceService {
  static async getUserBalance(userId: string): Promise<UserBalance | null> {
    try {
      const doc = await getDoc({
        collection: 'balances',
        key: userId
      });
      
      if (!doc?.data) return null;

      const rawData = doc.data as {
        userId: string;
        balance: number;
        currency: string;
        lastUpdated: string;
      };

      return {
        userId: rawData.userId,
        balance: rawData.balance,
        currency: rawData.currency,
        lastUpdated: new Date(rawData.lastUpdated)
      };
    } catch (error) {
      console.error('Error getting user balance:', error);
      return null;
    }
  }

  static async updateUserBalance(userId: string, balance: number, currency: string = 'UGX'): Promise<boolean> {
    try {
      const now = new Date();
      const userBalance: UserBalance = {
        userId,
        balance,
        currency,
        lastUpdated: now
      };

      const dataForJuno = {
        ...userBalance,
        lastUpdated: now.toISOString()
      };

      const existingDoc = await getDoc({
        collection: 'balances',
        key: userId
      });

      await setDoc({
        collection: 'balances',
        doc: {
          key: userId,
          data: dataForJuno,
          version: existingDoc?.version ? existingDoc.version : 1n
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating user balance:', error);
      return false;
    }
  }

  static async getBalance(userId: string, currency: string): Promise<number> {
    const balance = await this.getUserBalance(userId);
    return balance?.balance || 0;
  }

  static async transfer(
    senderId: string,
    recipientId: string,
    amount: number,
    currency: string
  ): Promise<void> {
    const senderBalance = await this.getUserBalance(senderId);
    if (!senderBalance || senderBalance.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.updateUserBalance(senderId, senderBalance.balance - amount);

    const recipientBalance = await this.getUserBalance(recipientId);
    const newRecipientBalance = (recipientBalance?.balance || 0) + amount;
    await this.updateUserBalance(recipientId, newRecipientBalance);

    await TransactionService.createTransaction({
      userId: senderId,
      type: 'send',
      amount,
      currency,
      recipientId,
      status: 'completed',
      description: `Transfer to ${recipientId}`
    });
  }

  static async transferWithConversion(
    senderId: string,
    recipientId: string,
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<void> {
    const conversionRate = 0.03;
    const convertedAmount = amount * conversionRate;

    const senderBalance = await this.getUserBalance(senderId);
    if (!senderBalance || senderBalance.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.updateUserBalance(senderId, senderBalance.balance - amount);

    const recipientBalance = await this.getUserBalance(recipientId);
    const newRecipientBalance = (recipientBalance?.balance || 0) + convertedAmount;
    await this.updateUserBalance(recipientId, newRecipientBalance);

    await TransactionService.createTransaction({
      userId: senderId,
      type: 'send',
      amount,
      currency: fromCurrency,
      recipientId,
      status: 'completed',
      description: `Cross-currency transfer: ${amount} ${fromCurrency} → ${convertedAmount} ${toCurrency}`
    });
  }
}
