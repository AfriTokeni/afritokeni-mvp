import { BalanceService } from './BalanceService';
import { NotificationService } from './notificationService';
import { DataService } from './dataService';

interface SendMoneyRequest {
  fromUserId: string;
  toUserPhone: string;
  amount: number;
  currency: string;
  description?: string;
}

interface WithdrawRequest {
  userId: string;
  amount: number;
  currency: string;
  agentId: string;
  withdrawalCode: string;
}

export class TransactionService {
  // Process send money transaction
  static async processSendMoney(request: SendMoneyRequest): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      // In a real system, we'd look up the user by phone number
      // For now, we'll simulate finding a user
      const toUserId = `user_${request.toUserPhone.replace(/\D/g, '').slice(-6)}`;
      
      // Check if sender has sufficient balance
      if (!BalanceService.hasSufficientBalance(request.fromUserId, request.amount, request.currency)) {
        return {
          success: false,
          message: 'Insufficient balance for this transaction'
        };
      }

      // Process the send transaction
      const transaction = BalanceService.processSend(
        request.fromUserId,
        toUserId,
        request.amount,
        request.currency
      );

      // Send notifications to both sender and recipient
      try {
        const [senderUser, recipientUser] = await Promise.all([
          DataService.getUserByKey(request.fromUserId),
          DataService.getUserByKey(toUserId)
        ]);

        if (senderUser) {
          await NotificationService.sendNotification(senderUser, {
            userId: request.fromUserId,
            type: 'withdrawal',
            amount: request.amount,
            currency: request.currency,
            transactionId: transaction.id,
            message: `Money sent to ${request.toUserPhone}`
          });
        }

        if (recipientUser) {
          await NotificationService.sendNotification(recipientUser, {
            userId: toUserId,
            type: 'deposit',
            amount: request.amount,
            currency: request.currency,
            transactionId: transaction.id,
            message: `Money received from ${senderUser?.firstName || 'user'}`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send transaction notifications:', notificationError);
      }

      return {
        success: true,
        message: 'Money sent successfully',
        transactionId: transaction.id
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  // Process withdrawal transaction
  static async processWithdraw(request: WithdrawRequest): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      // Check if user has sufficient balance
      if (!BalanceService.hasSufficientBalance(request.userId, request.amount, request.currency)) {
        return {
          success: false,
          message: 'Insufficient balance for this withdrawal'
        };
      }

      // Process the withdrawal transaction
      const transaction = BalanceService.processWithdrawal(
        request.userId,
        request.amount,
        request.currency,
        request.agentId
      );

      // Send withdrawal notifications
      try {
        const [user, agent] = await Promise.all([
          DataService.getUserByKey(request.userId),
          DataService.getUserByKey(request.agentId)
        ]);

        // Notify user of withdrawal request
        if (user) {
          await NotificationService.sendNotification(user, {
            userId: request.userId,
            type: 'withdrawal',
            amount: request.amount,
            currency: request.currency,
            transactionId: transaction.id,
            message: `Withdrawal request processed. Code: ${request.withdrawalCode}`
          });
        }

        // Notify agent of new withdrawal request
        if (agent) {
          await NotificationService.sendNotification(agent, {
            userId: request.agentId,
            type: 'agent_match',
            amount: request.amount,
            currency: request.currency,
            transactionId: transaction.id,
            message: `New withdrawal request: ${request.amount} ${request.currency}. Code: ${request.withdrawalCode}`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send withdrawal notifications:', notificationError);
      }

      return {
        success: true,
        message: 'Withdrawal processed successfully',
        transactionId: transaction.id
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Withdrawal failed'
      };
    }
  }

  // Get user transaction history with real balance calculations
  static getUserTransactions(userId: string) {
    const transactions = BalanceService.getTransactionHistory(userId);
    
    // Convert to the format expected by the UI
    return transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      description: this.getTransactionDescription(tx),
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
      fromUserId: tx.fromUserId,
      toUserId: tx.toUserId,
      agentId: tx.agentId
    }));
  }

  // Generate human-readable transaction descriptions
  private static getTransactionDescription(tx: any): string {
    switch (tx.type) {
      case 'deposit':
        return `Cash deposit via agent`;
      case 'withdrawal':
        return `Cash withdrawal via agent`;
      case 'send':
        return `Sent to ${tx.toUserId || 'user'}`;
      case 'receive':
        return `Received from ${tx.fromUserId || 'user'}`;
      case 'bitcoin_buy':
        return `Purchased Bitcoin`;
      case 'bitcoin_sell':
        return `Sold Bitcoin`;
      default:
        return 'Transaction';
    }
  }

  // Get user's multi-currency balances
  static getUserBalances(userId: string) {
    return BalanceService.calculateAllBalances(userId);
  }

  // Process withdrawal with simplified parameters
  static async processWithdrawal(
    userId: string, 
    amount: number, 
    currency: string, 
    agentId?: string
  ): Promise<{ success: boolean; message: string; withdrawalCode?: string }> {
    try {
      // Check if user has sufficient balance
      if (!BalanceService.hasSufficientBalance(userId, amount, currency)) {
        return {
          success: false,
          message: 'Insufficient balance for this withdrawal'
        };
      }

      // Generate withdrawal code
      const withdrawalCode = Math.random().toString(36).substr(2, 6).toUpperCase();

      // Process the withdrawal transaction
      BalanceService.processWithdrawal(
        userId,
        amount,
        currency,
        agentId || 'agent_default'
      );

      // Send withdrawal notification to user
      try {
        const user = await DataService.getUserByKey(userId);
        if (user) {
          await NotificationService.sendNotification(user, {
            userId,
            type: 'withdrawal',
            amount,
            currency,
            transactionId: withdrawalCode,
            message: `Withdrawal request created. Show code ${withdrawalCode} to agent to collect cash.`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send withdrawal notification:', notificationError);
      }

      return {
        success: true,
        message: `Withdrawal initiated. Code: ${withdrawalCode}`,
        withdrawalCode
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Withdrawal failed'
      };
    }
  }

  // Check if user exists (mock implementation)
  static async findUserByPhone(phone: string): Promise<{ id: string; name: string; phone: string } | null> {
    // Mock user lookup - in production this would be a real database query
    const mockUsers = [
      { id: 'user_123456', name: 'Alice Johnson', phone: '+256700123456' },
      { id: 'user_654321', name: 'Bob Smith', phone: '+256700654321' },
      { id: 'user_789012', name: 'Carol Davis', phone: '+256700789012' }
    ];

    return mockUsers.find(user => user.phone === phone) || null;
  }
}
