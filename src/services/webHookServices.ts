#!/usr/bin/env node

import { setDoc, getDoc, listDocs } from '@junobuild/core';
import { nanoid } from 'nanoid';
import { User } from '../types/auth';
import { AnonymousIdentity } from "@dfinity/agent";
import type { SatelliteOptions } from "@junobuild/core";

const satellite:SatelliteOptions = {
  identity: new AnonymousIdentity,
  satelliteId: process.env.VITE_DEVELOPMENT_JUNO_SATELLITE_ID || "uxrrr-q7777-77774-qaaaq-cai",
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
}
