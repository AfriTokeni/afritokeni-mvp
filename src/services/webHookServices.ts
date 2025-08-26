#!/usr/bin/env node

import { setDoc, getDoc } from '@junobuild/core';
import { nanoid } from 'nanoid';
import { User } from '../types/auth';
import { AnonymousIdentity } from "@dfinity/agent";
import type { SatelliteOptions } from "@junobuild/core";

const satellite:SatelliteOptions = {
  identity: new AnonymousIdentity,
  satelliteId: "uxrrr-q7777-77774-qaaaq-cai",
  container: true
};

// Interface for user data as stored in Juno (with string dates)
interface UserDataFromJuno {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'user' | 'agent';
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_started';
  pin?: string;
  createdAt: string;
}

// Transaction types for AfriTokeni
export interface Transaction {
  id: string;
  userId: string;
  type: 'send' | 'receive' | 'withdraw' | 'deposit';
  amount: number;
  fee?: number;
  currency: 'UGX';
  recipientId?: string;
  recipientPhone?: string;
  recipientName?: string;
  agentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  smsCommand?: string;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: {
    withdrawalCode?: string;
    agentLocation?: string;
    smsReference?: string;
  };
}

export interface UserBalance {
  userId: string;
  balance: number;
  currency: 'UGX';
  lastUpdated: Date;
}

export interface Agent {
  id: string;
  userId: string;
  businessName: string;
  location: {
    country: string;
    state: string;
    city: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isActive: boolean;
  status: 'available' | 'busy' | 'cash_out' | 'offline';
  cashBalance: number;
  digitalBalance: number;
  commissionRate: number;
  createdAt: Date;
}

export interface SMSMessage {
  id: string;
  userId?: string;
  phoneNumber: string;
  message: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  command?: string;
  transactionId?: string;
  createdAt: Date;
}

export interface UserPin {
  userId: string;
  phoneNumber: string;
  pin: string;
  isSet: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  userId?: string;
  currentMenu: 'pin_check' | 'pin_setup' | 'main_menu' | 'send_money' | 'check_balance' | 'withdraw_money' | 'transaction_history';
  step: number;
  tempData?: {
    newPin?: string;
    sendAmount?: number;
    sendRecipient?: string;
    withdrawAmount?: number;
    pinAttempts?: number;
  };
  createdAt: Date;
  lastActivity: Date;
  
  // Add session management methods
  isExpired(): boolean;
  updateActivity(): void;
}

// Simplified data service following Juno patterns
export class WebhookDataService {
  // User operations
  static async createUser(userData: {
    id?: string; // Optional ID, if not provided will generate new one
    firstName: string;
    lastName: string;
    email: string; // This will be the phone number for SMS users, or user ID for web users
    userType: 'user' | 'agent';
    kycStatus?: 'pending' | 'approved' | 'rejected' | 'not_started';
    pin?: string; // USSD PIN for mobile users
    authMethod?: 'sms' | 'web'; // To determine key strategy
  }): Promise<User> {
    const now = new Date();
    const newUser: User = {
      id: userData.id || nanoid(), // Use provided ID or generate new one
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      userType: userData.userType,
      isVerified: false,
      kycStatus: userData.kycStatus || 'not_started',
      pin: userData.pin,
      createdAt: now
    };

    // Convert Date fields to ISO strings for Juno storage
    const dataForJuno = {
      ...newUser,
      createdAt: now.toISOString()
    };

    // Determine key based on auth method
    // For web users: use ID as key
    // For SMS users: use phone number (email field) as key
    const documentKey = userData.authMethod === 'web' ? newUser.id : userData.email;

     const existingDoc = await getDoc({
        collection: 'users',
        key: documentKey,
        satellite
      });

    // Save user to Juno datastore
    await setDoc({
      collection: 'users',
      doc: {
        key: documentKey,
        data: dataForJuno,
        version: existingDoc?.version ? existingDoc.version : 1n
      },
      satellite
    });

    return newUser;
  }

  // Get user by key (either ID for web users or phone for SMS users)
  static async getUserByKey(key: string): Promise<User | null> {
    try {
      const doc = await getDoc({
        collection: 'users',
        key: key,
        satellite
      });

      if (!doc?.data) {
        return null;
      }

      // Convert string date back to Date object
      const rawData = doc.data as UserDataFromJuno;
      const user: User = {
        id: rawData.id,
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        email: rawData.email,
        userType: rawData.userType,
        isVerified: rawData.isVerified,
        kycStatus: rawData.kycStatus,
        pin: rawData.pin,
        createdAt: new Date(rawData.createdAt)
      };

      return user;
    } catch (error) {
      console.error('Error getting user by key:', error);
      return null;
    }
  }

