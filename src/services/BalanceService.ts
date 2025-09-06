interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'send' | 'receive' | 'bitcoin_buy' | 'bitcoin_sell';
  amount: number;
  currency: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  fromUserId?: string;
  toUserId?: string;
  agentId?: string;
}

interface UserBalance {
  [currency: string]: number;
}

export class BalanceService {
  private static transactions: Transaction[] = [];

  // Initialize with some sample transactions for demo
  static initialize() {
    this.transactions = [
      {
        id: 'txn_001',
        type: 'deposit',
        amount: 50000,
        currency: 'UGX',
        userId: 'user_123',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        agentId: 'agent_1'
      },
      {
        id: 'txn_002',
        type: 'send',
        amount: 10000,
        currency: 'UGX',
        userId: 'user_123',
        toUserId: 'user_456',
        status: 'completed',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 'txn_003',
        type: 'receive',
        amount: 15000,
        currency: 'UGX',
        userId: 'user_123',
        fromUserId: 'user_789',
        status: 'completed',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      }
    ];
  }

  // Calculate balance for a specific user and currency
  static calculateBalance(userId: string, currency: string): number {
    if (this.transactions.length === 0) {
      this.initialize();
    }

    const userTransactions = this.transactions.filter(
      tx => (tx.userId === userId || tx.toUserId === userId || tx.fromUserId === userId) 
        && tx.currency === currency 
        && tx.status === 'completed'
    );

    let balance = 0;

    for (const tx of userTransactions) {
      switch (tx.type) {
        case 'deposit':
        case 'bitcoin_sell':
          if (tx.userId === userId) {
            balance += tx.amount;
          }
          break;
        
        case 'withdrawal':
        case 'bitcoin_buy':
          if (tx.userId === userId) {
            balance -= tx.amount;
          }
          break;
        
        case 'send':
          if (tx.userId === userId) {
            balance -= tx.amount; // Sender loses money
          }
          break;
        
        case 'receive':
          if (tx.userId === userId) {
            balance += tx.amount; // Receiver gains money
          }
          break;
      }
    }

    return Math.max(0, balance); // Never allow negative balances
  }

  // Calculate all currency balances for a user
  static calculateAllBalances(userId: string): UserBalance {
    if (this.transactions.length === 0) {
      this.initialize();
    }

    const currencies = new Set(
      this.transactions
        .filter(tx => tx.userId === userId || tx.toUserId === userId || tx.fromUserId === userId)
        .map(tx => tx.currency)
    );

    const balances: UserBalance = {};
    
    for (const currency of currencies) {
      balances[currency] = this.calculateBalance(userId, currency);
    }

    return balances;
  }

  // Add a new transaction
  static addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.transactions.push(newTransaction);
    return newTransaction;
  }

  // Process a deposit transaction
  static processDeposit(userId: string, amount: number, currency: string, agentId: string): Transaction {
    return this.addTransaction({
      type: 'deposit',
      amount,
      currency,
      userId,
      status: 'completed',
      agentId
    });
  }

  // Process a withdrawal transaction
  static processWithdrawal(userId: string, amount: number, currency: string, agentId: string): Transaction {
    const currentBalance = this.calculateBalance(userId, currency);
    
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    return this.addTransaction({
      type: 'withdrawal',
      amount,
      currency,
      userId,
      status: 'completed',
      agentId
    });
  }

  // Process a send transaction
  static processSend(fromUserId: string, toUserId: string, amount: number, currency: string): Transaction {
    const currentBalance = this.calculateBalance(fromUserId, currency);
    
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create send transaction for sender
    const sendTx = this.addTransaction({
      type: 'send',
      amount,
      currency,
      userId: fromUserId,
      toUserId,
      status: 'completed'
    });

    // Create receive transaction for receiver
    this.addTransaction({
      type: 'receive',
      amount,
      currency,
      userId: toUserId,
      fromUserId,
      status: 'completed'
    });

    return sendTx;
  }

  // Get transaction history for a user
  static getTransactionHistory(userId: string): Transaction[] {
    if (this.transactions.length === 0) {
      this.initialize();
    }

    return this.transactions
      .filter(tx => tx.userId === userId || tx.toUserId === userId || tx.fromUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Check if user has sufficient balance
  static hasSufficientBalance(userId: string, amount: number, currency: string): boolean {
    const balance = this.calculateBalance(userId, currency);
    return balance >= amount;
  }

  // Get pending transactions for a user
  static getPendingTransactions(userId: string): Transaction[] {
    return this.transactions.filter(
      tx => (tx.userId === userId || tx.toUserId === userId) && tx.status === 'pending'
    );
  }
}
