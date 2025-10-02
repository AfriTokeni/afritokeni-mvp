/**
 * SMS Lightning Commands
 * Extends SMS functionality with Lightning Network commands
 * Enables instant Bitcoin transfers via SMS
 */

import { LightningService } from './lightningService';
import { BitcoinRoutingService } from './bitcoinRoutingService';
import { AfricanCurrency } from '../types/currency';

export interface SMSLightningCommand {
  command: string;
  phoneNumber: string;
  params: string[];
}

export interface SMSLightningResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class SMSLightningCommands {
  /**
   * Process Lightning-specific SMS commands
   */
  static async processCommand(cmd: SMSLightningCommand): Promise<SMSLightningResponse> {
    const command = cmd.command.toUpperCase();

    switch (command) {
      case 'LN':
      case 'LIGHTNING':
        return await this.handleLightningInfo();

      case 'LN SEND':
        return await this.handleLightningSend(cmd);

      case 'LN INVOICE':
        return await this.handleCreateInvoice(cmd);

      case 'LN PAY':
        return await this.handlePayInvoice(cmd);

      default:
        return {
          success: false,
          message: 'Unknown Lightning command. Send "LN" for help.',
        };
    }
  }

  /**
   * Show Lightning Network info
   */
  private static async handleLightningInfo(): Promise<SMSLightningResponse> {
    const stats = await LightningService.getNetworkStats();
    
    return {
      success: true,
      message: `⚡ Lightning Network

INSTANT Bitcoin transfers!
Fee: ~$0.001 (99% cheaper)
Speed: < 1 second

Commands:
LN SEND +234... 5000 NGN
LN INVOICE 10000 UGX
LN PAY [invoice]

Network: ${stats.channels.toLocaleString()} channels
Avg Fee: $${(stats.avgFee * 50000).toFixed(3)}`,
    };
  }

  /**
   * Send Lightning payment
   * Format: LN SEND +234... 5000 NGN
   */
  private static async handleLightningSend(cmd: SMSLightningCommand): Promise<SMSLightningResponse> {
    try {
      if (cmd.params.length < 3) {
        return {
          success: false,
          message: 'Format: LN SEND +234... 5000 NGN\nExample: LN SEND +2348153353131 1000 NGN',
        };
      }

      const recipientPhone = cmd.params[1];
      const amount = parseFloat(cmd.params[2]);
      const currency = (cmd.params[3] || 'NGN') as AfricanCurrency;

      if (isNaN(amount) || amount <= 0) {
        return {
          success: false,
          message: 'Invalid amount. Please enter a valid number.',
        };
      }

      // Check if amount is suitable for Lightning
      const routing = await BitcoinRoutingService.decideRouting({ amount, currency });

      if (routing.method === 'onchain') {
        return {
          success: false,
          message: `Amount too large for Lightning (>$50).\n${routing.reason}\n\nUse: BTC SEND for on-chain transfer`,
        };
      }

      // Execute Lightning transfer
      const transfer = await BitcoinRoutingService.executeTransfer({
        fromUserId: cmd.phoneNumber, // In production, get actual user ID
        toUserId: recipientPhone,
        amount,
        currency,
        urgency: 'instant',
      });

      return {
        success: true,
        message: `⚡ INSTANT Transfer Complete!

Sent: ${amount.toLocaleString()} ${currency}
To: ${recipientPhone}
Fee: $${(transfer.fee * 50000).toFixed(3)}
Time: < 1 second

Balance updated instantly!`,
        data: transfer,
      };
    } catch (error) {
      return {
        success: false,
        message: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create Lightning invoice
   * Format: LN INVOICE 10000 UGX
   */
  private static async handleCreateInvoice(cmd: SMSLightningCommand): Promise<SMSLightningResponse> {
    try {
      if (cmd.params.length < 2) {
        return {
          success: false,
          message: 'Format: LN INVOICE 10000 UGX\nExample: LN INVOICE 5000 NGN',
        };
      }

      const amount = parseFloat(cmd.params[1]);
      const currency = (cmd.params[2] || 'NGN') as AfricanCurrency;

      if (isNaN(amount) || amount <= 0) {
        return {
          success: false,
          message: 'Invalid amount.',
        };
      }

      const invoice = await LightningService.createInvoice({
        amount,
        currency,
        description: `Payment to ${cmd.phoneNumber}`,
        userId: cmd.phoneNumber,
      });

      return {
        success: true,
        message: `⚡ Lightning Invoice Created!

Amount: ${amount.toLocaleString()} ${currency}
≈ ${invoice.amountBTC.toFixed(8)} BTC

Invoice:
${invoice.paymentRequest}

Expires: ${invoice.expiresAt.toLocaleTimeString()}

Share this invoice to receive instant payment!`,
        data: invoice,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Pay Lightning invoice
   * Format: LN PAY lnbc...
   */
  private static async handlePayInvoice(cmd: SMSLightningCommand): Promise<SMSLightningResponse> {
    try {
      if (cmd.params.length < 2) {
        return {
          success: false,
          message: 'Format: LN PAY [invoice]\nExample: LN PAY lnbc10n1p...',
        };
      }

      const invoice = cmd.params[1];

      // Decode invoice to show details
      const details = LightningService.decodeInvoice(invoice);

      // Pay invoice
      const payment = await LightningService.payInvoice(invoice, cmd.phoneNumber);

      return {
        success: true,
        message: `⚡ Payment Sent!

Amount: ${details.amount ? (details.amount / 100000000).toFixed(8) : 'Unknown'} BTC
Fee: ${(payment.fee / 100000000).toFixed(8)} BTC
Status: ${payment.status}

Transaction completed in < 1 second!`,
        data: payment,
      };
    } catch (error) {
      return {
        success: false,
        message: `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get help text for Lightning commands
   */
  static getHelpText(): string {
    return `⚡ LIGHTNING COMMANDS

LN - Lightning info
LN SEND +234... 5000 NGN - Instant send
LN INVOICE 10000 UGX - Create invoice
LN PAY [invoice] - Pay invoice

Benefits:
• Instant (< 1 second)
• Cheap (~$0.001 fee)
• Perfect for small amounts

Limits: Max $50 per transfer`;
  }
}
