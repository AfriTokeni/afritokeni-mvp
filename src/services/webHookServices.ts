#!/usr/bin/env node

import { setDoc, getDoc, listDocs } from '@junobuild/core';
import { nanoid } from 'nanoid';
import { User } from '../types/auth';
import { AnonymousIdentity } from "@dfinity/agent";
import type { SatelliteOptions } from "@junobuild/core";
import { AfricanCurrency } from '../types/currency';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { createCipheriv, scryptSync, randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Node.js process declaration for environment variables
// declare const process: {
//   env: {
//     [key: string]: string | undefined;
//     NODE_ENV?: string;
//   };
// };

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

// Deposit Request interface for USSD/SMS deposit requests
export interface DepositRequest {
  id: string;
  userId: string;
  agentId: string;
  amount: number;
  currency: string;
  depositCode: string;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
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


// Bitcoin wallet and transaction interfaces
export interface BitcoinWallet {
  id: string;
  userId: string;
  address: string;
  privateKey?: string; // For POC - in production use threshold signatures
  balance: number; // in satoshis
  createdAt: Date;
}

export interface BitcoinTransaction {
  id: string;
  userId: string;
  agentId?: string;
  type: 'bitcoin_to_local' | 'local_to_bitcoin' | 'bitcoin_send' | 'bitcoin_receive';
  bitcoinAmount: number; // in satoshis
  localAmount?: number; // equivalent local currency amount
  localCurrency: AfricanCurrency; // The local African currency being exchanged
  exchangeRate: number; // BTC to local currency rate at time of transaction
  bitcoinTxHash?: string; // actual Bitcoin network transaction hash
  fromAddress?: string;
  toAddress?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  confirmations: number;
  fee: number; // Bitcoin network fee in satoshis
  agentFee?: number; // Agent commission in local currency
  createdAt: Date;
  confirmedAt?: Date;
  metadata?: {
    smsReference?: string;
    exchangeMethod?: 'agent_cash' | 'agent_digital';
    agentLocation?: string;
  };
}

export interface ExchangeRate {
  btcToLocal: number;
  localToBtc: number;
  currency: AfricanCurrency;
  lastUpdated: Date;
  source: string;
}

export interface MultiCurrencyExchangeRates {
  [currency: string]: ExchangeRate;
}

// Helper function for currency formatting
const formatCurrencyAmount = (amount: number, currency: string): string => {
  return `${amount.toFixed(2)} ${currency}`;
};

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

  // Find user by phone number - handles both SMS users (phone as key) and web users (phone in email field)
  static async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    try {
      // First try to get user directly by phone number (SMS users)
      let user = await this.getUserByKey(phoneNumber);
      if (user) {
        return user;
      }

      // Try with + prefix
      user = await this.getUserByKey(`+${phoneNumber}`);
      if (user) {
        return user;
      }

      // Try with various phone number formats
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('256')) {
        const withPlus = `+${cleanPhone}`;
        user = await this.getUserByKey(withPlus);
        if (user) {
          return user;
        }
      }

      // If not found as direct key, search for web users where phone number is in email field
      console.log(`Phone number ${phoneNumber} not found as direct key. Searching web users...`);
      
      try {
        // List all users to search through them
        const userDocs = await listDocs({
          collection: 'users',
          satellite
        });

        console.log(`Searching through ${userDocs.items.length} users for phone: ${phoneNumber}`);

        // Search through all users to find one with matching phone number in email field
        for (const doc of userDocs.items) {
          const userData = doc.data as UserDataFromJuno;
          
          // Check if email field matches the phone number (for web users)
          if (userData.email === phoneNumber || 
              userData.email === `+${phoneNumber}` ||
              userData.email === `+${cleanPhone}` ||
              userData.email === cleanPhone) {
            
            console.log(`Found web user: ${userData.firstName} ${userData.lastName} with phone ${userData.email}`);
            
            // Convert and return the user
            const foundUser: User = {
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              userType: userData.userType,
              isVerified: userData.isVerified,
              kycStatus: userData.kycStatus,
              pin: userData.pin,
              createdAt: new Date(userData.createdAt)
            };
            
            return foundUser;
          }
        }
        
        console.log(`No web user found with phone number: ${phoneNumber}`);
        return null;
        
      } catch (searchError) {
        console.error('Error searching web users:', searchError);
        // Fall back to original behavior if search fails
        console.log(`Unable to search for user with phone ${phoneNumber}. Search functionality failed.`);
        return null;
      }
      
    } catch (error) {
      console.error('Error finding user by phone number:', error);
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

  static async createOrUpdateUserPin(phoneNumber: string, pin: string, _userId?: string): Promise<boolean> {
    try {
      console.log(`📍 createOrUpdateUserPin called with: ${phoneNumber}, PIN: ${pin}`);
      
      // Get user by phone number (stored as email for SMS users)
      let user = await this.getUserByKey(phoneNumber);
      console.log(`📍 User lookup result for ${phoneNumber}:`, user ? 'Found' : 'Not found');

      // Use the PIN as-is, no parsing needed since server already processes it
      const cleanPin = pin.trim();
      console.log(`📍 Clean PIN for storage: ${cleanPin}`);
      
      if (!user) {
        console.log(`📍 Creating new user for ${phoneNumber} with PIN`);
        // Create new user if doesn't exist
        user = await this.createUser({
          firstName: 'USSD',
          lastName: 'User',
          email: phoneNumber,
          userType: 'user',
          pin: cleanPin,
          authMethod: 'sms'
        });
        console.log(`📍 New user created successfully for ${phoneNumber}`);
        return true;
      } else {
        console.log(`📍 Updating existing user ${phoneNumber} with PIN`);
        // Update existing user with PIN
        const updateResult = await this.updateUser(phoneNumber, { pin: cleanPin }, 'sms');
        console.log(`📍 PIN update result for ${phoneNumber}:`, updateResult ? 'Success' : 'Failed');
        return updateResult;
      }
    } catch (error) {
      console.error('Error creating/updating user pin:', error);
      return false;
    }
  }

    // Balance operations
    static async getUserBalance(userIdentifier: string): Promise<UserBalance | null> {
      try {
        // First try to get user by the identifier (could be user ID or phone number)
        let user = await this.getUserByKey(userIdentifier);
        
        // If not found by direct key lookup, try to find by phone number
        if (!user) {
          console.log(`User not found by key ${userIdentifier}, trying phone number search...`);
          user = await this.findUserByPhoneNumber(userIdentifier);
        }
        
        console.log(`Getting balance for user: ${user?.id} (searched with: ${userIdentifier})`); 
        if (!user) {
            console.log(`User not found with identifier: ${userIdentifier}`);
            return null;
        }
            
        const doc = await getDoc({
          collection: 'balances',
          key: user.id, // Always use the actual user ID for balance lookup
          satellite
        });
        
        if (!doc?.data) {
          console.log(`No balance document found for user ID: ${user.id}`);
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
  
        console.log(`Found balance for user ${user.firstName} ${user.lastName}: UGX ${userBalance.balance}`);
        return userBalance;
      } catch (error) {
        console.error('Error getting user balance:', error);
        return null;
      }
    }

    // Create or update user balance
    static async updateUserBalance(userIdentifier: string, newBalance: number): Promise<boolean> {
      try {
        // First try to get user by the identifier (could be user ID or phone number)
        let user = await this.getUserByKey(userIdentifier);
        
        // If not found by direct key lookup, try to find by phone number
        if (!user) {
          console.log(`User not found by key ${userIdentifier}, trying phone number search for balance update...`);
          user = await this.findUserByPhoneNumber(userIdentifier);
        }
        
        if (!user) {
          console.log(`User not found with identifier: ${userIdentifier} for balance update`);
          return false;
        }

        console.log(`Updating balance for user: ${user.firstName} ${user.lastName} (ID: ${user.id}) to UGX ${newBalance}`);

        // Get existing balance document using the actual user ID
        const existingDoc = await getDoc({
          collection: 'balances',
          key: user.id, // Always use the actual user ID for balance operations
          satellite
        });

        const balanceData = {
          userId: user.id, // Always use the actual user ID
          balance: newBalance,
          currency: 'UGX' as const,
          lastUpdated: new Date().toISOString()
        };

        // Save updated balance
        await setDoc({
          collection: 'balances',
          doc: {
            key: user.id, // Always use the actual user ID as the document key
            data: balanceData,
            version: existingDoc?.version ? existingDoc.version : 1n
          },
          satellite
        });

        console.log(`✅ Balance updated successfully for user ${user.firstName} ${user.lastName}: UGX ${newBalance}`);
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
          description:`Sent money to ${transactionData.recipientPhone}`,
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
          description:`Received money from ${transactionData.senderPhone}`,
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
        // Get sender and recipient users using the new search method
        const sender = await this.findUserByPhoneNumber(senderPhone);
        const recipient = await this.findUserByPhoneNumber(recipientPhone);

        if (!sender) {
          return { success: false, error: 'Sender not found' };
        }

        if (!recipient) {
          return { success: false, error: 'Recipient not found' };
        }

        console.log(`Found sender: ${sender.firstName} ${sender.lastName} (ID: ${sender.id})`);
        console.log(`Found recipient: ${recipient.firstName} ${recipient.lastName} (ID: ${recipient.id})`);

        // Get current balances using the user IDs (not phone numbers)
        const senderBalance = await this.getUserBalance(senderPhone);
        const recipientBalance = await this.getUserBalance(recipient.id);

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

        console.log(`Updating balances - Sender: ${newSenderBalance}, Recipient: ${newRecipientBalance}`);

        // Update balances
        const senderBalanceUpdated = await this.updateUserBalance(senderPhone, newSenderBalance);
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

    // Agent operations
    static async getAvailableAgents(): Promise<Agent[]> {
      try {
        const agentDocs = await listDocs({
          collection: 'agents',
          satellite
        });

        const agents: Agent[] = agentDocs.items
          .map(doc => doc.data as any)
          .filter(agent => agent.isActive && agent.status === 'available')
          .map(rawAgent => ({
            id: rawAgent.id,
            userId: rawAgent.userId,
            businessName: rawAgent.businessName,
            location: rawAgent.location,
            isActive: rawAgent.isActive,
            status: rawAgent.status,
            cashBalance: rawAgent.cashBalance,
            digitalBalance: rawAgent.digitalBalance,
            commissionRate: rawAgent.commissionRate,
            createdAt: new Date(rawAgent.createdAt)
          }))
          .slice(0, 10); // Limit to 10 agents for USSD display

        console.log(`Found ${agents.length} available agents`);
        return agents;
      } catch (error) {
        console.error('Error getting available agents:', error);
        return [];
      }
    }

    static async getAgentById(agentId: string): Promise<Agent | null> {
      try {
        const doc = await getDoc({
          collection: 'agents',
          key: agentId,
          satellite
        });

        if (!doc?.data) {
          return null;
        }

        const rawAgent = doc.data as any;
        return {
          id: rawAgent.id,
          userId: rawAgent.userId,
          businessName: rawAgent.businessName,
          location: rawAgent.location,
          isActive: rawAgent.isActive,
          status: rawAgent.status,
          cashBalance: rawAgent.cashBalance,
          digitalBalance: rawAgent.digitalBalance,
          commissionRate: rawAgent.commissionRate,
          createdAt: new Date(rawAgent.createdAt)
        };
      } catch (error) {
        console.error('Error getting agent by ID:', error);
        return null;
      }
    }

    // Create a withdrawal transaction
    static async createWithdrawTransaction(userId: string, amount: number, agentId: string, withdrawalCode: string): Promise<string | null> {
      try {
        const transactionId = `withdraw_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date();

        const transaction = {
          id: transactionId,
          userId: userId,
          type: 'withdraw' as const,
          amount: amount,
          fee: Math.round(amount * 0.01), // 1% fee
          currency: 'UGX' as const,
          agentId: agentId,
          status: 'pending' as const,
          description: `Cash withdrawal of UGX ${amount.toLocaleString()}`,
          createdAt: now.toISOString(),
          metadata: {
            withdrawalCode: withdrawalCode,
            agentLocation: 'Agent location' // Will be populated with actual agent location
          }
        };

        await setDoc({
          collection: 'transactions',
          doc: {
            key: transactionId,
            data: transaction
          },
          satellite
        });

        console.log(`✅ Withdrawal transaction created: ${transactionId}`);
        return transactionId;
      } catch (error) {
        console.error('Error creating withdrawal transaction:', error);
        return null;
      }
    }

    // Get user transaction history
    static async getUserTransactions(phoneNumber: string, limit: number = 5): Promise<Transaction[]> {
      console.log(`Getting transaction history for ${phoneNumber}, limit: ${limit}`);
      try {
        // Find the user first to get their ID
        const user = await this.findUserByPhoneNumber(phoneNumber);
        if (!user) {
          console.log(`No user found for phone number: ${phoneNumber}`);
          return [];
        }

        console.log(`Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

        // Get all transactions from the collection
        const transactionsResponse = await listDocs({
          collection: 'transactions',
          satellite
        });

        if (!transactionsResponse || !transactionsResponse.items) {
          console.log('No transactions found in collection');
          return [];
        }

        console.log(`Found ${transactionsResponse.items.length} total transactions in collection`);

        // Filter transactions for this user and sort by creation date (newest first)
        const userTransactions: Transaction[] = transactionsResponse.items
          .filter(item => {
            const data = item.data as any;
            // Match by userId OR userPhone (for backward compatibility)
            return data.userId === user.id || 
                   data.userPhone === phoneNumber || 
                   data.userPhone === `+${phoneNumber}` ||
                   data.userPhone === phoneNumber.replace('+', '');
          })
          .map(item => {
            const data = item.data as any;
            return {
              id: data.id,
              userId: data.userId,
              type: data.type,
              amount: data.amount,
              fee: data.fee || 0,
              currency: data.currency || 'UGX',
              recipientId: data.recipientId,
              recipientPhone: data.recipientPhone,
              recipientName: data.recipientName,
              agentId: data.agentId,
              status: data.status,
              smsCommand: data.smsCommand,
              description: data.description,
              createdAt: new Date(data.createdAt),
              completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
              metadata: data.metadata
            } as Transaction;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort by newest first
          .slice(0, limit); // Take only the requested number

        console.log(`Found ${userTransactions.length} transactions for user ${user.firstName} ${user.lastName}`);
        return userTransactions;

      } catch (error) {
        console.error('Error getting user transactions:', error);
        return [];
      }
    }

    // Verify user PIN
    static async verifyUserPin(phoneNumber: string, pin: string): Promise<boolean> {
      console.log(`Verifying PIN for ${phoneNumber}: ${pin}`);
      try {
        const userPin = await this.getUserPin(`+${phoneNumber}`);
        if (!userPin) {
          return false;
        }

        return userPin.pin === pin;
      } catch (error) {
        console.error('Error verifying user PIN:', error);
        return false;
      }
    }

    // Create deposit request for USSD/SMS users
    static async createDepositRequest(
      userId: string,
      agentId: string,
      amount: number,
      currency: string,
      depositCode: string
    ): Promise<string> {
      try {
        const now = new Date();
        const requestId = `dep_${nanoid()}`;
        
        const depositRequest: DepositRequest = {
          id: requestId,
          userId,
          agentId,
          amount,
          currency,
          depositCode,
          status: 'pending',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };

        await setDoc({
          collection: 'deposit_requests',
          doc: {
            key: requestId,
            data: depositRequest,
            version: 1n
          },
          satellite
        });

        console.log(`✅ Created deposit request ${requestId} for user ${userId}, agent ${agentId}, amount ${amount} ${currency}`);
        return requestId;
      } catch (error) {
        console.error('❌ Error creating deposit request:', error);
        throw error;
      }
    }

    // Get deposit requests for an agent
    static async getAgentDepositRequests(agentId: string, status?: string): Promise<DepositRequest[]> {
      try {
        console.log('🔍 getAgentDepositRequests called with:', { agentId, status });
        const docs = await listDocs({
          collection: 'deposit_requests',
          satellite
        });
        
        console.log('🔍 Retrieved docs from deposit_requests collection:', docs);
        console.log('🔍 Number of docs.items:', docs.items?.length || 0);
        
        // Log all deposit requests for debugging
        if (docs.items && docs.items.length > 0) {
          console.log('🔍 All deposit requests in datastore:');
          docs.items.forEach((doc, index) => {
            const request = doc.data as DepositRequest;
            console.log(`  ${index + 1}. ID: ${request.id}, AgentID: ${request.agentId}, UserID: ${request.userId}, Status: ${request.status}`);
          });
        }

        if (!docs.items) {
          console.log('🔍 No docs.items found, returning empty array');
          return [];
        }

        const requests = docs.items
          .map(doc => doc.data as DepositRequest)
          .filter(request => {
            const matchesAgent = request.agentId === agentId;
            const matchesStatus = !status || request.status === status;
            console.log(`🔍 Filtering request ${request.id}: agentId=${request.agentId}, targetAgentId=${agentId}, matchesAgent=${matchesAgent}, status=${request.status}, targetStatus=${status}, matchesStatus=${matchesStatus}`);
            return matchesAgent && matchesStatus;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
        console.log(`🔍 After filtering: ${requests.length} requests match the criteria`);

        // Enhance requests with user information
        const enhancedRequests = await Promise.all(
          requests.map(async (request) => {
            try {
              const user = await this.getUserByKey(request.userId);
              return {
                ...request,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                userPhone: user?.email || 'Unknown Phone', // email field contains phone for SMS users
                userLocation: 'Unknown Location' // Would need to enhance with actual location data
              };
            } catch (error) {
              console.error(`Error getting user info for ${request.userId}:`, error);
              return {
                ...request,
                userName: 'Unknown User',
                userPhone: 'Unknown Phone',
                userLocation: 'Unknown Location'
              };
            }
          })
        );

        console.log(`Retrieved ${enhancedRequests.length} deposit requests for agent ${agentId}`);
        return enhancedRequests;
      } catch (error) {
        console.error('Error getting agent deposit requests:', error);
        throw error;
      }
    }

    // Update deposit request status
    static async updateDepositRequestStatus(
      requestId: string, 
      status: 'pending' | 'confirmed' | 'completed' | 'rejected'
    ): Promise<boolean> {
      try {
        const existingDoc = await getDoc({
          collection: 'deposit_requests',
          key: requestId,
          satellite
        });

        if (!existingDoc?.data) {
          throw new Error('Deposit request not found');
        }

        const updatedRequest = {
          ...existingDoc.data,
          status,
          updatedAt: new Date().toISOString()
        };

        await setDoc({
          collection: 'deposit_requests',
          doc: {
            key: requestId,
            data: updatedRequest,
            version: existingDoc.version || 1n
          },
          satellite
        });

        console.log(`Updated deposit request ${requestId} status to ${status}`);
        return true;
      } catch (error) {
        console.error('Error updating deposit request status:', error);
        return false;
      }
    }

    // Get deposit request by code (for agent lookup)
    static async getDepositRequestByCode(depositCode: string): Promise<DepositRequest | null> {
      try {
        const allRequests = await listDocs({
          collection: 'deposit_requests',
          satellite
        });

        if (!allRequests.items) return null;

        for (const doc of allRequests.items) {
          const request = doc.data as DepositRequest;
          if (request.depositCode === depositCode && request.status === 'pending') {
            return request;
          }
        }

        return null;
      } catch (error) {
        console.error('Error getting deposit request by code:', error);
        return null;
      }
    }

    // Get agent by user ID (needed for ProcessDeposits component)
    static async getAgentByUserId(userId: string): Promise<Agent | null> {
      try {
        // In webhook service, we assume the userId is also the agentId for agents
        // This is a simplified implementation - in production you'd have proper agent-user mapping
        const agents = await this.getAvailableAgents();
        
        // For now, return the first agent as a placeholder
        // In production, you'd implement proper user-to-agent mapping
        if (agents.length > 0) {
          return {
            ...agents[0],
            userId: userId
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error getting agent by user ID:', error);
        return null;
      }
    }

    // Process deposit request (simplified implementation)
    static async processDepositRequest(
      requestId: string,
      agentId: string,
      _processedBy?: string
    ): Promise<{ success: boolean; transactionId?: string; userTransactionId?: string; error?: string }> {
      try {
        // Get the deposit request
        const requestDoc = await getDoc({
          collection: 'deposit_requests',
          key: requestId,
          satellite
        });

        if (!requestDoc?.data) {
          return { success: false, error: 'Deposit request not found' };
        }

        const request = requestDoc.data as DepositRequest;

        if (request.status !== 'pending' && request.status !== 'confirmed') {
          return { success: false, error: 'Deposit request is not available for processing' };
        }

        if (request.agentId !== agentId) {
          return { success: false, error: 'Agent not authorized for this deposit request' };
        }

        // Create a simple transaction record for the deposit
        const userTransactionId = `dep_tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // For now, we'll just create a simple transaction ID
        // In production, you'd store the actual transaction in the datastore

        // Update user balance (increase)
        const userBalance = await this.getUserBalance(request.userId);
        const currentUserBalance = userBalance?.balance || 0;
        await this.updateUserBalance(request.userId, currentUserBalance + request.amount);

        // Mark deposit request as completed
        await this.updateDepositRequestStatus(requestId, 'completed');

        console.log(`Successfully processed deposit request ${requestId}, user transaction ${userTransactionId}`);
        return { 
          success: true, 
          transactionId: `agent_${requestId}`, 
          userTransactionId: userTransactionId || undefined 
        };
      } catch (error) {
        console.error('Error processing deposit request:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
}

export class BitcoinDataService {
  private static readonly SATOSHIS_PER_BTC = 100000000;
  private static readonly NETWORK_FEE_SATS = 1000; // Default network fee
  
  // Bitcoin networks
  private static readonly MAINNET = bitcoin.networks.bitcoin;
  private static readonly TESTNET = bitcoin.networks.testnet;
  
  // Use testnet for development, mainnet for production
  private static readonly NETWORK = process.env.NODE_ENV === 'production' ? this.MAINNET : this.TESTNET;
  
  // Initialize ECPair with secp256k1
  private static readonly ECPair = ECPairFactory(ecc);
  
  // Generate REAL Bitcoin address using bitcoinjs-lib
  static generateBitcoinAddress(): { address: string; privateKey: string; publicKey: string } {
    // Generate a random private key
    const keyPair = this.ECPair.makeRandom({ network: this.NETWORK });
    
    // Get the private key in WIF format
    const privateKey = keyPair.toWIF();
    
    // Get the public key as hex string
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
    
    // Generate P2WPKH (native segwit) address
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: Buffer.from(keyPair.publicKey), 
      network: this.NETWORK 
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    return {
      address,
      privateKey,
      publicKey
    };
  }
  
  // Generate Bitcoin address from existing private key
  static getAddressFromPrivateKey(privateKeyWIF: string): { address: string; publicKey: string } {
    const keyPair = this.ECPair.fromWIF(privateKeyWIF, this.NETWORK);
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
    
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: Buffer.from(keyPair.publicKey), 
      network: this.NETWORK 
    });
    
    if (!address) {
      throw new Error('Failed to generate address from private key');
    }
    
    return { address, publicKey };
  }

  // Create Bitcoin wallet for user
  static async createBitcoinWallet(userId: string, phoneNumber?: string): Promise<BitcoinWallet> {
    try {
      // Generate real Bitcoin address using your existing code
      const { address, privateKey, publicKey } = this.generateBitcoinAddress();
      
      const wallet: BitcoinWallet = {
        id: nanoid(),
        userId,
        address,
        privateKey, // Store securely - consider encryption
        balance: 0,
        createdAt: new Date()
      };

      // Store in Juno datastore
      const walletDocument = {
        id: wallet.id,
        userId,
        address,
        encryptedPrivateKey: this.encryptPrivateKey(privateKey, phoneNumber || userId),
        publicKey,
        balance: 0,
        network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          walletType: phoneNumber ? 'custodial' : 'custodial', // SMS users need custodial
          isActive: true,
          derivationPath: phoneNumber ? this.getDerivationPath(phoneNumber) : undefined
        }
      };

      await setDoc({
        collection: 'bitcoin_wallets',
        doc: {
          key: `btc_${userId}`,
          data: walletDocument,
          version: 1n
        },
        satellite
      });

      // Send notification
      try {
        const user = await WebhookDataService.getUserByKey(userId);
        if (user) {
          console.log(`Sending Bitcoin wallet creation notification to user ${user.firstName} ${user.lastName}`);
          // await NotificationService.sendNotification(user, {
          //   userId,
          //   type: 'bitcoin_exchange',
          //   amount: 0,
          //   currency: 'BTC',
          //   transactionId: wallet.id,
          //   message: `Bitcoin wallet created. Address: ${address.substring(0, 8)}...`
          // });
        }
      } catch (notificationError) {
        console.error('Failed to send Bitcoin wallet notification:', notificationError);
      }

      return wallet;
    } catch (error) {
      console.error('Error creating Bitcoin wallet:', error);
      throw error;
    }
  }

  // Get REAL BTC to local currency exchange rate
  static async getExchangeRate(currency: AfricanCurrency = 'NGN'): Promise<ExchangeRate> {
    try {
      // Get real BTC price in USD first
      const btcUsdResponse = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
      const btcUsdData = await btcUsdResponse.json();
      const btcToUsd = parseFloat(btcUsdData.data.rates.USD);
      
      // Get USD to local currency rate
      let usdToLocal = 1;
      
      if (currency !== 'BTC') {
        try {
          // Use exchangerate-api for real forex rates
          const forexResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
          const forexData = await forexResponse.json();
          
          // Map African currencies to their forex codes
          const currencyMap: Record<AfricanCurrency, string> = {
            'NGN': 'NGN', 'KES': 'KES', 'TZS': 'TZS', 'RWF': 'RWF', 'BIF': 'BIF', 'ETB': 'ETB', 'UGX': 'UGX',
            'GHS': 'GHS', 'GNF': 'GNF', 'XOF': 'XOF', 'XAF': 'XAF', 'CDF': 'CDF',
            'AOA': 'AOA', 'ZAR': 'ZAR', 'BWP': 'BWP', 'EGP': 'EGP', 'MAD': 'MAD',
            'TND': 'TND', 'DZD': 'DZD', 'MRU': 'MRU', 'MUR': 'MUR', 'SLL': 'SLL', 'LRD': 'LRD',
            'GMD': 'GMD', 'SZL': 'SZL', 'LSL': 'LSL', 'NAD': 'NAD', 'ZMW': 'ZMW',
            'ZWL': 'ZWL', 'MWK': 'MWK', 'MZN': 'MZN', 'SCR': 'SCR', 'CVE': 'CVE',
            'STN': 'STN', 'KMF': 'KMF', 'DJF': 'DJF', 'ERN': 'ERN', 'MGA': 'MGA',
            'SOS': 'SOS', 'LYD': 'LYD', 'SDG': 'SDG', 'BTC': 'BTC'
          };
          
          const forexCode = currencyMap[currency];
          if (forexCode && forexData.rates[forexCode]) {
            usdToLocal = forexData.rates[forexCode];
          } else {
            // Fallback to estimated rates if not available in forex API
            const fallbackRates: Record<AfricanCurrency, number> = {
              'NGN': 1550, 'KES': 129, 'TZS': 2300, 'RWF': 1240, 'BIF': 2900, 'ETB': 120,
              'UGX': 3700, 'GHS': 15, 'GNF': 8600, 'XOF': 600, 'XAF': 600, 'CDF': 2800,
              'AOA': 900, 'ZAR': 18, 'BWP': 13.5, 'EGP': 49, 'MAD': 10,
              'TND': 3.1, 'DZD': 135, 'MRU': 36, 'MUR': 46, 'SLL': 22000, 'LRD': 190,
              'GMD': 67, 'SZL': 18, 'LSL': 18, 'NAD': 18, 'ZMW': 27,
              'ZWL': 25000, 'MWK': 1730, 'MZN': 64, 'SCR': 13.5, 'CVE': 101,
              'STN': 22.5, 'KMF': 450, 'DJF': 178, 'ERN': 15, 'MGA': 4500,
              'SOS': 570, 'LYD': 4.8, 'SDG': 600, 'BTC': 1
            };
            usdToLocal = fallbackRates[currency] || 1;
          }
        } catch (forexError) {
          console.warn('Forex API failed, using fallback rates:', forexError);
          // Use fallback rates
          const fallbackRates: Record<AfricanCurrency, number> = {
            'NGN': 1550, 'KES': 129, 'TZS': 2300, 'RWF': 1240, 'BIF': 2900, 'ETB': 120,
            'UGX': 3700, 'GHS': 15, 'GNF': 8600, 'XOF': 600, 'XAF': 600, 'CDF': 2800,
            'AOA': 900, 'ZAR': 18, 'BWP': 13.5, 'EGP': 49, 'MAD': 10,
            'TND': 3.1, 'DZD': 135, 'MRU': 36, 'MUR': 46, 'SLL': 22000, 'LRD': 190,
            'GMD': 67, 'SZL': 18, 'LSL': 18, 'NAD': 18, 'ZMW': 27,
            'ZWL': 25000, 'MWK': 1730, 'MZN': 64, 'SCR': 13.5, 'CVE': 101,
            'STN': 22.5, 'KMF': 450, 'DJF': 178, 'ERN': 15, 'MGA': 4500,
            'SOS': 570, 'LYD': 4.8, 'SDG': 600, 'BTC': 1
          };
          usdToLocal = fallbackRates[currency] || 1;
        }
      }
      
      const btcToLocal = currency === 'BTC' ? 1 : btcToUsd * usdToLocal;
      
      return {
        btcToLocal,
        localToBtc: 1 / btcToLocal,
        currency,
        lastUpdated: new Date(),
        source: 'coinbase_exchangerate_api'
      };
    } catch (error) {
      console.error('Error fetching real exchange rate:', error);
      // Fallback to estimated rates
      const fallbackRates: Record<AfricanCurrency, number> = {
        'NGN': 65000000, 'KES': 6500000, 'UGX': 150000000, 'ZAR': 1200000,
        'GHS': 800000, 'EGP': 3200000, 'MAD': 650000, 'TZS': 150000000,
        'RWF': 85000000, 'BIF': 145000000, 'ETB': 7500000, 'XOF': 40000000, 'XAF': 40000000,
        'CDF': 180000000, 'AOA': 55000000, 'BWP': 900000, 'TND': 200000,
        'DZD': 8800000, 'MRU': 2400000, 'MUR': 3000000, 'BTC': 1, 'SLL': 1200000000,
        'LRD': 12000000, 'GMD': 4200000, 'GNF': 540000000, 'SZL': 1200000, 'LSL': 1200000,
        'NAD': 1200000, 'ZMW': 18000000, 'ZWL': 32000000000, 'MWK': 85000000,
        'MZN': 4200000, 'SCR': 900000, 'CVE': 6800000, 'STN': 1500000,
        'KMF': 30000000, 'DJF': 12000000, 'ERN': 1000000, 'MGA': 300000000,
        'SOS': 38000000, 'LYD': 320000, 'SDG': 40000000
      };
      
      const rate = fallbackRates[currency] || fallbackRates['NGN'];
      
      return {
        btcToLocal: rate,
        localToBtc: 1 / rate,
        currency,
        lastUpdated: new Date(),
        source: 'fallback'
      };
    }
  }

  // Convert satoshis to BTC
  static satoshisToBtc(satoshis: number): number {
    return satoshis / this.SATOSHIS_PER_BTC;
  }

  // Convert BTC to satoshis
  static btcToSatoshis(btc: number): number {
    return Math.round(btc * this.SATOSHIS_PER_BTC);
  }

  // Calculate local currency equivalent of Bitcoin amount
  static async calculateLocalFromBitcoin(satoshis: number, currency: AfricanCurrency): Promise<number> {
    const rate = await this.getExchangeRate(currency);
    const btc = this.satoshisToBtc(satoshis);
    return Math.round(btc * rate.btcToLocal);
  }

  // Calculate Bitcoin equivalent of local currency amount
  static async calculateBitcoinFromLocal(amount: number, currency: AfricanCurrency): Promise<number> {
    const rate = await this.getExchangeRate(currency);
    const btc = amount * rate.localToBtc;
    return this.btcToSatoshis(btc);
  }

  // Create Bitcoin transaction record
  static async createBitcoinTransaction(
    transaction: Omit<BitcoinTransaction, 'id' | 'createdAt' | 'confirmations'>
  ): Promise<BitcoinTransaction> {
    const newTransaction: BitcoinTransaction = {
      ...transaction,
      id: nanoid(),
      confirmations: 0,
      createdAt: new Date()
    };

    try {
      // Store Bitcoin transaction in Juno datastore
      const transactionDoc = {
        id: newTransaction.id,
        userId: newTransaction.userId,
        agentId: newTransaction.agentId,
        type: newTransaction.type,
        bitcoinAmount: newTransaction.bitcoinAmount,
        localAmount: newTransaction.localAmount,
        localCurrency: newTransaction.localCurrency,
        exchangeRate: newTransaction.exchangeRate,
        bitcoinTxHash: newTransaction.bitcoinTxHash,
        fromAddress: newTransaction.fromAddress,
        toAddress: newTransaction.toAddress,
        status: newTransaction.status,
        confirmations: newTransaction.confirmations,
        fee: newTransaction.fee,
        agentFee: newTransaction.agentFee,
        createdAt: newTransaction.createdAt.toISOString(),
        confirmedAt: newTransaction.confirmedAt?.toISOString(),
        metadata: newTransaction.metadata
      };

      await setDoc({
        collection: 'bitcoin_transactions',
        doc: {
          key: newTransaction.id,
          data: transactionDoc,
          version: 1n
        },
        satellite
      });

      console.log(`✅ Bitcoin transaction ${newTransaction.id} stored in Juno datastore`);
      return newTransaction;
    } catch (error) {
      console.error('❌ Error storing Bitcoin transaction in Juno:', error);
      // Return the transaction even if storage fails, for backwards compatibility
      return newTransaction;
    }
  }

  // Send REAL Bitcoin transaction
  static async sendBitcoin(
    fromAddress: string,
    toAddress: string,
    amountSats: number,
    privateKeyWIF: string
  ): Promise<{ txHash: string; success: boolean; error?: string }> {
    try {
      // Get UTXOs for the from address
      const utxos = await this.getUTXOs(fromAddress);
      
      if (utxos.length === 0) {
        return {
          txHash: '',
          success: false,
          error: 'No UTXOs available for this address'
        };
      }
      
      // Calculate total available balance
      const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      
      if (totalBalance < amountSats + this.NETWORK_FEE_SATS) {
        return {
          txHash: '',
          success: false,
          error: `Insufficient balance. Available: ${totalBalance} sats, Required: ${amountSats + this.NETWORK_FEE_SATS} sats`
        };
      }
      
      // Create transaction
      const keyPair = this.ECPair.fromWIF(privateKeyWIF, this.NETWORK);
      const psbt = new bitcoin.Psbt({ network: this.NETWORK });
      
      // Add inputs
      let inputValue = 0;
      for (const utxo of utxos) {
        if (inputValue >= amountSats + this.NETWORK_FEE_SATS) break;
        
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: bitcoin.payments.p2wpkh({ pubkey: Buffer.from(keyPair.publicKey), network: this.NETWORK }).output!,
            value: utxo.value,
          },
        });
        inputValue += utxo.value;
      }
      
      // Add output to recipient
      psbt.addOutput({
        address: toAddress,
        value: amountSats,
      });
      
      // Add change output if necessary
      const change = inputValue - amountSats - this.NETWORK_FEE_SATS;
      if (change > 0) {
        psbt.addOutput({
          address: fromAddress,
          value: change,
        });
      }
      
      // Sign all inputs
      for (let i = 0; i < psbt.inputCount; i++) {
        psbt.signInput(i, keyPair as any);
      }
      
      // Finalize and extract transaction
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();
      
      // Broadcast transaction
      const txHash = await this.broadcastTransaction(txHex);
      
      return {
        txHash,
        success: true
      };
    } catch (error) {
      console.error('Bitcoin transaction error:', error);
      return {
        txHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }
  
  // Get UTXOs for an address using blockchain API
  static async getUTXOs(address: string): Promise<Array<{
    txid: string;
    vout: number;
    value: number;
  }>> {
    try {
      // Use BlockCypher API for testnet/mainnet
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/addrs/${address}?unspentOnly=true`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (!data.txrefs) {
        return [];
      }
      
      return data.txrefs.map((utxo: any) => ({
        txid: utxo.tx_hash,
        vout: utxo.tx_output_n,
        value: utxo.value
      }));
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      return [];
    }
  }
  
  // Broadcast transaction to Bitcoin network
  static async broadcastTransaction(txHex: string): Promise<string> {
    try {
      // Use BlockCypher API to broadcast
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/txs/push`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tx: txHex }),
      });
      
      const data = await response.json();
      
      if (data.tx && data.tx.hash) {
        return data.tx.hash;
      } else {
        throw new Error(data.error || 'Failed to broadcast transaction');
      }
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw error;
    }
  }

  // Check REAL Bitcoin transaction confirmations
  static async checkTransactionConfirmations(txHash: string): Promise<number> {
    try {
      // Use BlockCypher API to get transaction details
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/txs/${txHash}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.confirmations !== undefined) {
        return data.confirmations;
      } else {
        console.warn('Transaction not found or pending:', txHash);
        return 0;
      }
    } catch (error) {
      console.error('Error checking confirmations:', error);
      return 0;
    }
  }
  
  // Get REAL Bitcoin balance for an address
  static async getBitcoinBalance(address: string): Promise<number> {
    try {
      // Use BlockCypher API to get address balance
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/addrs/${address}/balance`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      return data.balance || 0; // Balance in satoshis
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error);
      return 0;
    }
  }

  // Process Bitcoin to local currency exchange through agent with dynamic fees
  static async processBitcoinToLocalExchange(
    userId: string,
    agentId: string,
    bitcoinAmount: number, // in satoshis
    localCurrency: AfricanCurrency,
    exchangeMethod: 'agent_cash' | 'agent_digital',
    customerLocation?: { latitude: number; longitude: number; accessibility: 'urban' | 'suburban' | 'rural' | 'remote' },
    agentDistance?: number,
    urgency: 'standard' | 'express' | 'emergency' = 'standard'
  ): Promise<{
    success: boolean;
    transaction?: BitcoinTransaction;
    message: string;
    feeBreakdown?: any;
  }> {
    try {
      const rate = await this.getExchangeRate(localCurrency);
      const localAmount = await this.calculateLocalFromBitcoin(bitcoinAmount, localCurrency);
      
      // Calculate dynamic fee if location data is available
      let agentFee: number;
      let feeBreakdown: any = null;
      
      if (customerLocation && agentDistance !== undefined) {
        const { DynamicFeeService } = await import('./dynamicFeeService');
        const now = new Date();
        const hour = now.getHours();
        const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
        const dayOfWeek = now.getDay() === 0 || now.getDay() === 6 ? 'weekend' : 'weekday';
        
        const feeCalculation = DynamicFeeService.calculateDynamicFee(
          {
            amount: localAmount,
            currency: localCurrency,
            type: 'bitcoin_sell',
            customerLocation: {
              latitude: customerLocation.latitude,
              longitude: customerLocation.longitude,
              accessibility: customerLocation.accessibility
            },
            urgency,
            timeOfDay: timeOfDay as any,
            dayOfWeek: dayOfWeek as any
          },
          agentDistance,
          { latitude: 0, longitude: 0, accessibility: 'urban' } // Agent location placeholder
        );
        
        agentFee = feeCalculation.totalFeeAmount;
        feeBreakdown = feeCalculation;
      } else {
        // Fallback to fixed 3% fee for remote areas, 2% for others
        const feeRate = customerLocation?.accessibility === 'remote' ? 0.03 : 0.02;
        agentFee = Math.round(localAmount * feeRate);
      }
      
      const netLocalAmount = localAmount - agentFee;

      const transaction = await this.createBitcoinTransaction({
        userId,
        agentId,
        type: 'bitcoin_to_local',
        bitcoinAmount,
        localAmount: netLocalAmount,
        localCurrency,
        exchangeRate: rate.btcToLocal,
        status: 'pending',
        fee: this.NETWORK_FEE_SATS,
        agentFee,
        metadata: {
          exchangeMethod,
          smsReference: `BTC${Date.now().toString().slice(-6)}`
        }
      });

      // Send notifications to user and agent
      try {
        const [user, agent] = await Promise.all([
          WebhookDataService.getUserByKey(userId),
          WebhookDataService.getUserByKey(agentId)
        ]);

        if (user) {
          console.log(`Sending Bitcoin exchange notification to user ${user.firstName} ${user.lastName}`);
          // await NotificationService.sendNotification(user, {
          //   userId,
          //   type: 'bitcoin_exchange',
          //   amount: this.satoshisToBtc(bitcoinAmount),
          //   currency: 'BTC',
          //   status: 'initiated',
          //   transactionId: transaction.id,
          //   message: `Bitcoin exchange initiated for ${formatCurrencyAmount(netLocalAmount, localCurrency)}`
          // });
        }

        if (agent) {
          console.log(`Sending Bitcoin exchange notification to agent ${agent.firstName} ${agent.lastName}`);
          // await NotificationService.sendNotification(agent, {
          //   userId: agentId,
          //   type: 'agent_match',
          //   amount: netLocalAmount,
          //   currency: localCurrency,
          //   transactionId: transaction.id,
          //   message: `New Bitcoin exchange request: ${this.satoshisToBtc(bitcoinAmount).toFixed(8)} BTC`
          // });
        }
      } catch (notificationError) {
        console.error('Failed to send Bitcoin exchange notifications:', notificationError);
      }

      // Send notifications for local to Bitcoin exchange
      try {
        const [user, agent] = await Promise.all([
          WebhookDataService.getUserByKey(userId),
          WebhookDataService.getUserByKey(agentId)
        ]);

        if (user) {
          console.log(`Sending Bitcoin purchase notification to user ${user.firstName} ${user.lastName}`);
          // await NotificationService.sendNotification(user, {
          //   userId,
          //   type: 'bitcoin_exchange',
          //   amount: this.satoshisToBtc(bitcoinAmount),
          //   currency: 'BTC',
          //   status: 'initiated',
          //   transactionId: transaction.id,
          //   message: `Bitcoin purchase initiated with ${formatCurrencyAmount(localAmount, localCurrency)}`
          // });
        }

        if (agent) {
          console.log(`Sending Bitcoin purchase notification to agent ${agent.firstName} ${agent.lastName}`);
          // await NotificationService.sendNotification(agent, {
          //   userId: agentId,
          //   type: 'agent_match',
          //   amount: localAmount,
          //   currency: localCurrency,
          //   transactionId: transaction.id,
          //   message: `New Bitcoin purchase request: ${formatCurrencyAmount(localAmount, localCurrency)} → ${this.satoshisToBtc(bitcoinAmount).toFixed(8)} BTC`
          // });
        }
      } catch (notificationError) {
        console.error('Failed to send Bitcoin purchase notifications:', notificationError);
      }

      return {
        success: true,
        transaction,
        message: `Bitcoin exchange successful! ${bitcoinAmount} satoshis exchanged for ${netLocalAmount.toLocaleString()} ${localCurrency}`,
        feeBreakdown
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bitcoin exchange failed'
      };
    }
  }

  // Process local currency to Bitcoin exchange through agent
  static async processLocalToBitcoinExchange(
    userId: string,
    agentId: string,
    localAmount: number,
    localCurrency: AfricanCurrency,
    userBitcoinAddress: string
  ): Promise<{
    success: boolean;
    transaction?: BitcoinTransaction;
    message: string;
  }> {
    try {
      const rate = await this.getExchangeRate(localCurrency);
      const agentFee = Math.round(localAmount * 0.02); // 2% agent fee
      const netLocalAmount = localAmount - agentFee;
      const bitcoinAmount = await this.calculateBitcoinFromLocal(netLocalAmount, localCurrency);

      const transaction = await this.createBitcoinTransaction({
        userId,
        agentId,
        type: 'local_to_bitcoin',
        bitcoinAmount,
        localAmount: netLocalAmount,
        localCurrency,
        exchangeRate: rate.btcToLocal,
        toAddress: userBitcoinAddress,
        status: 'pending',
        fee: this.NETWORK_FEE_SATS,
        agentFee,
        metadata: {
          exchangeMethod: 'agent_cash',
          smsReference: `${localCurrency}${Date.now().toString().slice(-6)}`
        }
      });

      return {
        success: true,
        transaction,
        message: `Exchange initiated: ${formatCurrencyAmount(localAmount, localCurrency)} → ${this.satoshisToBtc(bitcoinAmount).toFixed(8)} BTC`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process local currency exchange'
      };
    }
  }

  // Format Bitcoin amount for display
  static formatBitcoinAmount(satoshis: number): string {
    const btc = this.satoshisToBtc(satoshis);
    if (btc >= 1) {
      return `${btc.toFixed(8)} BTC`;
    } else if (btc >= 0.001) {
      return `${(btc * 1000).toFixed(5)} mBTC`;
    } else {
      return `${satoshis} sats`;
    }
  }

  // Generate SMS message for Bitcoin transaction
  static generateBitcoinSMS(transaction: BitcoinTransaction, userPhone: string): string {
    const btcAmount = this.formatBitcoinAmount(transaction.bitcoinAmount);
    const localAmount = transaction.localAmount ? formatCurrencyAmount(transaction.localAmount, transaction.localCurrency) : '0';
    
    // Log SMS generation for the user
    console.log(`Generating Bitcoin SMS for ${userPhone}`);
    
    switch (transaction.type) {
      case 'bitcoin_to_local':
        return `AfriTokeni: Bitcoin exchange completed. ${btcAmount} → ${localAmount}. Ref: ${transaction.metadata?.smsReference}`;
      
      case 'local_to_bitcoin':
        return `AfriTokeni: ${transaction.localCurrency} exchange completed. ${localAmount} → ${btcAmount}. Address: ${transaction.toAddress}. Ref: ${transaction.metadata?.smsReference}`;
      
      case 'bitcoin_receive':
        return `AfriTokeni: Bitcoin received. ${btcAmount} to your wallet. TxHash: ${transaction.bitcoinTxHash?.slice(0, 8)}...`;
      
      default:
        return `AfriTokeni: Bitcoin transaction ${transaction.type}. Amount: ${btcAmount}. Ref: ${transaction.id}`;
    }
  }

  // Helper methods for SMS users
  private static encryptPrivateKey(privateKey: string, seed: string): string {
    // Simple encryption - in production use proper encryption
    const key = scryptSync(seed, 'salt', 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private static getDerivationPath(phoneNumber: string): string {
    const index = parseInt(phoneNumber.slice(-6)) % 1000000;
    return `m/44'/0'/0'/${index}`;
  }

  // Get Bitcoin wallet for SMS user (without blockchain balance check for transaction-based calculations)
  static async getBitcoinWalletForUser(userId: string): Promise<BitcoinWallet | null> {
    try {
      const docs = await listDocs({
        collection: 'bitcoin_wallets',
        satellite
      });

      const walletDoc = docs.items.find(doc => 
        (doc.data as any).userId === userId
      );

      if (!walletDoc) {
        return null;
      }

      const walletData = walletDoc.data as any;
      
      // For transaction-based balance calculation, don't query blockchain
      // Use the stored balance as-is, it will be updated by the sync function
      return {
        id: walletData.id,
        userId: walletData.userId,
        address: walletData.address,
        privateKey: walletData.encryptedPrivateKey, // Keep encrypted
        balance: walletData.balance || 0, // Use stored balance without blockchain query
        createdAt: new Date(walletData.createdAt)
      };
    } catch (error) {
      console.error('Error getting Bitcoin wallet:', error);
      return null;
    }
  }

  // Update wallet balance in Juno
  static async updateWalletBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const docs = await listDocs({
        collection: 'bitcoin_wallets',
        satellite
      });

      const walletDoc = docs.items.find(doc => 
        (doc.data as any).userId === userId
      );

      if (!walletDoc) return false;

      const updatedData = {
        ...walletDoc.data,
        balance: newBalance,
        updatedAt: new Date().toISOString()
      };

      await setDoc({
        collection: 'bitcoin_wallets',
        doc: {
          key: walletDoc.key,
          data: updatedData,
          version: (walletDoc.version || 0n) + 1n
        },
        satellite
      });

      return true;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return false;
    }
  }

  // Store Bitcoin transaction in Juno
  static async storeBitcoinTransaction(transaction: BitcoinTransaction): Promise<void> {
    try {
      const transactionDoc = {
        id: transaction.id,
        userId: transaction.userId,
        agentId: transaction.agentId,
        type: transaction.type,
        bitcoinAmount: transaction.bitcoinAmount,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        bitcoinTxHash: transaction.bitcoinTxHash,
        confirmations: transaction.confirmations,
        networkFee: transaction.fee,
        localAmount: transaction.localAmount,
        localCurrency: transaction.localCurrency,
        exchangeRate: transaction.exchangeRate,
        agentFee: transaction.agentFee,
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
        confirmedAt: transaction.confirmedAt?.toISOString(),
        metadata: transaction.metadata
      };

      await setDoc({
        collection: 'bitcoin_transactions',
        doc: {
          key: transaction.id,
          data: transactionDoc,
          version: 1n
        },
        satellite
      });

      console.log(`Stored Bitcoin transaction ${transaction.id} in Juno`);
    } catch (error) {
      console.error('Error storing Bitcoin transaction:', error);
      throw error;
    }
  }

  // Get Bitcoin transactions for a specific agent
  static async getAgentBitcoinTransactions(agentId: string): Promise<BitcoinTransaction[]> {
    try {
      const docs = await listDocs({
        collection: 'bitcoin_transactions',
        satellite
      });

      if (!docs.items) {
        return [];
      }

      const transactions: BitcoinTransaction[] = docs.items
        .map(doc => doc.data as BitcoinTransaction)
        .filter(txData => txData.agentId === agentId)
        .map(txData => ({
          id: txData.id,
          userId: txData.userId,
          agentId: txData.agentId,
          type: txData.type,
          bitcoinAmount: txData.bitcoinAmount,
          localAmount: txData.localAmount,
          localCurrency: txData.localCurrency,
          exchangeRate: txData.exchangeRate,
          bitcoinTxHash: txData.bitcoinTxHash,
          fromAddress: txData.fromAddress,
          toAddress: txData.toAddress,
          status: txData.status,
          confirmations: txData.confirmations,
          fee: txData.fee,
          agentFee: txData.agentFee,
          createdAt: new Date(txData.createdAt),
          confirmedAt: txData.confirmedAt ? new Date(txData.confirmedAt) : undefined,
          metadata: txData.metadata
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first

      console.log(`Retrieved ${transactions.length} Bitcoin transactions for agent ${agentId}`);
      return transactions;
    } catch (error) {
      console.error('Error getting agent Bitcoin transactions:', error);
      return [];
    }
  }

  // Get all Bitcoin transactions (for admin/overview)
  static async getAllBitcoinTransactions(): Promise<BitcoinTransaction[]> {
    try {
      const docs = await listDocs({
        collection: 'bitcoin_transactions',
        satellite
      });

      if (!docs.items) {
        return [];
      }

      const transactions: BitcoinTransaction[] = docs.items
        .map(doc => doc.data as BitcoinTransaction)
        .map(txData => ({
          id: txData.id,
          userId: txData.userId,
          agentId: txData.agentId,
          type: txData.type,
          bitcoinAmount: txData.bitcoinAmount,
          localAmount: txData.localAmount,
          localCurrency: txData.localCurrency,
          exchangeRate: txData.exchangeRate,
          bitcoinTxHash: txData.bitcoinTxHash,
          fromAddress: txData.fromAddress,
          toAddress: txData.toAddress,
          status: txData.status,
          confirmations: txData.confirmations,
          fee: txData.fee,
          agentFee: txData.agentFee,
          createdAt: new Date(txData.createdAt),
          confirmedAt: txData.confirmedAt ? new Date(txData.confirmedAt) : undefined,
          metadata: txData.metadata
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first

      console.log(`Retrieved ${transactions.length} total Bitcoin transactions`);
      return transactions;
    } catch (error) {
      console.error('Error getting all Bitcoin transactions:', error);
      return [];
    }
  }

  // Get Bitcoin transactions with user details for agent interface
  static async getAgentBitcoinExchangeRequests(agentId: string): Promise<Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    type: 'buy' | 'sell';
    amount: number;
    currency: string;
    bitcoinAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: Date;
    location?: string;
    exchangeRate: number;
    agentFee?: number;
    metadata?: {
      smsReference?: string;
      exchangeMethod?: 'agent_cash' | 'agent_digital';
      agentLocation?: string;
    };
  }>> {
    try {
      const transactions = await this.getAgentBitcoinTransactions(agentId);
      
      // Convert Bitcoin transactions to exchange request format
      const exchangeRequests = await Promise.all(
        transactions.map(async (tx) => {
          // Get user details
          const user = await WebhookDataService.getUserByKey(tx.userId);
          
          return {
            id: tx.id,
            customerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
            customerPhone: user ? user.email : 'Unknown Phone', // email field contains phone for SMS users
            type: tx.type === 'local_to_bitcoin' ? 'buy' as const : 'sell' as const,
            amount: tx.localAmount || 0,
            currency: tx.localCurrency,
            bitcoinAmount: this.satoshisToBtc(tx.bitcoinAmount),
            status: tx.status === 'pending' ? 'pending' as const : 
                   tx.status === 'confirmed' ? 'processing' as const :
                   tx.status === 'completed' ? 'completed' as const :
                   'cancelled' as const,
            createdAt: tx.createdAt,
            location: tx.metadata?.agentLocation || 'Location Unknown',
            exchangeRate: tx.exchangeRate,
            agentFee: tx.agentFee,
            metadata: tx.metadata
          };
        })
      );

      return exchangeRequests;
    } catch (error) {
      console.error('Error getting agent exchange requests:', error);
      return [];
    }
  }

  // Update Bitcoin transaction status
  static async updateBitcoinTransactionStatus(
    transactionId: string, 
    newStatus: 'pending' | 'confirmed' | 'completed' | 'failed',
    agentId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get the current transaction to verify agent access
      const currentTx = await getDoc({
        collection: 'bitcoin_transactions',
        key: transactionId,
        satellite
      });
      
      if (!currentTx) {
        return { success: false, message: 'Transaction not found' };
      }

      const txData = currentTx.data as BitcoinTransaction;
      
      // If agentId is provided, verify the agent has access to this transaction
      if (agentId && txData.agentId !== agentId) {
        return { success: false, message: 'Unauthorized: Agent does not have access to this transaction' };
      }

      // Update the transaction status
      await setDoc({
        collection: 'bitcoin_transactions',
        doc: {
          key: transactionId,
          data: {
            ...txData,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            createdAt: typeof txData.createdAt === 'string' ? txData.createdAt : txData.createdAt.toISOString()
          }
        },
        satellite
      });

      // If status is completed, update the user's wallet balance
      if (newStatus === 'completed' && txData.type === 'local_to_bitcoin') {
        await this.updateUserBitcoinBalance(txData.userId, txData.bitcoinAmount);
      }

      console.log(`✅ Updated Bitcoin transaction ${transactionId} status to ${newStatus}`);
      
      return { 
        success: true, 
        message: `Transaction status updated to ${newStatus}` 
      };
    } catch (error) {
      console.error('Error updating Bitcoin transaction status:', error);
      return { 
        success: false, 
        message: 'Failed to update transaction status' 
      };
    }
  }

  // Update user's Bitcoin wallet balance
  static async updateUserBitcoinBalance(userId: string, amountSats: number): Promise<void> {
    try {
      const userWallet = await getDoc({
        collection: 'bitcoin_wallets',
        key: userId,
        satellite
      });
      
      if (userWallet) {
        const walletData = userWallet.data as BitcoinWallet;
        const newBalance = walletData.balance + amountSats;
        
        await setDoc({
          collection: 'bitcoin_wallets',
          doc: {
            key: userId,
            data: {
              ...walletData,
              balance: newBalance,
              updatedAt: new Date().toISOString(),
              createdAt: typeof walletData.createdAt === 'string' ? walletData.createdAt : walletData.createdAt.toISOString()
            }
          },
          satellite
        });
        
        console.log(`✅ Updated Bitcoin wallet balance for user ${userId}: +${amountSats} sats (new balance: ${newBalance} sats)`);
      } else {
        console.warn(`⚠️ Bitcoin wallet not found for user ${userId}`);
      }
    } catch (error) {
      console.error('Error updating user Bitcoin balance:', error);
    }
  }

  // Calculate actual Bitcoin balance from transaction history for SMS users
  static async calculateBitcoinBalanceFromTransactions(userId: string): Promise<number> {
    try {
      console.log(`🧮 Calculating Bitcoin balance from transactions for user ${userId}`);
      
      const docs = await listDocs({
        collection: 'bitcoin_transactions',
        satellite
      });

      console.log(`🧮 Total documents in bitcoin_transactions collection: ${docs.items?.length || 0}`);

      if (!docs.items) {
        console.log(`No Bitcoin transactions found for user ${userId}`);
        return 0;
      }

      const userTransactions = docs.items
        .map(doc => doc.data as BitcoinTransaction)
        .filter((tx: BitcoinTransaction) => tx.userId === userId);
      
      console.log(`Found ${userTransactions.length} Bitcoin transactions for user ${userId}`);
      
      // Log all user transactions for debugging
      userTransactions.forEach((tx, index) => {
        console.log(`🧮 Transaction ${index + 1}: ID=${tx.id}, type=${tx.type}, amount=${tx.bitcoinAmount} sats, status=${tx.status}`);
      });
      
      // Calculate balance from completed/confirmed transactions
      const completedTransactions = userTransactions.filter((tx: BitcoinTransaction) => 
        tx.status === 'completed' || tx.status === 'confirmed'
      );
      
      console.log(`Found ${completedTransactions.length} completed/confirmed transactions`);
      
      // Log completed transactions specifically
      completedTransactions.forEach((tx, index) => {
        console.log(`🧮 Completed transaction ${index + 1}: ID=${tx.id}, type=${tx.type}, amount=${tx.bitcoinAmount} sats, status=${tx.status}`);
      });
      
      const calculatedBalance = completedTransactions.reduce((balance: number, tx: BitcoinTransaction) => {
        console.log(`Processing transaction ${tx.id}: type=${tx.type}, amount=${tx.bitcoinAmount}, status=${tx.status}`);
        
        if (tx.type === 'local_to_bitcoin' || tx.type === 'bitcoin_receive') {
          // User bought Bitcoin or received Bitcoin - add to balance
          console.log(`Adding ${tx.bitcoinAmount} satoshis to balance (${tx.type})`);
          return balance + (tx.bitcoinAmount || 0);
        } else if (tx.type === 'bitcoin_to_local' || tx.type === 'bitcoin_send') {
          // User sold Bitcoin or sent Bitcoin - subtract from balance
          console.log(`Subtracting ${tx.bitcoinAmount} satoshis from balance (${tx.type})`);
          return balance - (tx.bitcoinAmount || 0);
        }
        return balance;
      }, 0);
      
      console.log(`Calculated Bitcoin balance for ${userId}: ${calculatedBalance} satoshis from ${completedTransactions.length} completed transactions`);
      return calculatedBalance;
      
    } catch (error) {
      console.error('Error calculating Bitcoin balance from transactions:', error);
      return 0;
    }
  }

  // Get Bitcoin balance with sync functionality for SMS users (calculates from transactions and updates wallet)
  static async getBitcoinBalanceWithSync(userId: string): Promise<{ balance: number; wallet: BitcoinWallet | null }> {
    try {
      console.log(`🔍 getBitcoinBalanceWithSync called for userId: ${userId}`);
      
      // Calculate actual balance from transactions FIRST
      const calculatedBalance = await this.calculateBitcoinBalanceFromTransactions(userId);
      console.log(`🔍 Calculated balance from transactions: ${calculatedBalance} satoshis`);
      
      // Get wallet (but don't rely on its balance, use our calculated balance)
      const wallet = await this.getBitcoinWalletForUser(userId);
      console.log(`🔍 Wallet found: ${wallet ? 'Yes' : 'No'}`);
      
      if (!wallet) {
        console.log(`No Bitcoin wallet found for user ${userId}, returning calculated balance anyway`);
        return { balance: calculatedBalance, wallet: null };
      }

      console.log(`🔍 Wallet stored balance: ${wallet.balance} satoshis`);
      
      // Update wallet balance to match calculated balance if different
      if (wallet.balance !== calculatedBalance) {
        console.log(`Syncing wallet balance from ${wallet.balance} to ${calculatedBalance} satoshis`);
        await this.updateWalletBalance(userId, calculatedBalance);
        wallet.balance = calculatedBalance;
      }

      console.log(`🔍 Final balance returned: ${calculatedBalance} satoshis`);
      return { balance: calculatedBalance, wallet };
    } catch (error) {
      console.error('Error getting Bitcoin balance with sync:', error);
      return { balance: 0, wallet: null };
    }
  }
}
