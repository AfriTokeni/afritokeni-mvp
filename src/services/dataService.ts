import { setDoc, getDoc, listDocs } from '@junobuild/core';
import { nanoid } from 'nanoid';
import { User } from '../types/auth';



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
export class DataService {
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
      });

    // Save user to Juno datastore
    await setDoc({
      collection: 'users',
      doc: {
        key: documentKey,
        data: dataForJuno,
        version: existingDoc?.version ? existingDoc.version : 1n
      
      },     
    });

    return newUser;
  }

  // Get user by key (either ID for web users or phone for SMS users)
  static async getUserByKey(key: string): Promise<User | null> {
    console.log('Getting user by key:', key);
    try {
      const doc = await getDoc({
        collection: 'users',
        key: key,
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

  // Legacy method for SMS users - get user by phone number
  static async getUser(phoneNumber: string): Promise<User | null> {
    return this.getUserByKey(phoneNumber);
  }

  // Get web user by ID
  static async getWebUserById(userId: string): Promise<User | null> {
    return this.getUserByKey(userId);
  }

  static async updateUser(key: string, updates: Partial<User>, _authMethod?: 'sms' | 'web'): Promise<boolean> {
    try {
      const existingUser = await this.getUserByKey(key);
      if (!existingUser) return false;

      // Get the current document to retrieve its version
      const existingDoc = await getDoc({
        collection: 'users',
        key: key,
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
      });

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Legacy method for SMS users
  static async updateUserByPhone(phoneNumber: string, updates: Partial<User>): Promise<boolean> {
    return this.updateUser(phoneNumber, updates, 'sms');
  }

  // Method for web users
  static async updateWebUser(userId: string, updates: Partial<User>): Promise<boolean> {
    return this.updateUser(userId, updates, 'web');
  }

  // Enhanced search functionality - search by phone, first name, or last name
  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      // First, try to find user by exact phone number match (for SMS users)
      // Try both original case and formatted phone number
      let directMatch = await this.getUserByKey(searchTerm);
      if (!directMatch && searchTerm.match(/^\d+$/)) {
        // If it's a number, try formatting as phone number
        const formattedPhone = searchTerm.startsWith('+') ? searchTerm : `+256${searchTerm.replace(/^0/, '')}`;
        directMatch = await this.getUserByKey(formattedPhone);
      }
      
      if (directMatch) {
        return [directMatch];
      }

      // If not found by direct key match, search through all users
      const allUsersResult = await listDocs({
        collection: 'users'
      });

      if (!allUsersResult.items) {
        return [];
      }

      const searchTermLower = searchTerm.toLowerCase().trim();
      const matchedUsers: User[] = [];

      for (const doc of allUsersResult.items) {
        const rawData = doc.data as UserDataFromJuno;
        const user: User = {
          id: rawData.id,
          firstName: rawData.firstName,
          lastName: rawData.lastName,
          email: rawData.email,
          userType: rawData.userType,
          isVerified: rawData.isVerified,
          kycStatus: rawData.kycStatus,
          createdAt: new Date(rawData.createdAt)
        };

        // Check if search term matches phone (email field), first name, or last name (case insensitive)
        const matchesPhone = user.email.toLowerCase().includes(searchTermLower);
        const matchesFirstName = user.firstName.toLowerCase().includes(searchTermLower);
        const matchesLastName = user.lastName.toLowerCase().includes(searchTermLower);
        
        // Also check for partial phone number matches (last digits)
        const phoneDigits = user.email.replace(/\D/g, ''); // Extract only digits
        const searchDigits = searchTerm.replace(/\D/g, '');
        const matchesPhoneDigits = searchDigits.length >= 3 && phoneDigits.includes(searchDigits);

        if (matchesPhone || matchesFirstName || matchesLastName || matchesPhoneDigits) {
          matchedUsers.push(user);
        }
      }

      return matchedUsers;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Search specifically by phone number (legacy method)
  static async searchUserByPhone(phoneNumber: string): Promise<User | null> {
    const users = await this.searchUsers(phoneNumber);
    return users.length > 0 ? users[0] : null;
  }

  // Transaction operations
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const now = new Date();
    const newTransaction: Transaction = {
      ...transaction,
      id: nanoid(),
      createdAt: now
    };

    // Convert Date fields to ISO strings
    const dataForJuno = {
      ...newTransaction,
      createdAt: now.toISOString(),
      completedAt: newTransaction.completedAt ? newTransaction.completedAt.toISOString() : undefined
    };

    const existingDoc = await getDoc({
      collection: 'transactions',
      key: newTransaction.id
    });

    await setDoc({
      collection: 'transactions',
      doc: {
        key: newTransaction.id,
        data: dataForJuno,
        version: existingDoc?.version ? existingDoc.version : 1n
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

  // Get agent facilitated transactions (transactions where agent helped customers)
  static async getAgentTransactions(agentId: string): Promise<Transaction[]> {
    try {
      const docs = await listDocs({
        collection: 'transactions'
      });
      
      return docs.items
        .map(doc => doc.data as Transaction)
        .filter(transaction => transaction.agentId === agentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting agent transactions:', error);
      return [];
    }
  }

  // Get agent transactions by user ID (agent's own transactions, not facilitated ones)
  static async getAgentTransactionsByUserId(userId: string): Promise<Transaction[]> {
    try {
      // Return transactions where the agent is the actual user (userId), not just the facilitator
      const docs = await listDocs({
        collection: 'transactions'
      });
      
      return docs.items
        .map(doc => doc.data as Transaction)
        .filter(transaction => transaction.userId === userId) // Agent's own transactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting agent transactions by user ID:', error);
      return [];
    }
  }

  // Get all agent-related transactions (only agent commission/earnings transactions)
  static async getAllAgentTransactions(agentId: string, userId: string): Promise<Transaction[]> {
    try {
      const docs = await listDocs({
        collection: 'transactions'
      });
      
      const allTransactions = docs.items.map(doc => doc.data as Transaction);
      
      // Filter for agent commission/earnings transactions only:
      const agentTransactions = allTransactions.filter(transaction => {
        // 1. Agent commission transactions from deposits:
        // These have userId = agent's user ID AND agentId = agent's ID
        // These represent the agent's commission earnings from processing deposits
        if (transaction.userId === userId && transaction.agentId === agentId && 
            transaction.type === 'deposit') {
          return true;
        }
        
        // 2. Agent fee transactions from withdrawals:
        // These have agentId = agent's ID but userId = customer's ID
        // These represent transactions where the agent earned fees from facilitating withdrawals
        if (transaction.agentId === agentId && transaction.userId !== userId && 
            transaction.type === 'withdraw') {
          return true;
        }
        
        // 3. Agent's own business transactions (personal deposits/withdrawals)
        // These have userId = agent's user ID but no agentId (agent acting as regular user)
        if (transaction.userId === userId && !transaction.agentId && 
            (transaction.type === 'withdraw' || transaction.type === 'deposit')) {
          return true;
        }
        
        return false;
      });
      
      // Remove duplicates (in case a transaction matches multiple conditions)
      const uniqueTransactions = agentTransactions.filter((transaction, index, self) =>
        index === self.findIndex(t => t.id === transaction.id)
      );
      
      return uniqueTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting all agent transactions:', error);
      return [];
    }
  }

  // Calculate agent daily earnings
  static calculateAgentDailyEarnings(transactions: Transaction[]): {
    totalAmount: number;
    totalCommission: number;
    transactionCount: number;
    completedCount: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= today && transactionDate < tomorrow;
    });

    const completedTransactions = todayTransactions.filter(
      transaction => transaction.status === 'completed'
    );

    const totalAmount = completedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalCommission = completedTransactions.reduce((sum, transaction) => {
      // For withdrawal transactions, agent earns the fee
      if (transaction.type === 'withdraw') {
        return sum + (transaction.fee || 0);
      }
      // For other transactions, calculate 2% commission on amount
      return sum + (transaction.amount * 0.02);
    }, 0);

    return {
      totalAmount,
      totalCommission,
      transactionCount: todayTransactions.length,
      completedCount: completedTransactions.length
    };
  }

  // Get all customers (users of type 'user')
  static async getAllCustomers(): Promise<User[]> {
    try {
      const docs = await listDocs({
        collection: 'users'
      });
      
      return docs.items
        .map(doc => {
          const rawData = doc.data as UserDataFromJuno;
          return {
            id: rawData.id,
            firstName: rawData.firstName,
            lastName: rawData.lastName,
            email: rawData.email,
            userType: rawData.userType,
            isVerified: rawData.isVerified,
            kycStatus: rawData.kycStatus,
            createdAt: new Date(rawData.createdAt)
          } as User;
        })
        .filter(user => user.userType === 'user')
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<boolean> {
    try {
      const existing = await this.getTransaction(id);
      if (!existing) return false;

      const updated = { ...existing, ...updates };

      // Convert Date fields to ISO strings
      const dataForJuno = {
        ...updated,
        createdAt: updated.createdAt ? updated.createdAt.toISOString() : undefined,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : undefined
      };

      const existingDoc = await getDoc({
        collection: 'transactions',
        key: id
      });

      await setDoc({
        collection: 'transactions',
        doc: {
          key: id,
          data: dataForJuno,
          version: existingDoc?.version ? existingDoc.version : 1n
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

  static async updateUserBalance(userId: string, balance: number): Promise<boolean> {
    try {
      const now = new Date();
      const userBalance: UserBalance = {
        userId,
        balance,
        currency: 'UGX',
        lastUpdated: now
      };

      // Convert Date field to ISO string
      const dataForJuno = {
        ...userBalance,
        lastUpdated: now.toISOString()
      };

      // Get current document to obtain its version
      const existingDoc = await getDoc({
        collection: 'balances',
        key: userId
      });

      // Update with proper version handling
      await setDoc({
        collection: 'balances',
        doc: {
          key: userId,
          data: dataForJuno,
          version: existingDoc?.version ? existingDoc.version : 1n
        }
      });

      console.log('Balance updated successfully:', { userId, balance, hadExisting: !!existingDoc });
      return true;
    } catch (error) {
      console.error('Error updating user balance:', error);
      console.error('Update details:', { userId, balance });
      return false;
    }
  }

  // Agent operations
  static async createAgent(agent: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> {
    const now = new Date();
    const newAgent: Agent = {
      ...agent,
      id: nanoid(),
      createdAt: now
    };

    const existingDoc = await getDoc({
      collection: 'agents',
      key: newAgent.id
    });

    // Convert Date field to ISO string
    const dataForJuno = {
      ...newAgent,
      createdAt: now.toISOString()
    };

    await setDoc({
      collection: 'agents',
      doc: {
        key: newAgent.id,
        data: dataForJuno,
        version: existingDoc?.version ? existingDoc.version : 1n
      }
    });

    return newAgent;
  }

  // Complete Agent KYC process - updates user details and creates agent record
  static async completeAgentKYC(agentKYCData: {
    // User details to update
    userId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string; // This becomes the email field
    
    // Agent-specific details
    businessName?: string;
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
    operatingHours?: string;
    operatingDays?: string[];
    
    // Optional documents (for future use)
    documentType?: string;
    documentNumber?: string;
    businessLicense?: string;
  }): Promise<{ user: User; agent: Agent }> {
    try {
      // 1. Update user details in users collection
      const userUpdates: Partial<User> = {
        firstName: agentKYCData.firstName,
        lastName: agentKYCData.lastName,
        email: agentKYCData.phoneNumber,
        kycStatus: 'approved', // Set to approved after KYC completion
        isVerified: true
      };

      const userUpdateSuccess = await this.updateUser(agentKYCData.userId, userUpdates, 'web');
      if (!userUpdateSuccess) {
        throw new Error('Failed to update user details');
      }

      // Get the updated user
      const updatedUser = await this.getUserByKey(agentKYCData.userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      // 2. Get digital balance for agent from balances collection
      const userBalance = await this.getUserBalance(agentKYCData.userId);
      let digitalBalance = userBalance?.balance || 0;

      // If digital balance is 0, set a random figure between 100,000 and 1,000,000 UGX
      if (digitalBalance === 0) {
        digitalBalance = Math.floor(Math.random() * 900000) + 100000; // Random between 100,000 and 1,000,000 UGX
        
        // Update the balance in the balances table
        await this.updateUserBalance(agentKYCData.userId, digitalBalance);
      }

      // 3. Generate random cash balance (as requested)
      const cashBalance = Math.floor(Math.random() * 2000000) + 500000; // Random between 500,000 and 2,500,000 UGX

      // 4. Create agent record in agents collection
      const agentData: Omit<Agent, 'id' | 'createdAt'> = {
        userId: agentKYCData.userId,
        businessName: agentKYCData.businessName || `${agentKYCData.firstName} ${agentKYCData.lastName} Agent`,
        location: agentKYCData.location,
        isActive: true,
        status: 'available', // Default status when agent is created
        cashBalance: cashBalance,
        digitalBalance: digitalBalance,
        commissionRate: 0.02 // Default 2% commission rate
      };

      const newAgent = await this.createAgent(agentData);

      // 5. Initialize user balance if it doesn't exist (but don't override the random balance we just set)
      if (!userBalance && digitalBalance === 0) {
        await this.updateUserBalance(agentKYCData.userId, 0);
      }

      return {
        user: updatedUser,
        agent: newAgent
      };
    } catch (error) {
      console.error('Error completing agent KYC:', error);
      throw error;
    }
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

  // Get agent by userId
  static async getAgentByUserId(userId: string): Promise<Agent | null> {
    try {
      const docs = await listDocs({
        collection: 'agents'
      });

      // Find agent with matching userId
      for (const doc of docs.items) {
        const agentData = doc.data as Agent;
        if (agentData.userId === userId) {
          return {
            ...agentData,
            createdAt: agentData.createdAt ? new Date(agentData.createdAt) : new Date()
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting agent by userId:', error);
      return null;
    }
  }

  // Update agent status
  static async updateAgentStatus(agentId: string, status: 'available' | 'busy' | 'cash_out' | 'offline'): Promise<boolean> {
    try {
      const existingAgent = await this.getAgent(agentId);
      if (!existingAgent) return false;

      // Get current document to obtain its version
      const existingDoc = await getDoc({
        collection: 'agents',
        key: agentId
      });

      if (!existingDoc) return false;

      const updatedAgent = { 
        ...existingAgent, 
        status,
        // Ensure createdAt is a string for Juno storage
        createdAt: typeof existingAgent.createdAt === 'string' 
          ? existingAgent.createdAt 
          : existingAgent.createdAt.toISOString()
      };

      await setDoc({
        collection: 'agents',
        doc: {
          key: agentId,
          data: updatedAgent,
          version: existingDoc.version
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating agent status:', error);
      return false;
    }
  }

  // Update agent status by userId (convenience method)
  static async updateAgentStatusByUserId(userId: string, status: 'available' | 'busy' | 'cash_out' | 'offline'): Promise<boolean> {
    try {
      const agent = await this.getAgentByUserId(userId);
      if (!agent) return false;
      
      return await this.updateAgentStatus(agent.id, status);
    } catch (error) {
      console.error('Error updating agent status by userId:', error);
      return false;
    }
  }

  // Update agent balances (cash and digital)
  static async updateAgentBalance(agentId: string, updates: { 
    cashBalance?: number; 
    digitalBalance?: number; 
  }): Promise<boolean> {
    try {
      const existingAgent = await this.getAgent(agentId);
      if (!existingAgent) return false;

      // Get current document to obtain its version
      const existingDoc = await getDoc({
        collection: 'agents',
        key: agentId
      });

      if (!existingDoc) return false;

      const updatedAgent = { 
        ...existingAgent,
        ...(updates.cashBalance !== undefined && { cashBalance: updates.cashBalance }),
        ...(updates.digitalBalance !== undefined && { digitalBalance: updates.digitalBalance }),
        // Ensure createdAt is a string for Juno storage
        createdAt: typeof existingAgent.createdAt === 'string' 
          ? existingAgent.createdAt 
          : existingAgent.createdAt.toISOString()
      };

      await setDoc({
        collection: 'agents',
        doc: {
          key: agentId,
          data: updatedAgent,
          version: existingDoc.version
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating agent balance:', error);
      return false;
    }
  }

  // Update agent balance by userId (convenience method)
  static async updateAgentBalanceByUserId(userId: string, updates: { 
    cashBalance?: number; 
    digitalBalance?: number; 
  }): Promise<boolean> {
    try {
      const agent = await this.getAgentByUserId(userId);
      if (!agent) return false;
      
      return await this.updateAgentBalance(agent.id, updates);
    } catch (error) {
      console.error('Error updating agent balance by userId:', error);
      return false;
    }
  }

  static async getNearbyAgents(lat: number, lng: number, radius: number = 5, includeStatuses?: ('available' | 'busy' | 'cash_out' | 'offline')[]): Promise<Agent[]> {
    try {
      const docs = await listDocs({
        collection: 'agents'
      });
      
      // Default to only available agents if no statuses specified
      const allowedStatuses = includeStatuses || ['available'];
      
      return docs.items
        .map(doc => doc.data as Agent)
        .filter(agent => {
          if (!agent.isActive) return false;
          if (!allowedStatuses.includes(agent.status)) return false;
          
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
    const now = new Date();
    const newMessage: SMSMessage = {
      ...message,
      id: nanoid(),
      createdAt: now
    };

    // Convert Date field to ISO string
    const dataForJuno = {
      ...newMessage,
      createdAt: now.toISOString()
    };

    await setDoc({
      collection: 'sms_messages',
      doc: {
        key: newMessage.id,
        data: dataForJuno,
        version: 1n
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

  // USSD Operations
  static async getUserPin(phoneNumber: string, satellite?: any): Promise<UserPin | null> {
    console.log(`Satellite ID here: ${satellite}`);
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

  static async createOrUpdateUserPin(phoneNumber: string, pin: string, _satellite?: any): Promise<boolean> {
    try {
      // Get user by phone number (stored as email for SMS users)
      let user = await this.getUserByKey(phoneNumber);

      if (!user) {
        // Create new user if doesn't exist
        user = await this.createUser({
          firstName: 'USSD',
          lastName: 'User',
          email: phoneNumber,
          userType: 'user',
          pin: pin,
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

  static async createUSSDSession(sessionId: string, phoneNumber: string): Promise<USSDSession> {
    const now = new Date();
    const session: USSDSession = {
      sessionId,
      phoneNumber,
      currentMenu: 'pin_check', // Start with PIN check
      step: 0,
      createdAt: now,
      lastActivity: now,
      isExpired(): boolean {
        return Date.now() - this.lastActivity.getTime() > 180000; // 3 minutes
      },
      updateActivity(): void {
        this.lastActivity = new Date();
      }
    };

    const dataForJuno = {
      ...session,
      createdAt: now.toISOString(),
      lastActivity: now.toISOString()
    };

    await setDoc({
      collection: 'ussd_sessions',
      doc: {
        key: sessionId,
        data: dataForJuno,
        version: 1n
      }
    });

    return session;
  }

  static async getUSSDSession(sessionId: string): Promise<USSDSession | null> {
    try {
      const doc = await getDoc({
        collection: 'ussd_sessions',
        key: sessionId
      });

      if (!doc?.data) {
        return null;
      }

      const rawData = doc.data as {
        sessionId: string;
        phoneNumber: string;
        userId?: string;
        currentMenu: string;
        step: number;
        tempData?: any;
        createdAt: string;
        lastActivity: string;
      };
      
      const session: USSDSession = {
        sessionId: rawData.sessionId,
        phoneNumber: rawData.phoneNumber,
        userId: rawData.userId,
        currentMenu: rawData.currentMenu as any,
        step: rawData.step || 0,
        tempData: rawData.tempData,
        createdAt: new Date(rawData.createdAt),
        lastActivity: new Date(rawData.lastActivity),
        isExpired(): boolean {
          return Date.now() - this.lastActivity.getTime() > 180000; // 3 minutes
        },
        updateActivity(): void {
          this.lastActivity = new Date();
        }
      };
      
      return session;
    } catch (error) {
      console.error('Error getting USSD session:', error);
      return null;
    }
  }

  static async updateUSSDSession(sessionId: string, updates: Partial<USSDSession>): Promise<boolean> {
    try {
      const existingSession = await this.getUSSDSession(sessionId);
      if (!existingSession) {
        return false;
      }

      const existingDoc = await getDoc({
        collection: 'ussd_sessions',
        key: sessionId
      });

      const updatedSession = {
        ...existingSession,
        ...updates,
        lastActivity: new Date()
      };

      const dataForJuno = {
        ...updatedSession,
        createdAt: updatedSession.createdAt.toISOString(),
        lastActivity: updatedSession.lastActivity.toISOString()
      };

      await setDoc({
        collection: 'ussd_sessions',
        doc: {
          key: sessionId,
          data: dataForJuno,
          version: existingDoc?.version ? existingDoc.version : 1n
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating USSD session:', error);
      return false;
    }
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

  private static async handleAgentsCommand(_userId?: string): Promise<string> {
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
            createdAt: transaction.createdAt.toISOString(),
            completedAt: transaction.completedAt ? transaction.completedAt.toISOString() : undefined
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
      if (transaction.metadata?.withdrawalCode !== verificationCode) {
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
      if (agent.cashBalance < transaction.amount) {
        throw new Error('Agent has insufficient cash balance');
      }

      const agentDigitalReceives = transaction.amount + (transaction.fee || 0); // Agent receives user's digital payment including fee
      
      await this.updateAgentBalance(agentId, { 
        cashBalance: agent.cashBalance - transaction.amount, // Agent gives cash to user
        digitalBalance: agent.digitalBalance + agentDigitalReceives // Agent receives digital payment + fee
      });

      // Update transaction status
      const updatedTransaction = {
        ...transaction,
        status: 'completed' as const,
        completedAt: new Date()
      };

      await setDoc({
        collection: 'transactions',
        doc: {
          key: transactionId,
          data: {
            ...updatedTransaction,
            createdAt: transaction.createdAt instanceof Date 
              ? transaction.createdAt.getTime().toString()
              : transaction.createdAt,
            completedAt: updatedTransaction.completedAt.getTime().toString()
          },
          version: transactionDoc?.version ? transactionDoc.version : 1n
        }
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
}
