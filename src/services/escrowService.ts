import { BitcoinService } from './bitcoinService';
import { AfricanCurrency } from '../types/currency';

export interface EscrowTransaction {
  id: string;
  userId: string;
  agentId: string;
  bitcoinAmount: number; // in satoshis
  localAmount: number;
  currency: AfricanCurrency;
  escrowAddress: string;
  exchangeCode: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'refunded' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  fundedAt?: Date;
  completedAt?: Date;
  transactionHash?: string;
}

export interface Agent {
  id: string;
  name: string;
  location: string;
  bitcoinAddress: string;
  rating: number;
  totalTransactions: number;
  successRate: number;
  fee: number; // percentage
  isActive: boolean;
}

export class EscrowService {
  private static readonly ESCROW_TIMEOUT_HOURS = 24;

  /**
   * Create a new escrow transaction
   */
  static async createEscrowTransaction(
    userId: string,
    agentId: string,
    bitcoinAmount: number,
    localAmount: number,
    currency: AfricanCurrency
  ): Promise<EscrowTransaction> {
    // Generate unique escrow address for this transaction
    const addressData = await BitcoinService.generateBitcoinAddress();
    const escrowAddress = addressData.address;
    
    // Generate 6-digit exchange code
    const exchangeCode = this.generateExchangeCode();
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.ESCROW_TIMEOUT_HOURS);

    const transaction: EscrowTransaction = {
      id: this.generateTransactionId(),
      userId,
      agentId,
      bitcoinAmount,
      localAmount,
      currency,
      escrowAddress,
      exchangeCode,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
    };

    // In production, save to database
    await this.saveTransaction(transaction);
    
    // Notify agent of pending transaction
    await this.notifyAgent(agentId, transaction);

