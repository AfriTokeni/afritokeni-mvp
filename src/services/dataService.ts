import { nanoid } from 'nanoid';
import { getDoc, setDoc, listDocs } from '@junobuild/core';
import type { AfricanCurrency } from '../types/currency';
import { AfriTokenService } from './afriTokenService';
import { UserService } from './UserService';
import { AgentService } from './AgentService';
import { TransactionService } from './TransactionService';
import { BalanceService } from './BalanceService';
import { SMSService } from './SMSService';
import { USSDService } from './USSDService';
import { DepositWithdrawalService } from './DepositWithdrawalService';

// Interface for user data as stored in Juno (with string dates)
export interface UserDataFromJuno {
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

// User interface
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'user' | 'agent';
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_started';
  pin?: string;
  createdAt: Date;
}

// Balance interface
export interface Balance {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: Date;
}

// Transaction interface
export interface Transaction {
  id: string;
  userId: string;
  type: 'send' | 'receive' | 'withdraw' | 'deposit' | 'bitcoin_buy' | 'bitcoin_sell' | 'bitcoin_to_ugx' | 'ugx_to_bitcoin' | 'bitcoin_send' | 'bitcoin_receive';
  amount: number;
  fee?: number;
  currency: string;
  recipientId?: string;
  recipientPhone?: string;
  recipientName?: string;
  agentId?: string;
  fromUserId?: string;
  toUserId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'confirmed';
  smsCommand?: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  withdrawalCode?: string;
  depositCode?: string;
  bitcoinAddress?: string;
  exchangeRate?: number;
  location?: string;
  metadata?: any;
}

// Bitcoin interfaces for DataService
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
  createdAt: Date | string;
  confirmedAt?: Date | string;
  updatedAt?: string;
  metadata?: {
    smsReference?: string;
    exchangeMethod?: 'agent_cash' | 'agent_digital';
    agentLocation?: string;
  };
}

export interface BitcoinWallet {
  id: string;
  userId: string;
  address: string;
  privateKey?: string; // For POC - in production use threshold signatures
  balance: number; // in satoshis
  createdAt: Date | string;
  updatedAt?: string;
}

// Deposit Request interface
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
  userName?: string; // Added when fetching with user info
  userPhone?: string; // Added when fetching with user info
  userLocation?: string; // Added when fetching with user info
}

// Withdrawal Request interface
export interface WithdrawalRequest {
  id: string;
  userId: string;
  agentId: string;
  amount: number;
  currency: string;
  withdrawalCode: string;
  fee: number;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  withdrawalType?: 'digital_balance' | 'ckbtc' | 'ckusdc'; // Source of withdrawal
  userName?: string; // Added when fetching with user info
  userPhone?: string; // Added when fetching with user info
  userLocation?: string; // Added when fetching with user info
}

// Legacy Transaction interface - keeping for backward compatibility
export interface LegacyTransaction {
  id: string;
  userId: string;
  type: 'send' | 'receive' | 'withdraw' | 'deposit' | 'bitcoin_to_ugx' | 'ugx_to_bitcoin' | 'bitcoin_send' | 'bitcoin_receive';
  amount: number;
  fee?: number;
  currency: AfricanCurrency;
  recipientId?: string;
  recipientPhone?: string;
  recipientName?: string;
  agentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'confirmed';
  smsCommand?: string;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  // Bitcoin-specific fields
  bitcoinAmount?: number; // in satoshis
  exchangeRate?: number; // BTC to UGX rate
  bitcoinTxHash?: string;
  fromAddress?: string;
  toAddress?: string;
  confirmations?: number;
  agentFee?: number; // Agent commission in UGX
  metadata?: {
    withdrawalCode?: string;
    agentLocation?: string;
    smsReference?: string;
    exchangeMethod?: 'agent_cash' | 'agent_digital';
  };
}

export interface UserBalance {
  userId: string;
  balance: number;
  currency: AfricanCurrency;
  lastUpdated: Date;
}

export interface AgentReview {
  id: string;
  agentId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  transactionId?: string;
  createdAt: Date;
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
  rating?: number; // Average rating
  reviewCount?: number; // Total number of reviews
  reviews?: AgentReview[]; // Recent reviews
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

// Platform Revenue - tracks REAL money captured by platform
export interface PlatformRevenue {
  id: string;
  amount: number;
  currency: AfricanCurrency;
  source: 'settlement_fee' | 'liquidity_fee' | 'bitcoin_spread' | 'agent_subscription';
  sourceTransactionId?: string;
  agentId?: string;
  userId?: string;
  description: string;
  createdAt: Date;
}

export interface PlatformRevenueInput {
  amount: number;
  currency: AfricanCurrency;
  source: 'settlement_fee' | 'liquidity_fee' | 'bitcoin_spread' | 'agent_subscription';
  sourceTransactionId?: string;
  agentId?: string;
  userId?: string;
  description: string;
}


// Simplified data service following Juno patterns
export class DataService {
  // User operations - MOVED TO UserService
  static async createUser(userData: any): Promise<User> {
    return UserService.createUser(userData);
  }

  static async getUserByKey(key: string): Promise<User | null> {
    return UserService.getUserByKey(key);
  }

  static async getUser(phoneNumber: string): Promise<User | null> {
    return UserService.getUser(phoneNumber);
  }

  static async getWebUserById(userId: string): Promise<User | null> {
    return UserService.getWebUserById(userId);
  }

  static async updateUser(key: string, updates: Partial<User>, authMethod?: 'sms' | 'web'): Promise<boolean> {
    return UserService.updateUser(key, updates, authMethod);
  }

