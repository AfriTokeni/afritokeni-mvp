/**
 * Bitcoin Routing Service
 * Intelligent routing between Lightning Network and on-chain Bitcoin
 * Optimizes for speed and cost based on transaction amount
 */

import { LightningService } from './lightningService';
import { BitcoinService } from './bitcoinService';
import { AfricanCurrency } from '../types/currency';

export interface RoutingDecision {
  method: 'lightning' | 'onchain';
  reason: string;
  estimatedFee: number;
  estimatedTime: string;
  feePercentage: number;
}

export interface BitcoinTransfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: AfricanCurrency;
  method: 'lightning' | 'onchain';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fee: number;
  txHash?: string;
  invoice?: string;
  timestamp: Date;
  completedAt?: Date;
}

export class BitcoinRoutingService {
  // Thresholds in USD
  private static readonly LIGHTNING_MAX_USD = 50;
  private static readonly LIGHTNING_MIN_USD = 0.01; // ~1 cent minimum

  /**
   * Decide routing method based on amount and conditions
   */
  static async decideRouting(data: {
    amount: number;
    currency: AfricanCurrency;
    urgency?: 'instant' | 'standard' | 'economy';
  }): Promise<RoutingDecision> {
    try {
      // Convert to USD for comparison
      const exchangeRate = await BitcoinService.getExchangeRate(data.currency);
      // Approximate USD conversion (1 USD ≈ exchange rate varies by currency)
      const amountUSD = data.amount * exchangeRate.localToBtc * 50000; // Rough BTC to USD

      // Too small for Lightning (dust limit)
      if (amountUSD < this.LIGHTNING_MIN_USD) {
        return {
          method: 'onchain',
          reason: 'Amount too small for Lightning Network',
          estimatedFee: 0.0001, // BTC
          estimatedTime: '10-60 minutes',
          feePercentage: 0.1,
        };
      }

      // Perfect for Lightning
      if (amountUSD < this.LIGHTNING_MAX_USD) {
        const lightningFee = LightningService.calculateLightningFee(
          Math.round(data.amount * exchangeRate.localToBtc * 100000000)
        );

        return {
          method: 'lightning',
          reason: `Optimal for Lightning (<$${this.LIGHTNING_MAX_USD})`,
          estimatedFee: lightningFee / 100000000, // satoshis to BTC
          estimatedTime: '< 1 second',
          feePercentage: 0.01, // ~0.01%
        };
      }

      // Large amount - use on-chain for security
      const onchainFee = await this.estimateOnchainFee();
      
      return {
        method: 'onchain',
        reason: `Large amount (>$${this.LIGHTNING_MAX_USD}) - on-chain for security`,
        estimatedFee: onchainFee,
        estimatedTime: data.urgency === 'instant' ? '10 minutes' : '30-60 minutes',
        feePercentage: 0.5,
      };
    } catch (error) {
      console.error('Error deciding routing:', error);
      // Default to on-chain if routing decision fails
      return {
        method: 'onchain',
        reason: 'Fallback to on-chain',
        estimatedFee: 0.0001,
        estimatedTime: '30-60 minutes',
        feePercentage: 0.5,
      };
    }
  }

  /**
   * Execute Bitcoin transfer with automatic routing
   */
  static async executeTransfer(data: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: AfricanCurrency;
    urgency?: 'instant' | 'standard' | 'economy';
  }): Promise<BitcoinTransfer> {
    try {
      // Decide routing method
      const routing = await this.decideRouting({
        amount: data.amount,
        currency: data.currency,
        urgency: data.urgency,
      });

      console.log(`🔀 Routing decision: ${routing.method} - ${routing.reason}`);

      const transfer: BitcoinTransfer = {
        id: `transfer_${Date.now()}`,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        amount: data.amount,
        currency: data.currency,
        method: routing.method,
        status: 'processing',
        fee: routing.estimatedFee,
        timestamp: new Date(),
      };

      if (routing.method === 'lightning') {
        // Execute Lightning payment
        const payment = await LightningService.sendToUser({
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          amount: data.amount,
          currency: data.currency,
        });

        transfer.invoice = payment.invoice;
        transfer.status = payment.status === 'success' ? 'completed' : 'failed';
        transfer.completedAt = payment.status === 'success' ? new Date() : undefined;
        transfer.fee = payment.fee / 100000000; // satoshis to BTC
      } else {
        // Execute on-chain transaction
        const exchangeRate = await BitcoinService.getExchangeRate(data.currency);
        const amountBTC = data.amount * exchangeRate.localToBtc;
        const amountSats = Math.round(amountBTC * 100000000);

        // In production, this would create actual Bitcoin transaction
        // For now, simulate
        transfer.txHash = `mock_tx_${Math.random().toString(36).substring(7)}`;
        transfer.status = 'completed';
        transfer.completedAt = new Date();
        
        // Log for debugging
        console.log(`On-chain transfer: ${amountSats} sats`);
      }

      return transfer;
    } catch (error) {
      console.error('Error executing transfer:', error);
      throw new Error('Failed to execute Bitcoin transfer');
    }
  }

  /**
   * Get transfer status
   */
  static async getTransferStatus(_transferId: string): Promise<BitcoinTransfer['status']> {
    // In production, check actual payment status
    return 'completed';
  }

  /**
   * Estimate on-chain fee
   */
  private static async estimateOnchainFee(): Promise<number> {
    try {
      // In production, fetch from Bitcoin fee estimation API
      // For now, return average fee
      return 0.0001; // BTC (~$10 at current prices)
    } catch (error) {
      return 0.0001; // Default fee
    }
  }

  /**
   * Get routing statistics
   */
  static async getRoutingStats(): Promise<{
    lightningTransfers: number;
    onchainTransfers: number;
    avgLightningFee: number;
    avgOnchainFee: number;
    totalSaved: number;
  }> {
    // In production, fetch from database
    return {
      lightningTransfers: 1250,
      onchainTransfers: 48,
      avgLightningFee: 0.000001, // BTC
      avgOnchainFee: 0.0001, // BTC
      totalSaved: 0.012, // BTC saved by using Lightning
    };
  }

  /**
   * Recommend routing method to user
   */
  static async getRecommendation(data: {
    amount: number;
    currency: AfricanCurrency;
  }): Promise<{
    recommended: 'lightning' | 'onchain';
    lightningOption: RoutingDecision;
    onchainOption: RoutingDecision;
  }> {
    const routing = await this.decideRouting(data);
    
    // Get both options for comparison
    const lightningFee = LightningService.calculateLightningFee(10000); // Mock amount
    const onchainFee = await this.estimateOnchainFee();

    return {
      recommended: routing.method,
      lightningOption: {
        method: 'lightning',
        reason: 'Instant transfer with minimal fees',
        estimatedFee: lightningFee / 100000000,
        estimatedTime: '< 1 second',
        feePercentage: 0.01,
      },
      onchainOption: {
        method: 'onchain',
        reason: 'Traditional Bitcoin transaction',
        estimatedFee: onchainFee,
        estimatedTime: '10-60 minutes',
        feePercentage: 0.5,
      },
    };
  }
}
