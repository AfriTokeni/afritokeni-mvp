/**
 * Demo Data Service
 * Provides fake data for demo mode - no real transactions or blockchain calls
 */

import { faker } from '@faker-js/faker';
import { AfricanCurrency } from '../types/currency';

export interface DemoUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  balance: number;
  currency: AfricanCurrency;
  ckBTCBalance: number; // in satoshis
  ckUSDCBalance: number; // in USDC
  daoTokens: number; // AFRI governance tokens
  createdAt: Date;
}

export interface DemoTransaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'bitcoin_buy' | 'bitcoin_sell' | 'dao_reward' | 'ckbtc_buy' | 'ckusdc_buy' | 'ckbtc_send' | 'ckusdc_send';
  amount: number;
  currency: AfricanCurrency | 'BTC' | 'USDC' | 'AFRI';
  from?: string;
  to?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  createdAt: Date; // For compatibility with Transaction interface
  description: string;
  fee?: number;
}

export interface DemoAgent {
  id: string;
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  location: string;
  balance: number;
  currency: AfricanCurrency;
  totalEarnings: number;
  activeCustomers: number;
  rating: number;
  isOnline: boolean;
}

export class DemoDataService {
  private static demoUser: DemoUser | null = null;
  private static demoAgent: DemoAgent | null = null;
  private static userTransactions: DemoTransaction[] = [];
  private static agentTransactions: DemoTransaction[] = [];

  /**
   * Initialize demo user with fake data
   */
  static initializeDemoUser(phoneNumber: string): DemoUser {
    this.demoUser = {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: phoneNumber,
      phoneNumber: phoneNumber,
      balance: faker.number.int({ min: 250000, max: 850000 }), // Increased primary balance
      currency: 'UGX',
      ckBTCBalance: faker.number.int({ min: 50000, max: 500000 }), // 0.0005 - 0.005 BTC in satoshis
      ckUSDCBalance: faker.number.float({ min: 50, max: 500, fractionDigits: 2 }), // $50-$500 USDC
      daoTokens: 5000, // 5000 AFRI tokens - enough to create proposals
      createdAt: faker.date.past({ years: 1 })
    };

    // Generate more diverse fake transactions
    this.userTransactions = this.generateUserTransactions(35);

    return this.demoUser;
  }

  /**
   * Initialize demo agent with fake data
   */
  static initializeDemoAgent(phoneNumber: string): DemoAgent {
    this.demoAgent = {
      id: faker.string.uuid(),
      businessName: `${faker.company.name()} Money Services`,
      ownerName: faker.person.fullName(),
      phoneNumber: phoneNumber,
      location: `${faker.location.street()}, Kampala`,
      balance: faker.number.int({ min: 500000, max: 5000000 }),
      currency: 'UGX',
      totalEarnings: faker.number.int({ min: 1000000, max: 10000000 }),
      activeCustomers: faker.number.int({ min: 50, max: 500 }),
      rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
      isOnline: true
    };

    // Generate fake agent transactions
    this.agentTransactions = this.generateAgentTransactions(30);

    return this.demoAgent;
  }

  /**
   * Generate fake user transactions
   */
  private static generateUserTransactions(count: number): DemoTransaction[] {
    const transactions: DemoTransaction[] = [];
    const types: DemoTransaction['type'][] = [
      'send', 'receive', 'deposit', 'withdraw', 
      'ckbtc_buy', 'ckbtc_send', 
      'ckusdc_buy', 'ckusdc_send',
      'dao_reward'
    ];

    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types);
      let amount: number;
      let currency: 'UGX' | 'BTC' | 'USDC' | 'AFRI' = 'UGX';
      
      // Set amount and currency based on type
      if (type === 'ckbtc_buy' || type === 'ckbtc_send') {
        amount = faker.number.int({ min: 10000, max: 100000 }); // satoshis
        currency = 'BTC';
      } else if (type === 'ckusdc_buy' || type === 'ckusdc_send') {
        amount = faker.number.float({ min: 5, max: 200, fractionDigits: 2 });
        currency = 'USDC';
      } else if (type === 'dao_reward') {
        amount = faker.number.int({ min: 10, max: 500 });
        currency = 'AFRI';
      } else {
        amount = faker.number.int({ min: 5000, max: 250000 });
        currency = 'UGX';
      }
      