    return transaction;
  }

  /**
   * Check if escrow address has been funded
   */
  static async checkEscrowFunding(transactionId: string): Promise<boolean> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction || transaction.status !== 'pending') {
      return false;
    }

    try {
      const balance = await BitcoinService.getBitcoinBalance(transaction.escrowAddress);
      const requiredBalance = transaction.bitcoinAmount / 100000000; // Convert satoshis to BTC

      if (balance >= requiredBalance) {
        // Update transaction status
        transaction.status = 'funded';
        transaction.fundedAt = new Date();
        await this.saveTransaction(transaction);
        
        // Notify agent that funds are available
        await this.notifyAgentFunded(transaction.agentId, transaction);
        
        return true;
      }
    } catch (error) {
      console.error('Error checking escrow funding:', error);
    }

    return false;
  }

  /**
   * Verify exchange code and complete transaction
   */
  static async verifyExchangeCode(
    agentId: string,
    exchangeCode: string
  ): Promise<{ success: boolean; transaction?: EscrowTransaction; error?: string }> {
    try {
      const transaction = await this.getTransactionByCode(exchangeCode);
      
      if (!transaction) {
        return { success: false, error: 'Invalid exchange code' };
      }

      if (transaction.agentId !== agentId) {
        return { success: false, error: 'Unauthorized agent' };
      }

      if (transaction.status !== 'funded') {
        return { success: false, error: 'Transaction not funded or already completed' };
      }

      if (new Date() > transaction.expiresAt) {
        return { success: false, error: 'Transaction expired' };
      }

      // Complete the transaction
      await this.completeTransaction(transaction);

      return { success: true, transaction };
    } catch (error) {
      console.error('Error verifying exchange code:', error);
      return { success: false, error: 'System error' };
    }
  }

  /**
   * Complete transaction - release Bitcoin to agent
   */
  private static async completeTransaction(transaction: EscrowTransaction): Promise<void> {
    try {
      // Get agent's Bitcoin address
      const agent = await this.getAgent(transaction.agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Transfer Bitcoin from escrow to agent
      const result = await BitcoinService.sendBitcoin(
        transaction.escrowAddress,
        agent.bitcoinAddress,
        transaction.bitcoinAmount,
        '' // private key would be managed securely in production
      );
      const txHash = result.txHash;

      // Update transaction
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.transactionHash = txHash;
      
      await this.saveTransaction(transaction);

      // Update agent stats
      await this.updateAgentStats(transaction.agentId, true);

      // Notify both parties
      await this.notifyTransactionComplete(transaction);
    } catch (error) {
      console.error('Error completing transaction:', error);
      transaction.status = 'disputed';
      await this.saveTransaction(transaction);
      throw error;
    }
  }

  /**
   * Handle expired transactions - refund to user
   */
  static async processExpiredTransactions(): Promise<void> {
    const expiredTransactions = await this.getExpiredTransactions();
    
    for (const transaction of expiredTransactions) {
      if (transaction.status === 'funded') {
        await this.refundTransaction(transaction);
      } else {
        transaction.status = 'expired';
        await this.saveTransaction(transaction);
      }
    }
  }

  /**
   * Refund Bitcoin to user
   */
  private static async refundTransaction(transaction: EscrowTransaction): Promise<void> {
    try {
      // Get user's refund address (could be original sending address or user-specified)
      const userRefundAddress = await this.getUserRefundAddress(transaction.userId);
      
      // Transfer Bitcoin back to user
      const result = await BitcoinService.sendBitcoin(
        transaction.escrowAddress,
        userRefundAddress,
        transaction.bitcoinAmount,
        '' // private key would be managed securely in production
      );
      const txHash = result.txHash;

      transaction.status = 'refunded';
      transaction.transactionHash = txHash;
      await this.saveTransaction(transaction);

      // Notify user of refund
      await this.notifyRefund(transaction);
    } catch (error) {
      console.error('Error refunding transaction:', error);
      transaction.status = 'disputed';
      await this.saveTransaction(transaction);
    }
  }

  /**
   * Generate unique 6-digit exchange code
   */
  private static generateExchangeCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return `BTC-${code}`;
  }

  /**
   * Generate unique transaction ID
   */
  private static generateTransactionId(): string {
    return 'tx_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Mock database operations - replace with real database in production
  private static transactions: Map<string, EscrowTransaction> = new Map();
  private static agents: Map<string, Agent> = new Map();

  private static async saveTransaction(transaction: EscrowTransaction): Promise<void> {
    this.transactions.set(transaction.id, transaction);
  }

  private static async getTransaction(id: string): Promise<EscrowTransaction | null> {
    return this.transactions.get(id) || null;
  }

  private static async getTransactionByCode(code: string): Promise<EscrowTransaction | null> {
    for (const transaction of this.transactions.values()) {
      if (transaction.exchangeCode === code) {
        return transaction;
      }
    }
    return null;
  }

  private static async getExpiredTransactions(): Promise<EscrowTransaction[]> {
    const now = new Date();
    return Array.from(this.transactions.values()).filter(
      tx => tx.expiresAt < now && (tx.status === 'pending' || tx.status === 'funded')
    );
  }

  private static async getAgent(id: string): Promise<Agent | null> {
    return this.agents.get(id) || null;
  }

  private static async getUserRefundAddress(_userId: string): Promise<string> {
    // In production, get user's preferred refund address or derive from user ID
    const addressData = await BitcoinService.generateBitcoinAddress();
    return addressData.address;
  }

  // Notification methods - implement with real notification service
  private static async notifyAgent(agentId: string, transaction: EscrowTransaction): Promise<void> {
    console.log(`Notifying agent ${agentId} of new transaction ${transaction.id}`);
  }

  private static async notifyAgentFunded(agentId: string, transaction: EscrowTransaction): Promise<void> {
    console.log(`Notifying agent ${agentId} that transaction ${transaction.id} is funded`);
  }

  private static async notifyTransactionComplete(transaction: EscrowTransaction): Promise<void> {
    console.log(`Transaction ${transaction.id} completed successfully`);
  }

  private static async notifyRefund(transaction: EscrowTransaction): Promise<void> {
    console.log(`Refunding transaction ${transaction.id} to user ${transaction.userId}`);
  }

  private static async updateAgentStats(agentId: string, success: boolean): Promise<void> {
    const agent = await this.getAgent(agentId);
    if (agent) {
      agent.totalTransactions += 1;
      if (success) {
        agent.successRate = ((agent.successRate * (agent.totalTransactions - 1)) + 1) / agent.totalTransactions;
      }
      this.agents.set(agentId, agent);
    }
  }

  // Initialize with mock agents
  static initializeMockData(): void {
    const mockAgents: Agent[] = [
      {
        id: 'agent_1',
        name: 'John Mukasa',
        location: 'Kampala, Uganda',
        bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        rating: 4.9,
        totalTransactions: 150,
        successRate: 0.98,
        fee: 2.5,
        isActive: true
      },
      {
        id: 'agent_2',
        name: 'Sarah Nakato',
        location: 'Accra, Ghana',
        bitcoinAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        rating: 4.8,
        totalTransactions: 89,
        successRate: 0.96,
        fee: 2.0,
        isActive: true
      },
      {
        id: 'agent_3',
        name: 'David Okello',
        location: 'Nairobi, Kenya',
        bitcoinAddress: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
        rating: 4.7,
        totalTransactions: 67,
        successRate: 0.94,
        fee: 3.0,
        isActive: true
      }
    ];

    mockAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * Get available agents
   */
  static async getAvailableAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.isActive);
  }

  /**
   * Get transaction status for user
   */
  static async getUserTransactions(userId: string): Promise<EscrowTransaction[]> {
    return Array.from(this.transactions.values()).filter(tx => tx.userId === userId);
  }

  /**
   * Get pending transactions for agent
   */
  static async getAgentTransactions(agentId: string): Promise<EscrowTransaction[]> {
    return Array.from(this.transactions.values()).filter(tx => tx.agentId === agentId);
  }
}

// Initialize mock data
EscrowService.initializeMockData();
