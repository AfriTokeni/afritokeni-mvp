/**
 * SMS Command Processor
 * Processes incoming SMS commands and returns appropriate responses
 */

import { getSMSGateway } from './africasTalkingSMSGateway';
import { SMSDataAdapter } from './smsDataAdapter';
import { SMSLightningCommands } from './smsLightningCommands';
import { getCurrencyFromPhone } from '../utils/africanPhoneNumbers';
import { AfricanCurrency } from '../types/currency';

export interface SMSCommand {
  phoneNumber: string;
  message: string;
  timestamp: Date;
  sessionId?: string;
}

export interface SMSCommandResponse {
  success: boolean;
  reply: string;
  requiresConfirmation?: boolean;
  confirmationCode?: string;
  pendingAction?: any;
}

export class SMSCommandProcessor {
  private smsGateway: ReturnType<typeof getSMSGateway>;

  constructor() {
    this.smsGateway = getSMSGateway();
  }

  /**
   * Process incoming SMS command
   */
  async processCommand(command: SMSCommand): Promise<SMSCommandResponse> {
    const { phoneNumber, message } = command;
    const normalizedMessage = message.trim().toUpperCase();

    try {
      // Registration command
      if (normalizedMessage.startsWith('REG ')) {
        return await this.handleRegistration(phoneNumber, message);
      }

      // Balance check
      if (normalizedMessage === 'BAL' || normalizedMessage === 'BALANCE') {
        return await this.handleBalanceCheck(phoneNumber);
      }

      // Bitcoin balance
      if (normalizedMessage === 'BTC BAL' || normalizedMessage === 'BTC BALANCE') {
        return await this.handleBitcoinBalance(phoneNumber);
      }

      // Bitcoin rate
      if (normalizedMessage.startsWith('BTC RATE')) {
        return await this.handleBitcoinRate(message);
      }

      // Send money
      if (normalizedMessage.startsWith('SEND ')) {
        return await this.handleSendMoney(phoneNumber, message);
      }

      // Bitcoin buy
      if (normalizedMessage.startsWith('BTC BUY ')) {
        return await this.handleBitcoinBuy(phoneNumber, message);
      }

      // Bitcoin sell
      if (normalizedMessage.startsWith('BTC SELL ')) {
        return await this.handleBitcoinSell(phoneNumber, message);
      }

      // Withdraw
      if (normalizedMessage.startsWith('WITHDRAW ') || normalizedMessage.startsWith('WD ')) {
        return await this.handleWithdraw(phoneNumber, message);
      }

      // Confirmation
      if (normalizedMessage.startsWith('CONFIRM ')) {
        return await this.handleConfirmation(phoneNumber, message);
      }

      // Lightning Network commands
      if (normalizedMessage === 'LN' || normalizedMessage === 'LIGHTNING') {
        const response = await SMSLightningCommands.processCommand({
          command: 'LN',
          phoneNumber,
          params: [],
        });
        return { success: response.success, reply: response.message };
      }

      if (normalizedMessage.startsWith('LN SEND ')) {
        const parts = message.trim().split(' ');
        const response = await SMSLightningCommands.processCommand({
          command: 'LN SEND',
          phoneNumber,
          params: parts,
        });
        return { success: response.success, reply: response.message };
      }

      if (normalizedMessage.startsWith('LN INVOICE ')) {
        const parts = message.trim().split(' ');
        const response = await SMSLightningCommands.processCommand({
          command: 'LN INVOICE',
          phoneNumber,
          params: parts,
        });
        return { success: response.success, reply: response.message };
      }

      if (normalizedMessage.startsWith('LN PAY ')) {
        const parts = message.trim().split(' ');
        const response = await SMSLightningCommands.processCommand({
          command: 'LN PAY',
          phoneNumber,
          params: parts,
        });
        return { success: response.success, reply: response.message };
      }

      // Help
      if (normalizedMessage === 'HELP' || normalizedMessage === '*AFRI#') {
        return this.handleHelp();
      }

      // Transaction history
      if (normalizedMessage === 'HISTORY' || normalizedMessage === 'TXN') {
        return await this.handleHistory(phoneNumber);
      }

      // Unknown command
      return {
        success: false,
        reply: 'Invalid command. Send HELP or *AFRI# for available commands.',
      };
    } catch (error) {
      console.error('Command processing error:', error);
      return {
        success: false,
        reply: 'An error occurred processing your request. Please try again or contact support.',
      };
    }
  }