      const fee = type.includes('send') || type.includes('buy') ? Math.floor(amount * 0.01) : undefined;

      const timestamp = faker.date.recent({ days: 60 });
      transactions.push({
        id: faker.string.uuid(),
        type,
        amount,
        currency,
        from: type === 'receive' ? faker.person.fullName() : undefined,
        to: type === 'send' || type.includes('_send') ? faker.person.fullName() : undefined,
        status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'completed', 'pending']),
        timestamp,
        createdAt: timestamp,
        description: this.getTransactionDescription(type),
        fee
      });
    }

    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate fake agent transactions
   */
  private static generateAgentTransactions(count: number): DemoTransaction[] {
    const transactions: DemoTransaction[] = [];
    const types: DemoTransaction['type'][] = ['deposit', 'withdraw', 'bitcoin_buy', 'bitcoin_sell'];

    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types);
      const amount = faker.number.int({ min: 10000, max: 500000 });
      const commission = Math.floor(amount * 0.05); // 5% commission

      const timestamp = faker.date.recent({ days: 30 });
      transactions.push({
        id: faker.string.uuid(),
        type,
        amount,
        currency: 'UGX',
        from: faker.person.fullName(),
        to: type === 'withdraw' ? 'Bank Account' : undefined,
        status: 'completed',
        timestamp,
        createdAt: timestamp,
        description: `${type === 'deposit' ? 'Cash deposit' : type === 'withdraw' ? 'Cash withdrawal' : 'Bitcoin exchange'} for ${faker.person.firstName()}`,
        fee: commission
      });
    }

    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get transaction description based on type
   */
  private static getTransactionDescription(type: DemoTransaction['type']): string {
    switch (type) {
      case 'send':
        return `Sent to ${faker.person.firstName()} ${faker.person.lastName()}`;
      case 'receive':
        return `Received from ${faker.person.firstName()} ${faker.person.lastName()}`;
      case 'deposit':
        return `Cash deposit via agent`;
      case 'withdraw':
        return `Cash withdrawal via agent`;
      case 'bitcoin_buy':
        return `Bought Bitcoin`;
      case 'bitcoin_sell':
        return `Sold Bitcoin`;
      case 'ckbtc_buy':
        return `Bought ckBTC`;
      case 'ckbtc_send':
        return `Sent ckBTC to ${faker.person.firstName()}`;
      case 'ckusdc_buy':
        return `Bought ckUSDC`;
      case 'ckusdc_send':
        return `Sent ckUSDC to ${faker.person.firstName()}`;
      case 'dao_reward':
        return `DAO governance reward`;
      default:
        return 'Transaction';
    }
  }

  /**
   * Get demo user
   */
  static getDemoUser(): DemoUser | null {
    return this.demoUser;
  }

  /**
   * Get demo agent
   */
  static getDemoAgent(): DemoAgent | null {
    return this.demoAgent;
  }

  /**
   * Get user transactions
   */
  static getUserTransactions(): DemoTransaction[] {
    return this.userTransactions;
  }

  /**
   * Get agent transactions
   */
  static getAgentTransactions(): DemoTransaction[] {
    return this.agentTransactions;
  }

  /**
   * Add a new demo transaction (for simulating actions)
   */
  static addUserTransaction(transaction: Omit<DemoTransaction, 'id' | 'timestamp' | 'createdAt'>): DemoTransaction {
    const now = new Date();
    const newTransaction: DemoTransaction = {
      ...transaction,
      id: faker.string.uuid(),
      timestamp: now,
      createdAt: now
    };

    this.userTransactions.unshift(newTransaction);

    // Update balance
    if (this.demoUser) {
      if (transaction.type === 'send' || transaction.type === 'withdraw') {
        this.demoUser.balance -= transaction.amount + (transaction.fee || 0);
      } else if (transaction.type === 'receive' || transaction.type === 'deposit') {
        this.demoUser.balance += transaction.amount;
      }
    }

    return newTransaction;
  }

  /**
   * Add agent transaction
   */
  static addAgentTransaction(transaction: Omit<DemoTransaction, 'id' | 'timestamp' | 'createdAt'>): DemoTransaction {
    const now = new Date();
    const newTransaction: DemoTransaction = {
      ...transaction,
      id: faker.string.uuid(),
      timestamp: now,
      createdAt: now
    };

    this.agentTransactions.unshift(newTransaction);

    // Update agent balance and earnings
    if (this.demoAgent) {
      if (transaction.type === 'deposit') {
        this.demoAgent.balance += transaction.amount;
        this.demoAgent.totalEarnings += transaction.fee || 0;
      } else if (transaction.type === 'withdraw') {
        this.demoAgent.balance -= transaction.amount;
      }
    }

    return newTransaction;
  }

  /**
   * Update user balance (for demo actions)
   */
  static updateUserBalance(amount: number): void {
    if (this.demoUser) {
      this.demoUser.balance += amount;
    }
  }

  /**
   * Update agent balance
   */
  static updateAgentBalance(amount: number): void {
    if (this.demoAgent) {
      this.demoAgent.balance += amount;
    }
  }

  /**
   * Generate fake nearby agents for user
   */
  static generateNearbyAgents(count: number = 10): DemoAgent[] {
    const agents: DemoAgent[] = [];

    for (let i = 0; i < count; i++) {
      agents.push({
        id: faker.string.uuid(),
        businessName: `${faker.company.name()} Money Services`,
        ownerName: faker.person.fullName(),
        phoneNumber: `+256${faker.number.int({ min: 700000000, max: 799999999 })}`,
        location: `${faker.location.street()}, ${faker.helpers.arrayElement(['Kampala', 'Entebbe', 'Wakiso', 'Mukono'])}`,
        balance: faker.number.int({ min: 500000, max: 5000000 }),
        currency: 'UGX',
        totalEarnings: faker.number.int({ min: 1000000, max: 10000000 }),
        activeCustomers: faker.number.int({ min: 50, max: 500 }),
        rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
        isOnline: faker.datatype.boolean()
      });
    }

    return agents;
  }

  /**
   * Generate fake customers for agent
   */
  static generateAgentCustomers(count: number = 20): any[] {
    const customers: any[] = [];

    for (let i = 0; i < count; i++) {
      customers.push({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        phoneNumber: `+256${faker.number.int({ min: 700000000, max: 799999999 })}`,
        balance: faker.number.int({ min: 10000, max: 500000 }),
        totalTransactions: faker.number.int({ min: 5, max: 100 }),
        lastTransaction: faker.date.recent({ days: 7 }),
        status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive'])
      });
    }

    return customers;
  }

  /**
   * Generate DAO leaderboard with demo data
   */
  static generateDAOLeaderboard(count: number = 20): any[] {
    const leaderboard: any[] = [];
    
    // Add current demo user at the top with 5000 tokens
    const demoUser = this.getDemoUser();
    if (demoUser) {
      leaderboard.push({
        rank: 1,
        address: demoUser.id,
        name: `${demoUser.firstName} ${demoUser.lastName}`,
        balance: 5000,
        votingPower: '12.5%',
        proposalsCreated: faker.number.int({ min: 2, max: 8 }),
        votesParticipated: faker.number.int({ min: 15, max: 45 })
      });
    }
    
    // Generate other holders
    for (let i = 1; i < count; i++) {
      const balance = faker.number.int({ min: 100, max: 4500 });
      leaderboard.push({
        rank: i + 1,
        address: faker.string.uuid(),
        name: faker.person.fullName(),
        balance,
        votingPower: `${((balance / 40000) * 100).toFixed(2)}%`,
        proposalsCreated: faker.number.int({ min: 0, max: 5 }),
        votesParticipated: faker.number.int({ min: 5, max: 30 })
      });
    }
    
    return leaderboard.sort((a, b) => b.balance - a.balance).map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  /**
   * Load demo agents from JSON file
   */
  static async loadAgents(): Promise<any[]> {
    try {
      const response = await fetch('/data/agents.json');
      const agents = await response.json();
      return agents;
    } catch (error) {
      console.error('Error loading agents.json:', error);
      return [];
    }
  }

  /**
   * Reset demo data
   */
  static reset(): void {
    this.demoUser = null;
    this.demoAgent = null;
    this.userTransactions = [];
    this.agentTransactions = [];
  }
}
