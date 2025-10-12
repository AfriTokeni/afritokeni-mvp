/**
 * Agent Demo Data Service
 * Provides fake data for agent demo mode
 */

import { nanoid } from 'nanoid';

export interface DemoDeposit {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'approved' | 'rejected';
  createdAt: Date;
  code: string;
}

export interface DemoWithdrawal {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'approved' | 'rejected';
  createdAt: Date;
  code: string;
  withdrawalType: 'digital_balance' | 'ckbtc' | 'ckusdc';
}

export interface DemoTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'funding' | 'settlement';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt: Date;
  commission?: number;
}

export interface DemoCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalTransactions: number;
  totalVolume: number;
  lastTransaction: Date;
}

export interface DemoAgent {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  location: {
    country: string;
    city: string;
  };
  preferredCurrency: string;
  
  // Balances
  digitalBalance: number;  // Operational funds
  cashBalance: number;     // Commission earnings
  ckBTCBalance: number;    // In satoshis
  ckUSDCBalance: number;   // In USD
  
  // Stats
  totalCustomers: number;
  todayCommission: number;
  monthlyCommission: number;
}

class AgentDemoDataServiceClass {
  private demoAgent: DemoAgent | null = null;
  private pendingDeposits: DemoDeposit[] = [];
  private pendingWithdrawals: DemoWithdrawal[] = [];
  private transactions: DemoTransaction[] = [];
  private customers: DemoCustomer[] = [];

