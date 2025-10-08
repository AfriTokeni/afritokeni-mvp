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
  bitcoinBalance: number;
  createdAt: Date;
}

export interface DemoTransaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'bitcoin_buy' | 'bitcoin_sell';
  amount: number;
  currency: AfricanCurrency;
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
      balance: faker.number.int({ min: 50000, max: 500000 }),
      currency: 'UGX',
      bitcoinBalance: faker.number.float({ min: 0.001, max: 0.1, fractionDigits: 8 }),
      createdAt: faker.date.past({ years: 1 })
    };

    // Generate fake transactions
    this.userTransactions = this.generateUserTransactions(20);

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
    const types: DemoTransaction['type'][] = ['send', 'receive', 'deposit', 'withdraw', 'bitcoin_buy', 'bitcoin_sell'];

    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types);
      const amount = faker.number.int({ min: 5000, max: 200000 });
      const fee = Math.floor(amount * 0.028); // 2.8% fee

      const timestamp = faker.date.recent({ days: 30 });
      transactions.push({
        id: faker.string.uuid(),
        type,
        amount,
        currency: 'UGX',
        from: type === 'receive' ? `+256${faker.number.int({ min: 700000000, max: 799999999 })}` : undefined,
        to: type === 'send' ? `+256${faker.number.int({ min: 700000000, max: 799999999 })}` : undefined,
        status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'pending']),
        timestamp,
        createdAt: timestamp,
        description: this.getTransactionDescription(type),
        fee: ['send', 'withdraw', 'bitcoin_buy', 'bitcoin_sell'].includes(type) ? fee : undefined
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
        return `Cash deposit at ${faker.company.name()}`;
      case 'withdraw':
        return `Cash withdrawal at ${faker.company.name()}`;
      case 'bitcoin_buy':
        return `Bought Bitcoin`;
      case 'bitcoin_sell':
        return `Sold Bitcoin`;
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
        phoneNumber: faker.phone.number('+256 ### ### ###'),
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
        phoneNumber: faker.phone.number('+256 ### ### ###'),
        balance: faker.number.int({ min: 10000, max: 500000 }),
        totalTransactions: faker.number.int({ min: 5, max: 100 }),
        lastTransaction: faker.date.recent({ days: 7 }),
        status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive'])
      });
    }

    return customers;
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
