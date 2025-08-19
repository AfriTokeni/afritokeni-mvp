import { setDoc, getDoc, listDocs } from '@junobuild/core';
import { nanoid } from 'nanoid';

// Transaction types for AfriTokeni
export interface Transaction {
  id: string;
  userId: string;
  type: 'send' | 'receive' | 'withdraw' | 'deposit';
  amount: number;
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

// Simplified data service following Juno patterns
export class DataService {
  // Transaction operations
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const id = nanoid();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date()
    };

    await setDoc({
      collection: 'transactions',
      doc: {
        key: id,
        data: newTransaction
      }
    });

    return newTransaction;
  }

  static async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const doc = await getDoc({
        collection: 'transactions',
        key: id
      });
      return doc?.data as Transaction || null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const docs = await listDocs({
        collection: 'transactions'
      });
      
      return docs.items
        .map(doc => doc.data as Transaction)
        .filter(transaction => transaction.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<boolean> {
    try {
      const existing = await this.getTransaction(id);
      if (!existing) return false;

      const updated = { ...existing, ...updates };
      
      await setDoc({
        collection: 'transactions',
        doc: {
          key: id,
          data: updated
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  }

  // Balance operations
  static async getUserBalance(userId: string): Promise<UserBalance | null> {
    try {
      const doc = await getDoc({
        collection: 'balances',
        key: userId
      });
      return doc?.data as UserBalance || null;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return null;
    }
  }

  static async updateUserBalance(userId: string, balance: number): Promise<boolean> {
    try {
      const userBalance: UserBalance = {
        userId,
        balance,
        currency: 'UGX',
        lastUpdated: new Date()
      };

      await setDoc({
        collection: 'balances',
        doc: {
          key: userId,
          data: userBalance
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user balance:', error);
      return false;
    }
  }

  // Agent operations
  static async createAgent(agent: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> {
    const newAgent: Agent = {
      ...agent,
      id: nanoid(),
      createdAt: new Date()
    };

    await setDoc({
      collection: 'agents',
      doc: {
        key: newAgent.id,
        data: newAgent
      }
    });

    return newAgent;
  }

  static async getAgent(id: string): Promise<Agent | null> {
    try {
      const doc = await getDoc({
        collection: 'agents',
        key: id
      });
      return doc?.data as Agent || null;
    } catch (error) {
      console.error('Error getting agent:', error);
      return null;
    }
  }

  static async getNearbyAgents(lat: number, lng: number, radius: number = 5): Promise<Agent[]> {
    try {
      const docs = await listDocs({
        collection: 'agents'
      });
      
      return docs.items
        .map(doc => doc.data as Agent)
        .filter(agent => {
          if (!agent.isActive) return false;
          
          // Simple distance calculation (not precise but good for demo)
          const agentLat = agent.location.coordinates.lat;
          const agentLng = agent.location.coordinates.lng;
          const distance = Math.sqrt(
            Math.pow(lat - agentLat, 2) + Math.pow(lng - agentLng, 2)
          );
          
          return distance <= radius;
        })
        .sort((a, b) => {
          // Sort by distance (simplified)
          const distA = Math.sqrt(
            Math.pow(lat - a.location.coordinates.lat, 2) + 
            Math.pow(lng - a.location.coordinates.lng, 2)
          );
          const distB = Math.sqrt(
            Math.pow(lat - b.location.coordinates.lat, 2) + 
            Math.pow(lng - b.location.coordinates.lng, 2)
          );
          return distA - distB;
        });
    } catch (error) {
      console.error('Error getting nearby agents:', error);
      return [];
    }
  }

  // SMS operations
  static async logSMSMessage(message: Omit<SMSMessage, 'id' | 'createdAt'>): Promise<SMSMessage> {
    const newMessage: SMSMessage = {
      ...message,
      id: nanoid(),
      createdAt: new Date()
    };

    await setDoc({
      collection: 'sms_messages',
      doc: {
        key: newMessage.id,
        data: newMessage
      }
    });

    return newMessage;
  }

  static async getUserSMSHistory(userId: string): Promise<SMSMessage[]> {
    try {
      const docs = await listDocs({
        collection: 'sms_messages'
      });
      
      return docs.items
        .map(doc => doc.data as SMSMessage)
        .filter(message => message.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting SMS history:', error);
      return [];
    }
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

  // SMS Command Processing
  static async processSMSCommand(phoneNumber: string, message: string, userId?: string): Promise<string> {
    const command = message.trim().toUpperCase();
    
    try {
      // Log the incoming SMS
      await this.logSMSMessage({
        userId,
        phoneNumber,
        message,
        direction: 'inbound',
        status: 'delivered',
        command
      });

      // Process different commands
      if (command === 'BAL' || command === 'BALANCE') {
        return await this.handleBalanceCommand(userId);
      } else if (command.startsWith('SEND ')) {
        return await this.handleSendCommand(command, userId);
      } else if (command === 'AGENTS') {
        return await this.handleAgentsCommand(userId);
      } else if (command.startsWith('WITHDRAW ')) {
        return await this.handleWithdrawCommand(command, userId);
      } else if (command === '*AFRI#') {
        return this.getMainMenu();
      } else {
        return 'Invalid command. Send *AFRI# for menu.';
      }
    } catch (error) {
      console.error('Error processing SMS command:', error);
      return 'Sorry, there was an error processing your request. Please try again.';
    }
  }

  private static async handleBalanceCommand(userId?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    const balance = await this.getUserBalance(userId);
    const amount = balance?.balance || 0;
    
    return `Your balance is UGX ${amount.toLocaleString()}. Send *AFRI# for menu.`;
  }

  private static async handleSendCommand(command: string, userId?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    const parts = command.split(' ');
    if (parts.length < 3) {
      return 'Format: SEND amount phone_number. Example: SEND 10000 256701234567';
    }
    
    const amount = parseInt(parts[1]);
    const phone = parts[2];
    
    if (isNaN(amount) || amount <= 0) {
      return 'Invalid amount. Please enter a valid number.';
    }
    
    // Check balance
    const balance = await this.getUserBalance(userId);
    if (!balance || balance.balance < amount) {
      return 'Insufficient balance. Check your balance with BAL command.';
    }
    
    return `Confirm sending UGX ${amount.toLocaleString()} to ${phone}? Reply YES with your PIN.`;
  }

  private static async handleAgentsCommand(userId?: string): Promise<string> {
    // For demo, return mock agents
    return `Nearest agents:
1. Kampala Rd Shop - 0.2km
2. Nakawa Market - 0.8km  
3. Mobile Agent John - 1.2km
Reply with agent number to withdraw.`;
  }

  private static async handleWithdrawCommand(command: string, userId?: string): Promise<string> {
    if (!userId) return 'Please register first. Send *AFRI# for menu.';
    
    const parts = command.split(' ');
    if (parts.length < 2) {
      return 'Format: WITHDRAW amount. Example: WITHDRAW 50000';
    }
    
    const amount = parseInt(parts[1]);
    if (isNaN(amount) || amount <= 0) {
      return 'Invalid amount. Please enter a valid number.';
    }
    
    // Generate withdrawal code
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `Withdrawal code: ${code}. Visit any agent with your ID. Code expires in 2 hours.`;
  }

  private static getMainMenu(): string {
    return `*AFRI# - AfriTokeni Menu
1. Send Money - SEND amount phone
2. Check Balance - BAL
3. Find Agents - AGENTS
4. Withdraw Cash - WITHDRAW amount
5. Help - HELP`;
  }
}