  static async updateUser(key: string, updates: Partial<User>, _authMethod?: 'sms' | 'web'): Promise<boolean> {
    try {
      const existingUser = await this.getUserByKey(key);
      if (!existingUser) return false;

      // Get the current document to retrieve its version
      const existingDoc = await getDoc({
        collection: 'users',
        key: key,
        satellite
      });

      if (!existingDoc) return false;

      const updatedUser = { ...existingUser, ...updates };
      
      // Convert Date fields to ISO strings for Juno storage
      const dataForJuno = {
        ...updatedUser,
        createdAt: updatedUser.createdAt?.toISOString() || new Date().toISOString()
      };

      // Use the same key for updates with current version
      await setDoc({
        collection: 'users',
        doc: {
          key: key,
          data: dataForJuno,
          version: existingDoc.version ? existingDoc.version : 1n
        },
        satellite
      });

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // USSD Operations
  static async getUserPin(phoneNumber: string): Promise<UserPin | null> {
     console.log('Getting user by key:', satellite);
    try {
      // Get user by phone number (which is stored as email for SMS users)
      const user = await this.getUserByKey(phoneNumber);
      
      if (!user || !user.pin) {
        return null;
      }

      return {
        userId: user.id,
        phoneNumber: phoneNumber,
        pin: user.pin,
        isSet: true,
        createdAt: user.createdAt || new Date(),
        lastUpdated: user.createdAt || new Date()
      };
    } catch (error) {
      console.error('Error getting user pin:', error);
      return null;
    }
  }

  static async createOrUpdateUserPin(phoneNumber: string, pin: string, userId?: string): Promise<boolean> {
    try {
      // Get user by phone number (stored as email for SMS users)
      let user = await this.getUserByKey(phoneNumber);

      const sanitized_input = pin.split("*")[1];
      
      if (!user) {
        // Create new user if doesn't exist
        user = await this.createUser({
          firstName: 'USSD',
          lastName: 'User',
          email: phoneNumber,
          userType: 'user',
          pin: sanitized_input,
          authMethod: 'sms'
        });
        return true;
      } else {
        // Update existing user with PIN
        return await this.updateUser(phoneNumber, { pin: pin }, 'sms');
      }
    } catch (error) {
      console.error('Error creating/updating user pin:', error);
      return false;
    }
  }

    // Balance operations
    static async getUserBalance(userId: string): Promise<UserBalance | null> {
      try {
        const existingUser = await this.getUserByKey(userId);
        console.log(`Getting balance for user: ${existingUser?.id} ${userId}`); 
        if (!existingUser) {
            return null
        };
            
        const doc = await getDoc({
          collection: 'balances',
          key: existingUser.id,
          satellite
        });
        
        if (!doc?.data) {
          return null;
        }
  
        // Convert string date back to Date object
        const rawData = doc.data as {
          userId: string;
          balance: number;
          currency: 'UGX';
          lastUpdated: string;
        };
        const userBalance: UserBalance = {
          userId: rawData.userId,
          balance: rawData.balance,
          currency: rawData.currency,
          lastUpdated: new Date(rawData.lastUpdated)
        };
  
        return userBalance;
      } catch (error) {
        console.error('Error getting user balance:', error);
        return null;
      }
    }

    // Create or update user balance
    static async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
      try {
        const existingUser = await this.getUserByKey(userId);
        if (!existingUser) return false;

        // Get existing balance document
        const existingDoc = await getDoc({
          collection: 'balances',
          key: existingUser.id,
          satellite
        });

        const balanceData = {
          userId: existingUser.id,
          balance: newBalance,
          currency: 'UGX' as const,
          lastUpdated: new Date().toISOString()
        };

        // Save updated balance
        await setDoc({
          collection: 'balances',
          doc: {
            key: existingUser.id,
            data: balanceData,
            version: existingDoc?.version ? existingDoc.version : 1n
          },
          satellite
        });

        return true;
      } catch (error) {
        console.error('Error updating user balance:', error);
        return false;
      }
    }

    // Create a transaction record
    static async createTransaction(transactionData: {
      senderId: string;
      senderPhone: string;
      recipientId: string;
      recipientPhone: string;
      amount: number;
      fee: number;
      type: 'send' | 'receive';
      description?: string;
    }): Promise<string | null> {
      try {
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date();

        // Create sender transaction (outgoing)
        const senderTransaction = {
          id: `${transactionId}_out`,
          userId: transactionData.senderId,
          userPhone: transactionData.senderPhone,
          type: 'send' as const,
          amount: transactionData.amount,
          fee: transactionData.fee,
          currency: 'UGX' as const,
          recipientId: transactionData.recipientId,
          recipientPhone: transactionData.recipientPhone,
          status: 'completed' as const,
          description: transactionData.description || `Sent money to ${transactionData.recipientPhone}`,
          createdAt: now.toISOString(),
          completedAt: now.toISOString(),
          reference: transactionId
        };

        // Create recipient transaction (incoming)
        const recipientTransaction = {
          id: `${transactionId}_in`,
          userId: transactionData.recipientId,
          userPhone: transactionData.recipientPhone,
          type: 'receive' as const,
          amount: transactionData.amount,
          fee: 0, // Recipients don't pay fees
          currency: 'UGX' as const,
          senderId: transactionData.senderId,
          senderPhone: transactionData.senderPhone,
          status: 'completed' as const,
          description: transactionData.description || `Received money from ${transactionData.senderPhone}`,
          createdAt: now.toISOString(),
          completedAt: now.toISOString(),
          reference: transactionId
        };

        // Save both transactions
        await setDoc({
          collection: 'transactions',
          doc: {
            key: senderTransaction.id,
            data: senderTransaction
          },
          satellite
        });

        await setDoc({
          collection: 'transactions',
          doc: {
            key: recipientTransaction.id,
            data: recipientTransaction
          },
          satellite
        });

        console.log(`✅ Transactions created: ${transactionId}`);
        return transactionId;
      } catch (error) {
        console.error('Error creating transactions:', error);
        return null;
      }
    }

    // Process complete money transfer
    static async processSendMoney(senderPhone: string, recipientPhone: string, amount: number, fee: number): Promise<{
      success: boolean;
      transactionId?: string;
      error?: string;
    }> {
      console.log(`Processing send money: ${senderPhone} -> ${recipientPhone}, Amount: ${amount}, Fee: ${fee}`);
      try {
        // Get sender and recipient users
        const sender = await this.getUserByKey(senderPhone);
        const recipient = await this.getUserByKey(recipientPhone);

        if (!sender) {
          return { success: false, error: 'Sender not found' };
        }

        if (!recipient) {
          return { success: false, error: 'Recipient not found' };
        }

        // Get current balances
        const senderBalance = await this.getUserBalance(senderPhone);
        const recipientBalance = await this.getUserBalance(recipientPhone);

        if (!senderBalance) {
          return { success: false, error: 'Sender balance not found' };
        }

        const totalRequired = amount + fee;
        if (senderBalance.balance < totalRequired) {
          return { success: false, error: 'Insufficient balance' };
        }

        // Calculate new balances
        const newSenderBalance = senderBalance.balance - totalRequired;
        const newRecipientBalance = (recipientBalance?.balance || 0) + amount;

        // Update balances
        const senderBalanceUpdated = await this.updateUserBalance(sender.id, newSenderBalance);
        const recipientBalanceUpdated = await this.updateUserBalance(recipient.id, newRecipientBalance);

        if (!senderBalanceUpdated || !recipientBalanceUpdated) {
          return { success: false, error: 'Failed to update balances' };
        }

        // Create transaction records
        const transactionId = await this.createTransaction({
          senderId: sender.id,
          senderPhone: senderPhone,
          recipientId: recipient.id,
          recipientPhone: recipientPhone,
          amount: amount,
          fee: fee,
          type: 'send',
          description: `Money transfer: ${amount} UGX`
        });

        if (!transactionId) {
          return { success: false, error: 'Failed to create transaction record' };
        }

        console.log(`✅ Money transfer completed: ${senderPhone} -> ${recipientPhone}, Amount: ${amount}, Fee: ${fee}, TxID: ${transactionId}`);

        return {
          success: true,
          transactionId: transactionId
        };
      } catch (error) {
        console.error('Error processing send money:', error);
        return { success: false, error: 'Transaction processing failed' };
      }
    }
}