  static async updateUserByPhone(phoneNumber: string, updates: Partial<User>): Promise<boolean> {
    return UserService.updateUserByPhone(phoneNumber, updates);
  }

  static async updateWebUser(userId: string, updates: Partial<User>): Promise<boolean> {
    return UserService.updateWebUser(userId, updates);
  }

  static async searchUsers(searchTerm: string): Promise<User[]> {
    return UserService.searchUsers(searchTerm);
  }

  static async searchUserByPhone(phoneNumber: string): Promise<User | null> {
    return UserService.searchUserByPhone(phoneNumber);
  }

  static async getAllCustomers(): Promise<User[]> {
    return UserService.getAllCustomers();
  }

  // Transaction operations - MOVED TO TransactionService
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    return TransactionService.createTransaction(transaction);
  }

  static async getTransaction(id: string): Promise<Transaction | null> {
    return TransactionService.getTransaction(id);
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    return TransactionService.getUserTransactions(userId);
  }

  static async getAgentTransactions(agentId: string): Promise<Transaction[]> {
    return TransactionService.getAgentTransactions(agentId);
  }

  static async getAgentTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return TransactionService.getUserTransactions(userId);
  }

  static async getAllAgentTransactions(agentId: string, userId: string): Promise<Transaction[]> {
    return TransactionService.getAgentTransactions(agentId);
  }

  static calculateAgentDailyEarnings(transactions: Transaction[]): {
    totalAmount: number;
    totalCommission: number;
    transactionCount: number;
    completedCount: number;
  } {
    return TransactionService.calculateAgentDailyEarnings(transactions);
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<boolean> {
    return TransactionService.updateTransaction(id, updates);
  }

  // Balance operations - MOVED TO BalanceService
  static async getUserBalance(userId: string): Promise<UserBalance | null> {
    return BalanceService.getUserBalance(userId);
  }

  static async updateUserBalance(userId: string, balance: number, currency?: string): Promise<boolean> {
    return BalanceService.updateUserBalance(userId, balance, currency);
  }

  static async getBalance(userId: string, currency: string): Promise<number> {
    return BalanceService.getBalance(userId, currency);
  }

  static async transfer(senderId: string, recipientId: string, amount: number, currency: string): Promise<void> {
    return BalanceService.transfer(senderId, recipientId, amount, currency);
  }

  static async transferWithConversion(senderId: string, recipientId: string, amount: number, fromCurrency: string, toCurrency: string): Promise<void> {
    return BalanceService.transferWithConversion(senderId, recipientId, amount, fromCurrency, toCurrency);
  }

  // Agent operations - MOVED TO AgentService
  static async createAgent(agent: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> {
    return AgentService.createAgent(agent);
  }

  static async completeAgentKYC(agentKYCData: any): Promise<{ user: User; agent: Agent }> {
    return AgentService.completeAgentKYC(agentKYCData);
  }

  static async getAgent(id: string): Promise<Agent | null> {
    return AgentService.getAgent(id);
  }

  static async getAgentByUserId(userId: string): Promise<Agent | null> {
    return AgentService.getAgentByUserId(userId);
  }

  // Update agent status
  static async updateAgentStatus(agentId: string, status: 'available' | 'busy' | 'cash_out' | 'offline'): Promise<boolean> {
    return AgentService.updateAgentStatus(agentId, status);
  }

  static async updateAgentStatusByUserId(userId: string, status: 'available' | 'busy' | 'cash_out' | 'offline'): Promise<boolean> {
    return AgentService.updateAgentStatusByUserId(userId, status);
  }

  static async updateAgentBalance(agentId: string, updates: { cashBalance?: number; digitalBalance?: number; }): Promise<boolean> {
    return AgentService.updateAgentBalance(agentId, updates);
  }

  static async updateAgentBalanceByUserId(userId: string, updates: { cashBalance?: number; digitalBalance?: number; }): Promise<boolean> {
    return AgentService.updateAgentBalanceByUserId(userId, updates);
  }

  static async depositCashToAgent(agentId: string, amount: number, description?: string): Promise<boolean> {
    return AgentService.depositCashToAgent(agentId, amount, description);
  }

  static async initializeAgentCashForTesting(agentId: string, initialCashAmount: number = 10000): Promise<boolean> {
    return AgentService.depositCashToAgent(agentId, initialCashAmount, 'Initial cash balance for testing');
  }

  static async getNearbyAgents(lat: number, lng: number, radius: number = 5, includeStatuses?: ('available' | 'busy' | 'cash_out' | 'offline')[]): Promise<Agent[]> {
    return AgentService.getNearbyAgents(lat, lng, radius, includeStatuses);
  }

  // SMS operations - MOVED TO SMSService
  static async logSMSMessage(message: Omit<SMSMessage, 'id' | 'createdAt'>): Promise<SMSMessage> {
    return SMSService.logSMSMessage(message);
  }

  static async getUserSMSHistory(userId: string): Promise<SMSMessage[]> {
    return SMSService.getUserSMSHistory(userId);
  }

  // Utility functions
  static async initializeUserData(userId: string): Promise<void> {
    try {
      // Initialize user balance if it doesn't exist
      const existingBalance = await this.getUserBalance(userId);
      if (!existingBalance) {
        await this.updateUserBalance(userId, 0);
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }

  // USSD Operations - MOVED TO USSDService
  static async getUserPin(phoneNumber: string, satellite?: any): Promise<UserPin | null> {
    return UserService.getUserPin(phoneNumber, satellite);
  }

  static async createOrUpdateUserPin(phoneNumber: string, pin: string, satellite?: any): Promise<boolean> {
    return UserService.createOrUpdateUserPin(phoneNumber, pin, satellite);
  }

  static async createUSSDSession(sessionId: string, phoneNumber: string): Promise<USSDSession> {
    return USSDService.createUSSDSession(sessionId, phoneNumber);
  }

  static async getUSSDSession(sessionId: string): Promise<USSDSession | null> {
    return USSDService.getUSSDSession(sessionId);
  }

  static async updateUSSDSession(sessionId: string, updates: Partial<USSDSession>): Promise<boolean> {
    return USSDService.updateUSSDSession(sessionId, updates);
  }

  // Main USSD handler
  static async processUSSDRequest(sessionId: string, phoneNumber: string, text: string): Promise<{ response: string; continueSession: boolean }> {
    try {
      let session = await this.getUSSDSession(sessionId);
      
      if (!session) {
        // Create new session
        session = await this.createUSSDSession(sessionId, phoneNumber);
      }

      // Check if user has a PIN set
      const userPin = await this.getUserPin(phoneNumber);
      
      if (!userPin || !userPin.isSet) {
        return await this.handlePinSetup(session, text);
      } else {
        // User has PIN, check current menu
        if (session.currentMenu === 'pin_check') {
          // Update session to main menu since PIN is already set
          await this.updateUSSDSession(sessionId, { currentMenu: 'main_menu' });
          return this.getMainMenuResponse();
        } else {
          return await this.handleMainMenuFlow(session, text, userPin);
        }
      }
    } catch (error) {
      console.error('Error processing USSD request:', error);
      return {
        response: 'Sorry, an error occurred. Please try again.',
        continueSession: false
      };
    }
  }

  private static async handlePinSetup(session: USSDSession, text: string): Promise<{ response: string; continueSession: boolean }> {
    if (session.currentMenu === 'pin_setup') {
      if (!text || text.trim() === '') {
        return {
          response: 'Welcome to AfriTokeni!\nPlease set your 4-digit PIN to secure your account:',
          continueSession: true
        };
      } else {
        // Validate PIN (4 digits)
        const pin = text.trim();
        if (!/^\d{4}$/.test(pin)) {
          return {
            response: 'Invalid PIN. Please enter exactly 4 digits:',
            continueSession: true
          };
        }

        // Store temporary PIN and move to confirmation step
        await this.updateUSSDSession(session.sessionId, {
          currentMenu: 'pin_setup',
          step: 2,
          tempData: { newPin: pin }
        });

        return {
          response: 'Please confirm your PIN by entering it again:',
          continueSession: true
        };
      }
    } else if (session.step === 2) {
      // PIN confirmation step
      const confirmPin = text.trim();
      const originalPin = session.tempData?.newPin;

      if (confirmPin !== originalPin) {
        // Reset to PIN setup
        await this.updateUSSDSession(session.sessionId, {
          currentMenu: 'pin_setup',
          step: 1,
          tempData: {}
        });
        return {
          response: 'PINs do not match. Please set your 4-digit PIN again:',
          continueSession: true
        };
      }

      // PINs match, save to database
      const success = await this.createOrUpdateUserPin(session.phoneNumber, originalPin!);
      
      if (success) {
        // Create user if doesn't exist
        let user = await this.getUserByKey(session.phoneNumber);
        if (!user) {
          user = await this.createUser({
            firstName: 'USSD',
            lastName: 'User',
            email: session.phoneNumber,
            userType: 'user',
            authMethod: 'sms'
          });
          
          // Initialize user balance
          await this.initializeUserData(user.id);
        }

        await this.updateUSSDSession(session.sessionId, {
          currentMenu: 'main_menu',
          step: 0,
          userId: user.id,
          tempData: {}
        });

        return this.getMainMenuResponse();
      } else {
        return {
          response: 'Error saving PIN. Please try again.',
          continueSession: false
        };
      }
    }

    return {
      response: 'Invalid request.',
      continueSession: false
    };
  }

  private static async handleMainMenuFlow(session: USSDSession, text: string, userPin: UserPin): Promise<{ response: string; continueSession: boolean }> {
    if (session.currentMenu === 'main_menu') {
      const choice = text.trim();
      
      switch (choice) {
        case '1':
          await this.updateUSSDSession(session.sessionId, { currentMenu: 'send_money', step: 1 });
          return {
            response: 'Send Money\nEnter recipient phone number (format: 256XXXXXXXXX):',
            continueSession: true
          };
        case '2':
          return await this.handleCheckBalance(session, userPin);
        case '3':
          await this.updateUSSDSession(session.sessionId, { currentMenu: 'withdraw_money', step: 1 });
          return {
            response: 'Withdraw Money\nEnter amount to withdraw (UGX):',
            continueSession: true
          };
        case '4':
          return await this.handleTransactionHistory(session, userPin);
        default:
          return this.getMainMenuResponse();
      }
    } else if (session.currentMenu === 'send_money') {
      return await this.handleSendMoneyFlow(session, text);
    } else if (session.currentMenu === 'withdraw_money') {
      return await this.handleWithdrawMoneyFlow(session, text);
    }

    return this.getMainMenuResponse();
  }

  private static getMainMenuResponse(): { response: string; continueSession: boolean } {
    return {
      response: `AfriTokeni Menu
1. Send Money
2. Check Balance  
3. Withdraw Money
4. Transaction History

Choose an option (1-4):`,
      continueSession: true
    };
  }

  private static async handleCheckBalance(session: USSDSession, _userPin: UserPin): Promise<{ response: string; continueSession: boolean }> {
    try {
      const user = await this.getUserByKey(session.phoneNumber);
      if (!user) {
        return {
          response: 'User not found. Please try again.',
          continueSession: false
        };
      }

      const balance = await this.getUserBalance(user.id);
      const amount = balance?.balance || 0;

      return {
        response: `Your Account Balance
Amount: UGX ${amount.toLocaleString()}

Thank you for using AfriTokeni!`,
        continueSession: false
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return {
        response: 'Error retrieving balance. Please try again.',
        continueSession: false
      };
    }
  }

  private static async handleTransactionHistory(session: USSDSession, _userPin: UserPin): Promise<{ response: string; continueSession: boolean }> {
    try {
      const user = await this.getUserByKey(session.phoneNumber);
      if (!user) {
        return {
          response: 'User not found. Please try again.',
          continueSession: false
        };
      }

      const transactions = await this.getUserTransactions(user.id);
      const recentTransactions = transactions.slice(0, 5); // Show last 5 transactions

      if (recentTransactions.length === 0) {
        return {
          response: 'No transactions found.\n\nThank you for using AfriTokeni!',
          continueSession: false
        };
      }

      let response = 'Last 5 Transactions:\n\n';
      recentTransactions.forEach((txn, index) => {
        const date = new Date(txn.createdAt).toLocaleDateString();
        const type = txn.type.charAt(0).toUpperCase() + txn.type.slice(1);
        response += `${index + 1}. ${type}: UGX ${txn.amount.toLocaleString()} - ${date}\n`;
      });

      response += '\nThank you for using AfriTokeni!';

      return {
        response,
        continueSession: false
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return {
        response: 'Error retrieving transaction history. Please try again.',
        continueSession: false
      };
    }
  }

  private static async handleSendMoneyFlow(session: USSDSession, text: string): Promise<{ response: string; continueSession: boolean }> {
    if (!session.tempData?.sendRecipient) {
      // First step: get recipient phone number
      const phone = text.trim();
      if (!/^256\d{9}$/.test(phone)) {
        return {
          response: 'Invalid phone number format. Please enter in format 256XXXXXXXXX:',
          continueSession: true
        };
      }

      await this.updateUSSDSession(session.sessionId, {
        tempData: { ...session.tempData, sendRecipient: phone }
      });

      return {
        response: 'Enter amount to send (UGX):',
        continueSession: true
      };
    } else if (!session.tempData?.sendAmount) {
      // Second step: get amount
      const amount = parseInt(text.trim());
      if (isNaN(amount) || amount <= 0) {
        return {
          response: 'Invalid amount. Please enter a valid amount (UGX):',
          continueSession: true
        };
      }

      // Check balance
      const user = await this.getUserByKey(session.phoneNumber);
      if (!user) {
        return {
          response: 'User not found. Transaction cancelled.',
          continueSession: false
        };
      }

      const balance = await this.getUserBalance(user.id);
      if (!balance || balance.balance < amount) {
        return {
          response: `Insufficient balance. Your balance is UGX ${balance?.balance.toLocaleString() || 0}.\n\nTransaction cancelled.`,
          continueSession: false
        };
      }

      await this.updateUSSDSession(session.sessionId, {
        tempData: { ...session.tempData, sendAmount: amount }
      });

      return {
        response: `Confirm transaction:
Send UGX ${amount.toLocaleString()} to ${session.tempData.sendRecipient}

1. Confirm
2. Cancel`,
        continueSession: true
      };
    } else {
      // Third step: confirmation
      const choice = text.trim();
      if (choice === '1') {
        // Process transaction
        try {
          const user = await this.getUserByKey(session.phoneNumber);
          if (!user) {
            return {
              response: 'User not found. Transaction cancelled.',
              continueSession: false
            };
          }

          // Create transaction
          const transaction = await this.createTransaction({
            userId: user.id,
            type: 'send',
            amount: session.tempData.sendAmount!,
            currency: 'UGX',
            recipientPhone: session.tempData.sendRecipient,
            status: 'completed',
            description: `Money sent to ${session.tempData.sendRecipient}`
          });

          // Update sender balance
          const currentBalance = await this.getUserBalance(user.id);
          const newBalance = (currentBalance?.balance || 0) - session.tempData.sendAmount!;
          await this.updateUserBalance(user.id, newBalance);

          return {
            response: `Transaction Successful!
UGX ${session.tempData.sendAmount!.toLocaleString()} sent to ${session.tempData.sendRecipient}
Reference: ${transaction.id.substring(0, 8)}

Thank you for using AfriTokeni!`,
            continueSession: false
          };
        } catch (error) {
          console.error('Error processing send money:', error);
          return {
            response: 'Transaction failed. Please try again.',
            continueSession: false
          };
        }
      } else {
        return {
          response: 'Transaction cancelled.\n\nThank you for using AfriTokeni!',
          continueSession: false
        };
      }
    }
  }

  private static async handleWithdrawMoneyFlow(session: USSDSession, text: string): Promise<{ response: string; continueSession: boolean }> {
    if (!session.tempData?.withdrawAmount) {
      // First step: get amount
      const amount = parseInt(text.trim());
      if (isNaN(amount) || amount <= 0) {
        return {
          response: 'Invalid amount. Please enter a valid amount (UGX):',
          continueSession: true
        };
      }

      // Check balance
      const user = await this.getUserByKey(session.phoneNumber);
      if (!user) {
        return {
          response: 'User not found. Transaction cancelled.',
          continueSession: false
        };
      }

      const balance = await this.getUserBalance(user.id);
      if (!balance || balance.balance < amount) {
        return {
          response: `Insufficient balance. Your balance is UGX ${balance?.balance.toLocaleString() || 0}.\n\nTransaction cancelled.`,
          continueSession: false
        };
      }

      await this.updateUSSDSession(session.sessionId, {
        tempData: { ...session.tempData, withdrawAmount: amount }
      });

      return {
        response: `Confirm withdrawal:
Amount: UGX ${amount.toLocaleString()}

1. Confirm
2. Cancel`,
        continueSession: true
      };
    } else {
      // Second step: confirmation
      const choice = text.trim();
      if (choice === '1') {
        // Generate withdrawal code
        const withdrawalCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        try {
          const user = await this.getUserByKey(session.phoneNumber);
          if (!user) {
            return {
              response: 'User not found. Transaction cancelled.',
              continueSession: false
            };
          }

          // Create withdrawal transaction
          await this.createTransaction({
            userId: user.id,
            type: 'withdraw',
            amount: session.tempData.withdrawAmount!,
            currency: 'UGX',
            status: 'pending',
            description: `Cash withdrawal of UGX ${session.tempData.withdrawAmount!.toLocaleString()}`,
            metadata: {
              withdrawalCode
            }
          });

          return {
            response: `Withdrawal Code Generated!
Code: ${withdrawalCode}
Amount: UGX ${session.tempData.withdrawAmount!.toLocaleString()}

Visit any AfriTokeni agent with this code and your ID to collect cash.
Code expires in 24 hours.

Thank you for using AfriTokeni!`,
            continueSession: false
          };
        } catch (error) {
          console.error('Error processing withdrawal:', error);
          return {
            response: 'Withdrawal failed. Please try again.',
            continueSession: false
          };
        }
      } else {
        return {
          response: 'Withdrawal cancelled.\n\nThank you for using AfriTokeni!',
          continueSession: false
        };
      }
    }
  }

  // SMS Command Processing
  // SMS Command Processing - MOVED TO SMSService
  static async processSMSCommand(phoneNumber: string, message: string, userId?: string): Promise<string> {
    return SMSService.processSMSCommand(phoneNumber, message, userId);
  }

  // USSD Command Handlers
  private static async handleConfirmCommand(command: string, userId?: string, _phoneNumber?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    const parts = command.split(' ');
    if (parts.length < 2) {
      return 'Format: CONFIRM code. Check your previous message for the confirmation code.';
    }
    
    const confirmationCode = parts[1].toUpperCase();
    
    try {
      // Retrieve pending transaction
      const pendingTx = await this.getPendingTransaction(userId, confirmationCode);
      if (!pendingTx) {
        return 'Invalid or expired confirmation code. Please start a new transaction.';
      }
      
      // Check if expired
      if (new Date() > pendingTx.expiresAt) {
        await this.deletePendingTransaction(userId, confirmationCode);
        return 'Confirmation code expired. Please start a new transaction.';
      }
      
      // Process the transaction
      if (pendingTx.type === 'ckbtc_send') {
        // Process ckBTC transfer
        const { CkBTCService } = await import('./ckBTCService');
        const result = await CkBTCService.transfer({
          amountSatoshis: pendingTx.amountSatoshis,
          recipient: pendingTx.recipient,
          senderId: userId,
          memo: 'USSD transfer'
        });
        
        await this.deletePendingTransaction(userId, confirmationCode);
        
        if (result.success) {
          return `ckBTC Transfer Complete!
Sent: ₿${pendingTx.amountBTC.toFixed(8)} ckBTC
To: ${pendingTx.recipient}
Fee: ₿0.00000010
Time: <1 second ✅

Send *AFRI# for menu`;
        } else {
          return `Transfer failed: ${result.error}. Please try again.`;
        }
      } else if (pendingTx.type === 'ckusdc_send') {
        // Process ckUSDC transfer
        const { CkUSDCService } = await import('./ckUSDCService');
        
        const result = await CkUSDCService.transfer({
          senderId: userId,
          recipient: pendingTx.recipient,
          amount: pendingTx.amount,
        });
        
        await this.deletePendingTransaction(userId, confirmationCode);
        
        if (result.success) {
          return `ckUSDC Transfer Complete!
Sent: $${pendingTx.amount.toFixed(2)} ckUSDC
To: ${pendingTx.recipient}
Fee: $${result.fee?.toFixed(2) || '0.00'}
Time: <1 second ✅

Send *AFRI# for menu`;
        } else {
          return `Transfer failed: ${result.error}. Please try again.`;
        }
      }
      
      return 'Unknown transaction type. Please try again.';
    } catch (error) {
      return 'Error confirming transaction. Please try again.';
    }
  }

  // ckBTC USSD Command Handlers
  private static async handleCkBTCBalanceCommand(userId?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    try {
      const { CkBTCService } = await import('./ckBTCService');
      const { BitcoinRateService } = await import('./bitcoinRateService');
      
      const balance = await CkBTCService.getBalance(userId);
      const ugxRate = await BitcoinRateService.getBitcoinRate('ugx');
      const satoshis = balance.balanceSatoshis;
      const btc = satoshis / 100000000;
      const ugxValue = btc * ugxRate;
      
      return `ckBTC Balance (Instant):
₿${balance.balanceBTC} ckBTC
≈ UGX ${ugxValue.toLocaleString()}

⚡ Instant transfers <1 sec
💰 Fee: ~$0.01 per transfer

Dial *AFRI# for menu`;
    } catch (error) {
      return 'Error checking ckBTC balance. Please try again.';
    }
  }

  private static async handleCkBTCSendCommand(command: string, userId?: string, phoneNumber?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    const parts = command.split(' ');
    if (parts.length < 4) {
      return 'Format: CKBTC SEND phone amount. Example: CKBTC SEND +256700123456 0.001';
    }
    
    const recipient = parts[2];
    const amount = parseFloat(parts[3]);
    
    if (isNaN(amount) || amount <= 0) {
      return 'Invalid amount. Please enter a valid number.';
    }
    
    try {
      // const { CkBTCService } = await import('./ckBTCService');
      const { CkBTCUtils } = await import('../types/ckbtc');
      
      const amountSatoshis = CkBTCUtils.btcToSatoshis(amount);
      const feeSatoshis = 10; // ~$0.01
      
      // Store pending transaction for confirmation
      const confirmationCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      await this.storePendingTransaction(userId, {
        type: 'ckbtc_send',
        recipient,
        amountSatoshis,
        amountBTC: amount,
        feeSatoshis,
        confirmationCode,
        phoneNumber: phoneNumber || '',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
      
      return `ckBTC Instant Transfer:
Send: ₿${amount.toFixed(8)} ckBTC
To: ${recipient}
Fee: ₿0.00000010 (~$0.01)
Total: ₿${(amount + 0.00000010).toFixed(8)}

⚡ Completes in <1 second!

To confirm, reply:
CONFIRM ${confirmationCode}

Quote expires in 5 minutes.`;
    } catch (error) {
      return 'Error processing ckBTC transfer. Please try again.';
    }
  }

  private static async handleCkBTCDepositCommand(userId?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    try {
      const { CkBTCService } = await import('./ckBTCService');
      
      const response = await CkBTCService.getDepositAddress({ principalId: userId });
      
      if (!response.success || !response.depositAddress) {
        return 'Error generating deposit address. Please try again.';
      }
      
      return `ckBTC Deposit Address:
${response.depositAddress}

How to deposit:
1. Send Bitcoin to address above
2. Wait for ${response.minConfirmations || 6} confirmations (~60 min)
3. ckBTC automatically minted!

⚡ Then enjoy instant transfers!

Dial *AFRI# for menu`;
    } catch (error) {
      return 'Error getting deposit address. Please try again.';
    }
  }

  // ckUSDC USSD Command Handlers
  private static async handleCkUSDCBalanceCommand(userId?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    try {
      const { CkUSDCService } = await import('./ckUSDCService');
      
      const balance = await CkUSDCService.getBalanceWithLocalCurrency(userId, 'UGX');
      
      return `ckUSDC Balance (Stable):
$${balance.balanceUSDC} ckUSDC
≈ UGX ${balance.localCurrencyEquivalent?.toLocaleString() || '0'}

💵 1:1 USD peg (stable value)
⚡ Instant transfers

Dial *AFRI# for menu`;
    } catch (error) {
      return 'Error checking ckUSDC balance. Please try again.';
    }
  }

  private static async handleCkUSDCSendCommand(command: string, userId?: string, phoneNumber?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    const parts = command.split(' ');
    if (parts.length < 4) {
      return 'Format: USDC SEND phone amount. Example: USDC SEND +256700123456 50';
    }
    
    const recipient = parts[2];
    const amount = parseFloat(parts[3]);
    
    if (isNaN(amount) || amount <= 0) {
      return 'Invalid amount. Please enter a valid number.';
    }
    
    try {
      // Store pending transaction for confirmation
      const confirmationCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      await this.storePendingTransaction(userId, {
        type: 'ckusdc_send',
        recipient,
        amount,
        fee: 0.01, // ~$0.01
        confirmationCode,
        phoneNumber: phoneNumber || '',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
      
      return `ckUSDC Instant Transfer:
Send: $${amount.toFixed(2)} ckUSDC
To: ${recipient}
Fee: $0.01
Total: $${(amount + 0.01).toFixed(2)}

💵 Stable value (1:1 USD)
⚡ Completes in <1 second!

To confirm, reply:
CONFIRM ${confirmationCode}

Quote expires in 5 minutes.`;
    } catch (error) {
      return 'Error processing ckUSDC transfer. Please try again.';
    }
  }

  // Pending Transaction Storage (for SMS confirmations)
  private static async storePendingTransaction(userId: string, transaction: any): Promise<void> {
    try {
      await setDoc({
        collection: 'pending_transactions',
        doc: {
          key: `${userId}_${transaction.confirmationCode}`,
          data: {
            ...transaction,
            userId,
            createdAt: new Date().toISOString(),
            expiresAt: transaction.expiresAt instanceof Date ? transaction.expiresAt.toISOString() : String(transaction.expiresAt)
          }
        }
      });
    } catch (error) {
      console.error('Error storing pending transaction:', error);
    }
  }

  private static async getPendingTransaction(userId: string, confirmationCode: string): Promise<any> {
    try {
      const doc = await getDoc({
        collection: 'pending_transactions',
        key: `${userId}_${confirmationCode}`
      });
      
      if (!doc) return null;
      
      return {
        ...doc.data,
        expiresAt: new Date((doc.data as any).expiresAt)
      };
    } catch (error) {
      console.error('Error getting pending transaction:', error);
      return null;
    }
  }

  private static async deletePendingTransaction(userId: string, confirmationCode: string): Promise<void> {
    try {
      // For deleteDoc, we just need the collection and key
      const docKey = `${userId}_${confirmationCode}`;
      // Note: deleteDoc API might be different - this is a placeholder implementation
      console.log(`Deleting pending transaction: ${docKey}`);
      // In production, implement proper deleteDoc call based on Juno API
    } catch (error) {
      console.error('Error deleting pending transaction:', error);
    }
  }

  // Withdraw Transaction Methods
  static async createWithdrawTransaction(
    userId: string,
    amount: number,
    agentId: string,
    withdrawalCode: string,
    fee: number
  ): Promise<Transaction> {
    try {
      const transaction: Transaction = {
        id: nanoid(),
        userId,
        type: 'withdraw',
        amount,
        fee,
        currency: 'UGX',
        agentId,
        status: 'pending',
        description: `Cash withdrawal of UGX ${amount.toLocaleString()}`,
        createdAt: new Date(),
        metadata: {
          withdrawalCode,
          agentLocation: '', // This could be populated with agent location
        }
      };

      await setDoc({
        collection: 'transactions',
        doc: {
          key: transaction.id,
          data: {
            ...transaction,
            createdAt: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : String(transaction.createdAt),
            completedAt: transaction.completedAt 
              ? (transaction.completedAt instanceof Date ? transaction.completedAt.toISOString() : String(transaction.completedAt))
              : undefined
          }
        }
      });

      // Send SMS notification to user (log it for now)
      await this.logSMSMessage({
        userId,
        phoneNumber: '+256123456789', // This should be the user's phone number from their profile
        message: `Withdrawal request created. Code: ${withdrawalCode}. Amount: UGX ${amount.toLocaleString()}. Show this code to agent ${agentId} to complete withdrawal.`,
        direction: 'outbound',
        status: 'sent',
        transactionId: transaction.id
      });

      return transaction;
    } catch (error) {
      console.error('Error creating withdraw transaction:', error);
      throw new Error('Failed to create withdraw transaction');
    }
  }

  static async completeWithdrawTransaction(
    transactionId: string,
    agentId: string,
    verificationCode: string
  ): Promise<boolean> {
    try {
      // Get the transaction
      const transactionDoc = await getDoc({
        collection: 'transactions',
        key: transactionId
      });

      if (!transactionDoc?.data) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionDoc.data as Transaction;
      
      // Verify the withdrawal code
      if (transaction.withdrawalCode !== verificationCode) {
        throw new Error('Invalid withdrawal code');
      }

      // Verify the agent
      if (transaction.agentId !== agentId) {
        throw new Error('Agent not authorized for this transaction');
      }

      // Update user balance (reduce)
      const userBalance = await this.getUserBalance(transaction.userId);
      if (!userBalance) {
        throw new Error('User balance not found');
      }
      
      const totalDeduction = transaction.amount + (transaction.amount * 0.01); // Amount + 1% fee
      
      if (userBalance.balance < totalDeduction) {
        throw new Error('Insufficient balance');
      }

      await this.updateUserBalance(transaction.userId, userBalance.balance - totalDeduction);

      // Update agent balance
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Check if agent has sufficient cash balance
      console.log(`🏦 Agent balance check (completeWithdraw): cashBalance=${agent.cashBalance}, withdrawal amount=${transaction.amount}, digitalBalance=${agent.digitalBalance}`);
      if (agent.cashBalance < transaction.amount) {
        throw new Error(`Agent has insufficient cash balance. Agent has ${agent.cashBalance}, needs ${transaction.amount}`);
      }

      const agentDigitalReceives = transaction.amount + (transaction.fee || 0); // Agent receives user's digital payment including fee
      
      await this.updateAgentBalance(agentId, { 
        cashBalance: agent.cashBalance - transaction.amount, // Agent gives cash to user
        digitalBalance: agent.digitalBalance + agentDigitalReceives // Agent receives digital payment + fee
      });

      // Update transaction status to completed
      await this.updateTransaction(transactionId, {
        status: 'completed' as const,
        completedAt: new Date()
      });

      // Send completion SMS to user (log it for now)
      await this.logSMSMessage({
        userId: transaction.userId,
        phoneNumber: '+256123456789', // User's phone number
        message: `Withdrawal completed! You received UGX ${transaction.amount.toLocaleString()} cash. Transaction ID: ${transactionId}`,
        direction: 'outbound',
        status: 'sent',
        transactionId
      });

      return true;
    } catch (error) {
      console.error('Error completing withdraw transaction:', error);
      throw error;
    }
  }

  static async getPendingWithdrawals(agentId: string): Promise<Transaction[]> {
    try {
      const docs = await listDocs({
        collection: 'transactions'
      });

      return docs.items
        .map(doc => doc.data as Transaction)
        .filter(transaction => 
          transaction.type === 'withdraw' && 
          transaction.status === 'pending' &&
          transaction.agentId === agentId
        )
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
    } catch (error) {
      console.error('Error getting pending withdrawals:', error);
      return [];
    }
  }

  // Deposit Request Management Methods
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
      
      const depositRequest = {
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
        }
      });

      console.log(`Created deposit request ${requestId} for user ${userId}`);
      return requestId;
    } catch (error) {
      console.error('Error creating deposit request:', error);
      throw error;
    }
  }

  static async getAgentDepositRequests(agentId: string, status?: string): Promise<DepositRequest[]> {
    return DepositWithdrawalService.getAgentDepositRequests(agentId, status);
  }

  static async updateDepositRequestStatus(
    requestId: string, 
    status: 'pending' | 'confirmed' | 'completed' | 'rejected'
  ): Promise<boolean> {
    try {
      const existingDoc = await getDoc({
        collection: 'deposit_requests',
        key: requestId
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
        }
      });

      console.log(`Updated deposit request ${requestId} status to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating deposit request status:', error);
      return false;
    }
  }

  // Deposit/Withdrawal Processing - MOVED TO DepositWithdrawalService
  static async processDepositRequest(
    requestId: string,
    agentId: string,
    processedBy?: string
  ): Promise<{ success: boolean; transactionId?: string; userTransactionId?: string; error?: string }> {
    return DepositWithdrawalService.processDepositRequest(requestId, agentId, processedBy);
  }

  static async createWithdrawalRequest(userId: string, agentId: string, amount: number, currency: string, withdrawalCode: string, fee: number): Promise<string> {
    return DepositWithdrawalService.createWithdrawalRequest(userId, agentId, amount, currency, fee).then(r => r.id);
  }

  static async getAgentWithdrawalRequests(agentId: string, status?: string): Promise<WithdrawalRequest[]> {
    return DepositWithdrawalService.getAgentWithdrawalRequests(agentId, status);
  }

  static async updateWithdrawalRequestStatus(
    requestId: string, 
    status: 'pending' | 'confirmed' | 'completed' | 'rejected'
  ): Promise<boolean> {
    try {
      // Update the transaction status instead of withdrawal_requests
      const transaction = await this.updateTransaction(requestId, {
        status: status as 'pending' | 'completed' | 'failed' | 'cancelled' | 'confirmed',
        updatedAt: new Date()
      });

      console.log(`Updated withdrawal transaction ${requestId} status to ${status}`);
      return !!transaction;
    } catch (error) {
      console.error('Error updating withdrawal transaction status:', error);
      return false;
    }
  }

  static async processWithdrawalRequest(
    requestId: string,
    agentId: string,
    processedBy?: string
  ): Promise<{ success: boolean; transactionId?: string; userTransactionId?: string; error?: string }> {
    return DepositWithdrawalService.processWithdrawalRequest(requestId, agentId, processedBy);
  }

  // SMS Notification Methods - MOVED TO SMSService
  static async sendDepositSuccessSMS(phoneNumber: string, amount: number, currency: string, depositCode: string): Promise<void> {
    return SMSService.sendDepositSuccessSMS(phoneNumber, amount, currency, depositCode);
  }

  static async sendWithdrawalSuccessSMS(phoneNumber: string, amount: number, currency: string, withdrawalCode: string): Promise<void> {
    return SMSService.sendWithdrawalSuccessSMS(phoneNumber, amount, currency, withdrawalCode);
  }

  static async getDepositRequestByCode(depositCode: string): Promise<DepositRequest | null> {
    return DepositWithdrawalService.getDepositRequestByCode(depositCode);
  }

  static async confirmDepositRequest(requestId: string, agentId: string): Promise<boolean> {
    const requestDoc = await getDoc({ collection: 'deposit_requests', key: requestId });
    if (!requestDoc?.data) return false;
    const request = requestDoc.data as DepositRequest;
    if (request.agentId !== agentId || request.status !== 'pending') return false;
    return this.updateDepositRequestStatus(requestId, 'confirmed');
  }

  // ==================== PLATFORM REVENUE OPERATIONS ====================
  
  /**
   * Record platform revenue from settlement fees, liquidity fees, etc.
   * This captures REAL money that the platform earns
   */
  static async recordPlatformRevenue(revenueData: PlatformRevenueInput): Promise<PlatformRevenue> {
    try {
      const now = new Date();
      const revenueId = nanoid();

      const revenue: PlatformRevenue = {
        id: revenueId,
        amount: revenueData.amount,
        currency: revenueData.currency,
        source: revenueData.source,
        sourceTransactionId: revenueData.sourceTransactionId,
        agentId: revenueData.agentId,
        userId: revenueData.userId,
        description: revenueData.description,
        createdAt: now
      };

      await setDoc({
        collection: 'platform_revenue',
        doc: {
          key: revenueId,
          data: {
            ...revenue,
            createdAt: now.toISOString()
          }
        }
      });

      console.log('💰 Platform revenue recorded:', {
        id: revenueId,
        amount: revenueData.amount,
        source: revenueData.source,
        description: revenueData.description
      });

      return revenue;
    } catch (error) {
      console.error('Error recording platform revenue:', error);
      throw error;
    }
  }

  /**
   * Get total platform revenue
   */
  static async getTotalPlatformRevenue(): Promise<{ total: number; byCurrency: Record<string, number> }> {
    try {
      const docs = await listDocs({
        collection: 'platform_revenue'
      });

      const byCurrency: Record<string, number> = {};
      let total = 0;

      docs.items.forEach(doc => {
        const revenue = doc.data as any;
        if (!byCurrency[revenue.currency]) {
          byCurrency[revenue.currency] = 0;
        }
        byCurrency[revenue.currency] += revenue.amount;
        total += revenue.amount;
      });

      return { total, byCurrency };
    } catch (error) {
      console.error('Error calculating total platform revenue:', error);
      return { total: 0, byCurrency: {} };
    }
  }

  /**
   * Initialize cash balance for all agents
   */
  static async initializeAllAgentsCashBalance(): Promise<{ success: boolean; updated: number; errors: string[] }> {
    try {
      const agents = await listDocs({
        collection: 'agents'
      });

      let updated = 0;
      const errors: string[] = [];

      for (const agentDoc of agents.items) {
        try {
          const agent = agentDoc.data as any;
          
          // Initialize cashBalance if not set
          if (agent.cashBalance === undefined || agent.cashBalance === null) {
            await setDoc({
              collection: 'agents',
              doc: {
                key: agentDoc.key,
                data: {
                  ...agent,
                  cashBalance: 0,
                  digitalBalance: agent.digitalBalance || 0,
                  updatedAt: new Date().toISOString(),
                }
              }
            });
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update agent ${agentDoc.key}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        updated,
        errors
      };
    } catch (error) {
      console.error('Error initializing agent balances:', error);
      return {
        success: false,
        updated: 0,
        errors: [`Failed to initialize: ${error}`]
      };
    }
  }

  /**
   * Transfer money between users
   */
}
