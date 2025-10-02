/**
 * USSD Service for Menu-Driven Interface
 * Provides interactive menu system for feature phones
 */

import { SMSDataAdapter } from './smsDataAdapter';
import { getCurrencyFromPhone } from '../utils/africanPhoneNumbers';
import { AfricanCurrency } from '../types/currency';

export interface USSDRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

export interface USSDResponse {
  response: string;
  continueSession: boolean;
}

interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  currentMenu: string;
  data: Record<string, any>;
  timestamp: Date;
}

export class USSDService {
  private sessions: Map<string, USSDSession>;

  constructor() {
    this.sessions = new Map();
  }

  /**
   * Process USSD request
   */
  async processRequest(request: USSDRequest): Promise<USSDResponse> {
    const { sessionId, phoneNumber, text } = request;

    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        phoneNumber,
        currentMenu: 'main',
        data: {},
        timestamp: new Date(),
      };
      this.sessions.set(sessionId, session);
    }

    // Parse user input
    const input = text.split('*').pop() || '';

    // Route to appropriate menu handler
    try {
      if (text === '') {
        return await this.showMainMenu(session);
      }

      const menuPath = text.split('*');
      return await this.handleMenuNavigation(session, menuPath);
    } catch (error) {
      console.error('USSD processing error:', error);
      return {
        response: 'END An error occurred. Please try again.',
        continueSession: false,
      };
    }
  }

  /**
   * Show main menu
   */
  private async showMainMenu(session: USSDSession): Promise<USSDResponse> {
    const user = await SMSDataAdapter.getUserByPhone(session.phoneNumber);

    if (!user) {
      return {
        response: `CON Welcome to AfriTokeni
1. Register
2. Help`,
        continueSession: true,
      };
    }

    const { amount: balance, currency } = await SMSDataAdapter.getBalance(user.id, session.phoneNumber);

    return {
      response: `CON AfriTokeni - ${user.firstName} ${user.lastName}
Balance: ${balance.toLocaleString()} ${currency}

1. Check Balance
2. Send Money
3. Withdraw Cash
4. Bitcoin Services
5. Transaction History
6. Help`,
      continueSession: true,
    };
  }

  /**
   * Handle menu navigation
   */
  private async handleMenuNavigation(session: USSDSession, menuPath: string[]): Promise<USSDResponse> {
    const user = await SMSDataAdapter.getUserByPhone(session.phoneNumber);

    // Registration flow
    if (menuPath[0] === '1' && !user) {
      return await this.handleRegistration(session, menuPath);
    }

    // Help
    if (menuPath[0] === '2' && !user) {
      return this.showHelp();
    }

    // User must be registered for other options
    if (!user) {
      return {
        response: 'END Please register first. Dial *123# and select option 1.',
        continueSession: false,
      };
    }

    // Check Balance
    if (menuPath[0] === '1') {
      return await this.handleBalanceCheck(session, user);
    }

    // Send Money
    if (menuPath[0] === '2') {
      return await this.handleSendMoney(session, menuPath, user);
    }

    // Withdraw Cash
    if (menuPath[0] === '3') {
      return await this.handleWithdraw(session, menuPath, user);
    }

    // Bitcoin Services
    if (menuPath[0] === '4') {
      return await this.handleBitcoinMenu(session, menuPath, user);
    }

    // Transaction History
    if (menuPath[0] === '5') {
      return await this.handleHistory(session, user);
    }

    // Help
    if (menuPath[0] === '6') {
      return this.showHelp();
    }

    return {
      response: 'END Invalid option. Please try again.',
      continueSession: false,
    };
  }

  /**
   * Handle registration
   */
  private async handleRegistration(session: USSDSession, menuPath: string[]): Promise<USSDResponse> {
    if (menuPath.length === 1) {
      return {
        response: 'CON Enter your full name:',
        continueSession: true,
      };
    }

    if (menuPath.length === 2) {
      const name = menuPath[1];
      
      // Create user
      await SMSDataAdapter.createUser(session.phoneNumber, name);

      return {
        response: `END Welcome to AfriTokeni, ${name}! Your account is ready. Dial *123# to access services.`,
        continueSession: false,
      };
    }

    return {
      response: 'END Registration error. Please try again.',
      continueSession: false,
    };
  }

  /**
   * Handle balance check
   */
  private async handleBalanceCheck(session: USSDSession, user: any): Promise<USSDResponse> {
    const { amount: balance, currency } = await SMSDataAdapter.getBalance(user.id, session.phoneNumber);
    const btcBalance = await SMSDataAdapter.getBitcoinBalance(user.id);

    return {
      response: `END Your Balances:
Local: ${balance.toLocaleString()} ${currency}
Bitcoin: ${btcBalance.toFixed(8)} BTC`,
      continueSession: false,
    };
  }

  /**
   * Handle send money
   */
  private async handleSendMoney(session: USSDSession, menuPath: string[], user: any): Promise<USSDResponse> {
    // Step 1: Enter recipient phone
    if (menuPath.length === 1) {
      return {
        response: 'CON Enter recipient phone number:\n(Format: +256700123456)',
        continueSession: true,
      };
    }

    // Step 2: Enter amount
    if (menuPath.length === 2) {
      const recipientPhone = menuPath[1];
      session.data.recipientPhone = recipientPhone;

      // Verify recipient exists
      const recipient = await SMSDataAdapter.getUserByPhone(recipientPhone);
      if (!recipient) {
        return {
          response: 'END Recipient not found. They need to register first.',
          continueSession: false,
        };
      }

      session.data.recipientName = `${recipient.firstName} ${recipient.lastName}`;

      return {
        response: `CON Send to: ${recipient.firstName} ${recipient.lastName}\nEnter amount:`,
        continueSession: true,
      };
    }

    // Step 3: Confirm
    if (menuPath.length === 3) {
      const amount = parseFloat(menuPath[2]);

      if (isNaN(amount) || amount <= 0) {
        return {
          response: 'END Invalid amount. Please try again.',
          continueSession: false,
        };
      }

      session.data.amount = amount;

      return {
        response: `CON Confirm:
Send ${amount.toLocaleString()} UGX to ${session.data.recipientName}

1. Confirm
2. Cancel`,
        continueSession: true,
      };
    }

    // Step 4: Execute
    if (menuPath.length === 4) {
      if (menuPath[3] === '1') {
        const { amount: balance, currency: userCurrency } = await SMSDataAdapter.getBalance(user.id, session.phoneNumber);
        const amount = session.data.amount;

        if (balance < amount) {
          return {
            response: `END Insufficient balance. Your balance: ${balance.toLocaleString()} ${userCurrency}`,
            continueSession: false,
          };
        }

        const recipient = await SMSDataAdapter.getUserByPhone(session.data.recipientPhone);
        await SMSDataAdapter.transferMoney(user.id, recipient!.id, amount, userCurrency);

        return {
          response: `END Success! Sent ${amount.toLocaleString()} ${userCurrency} to ${session.data.recipientName}. New balance: ${(balance - amount).toLocaleString()} ${userCurrency}`,
          continueSession: false,
        };
      } else {
        return {
          response: 'END Transaction cancelled.',
          continueSession: false,
        };
      }
    }

    return {
      response: 'END Error processing transaction.',
      continueSession: false,
    };
  }

  /**
   * Handle withdrawal
   */
  private async handleWithdraw(session: USSDSession, menuPath: string[], user: any): Promise<USSDResponse> {
    // Step 1: Enter amount
    if (menuPath.length === 1) {
      const { amount: balance, currency } = await SMSDataAdapter.getBalance(user.id, session.phoneNumber);
      return {
        response: `CON Withdraw Cash
Balance: ${balance.toLocaleString()} UGX

Enter amount to withdraw:`,
        continueSession: true,
      };
    }

    // Step 2: Confirm
    if (menuPath.length === 2) {
      const amount = parseFloat(menuPath[1]);

      if (isNaN(amount) || amount <= 0) {
        return {
          response: 'END Invalid amount. Please try again.',
          continueSession: false,
        };
      }

      const { amount: balance, currency } = await SMSDataAdapter.getBalance(user.id, session.phoneNumber);
      if (balance < amount) {
        return {
          response: `END Insufficient balance. Your balance: ${balance.toLocaleString()} UGX`,
          continueSession: false,
        };
      }

      session.data.withdrawAmount = amount;

      return {
        response: `CON Confirm withdrawal:
Amount: ${amount.toLocaleString()} UGX

1. Confirm
2. Cancel`,
        continueSession: true,
      };
    }

    // Step 3: Execute
    if (menuPath.length === 3) {
      if (menuPath[2] === '1') {
        const amount = session.data.withdrawAmount;
        const withdrawalCode = this.generateWithdrawalCode();

        await SMSDataAdapter.createWithdrawalRequest({
          userId: user.id,
          amount,
          currency: 'UGX',
          code: withdrawalCode,
        });

        return {
          response: `END Withdrawal approved!
Code: ${withdrawalCode}
Amount: ${amount.toLocaleString()} UGX

Show this code to any AfriTokeni agent. Valid for 24 hours.`,
          continueSession: false,
        };
      } else {
        return {
          response: 'END Withdrawal cancelled.',
          continueSession: false,
        };
      }
    }

    return {
      response: 'END Error processing withdrawal.',
      continueSession: false,
    };
  }

  /**
   * Handle Bitcoin menu
   */
  private async handleBitcoinMenu(session: USSDSession, menuPath: string[], user: any): Promise<USSDResponse> {
    if (menuPath.length === 1) {
      return {
        response: `CON Bitcoin Services
1. Check BTC Balance
2. Buy Bitcoin
3. Sell Bitcoin
4. BTC Exchange Rate
5. Back`,
        continueSession: true,
      };
    }

    // Check BTC Balance
    if (menuPath[1] === '1') {
      const btcBalance = await SMSDataAdapter.getBitcoinBalance(user.id);
      const currency = getCurrencyFromPhone(session.phoneNumber) || 'UGX';
      const rate = await SMSDataAdapter.getBitcoinRate(currency as AfricanCurrency);
      const localValue = btcBalance * rate;

      return {
        response: `END Bitcoin Balance:
${btcBalance.toFixed(8)} BTC
≈ ${localValue.toLocaleString()} ${currency}

Rate: 1 BTC = ${rate.toLocaleString()} ${currency}`,
        continueSession: false,
      };
    }

    // Buy Bitcoin
    if (menuPath[1] === '2') {
      return await this.handleBitcoinBuy(session, menuPath.slice(2), user);
    }

    // Sell Bitcoin
    if (menuPath[1] === '3') {
      return await this.handleBitcoinSell(session, menuPath.slice(2), user);
    }

    // Exchange Rate
    if (menuPath[1] === '4') {
      const currency = getCurrencyFromPhone(session.phoneNumber) || 'UGX';
      const rate = await SMSDataAdapter.getBitcoinRate(currency as AfricanCurrency);
      return {
        response: `END Bitcoin Rate:
1 BTC = ${rate.toLocaleString()} ${currency}

Updated: ${new Date().toLocaleTimeString()}`,
        continueSession: false,
      };
    }

    return await this.showMainMenu(session);
  }

  /**
   * Handle Bitcoin buy
   */
  private async handleBitcoinBuy(_session: USSDSession, subPath: string[], _user: any): Promise<USSDResponse> {
    if (subPath.length === 0) {
      return {
        response: 'CON Enter amount in UGX to spend:',
        continueSession: true,
      };
    }

    const amount = parseFloat(subPath[0]);
    if (isNaN(amount) || amount <= 0) {
      return {
        response: 'END Invalid amount. Please try again.',
        continueSession: false,
      };
    }

    const rate = await this.bitcoinService.getExchangeRate('UGX');
    const btcAmount = amount / rate;

    return {
      response: `END Bitcoin Purchase:
Spend: ${amount.toLocaleString()} UGX
Receive: ${btcAmount.toFixed(8)} BTC
Rate: ${rate.toLocaleString()} UGX/BTC

Visit nearest agent to complete purchase.`,
      continueSession: false,
    };
  }

  /**
   * Handle Bitcoin sell
   */
  private async handleBitcoinSell(_session: USSDSession, subPath: string[], _user: any): Promise<USSDResponse> {
    if (subPath.length === 0) {
      const btcBalance = await SMSDataAdapter.getBitcoinBalance(_user.id);
      return {
        response: `CON Your BTC: ${btcBalance.toFixed(8)}
Enter BTC amount to sell:`,
        continueSession: true,
      };
    }

    const btcAmount = parseFloat(subPath[0]);
    if (isNaN(btcAmount) || btcAmount <= 0) {
      return {
        response: 'END Invalid amount. Please try again.',
        continueSession: false,
      };
    }

    const rate = await this.bitcoinService.getExchangeRate('UGX');
    const ugxAmount = btcAmount * rate;

    return {
      response: `END Bitcoin Sale:
Sell: ${btcAmount.toFixed(8)} BTC
Receive: ${ugxAmount.toLocaleString()} UGX
Rate: ${rate.toLocaleString()} UGX/BTC

Visit nearest agent to complete sale.`,
      continueSession: false,
    };
  }

  /**
   * Handle transaction history
   */
  private async handleHistory(session: USSDSession, user: any): Promise<USSDResponse> {
    const transactions = await SMSDataAdapter.getRecentTransactions(user.id, 5);

    if (transactions.length === 0) {
      return {
        response: 'END No recent transactions.',
        continueSession: false,
      };
    }

    let response = 'END Recent Transactions:\n';
    transactions.forEach((txn: any, index: number) => {
      response += `${index + 1}. ${txn.type} ${txn.amount.toLocaleString()} ${txn.currency}\n`;
    });

    return {
      response,
      continueSession: false,
    };
  }

  /**
   * Show help
   */
  private showHelp(): USSDResponse {
    return {
      response: `END AfriTokeni Help:
Dial *123# for menu
SMS Commands:
- BAL: Check balance
- SEND [phone] [amount]
- WITHDRAW [amount]
- BTC BAL: Bitcoin balance
- HELP: Show commands

Support: +256700000000`,
      continueSession: false,
    };
  }

  /**
   * Generate withdrawal code
   */
  private generateWithdrawalCode(): string {
    return `WD-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    const now = new Date();
    const expiryTime = 5 * 60 * 1000; // 5 minutes

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.timestamp.getTime() > expiryTime) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