  /**
   * Handle user registration
   * Format: REG [Name]
   */
  private async handleRegistration(phoneNumber: string, message: string): Promise<SMSCommandResponse> {
    const parts = message.trim().split(' ');
    if (parts.length < 2) {
      return {
        success: false,
        reply: 'Invalid format. Use: REG [Your Name]\nExample: REG John Doe',
      };
    }

    const name = parts.slice(1).join(' ');
    
    // Check if user already exists
    const existingUser = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (existingUser) {
      return {
        success: false,
        reply: `Welcome back, ${existingUser.firstName} ${existingUser.lastName}! You are already registered. Send HELP for commands.`,
      };
    }

    // Create new user
    await SMSDataAdapter.createUser(phoneNumber, name);

    return {
      success: true,
      reply: `Welcome to AfriTokeni, ${name}! Your account is ready. Send BAL to check balance or HELP for all commands.`,
    };
  }

  /**
   * Handle balance check
   */
  private async handleBalanceCheck(phoneNumber: string): Promise<SMSCommandResponse> {
    const user = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const { amount, currency } = await SMSDataAdapter.getBalance(user.id, phoneNumber);
    const formattedBalance = amount.toLocaleString();

    return {
      success: true,
      reply: `AfriTokeni Balance:\n${formattedBalance} ${currency}\n\nSend HELP for more options.`,
    };
  }

  /**
   * Handle Bitcoin balance check
   */
  private async handleBitcoinBalance(phoneNumber: string): Promise<SMSCommandResponse> {
    const user = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const btcBalance = await SMSDataAdapter.getBitcoinBalance(user.id);
    const currency = getCurrencyFromPhone(phoneNumber) || 'UGX';
    const rate = await SMSDataAdapter.getBitcoinRate(currency as AfricanCurrency);
    const ugxValue = btcBalance * rate;

    return {
      success: true,
      reply: `Bitcoin Balance:\n${btcBalance.toFixed(8)} BTC\n≈ ${ugxValue.toLocaleString()} ${currency}\n\nRate: 1 BTC = ${rate.toLocaleString()} ${currency}`,
    };
  }

  /**
   * Handle Bitcoin rate check
   * Format: BTC RATE [CURRENCY]
   */
  private async handleBitcoinRate(message: string): Promise<SMSCommandResponse> {
    const parts = message.trim().toUpperCase().split(' ');
    const currency = parts.length > 2 ? parts[2] : 'UGX';

    try {
      const rate = await SMSDataAdapter.getBitcoinRate(currency as AfricanCurrency);
      return {
        success: true,
        reply: `Bitcoin Rate:\n1 BTC = ${rate.toLocaleString()} ${currency}\n\nLast updated: ${new Date().toLocaleTimeString()}`,
      };
    } catch (error) {
      return {
        success: false,
        reply: `Unable to fetch rate for ${currency}. Try: BTC RATE UGX`,
      };
    }
  }