  /**
   * Initialize demo agent with fake data
   */
  initializeDemoAgent(email: string): void {
    // Only initialize once - don't reset if already initialized
    if (this.demoAgent) {
      console.log('🎭 Demo agent already initialized, skipping...');
      return;
    }

    console.log('🎭 Initializing demo agent...');
    
    // Create demo agent
    this.demoAgent = {
      id: nanoid(),
      businessName: 'Demo Agent Services',
      email: email,
      phone: '+256700123456',
      location: {
        country: 'Uganda',
        city: 'Kampala'
      },
      preferredCurrency: 'UGX',
      
      // Balances (in UGX)
      digitalBalance: 5000000,  // 5M UGX operational funds
      cashBalance: 250000,      // 250K UGX commission earnings
      ckBTCBalance: 500000,     // 500K satoshis (~0.005 BTC)
      ckUSDCBalance: 300,       // 300 USDC
      
      // Stats
      totalCustomers: 45,
      todayCommission: 15000,
      monthlyCommission: 450000
    };

    // Generate deposits with various statuses
    this.pendingDeposits = [
      // Pending deposits
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'John Mukasa',
        userPhone: '+256701234567',
        amount: 50000,
        currency: 'UGX',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
        code: 'DEP8BL'
      },
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Sarah Nakato',
        userPhone: '+256702345678',
        amount: 100000,
        currency: 'UGX',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        code: 'DEP6CP'
      },
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'David Okello',
        userPhone: '+256703456789',
        amount: 75000,
        currency: 'UGX',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
        code: 'DEPKY3'
      },
      // Confirmed deposits (code verified, waiting for agent to complete)
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Grace Nabirye',
        userPhone: '+256704567890',
        amount: 120000,
        currency: 'UGX',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        code: 'DEP' + Math.random().toString(36).substring(2, 8).toUpperCase()
      },
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Patrick Ssemakula',
        userPhone: '+256705678901',
        amount: 85000,
        currency: 'UGX',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 1000 * 60 * 75), // 1.25 hours ago
        code: 'DEP' + Math.random().toString(36).substring(2, 8).toUpperCase()
      },
      // Completed deposits
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Alice Namuli',
        userPhone: '+256706789012',
        amount: 150000,
        currency: 'UGX',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        code: 'DEP' + Math.random().toString(36).substring(2, 8).toUpperCase()
      },
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Robert Mugisha',
        userPhone: '+256707890123',
        amount: 95000,
        currency: 'UGX',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        code: 'DEP' + Math.random().toString(36).substring(2, 8).toUpperCase()
      },
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Mary Auma',
        userPhone: '+256708901234',
        amount: 200000,
        currency: 'UGX',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        code: 'DEP' + Math.random().toString(36).substring(2, 8).toUpperCase()
      }
    ];

    // Generate pending withdrawals with fixed codes for demo
    this.pendingWithdrawals = [
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Mary Auma',
        userPhone: '+256704567890',
        amount: 80000,
        currency: 'UGX',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
        code: 'WTH5MA',
        withdrawalType: 'digital_balance' as const
      },
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Peter Ssemakula',
        userPhone: '+256705678901',
        amount: 120000,
        currency: 'UGX',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 35), // 35 mins ago
        code: 'WTH9PS',
        withdrawalType: 'ckbtc' as const
      },
      {
        id: nanoid(),
        userId: nanoid(),
        userName: 'Grace Nabirye',
        userPhone: '+256706789012',
        amount: 95000,
        currency: 'UGX',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 1000 * 60 * 50), // 50 mins ago
        code: 'WTH2GN',
        withdrawalType: 'ckusdc' as const
      }
    ];

    // Generate transaction history with many transactions
    this.transactions = [
      { id: nanoid(), type: 'deposit', amount: 50000, currency: 'UGX', status: 'completed', description: 'Deposit from John Mukasa', createdAt: new Date(Date.now() - 1000 * 60 * 15), commission: 1000 },
      { id: nanoid(), type: 'withdrawal', amount: 75000, currency: 'UGX', status: 'completed', description: 'Withdrawal to Sarah Nakato', createdAt: new Date(Date.now() - 1000 * 60 * 30), commission: 1500 },
      { id: nanoid(), type: 'deposit', amount: 120000, currency: 'UGX', status: 'completed', description: 'Deposit from David Okello', createdAt: new Date(Date.now() - 1000 * 60 * 45), commission: 2400 },
      { id: nanoid(), type: 'withdrawal', amount: 95000, currency: 'UGX', status: 'completed', description: 'Withdrawal to Grace Nabirye', createdAt: new Date(Date.now() - 1000 * 60 * 60), commission: 1900 },
      { id: nanoid(), type: 'deposit', amount: 200000, currency: 'UGX', status: 'completed', description: 'Deposit from Peter Ssemakula', createdAt: new Date(Date.now() - 1000 * 60 * 75), commission: 4000 },
      { id: nanoid(), type: 'withdrawal', amount: 80000, currency: 'UGX', status: 'completed', description: 'Withdrawal to Mary Auma', createdAt: new Date(Date.now() - 1000 * 60 * 90), commission: 1600 },
      { id: nanoid(), type: 'deposit', amount: 150000, currency: 'UGX', status: 'completed', description: 'Deposit from Alice Namuli', createdAt: new Date(Date.now() - 1000 * 60 * 120), commission: 3000 },
      { id: nanoid(), type: 'withdrawal', amount: 110000, currency: 'UGX', status: 'completed', description: 'Withdrawal to Robert Mugisha', createdAt: new Date(Date.now() - 1000 * 60 * 150), commission: 2200 },
      { id: nanoid(), type: 'deposit', amount: 85000, currency: 'UGX', status: 'completed', description: 'Deposit from Jane Nambi', createdAt: new Date(Date.now() - 1000 * 60 * 180), commission: 1700 },
      { id: nanoid(), type: 'withdrawal', amount: 125000, currency: 'UGX', status: 'completed', description: 'Withdrawal to Moses Kato', createdAt: new Date(Date.now() - 1000 * 60 * 210), commission: 2500 },
      { id: nanoid(), type: 'deposit', amount: 95000, currency: 'UGX', status: 'completed', description: 'Deposit from Patrick Ouma', createdAt: new Date(Date.now() - 1000 * 60 * 240), commission: 1900 },
      { id: nanoid(), type: 'withdrawal', amount: 70000, currency: 'UGX', status: 'completed', description: 'Withdrawal to Betty Akello', createdAt: new Date(Date.now() - 1000 * 60 * 270), commission: 1400 },
      { id: nanoid(), type: 'funding', amount: 2000000, currency: 'UGX', status: 'completed', description: 'Account funding via Mobile Money', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      { id: nanoid(), type: 'settlement', amount: 150000, currency: 'UGX', status: 'completed', description: 'Commission settlement to bank', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) }
    ];

    // Generate customers
    this.customers = [
      {
        id: nanoid(),
        name: 'Alice Namuli',
        phone: '+256706789012',
        email: 'alice@example.com',
        totalTransactions: 12,
        totalVolume: 1500000,
        lastTransaction: new Date(Date.now() - 1000 * 60 * 60 * 3)
      },
      {
        id: nanoid(),
        name: 'Robert Mugisha',
        phone: '+256707890123',
        email: 'robert@example.com',
        totalTransactions: 8,
        totalVolume: 950000,
        lastTransaction: new Date(Date.now() - 1000 * 60 * 60 * 12)
      },
      {
        id: nanoid(),
        name: 'Grace Nabirye',
        phone: '+256708901234',
        email: 'grace@example.com',
        totalTransactions: 15,
        totalVolume: 2100000,
        lastTransaction: new Date(Date.now() - 1000 * 60 * 60 * 6)
      }
    ];

    console.log('🎭 Demo Agent initialized:', this.demoAgent.businessName);
  }

  /**
   * Get demo agent data
   */
  getDemoAgent(): DemoAgent | null {
    return this.demoAgent;
  }

  /**
   * Get pending deposits
   */
  getPendingDeposits(): DemoDeposit[] {
    return this.pendingDeposits;
  }

  /**
   * Get pending withdrawals
   */
  getPendingWithdrawals(): DemoWithdrawal[] {
    return this.pendingWithdrawals;
  }

  /**
   * Get transaction history
   */
  getTransactions(): DemoTransaction[] {
    return this.transactions;
  }

  /**
   * Get customers
   */
  getCustomers(): DemoCustomer[] {
    return this.customers;
  }

  /**
   * Confirm deposit code (demo) - changes status from pending to confirmed
   */
  confirmDeposit(depositId: string): void {
    const deposit = this.pendingDeposits.find(d => d.id === depositId);
    if (!deposit) return;
    
    deposit.status = 'confirmed';
    console.log('✅ Deposit confirmed (code verified):', depositId);
  }

  /**
   * Confirm withdrawal code (demo) - changes status from pending to confirmed
   */
  confirmWithdrawal(withdrawalId: string): void {
    const withdrawal = this.pendingWithdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) return;
    
    withdrawal.status = 'confirmed';
    console.log('✅ Withdrawal confirmed (code verified):', withdrawalId);
  }

  /**
   * Approve deposit (demo) - completes the deposit and updates balances
   */
  approveDeposit(depositId: string): void {
    const deposit = this.pendingDeposits.find(d => d.id === depositId);
    if (!deposit || !this.demoAgent) return;

    // Remove from pending
    this.pendingDeposits = this.pendingDeposits.filter(d => d.id !== depositId);

    // Update balances
    const commission = Math.round(deposit.amount * 0.02); // 2% commission
    this.demoAgent.digitalBalance -= deposit.amount; // Give money to user
    this.demoAgent.cashBalance += commission; // Earn commission

    // Add to transaction history
    this.transactions.unshift({
      id: nanoid(),
      type: 'deposit',
      amount: deposit.amount,
      currency: deposit.currency,
      status: 'completed',
      description: `Deposit from ${deposit.userName}`,
      createdAt: new Date(),
      commission
    });

    console.log('✅ Deposit approved:', depositId);
  }

  /**
   * Approve withdrawal (demo)
   */
  approveWithdrawal(withdrawalId: string): void {
    const withdrawal = this.pendingWithdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal || !this.demoAgent) return;

    // Remove from pending
    this.pendingWithdrawals = this.pendingWithdrawals.filter(w => w.id !== withdrawalId);

    // Update balances
    const commission = Math.round(withdrawal.amount * 0.02); // 2% commission
    this.demoAgent.digitalBalance += withdrawal.amount; // Receive money from user
    this.demoAgent.cashBalance += commission; // Earn commission

    // Add to transaction history
    this.transactions.unshift({
      id: nanoid(),
      type: 'withdrawal',
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      status: 'completed',
      description: `Withdrawal to ${withdrawal.userName}`,
      createdAt: new Date(),
      commission
    });

    console.log('✅ Withdrawal approved:', withdrawalId);
  }

  /**
   * Fund account (demo)
   */
  fundAccount(amount: number, currency: string, method: string): void {
    if (!this.demoAgent) return;

    this.demoAgent.digitalBalance += amount;

    this.transactions.unshift({
      id: nanoid(),
      type: 'funding',
      amount,
      currency,
      status: 'completed',
      description: `Account funding via ${method}`,
      createdAt: new Date()
    });

    console.log('💰 Account funded:', amount, currency);
  }

  /**
   * Request settlement (demo)
   */
  requestSettlement(amount: number, currency: string, method: string): void {
    if (!this.demoAgent) return;

    this.demoAgent.cashBalance -= amount;

    this.transactions.unshift({
      id: nanoid(),
      type: 'settlement',
      amount,
      currency,
      status: 'completed',
      description: `Commission settlement via ${method}`,
      createdAt: new Date()
    });

    console.log('💸 Settlement requested:', amount, currency);
  }

  /**
   * Update agent balance
   */
  updateBalance(type: 'digital' | 'cash' | 'ckbtc' | 'ckusdc', amount: number): void {
    if (!this.demoAgent) return;

    switch (type) {
      case 'digital':
        this.demoAgent.digitalBalance += amount;
        break;
      case 'cash':
        this.demoAgent.cashBalance += amount;
        break;
      case 'ckbtc':
        this.demoAgent.ckBTCBalance += amount;
        break;
      case 'ckusdc':
        this.demoAgent.ckUSDCBalance += amount;
        break;
    }
  }

  /**
   * Clear demo data
   */
  clearDemoData(): void {
    this.demoAgent = null;
    this.pendingDeposits = [];
    this.pendingWithdrawals = [];
    this.transactions = [];
    this.customers = [];
    console.log('🧹 Demo agent data cleared');
  }
}

// Export singleton instance
export const AgentDemoDataService = new AgentDemoDataServiceClass();
