/**
 * Lightning Network Service
 * Handles instant Bitcoin transfers via Lightning Network
 * Uses OpenNode API for production-ready Lightning payments
 */

import { AfricanCurrency } from '../types/currency';
import { BitcoinService } from './bitcoinService';

export interface LightningInvoice {
  id: string;
  paymentRequest: string; // BOLT11 invoice
  amount: number; // satoshis
  amountBTC: number;
  amountLocal: number;
  currency: AfricanCurrency;
  description: string;
  expiresAt: Date;
  status: 'pending' | 'paid' | 'expired';
  qrCode?: string;
}

export interface LightningPayment {
  id: string;
  invoice: string;
  amount: number; // satoshis
  fee: number; // satoshis
  status: 'pending' | 'success' | 'failed';
  preimage?: string;
  timestamp: Date;
}

export class LightningService {
  private static readonly OPENNODE_API_URL = 'https://api.opennode.com/v1';
  private static readonly LIGHTNING_THRESHOLD_USD = 50; // Use Lightning for <$50
  
  /**
   * Check if amount should use Lightning Network
   * Lightning for small amounts (<$50), on-chain for large
   */
  static shouldUseLightning(amountUSD: number): boolean {
    return amountUSD < this.LIGHTNING_THRESHOLD_USD;
  }

  /**
   * Create Lightning invoice for receiving payment
   */
  static async createInvoice(data: {
    amount: number; // in local currency
    currency: AfricanCurrency;
    description: string;
    userId: string;
  }): Promise<LightningInvoice> {
    try {
      // Convert local currency to BTC
      const exchangeRate = await BitcoinService.getExchangeRate(data.currency);
      const amountBTC = data.amount * exchangeRate.localToBtc;
      const amountSats = Math.round(amountBTC * 100000000); // BTC to satoshis

      // In production, call OpenNode API
      const apiKey = process.env.OPENNODE_API_KEY;
      
      if (!apiKey) {
        // Development mode - generate mock invoice
        return this.generateMockInvoice(data, amountSats, amountBTC);
      }

      // Production: Call OpenNode API
      const response = await fetch(`${this.OPENNODE_API_URL}/charges`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountSats,
          currency: 'BTC',
          description: data.description,
          callback_url: `${process.env.WEBHOOK_URL}/webhooks/lightning/payment`,
          success_url: `${process.env.APP_URL}/payment/success`,
        }),
      });

      const result = await response.json();

      return {
        id: result.data.id,
        paymentRequest: result.data.lightning_invoice.payreq,
        amount: amountSats,
        amountBTC,
        amountLocal: data.amount,
        currency: data.currency,
        description: data.description,
        expiresAt: new Date(result.data.lightning_invoice.expires_at * 1000),
        status: 'pending',
        qrCode: this.generateQRCode(result.data.lightning_invoice.payreq),
      };
    } catch (error) {
      console.error('Error creating Lightning invoice:', error);
      throw new Error('Failed to create Lightning invoice');
    }
  }

  /**
   * Pay Lightning invoice
   */
  static async payInvoice(invoice: string, _userId: string): Promise<LightningPayment> {
    try {
      const apiKey = process.env.OPENNODE_API_KEY;

      if (!apiKey) {
        // Development mode - simulate payment
        return this.simulatePayment(invoice);
      }

      // Production: Call OpenNode API
      const response = await fetch(`${this.OPENNODE_API_URL}/withdrawals`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ln',
          address: invoice,
          callback_url: `${process.env.WEBHOOK_URL}/webhooks/lightning/withdrawal`,
        }),
      });

      const result = await response.json();

      return {
        id: result.data.id,
        invoice,
        amount: result.data.amount,
        fee: result.data.fee || 0,
        status: result.data.status === 'paid' ? 'success' : 'pending',
        preimage: result.data.preimage,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error paying Lightning invoice:', error);
      throw new Error('Failed to pay Lightning invoice');
    }
  }

  /**
   * Send Lightning payment to another user
   */
  static async sendToUser(data: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: AfricanCurrency;
  }): Promise<LightningPayment> {
    try {
      // Create invoice for recipient
      const invoice = await this.createInvoice({
        amount: data.amount,
        currency: data.currency,
        description: `Payment from user ${data.fromUserId}`,
        userId: data.toUserId,
      });

      // Pay invoice from sender
      const payment = await this.payInvoice(invoice.paymentRequest, data.fromUserId);

      return payment;
    } catch (error) {
      console.error('Error sending Lightning payment:', error);
      throw new Error('Failed to send Lightning payment');
    }
  }

  /**
   * Decode Lightning invoice to get details
   */
  static decodeInvoice(_invoice: string): {
    amount?: number;
    description?: string;
    expiresAt?: Date;
  } {
    try {
      // In production, use bolt11 library to decode
      // For now, return mock data
      return {
        amount: 10000, // satoshis
        description: 'AfriTokeni payment',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      };
    } catch (error) {
      console.error('Error decoding invoice:', error);
      return {};
    }
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(paymentId: string): Promise<'pending' | 'paid' | 'expired' | 'failed'> {
    try {
      const apiKey = process.env.OPENNODE_API_KEY;

      if (!apiKey) {
        // Development mode
        return 'paid';
      }

      const response = await fetch(`${this.OPENNODE_API_URL}/charge/${paymentId}`, {
        headers: {
          'Authorization': apiKey,
        },
      });

      const result = await response.json();
      return result.data.status;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return 'failed';
    }
  }

  /**
   * Generate QR code for Lightning invoice
   */
  private static generateQRCode(invoice: string): string {
    // In production, use qrcode library
    // For now, return data URL that can be used with QR code generator
    return `lightning:${invoice}`;
  }

  /**
   * Generate mock invoice for development
   */
  private static generateMockInvoice(
    data: { amount: number; currency: AfricanCurrency; description: string; userId: string },
    amountSats: number,
    amountBTC: number
  ): LightningInvoice {
    const mockInvoice = `lnbc${amountSats}n1p${Math.random().toString(36).substring(7)}`;
    
    return {
      id: `mock_${Date.now()}`,
      paymentRequest: mockInvoice,
      amount: amountSats,
      amountBTC,
      amountLocal: data.amount,
      currency: data.currency,
      description: data.description,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      status: 'pending',
      qrCode: `lightning:${mockInvoice}`,
    };
  }

  /**
   * Simulate payment for development
   */
  private static simulatePayment(invoice: string): LightningPayment {
    return {
      id: `payment_${Date.now()}`,
      invoice,
      amount: 10000, // satoshis
      fee: 1, // ~0.01% fee
      status: 'success',
      preimage: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
  }

  /**
   * Calculate Lightning fee (typically <1 sat or 0.01%)
   */
  static calculateLightningFee(amountSats: number): number {
    // Lightning fees are typically 1 sat base + 0.01% of amount
    const baseFee = 1;
    const percentFee = Math.ceil(amountSats * 0.0001); // 0.01%
    return baseFee + percentFee;
  }

  /**
   * Get Lightning Network statistics
   */
  static async getNetworkStats(): Promise<{
    capacity: number;
    channels: number;
    avgFee: number;
  }> {
    // In production, fetch from Lightning Network explorers
    return {
      capacity: 5000, // BTC
      channels: 80000,
      avgFee: 0.000001, // BTC (~$0.001)
    };
  }
}