  /**
   * Handle send money
   * Format: SEND [Phone] [Amount]
   */
  private async handleSendMoney(phoneNumber: string, message: string): Promise<SMSCommandResponse> {
    const parts = message.trim().split(' ');
    if (parts.length < 3) {
      return {
        success: false,
        reply: 'Invalid format. Use: SEND [Phone] [Amount]\nExample: SEND +256700123456 5000',
      };
    }

    const recipientPhone = parts[1];
    const amount = parseFloat(parts[2]);

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        reply: 'Invalid amount. Please enter a valid number.',
      };
    }

    const sender = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!sender) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const recipient = await SMSDataAdapter.getUserByPhone(recipientPhone);
    if (!recipient) {
      return {
        success: false,
        reply: 'Recipient not found. They need to register first.',
      };
    }

    // Check balance
    const { amount: balance, currency } = await SMSDataAdapter.getBalance(sender.id, phoneNumber);
    if (balance < amount) {
      return {
        success: false,
        reply: `Insufficient balance. Your balance: ${balance.toLocaleString()} UGX`,
      };
    }

    // Process transfer
    await SMSDataAdapter.transferMoney(sender.id, recipient.id, amount, currency);

    // Send notifications
    await this.smsGateway.sendTransactionNotification(
      phoneNumber,
      'sent',
      amount,
      'UGX',
      balance - amount
    );

    await this.smsGateway.sendTransactionNotification(
      recipientPhone,
      'received',
      amount,
      'UGX',
      (await SMSDataAdapter.getBalance(recipient.id)).amount
    );

    return {
      success: true,
      reply: `Sent ${amount.toLocaleString()} ${currency} to ${recipient.firstName} ${recipient.lastName}. New balance: ${(balance - amount).toLocaleString()} ${currency}`,
    };
  }

  /**
   * Handle Bitcoin buy with dynamic fee confirmation
   * Format: BTC BUY [Amount] [Currency]
   */
  private async handleBitcoinBuy(phoneNumber: string, message: string): Promise<SMSCommandResponse> {
    const parts = message.trim().toUpperCase().split(' ');
    if (parts.length < 3) {
      return {
        success: false,
        reply: 'Invalid format. Use: BTC BUY [Amount] [Currency]\nExample: BTC BUY 100000 UGX',
      };
    }

    const amount = parseFloat(parts[2]);
    const currency = parts.length > 3 ? parts[3] : 'UGX';

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        reply: 'Invalid amount. Please enter a valid number.',
      };
    }

    const user = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    // Calculate fee (simplified - 2.5% standard fee)
    const feePercent = 2.5;
    const feeAmount = amount * (feePercent / 100);
    const total = amount + feeAmount;

    const confirmationCode = this.generateConfirmationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store pending transaction
    await SMSDataAdapter.storePendingTransaction({
      userId: user.id,
      type: 'bitcoin_buy',
      amount,
      currency: currency as AfricanCurrency,
      fee: feePercent,
      confirmationCode,
      expiresAt,
    });

    return {
      success: true,
      requiresConfirmation: true,
      confirmationCode,
      reply: `Bitcoin Purchase Quote:\nAmount: ${amount.toLocaleString()} ${currency}\nFee: ${feePercent}%\nTotal: ${total.toLocaleString()} ${currency}\n\nReply: CONFIRM ${confirmationCode}\nExpires in 5 minutes`,
    };
  }

  /**
   * Handle Bitcoin sell with dynamic fee confirmation
   */
  private async handleBitcoinSell(phoneNumber: string, message: string): Promise<SMSCommandResponse> {
    const parts = message.trim().toUpperCase().split(' ');
    if (parts.length < 3) {
      return {
        success: false,
        reply: 'Invalid format. Use: BTC SELL [Amount] [Currency]\nExample: BTC SELL 0.001 BTC',
      };
    }

    const amount = parseFloat(parts[2]);
    const currency = parts.length > 3 ? parts[3] : 'UGX';

    const user = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    // Calculate fee (simplified - 2.5% standard fee)
    const feePercent = 2.5;
    const youReceive = amount * (1 - feePercent / 100);

    const confirmationCode = this.generateConfirmationCode();

    return {
      success: true,
      requiresConfirmation: true,
      confirmationCode,
      reply: `Bitcoin Sale Quote:\nAmount: ${amount} BTC\nFee: ${feePercent}%\nYou receive: ${youReceive.toFixed(8)} BTC worth in ${currency}\n\nReply: CONFIRM ${confirmationCode}\nExpires in 5 minutes`,
    };
  }

  /**
   * Handle withdrawal request
   */
  private async handleWithdraw(phoneNumber: string, message: string): Promise<SMSCommandResponse> {
    const parts = message.trim().split(' ');
    if (parts.length < 2) {
      return {
        success: false,
        reply: 'Invalid format. Use: WITHDRAW [Amount]\nExample: WITHDRAW 50000',
      };
    }

    const amount = parseFloat(parts[1]);

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        reply: 'Invalid amount. Please enter a valid number.',
      };
    }

    const user = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const { amount: balance, currency } = await SMSDataAdapter.getBalance(user.id, phoneNumber);
    if (balance < amount) {
      return {
        success: false,
        reply: `Insufficient balance. Your balance: ${balance.toLocaleString()} UGX`,
      };
    }

    // Generate withdrawal code
    const withdrawalCode = this.generateWithdrawalCode();

    // Create withdrawal request
    await SMSDataAdapter.createWithdrawalRequest({
      userId: user.id,
      amount,
      currency: 'UGX',
      code: withdrawalCode,
    });

    // Send withdrawal code
    await this.smsGateway.sendWithdrawalCode(phoneNumber, withdrawalCode, amount, 'UGX');

    return {
      success: true,
      reply: `Withdrawal request created. Check your SMS for the withdrawal code. Show this code to any AfriTokeni agent to collect ${amount.toLocaleString()} UGX.`,
    };
  }

  /**
   * Handle confirmation of pending transactions
   */
  private async handleConfirmation(phoneNumber: string, message: string): Promise<SMSCommandResponse> {
    const parts = message.trim().toUpperCase().split(' ');
    if (parts.length < 2) {
      return {
        success: false,
        reply: 'Invalid format. Use: CONFIRM [Code]',
      };
    }

    const code = parts[1];

    const user = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found.',
      };
    }

    // Retrieve and execute pending transaction
    const pending = await SMSDataAdapter.getPendingTransaction(user.id, code);
    if (!pending) {
      return {
        success: false,
        reply: 'Invalid or expired confirmation code.',
      };
    }

    // Execute the transaction based on type
    // This would integrate with actual Bitcoin/payment processing
    await SMSDataAdapter.executePendingTransaction(pending.id);

    return {
      success: true,
      reply: `Transaction confirmed! Your ${pending.type} of ${pending.amount} ${pending.currency} is being processed.`,
    };
  }

  /**
   * Handle help command
   */
  private handleHelp(): SMSCommandResponse {
    return {
      success: true,
      reply: `AfriTokeni Commands:
REG [Name] - Register
BAL - Check balance
SEND [Phone] [Amount] - Send money
WITHDRAW [Amount] - Withdraw cash

Bitcoin:
BTC BAL - Bitcoin balance
BTC RATE [Currency] - BTC rate
BTC BUY [Amount] [Currency] - Buy BTC
BTC SELL [Amount] - Sell BTC

Lightning ⚡:
LN - Lightning info
LN SEND [Phone] [Amount] [Currency]
LN INVOICE [Amount] [Currency]
LN PAY [invoice]

HISTORY - Recent transactions
HELP - Show this menu`,
    };
  }

  /**
   * Handle transaction history
   */
  private async handleHistory(phoneNumber: string): Promise<SMSCommandResponse> {
    const user = await SMSDataAdapter.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found.',
      };
    }

    const transactions = await SMSDataAdapter.getRecentTransactions(user.id, 5);

    if (transactions.length === 0) {
      return {
        success: true,
        reply: 'No recent transactions.',
      };
    }

    let reply = 'Recent Transactions:\n';
    transactions.forEach((txn: any, index: number) => {
      reply += `${index + 1}. ${txn.type} ${txn.amount} ${txn.currency} - ${new Date(txn.timestamp).toLocaleDateString()}\n`;
    });

    return {
      success: true,
      reply,
    };
  }

  /**
   * Generate confirmation code
   */
  private generateConfirmationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate withdrawal code
   */
  private generateWithdrawalCode(): string {
    return `WD-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
