/**
 * SMS Command Processor
 * Processes incoming SMS commands and returns appropriate responses
 */

import { getSMSGateway } from './africasTalkingSMSGateway';
import { DataService } from './dataService';
import { BitcoinService } from './bitcoinService';
import { DynamicFeeService } from './dynamicFeeService';

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
    const existingUser = await DataService.getUser(phoneNumber);
    if (existingUser) {
      return {
        success: false,
        reply: `Welcome back, ${existingUser.firstName} ${existingUser.lastName}! You are already registered. Send HELP for commands.`,
      };
    }

    // Create new user
    await DataService.createUser({
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      email: phoneNumber, // Phone stored as email for SMS users
      userType: 'user',
      kycStatus: 'not_started',
    });

    return {
      success: true,
      reply: `Welcome to AfriTokeni, ${name}! Your account is ready. Send BAL to check balance or HELP for all commands.`,
    };
  }

  /**
   * Handle balance check
   */
  private async handleBalanceCheck(phoneNumber: string): Promise<SMSCommandResponse> {
    const user = await DataService.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const balance = await DataService.getBalance(user.id);
    const formattedBalance = balance.toLocaleString();

    return {
      success: true,
      reply: `AfriTokeni Balance:\n${formattedBalance} UGX\n\nSend HELP for more options.`,
    };
  }

  /**
   * Handle Bitcoin balance check
   */
  private async handleBitcoinBalance(phoneNumber: string): Promise<SMSCommandResponse> {
    const user = await DataService.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const btcBalance = await BitcoinService.getBitcoinBalance(user.id);
    const rate = await BitcoinService.getExchangeRate('UGX');
    const ugxValue = btcBalance * rate;

    return {
      success: true,
      reply: `Bitcoin Balance:\n${btcBalance.toFixed(8)} BTC\n≈ ${ugxValue.toLocaleString()} UGX\n\nRate: 1 BTC = ${rate.toLocaleString()} UGX`,
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
      const rate = await BitcoinService.getExchangeRate(currency);
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

    const sender = await DataService.getUserByPhone(phoneNumber);
    if (!sender) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const recipient = await DataService.getUserByPhone(recipientPhone);
    if (!recipient) {
      return {
        success: false,
        reply: 'Recipient not found. They need to register first.',
      };
    }

    // Check balance
    const balance = await DataService.getBalance(sender.id);
    if (balance < amount) {
      return {
        success: false,
        reply: `Insufficient balance. Your balance: ${balance.toLocaleString()} UGX`,
      };
    }

    // Process transfer
    await DataService.transferMoney(sender.id, recipient.id, amount, 'UGX');

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
      (await DataService.getBalance(recipient.id))
    );

    return {
      success: true,
      reply: `Sent ${amount.toLocaleString()} UGX to ${recipient.name}. New balance: ${(balance - amount).toLocaleString()} UGX`,
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

    const user = await DataService.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    // Calculate dynamic fee
    const feeCalculation = await DynamicFeeService.calculateFee({
      amount,
      currency,
      userLocation: user.location || { lat: 0.3476, lng: 32.5825 }, // Default to Kampala
      agentLocation: { lat: 0.3476, lng: 32.5825 }, // Mock agent location
      urgency: 'standard',
    });

    const confirmationCode = this.generateConfirmationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store pending transaction
    await DataService.storePendingTransaction({
      userId: user.id,
      type: 'bitcoin_buy',
      amount,
      currency,
      fee: feeCalculation.totalFee,
      confirmationCode,
      expiresAt,
    });

    return {
      success: true,
      requiresConfirmation: true,
      confirmationCode,
      reply: `Bitcoin Purchase Quote:\nAmount: ${amount.toLocaleString()} ${currency}\nFee: ${feeCalculation.totalFee}% (${feeCalculation.breakdown.join(', ')})\nTotal: ${(amount * (1 + feeCalculation.totalFee / 100)).toLocaleString()} ${currency}\n\nReply: CONFIRM ${confirmationCode}\nExpires in 5 minutes`,
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

    const user = await DataService.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    // Calculate fee and generate confirmation
    const feeCalculation = await DynamicFeeService.calculateFee({
      amount,
      currency,
      userLocation: user.location || { lat: 0.3476, lng: 32.5825 },
      agentLocation: { lat: 0.3476, lng: 32.5825 },
      urgency: 'standard',
    });

    const confirmationCode = this.generateConfirmationCode();

    return {
      success: true,
      requiresConfirmation: true,
      confirmationCode,
      reply: `Bitcoin Sale Quote:\nAmount: ${amount} BTC\nFee: ${feeCalculation.totalFee}%\nYou receive: ${(amount * (1 - feeCalculation.totalFee / 100)).toFixed(8)} BTC worth\n\nReply: CONFIRM ${confirmationCode}\nExpires in 5 minutes`,
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

    const user = await DataService.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found. Register with: REG [Your Name]',
      };
    }

    const balance = await DataService.getBalance(user.id);
    if (balance < amount) {
      return {
        success: false,
        reply: `Insufficient balance. Your balance: ${balance.toLocaleString()} UGX`,
      };
    }

    // Generate withdrawal code
    const withdrawalCode = this.generateWithdrawalCode();

    // Create withdrawal request
    await DataService.createWithdrawalRequest({
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

    const user = await DataService.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found.',
      };
    }

    // Retrieve and execute pending transaction
    const pending = await DataService.getPendingTransaction(user.id, code);
    if (!pending) {
      return {
        success: false,
        reply: 'Invalid or expired confirmation code.',
      };
    }

    // Execute the transaction based on type
    // This would integrate with actual Bitcoin/payment processing
    await DataService.executePendingTransaction(pending.id);

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
BTC BAL - Bitcoin balance
BTC RATE [Currency] - BTC rate
BTC BUY [Amount] [Currency] - Buy BTC
BTC SELL [Amount] - Sell BTC
HISTORY - Recent transactions
HELP - Show this menu`,
    };
  }

  /**
   * Handle transaction history
   */
  private async handleHistory(phoneNumber: string): Promise<SMSCommandResponse> {
    const user = await DataService.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        reply: 'Account not found.',
      };
    }

    const transactions = await DataService.getRecentTransactions(user.id, 5);

    if (transactions.length === 0) {
      return {
        success: true,
        reply: 'No recent transactions.',
      };
    }

    let reply = 'Recent Transactions:\n';
    transactions.forEach((txn, index) => {
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
