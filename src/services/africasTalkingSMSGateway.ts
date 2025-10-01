/**
 * Africa's Talking SMS Gateway Service
 * Real SMS integration for production deployment
 */

import AfricasTalking from 'africastalking';

interface SMSConfig {
  apiKey: string;
  username: string;
  shortCode?: string;
}

interface SendSMSOptions {
  to: string | string[];
  message: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  cost?: string;
  status?: string;
  error?: string;
}

export class AfricasTalkingSMSGateway {
  private client: any;
  private sms: any;
  private shortCode: string;

  constructor(config: SMSConfig) {
    // Initialize Africa's Talking client
    this.client = AfricasTalking({
      apiKey: config.apiKey,
      username: config.username,
    });

    this.sms = this.client.SMS;
    this.shortCode = config.shortCode || '22948';
  }

  /**
   * Send SMS to one or multiple recipients
   */
  async sendSMS(options: SendSMSOptions): Promise<SMSResponse> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      const result = await this.sms.send({
        to: recipients,
        message: options.message,
        from: options.from || this.shortCode,
      });

      // Africa's Talking returns an array of results
      const firstResult = result.SMSMessageData.Recipients[0];

      if (firstResult.status === 'Success') {
        return {
          success: true,
          messageId: firstResult.messageId,
          cost: firstResult.cost,
          status: firstResult.status,
        };
      } else {
        return {
          success: false,
          error: firstResult.status,
        };
      }
    } catch (error) {
      console.error('Africa\'s Talking SMS Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(recipients: string[], message: string): Promise<SMSResponse[]> {
    try {
      const result = await this.sms.send({
        to: recipients,
        message: message,
        from: this.shortCode,
      });

      return result.SMSMessageData.Recipients.map((recipient: any) => ({
        success: recipient.status === 'Success',
        messageId: recipient.messageId,
        cost: recipient.cost,
        status: recipient.status,
        error: recipient.status !== 'Success' ? recipient.status : undefined,
      }));
    } catch (error) {
      console.error('Bulk SMS Error:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }];
    }
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCode(phoneNumber: string, code: string, userName?: string): Promise<SMSResponse> {
    const { getCountryInfo } = require('../utils/africanPhoneNumbers');
    const country = getCountryInfo(phoneNumber);
    const flag = country ? country.flag : '🌍';
    
    const greeting = userName ? `${userName}, ` : '';
    const message = `${flag} ${greeting}Your AfriTokeni verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;

    return this.sendSMS({
      to: phoneNumber,
      message: message,
    });
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(
    phoneNumber: string,
    type: 'sent' | 'received' | 'withdrawal' | 'deposit',
    amount: number,
    currency: string,
    balance: number
  ): Promise<SMSResponse> {
    let message = '';

    switch (type) {
      case 'sent':
        message = `AfriTokeni: You sent ${amount.toLocaleString()} ${currency}. New balance: ${balance.toLocaleString()} ${currency}`;
        break;
      case 'received':
        message = `AfriTokeni: You received ${amount.toLocaleString()} ${currency}. New balance: ${balance.toLocaleString()} ${currency}`;
        break;
      case 'withdrawal':
        message = `AfriTokeni: Withdrawal of ${amount.toLocaleString()} ${currency} approved. Collect from agent. Code sent separately.`;
        break;
      case 'deposit':
        message = `AfriTokeni: Deposit of ${amount.toLocaleString()} ${currency} confirmed. New balance: ${balance.toLocaleString()} ${currency}`;
        break;
    }

    return this.sendSMS({
      to: phoneNumber,
      message: message,
    });
  }

  /**
   * Send withdrawal code
   */
  async sendWithdrawalCode(phoneNumber: string, code: string, amount: number, currency: string): Promise<SMSResponse> {
    const message = `AfriTokeni Withdrawal Code: ${code}\nAmount: ${amount.toLocaleString()} ${currency}\nShow this code to the agent. Valid for 24 hours.`;

    return this.sendSMS({
      to: phoneNumber,
      message: message,
    });
  }

  /**
   * Send Bitcoin transaction notification
   */
  async sendBitcoinNotification(
    phoneNumber: string,
    type: 'buy' | 'sell' | 'received' | 'sent',
    btcAmount: number,
    localAmount: number,
    currency: string
  ): Promise<SMSResponse> {
    let message = '';

    switch (type) {
      case 'buy':
        message = `AfriTokeni: You bought ${btcAmount} BTC for ${localAmount.toLocaleString()} ${currency}. Check your wallet.`;
        break;
      case 'sell':
        message = `AfriTokeni: You sold ${btcAmount} BTC for ${localAmount.toLocaleString()} ${currency}. Funds added to balance.`;
        break;
      case 'received':
        message = `AfriTokeni: Received ${btcAmount} BTC (${localAmount.toLocaleString()} ${currency}). Transaction confirmed.`;
        break;
      case 'sent':
        message = `AfriTokeni: Sent ${btcAmount} BTC (${localAmount.toLocaleString()} ${currency}). Transaction confirmed.`;
        break;
    }

    return this.sendSMS({
      to: phoneNumber,
      message: message,
    });
  }

  /**
   * Format phone number to E.164 format (Pan-African)
   * Uses utility functions for proper country detection
   */
  static formatPhoneNumber(phone: string, defaultCountryCode?: string): string {
    // Import is at top of file
    const { formatPhoneNumber } = require('../utils/africanPhoneNumbers');
    return formatPhoneNumber(phone, defaultCountryCode);
  }

  /**
   * Validate phone number format (Pan-African)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const { isValidPhoneNumber } = require('../utils/africanPhoneNumbers');
    return isValidPhoneNumber(phone);
  }
  
  /**
   * Get currency from phone number
   */
  static getCurrencyFromPhone(phone: string): string | null {
    const { getCurrencyFromPhone } = require('../utils/africanPhoneNumbers');
    return getCurrencyFromPhone(phone);
  }
  
  /**
   * Check if phone has full SMS/USSD support
   */
  static hasFullSMSSupport(phone: string): boolean {
    const { hasFullSMSSupport } = require('../utils/africanPhoneNumbers');
    return hasFullSMSSupport(phone);
  }
}

// Singleton instance
let smsGatewayInstance: AfricasTalkingSMSGateway | null = null;

/**
 * Initialize SMS Gateway with environment variables
 */
export function initializeSMSGateway(): AfricasTalkingSMSGateway {
  if (!smsGatewayInstance) {
    const apiKey = import.meta.env.AT_API_KEY || process.env.AT_API_KEY || '';
    const username = import.meta.env.AT_USERNAME || process.env.AT_USERNAME || 'sandbox';
    const shortCode = import.meta.env.AT_SHORT_CODE || process.env.AT_SHORT_CODE;

    if (!apiKey) {
      console.warn('Africa\'s Talking API key not configured. SMS features will not work.');
    }

    smsGatewayInstance = new AfricasTalkingSMSGateway({
      apiKey,
      username,
      shortCode,
    });
  }

  return smsGatewayInstance;
}

/**
 * Get SMS Gateway instance
 */
export function getSMSGateway(): AfricasTalkingSMSGateway {
  if (!smsGatewayInstance) {
    return initializeSMSGateway();
  }
  return smsGatewayInstance;
}
