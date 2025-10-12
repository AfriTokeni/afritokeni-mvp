/**
 * ckBTC Service for AfriTokeni
 * 
 * ICP-NATIVE Bitcoin integration using ckBTC
 * - Instant transfers (sub-second, <$0.01 fees)
 * - No external APIs (BlockCypher, bitcoinjs-lib removed)
 * - Direct ICP canister calls
 * - Lightning-like performance without Lightning complexity
 * - Supports both Web and SMS/USSD operations
 */

// import { Principal } from '@dfinity/principal'; // Use when connecting to real ICP canisters
import { nanoid } from 'nanoid';
import { getDoc, listDocs, setDoc } from '@junobuild/core';
import { SatelliteOptions } from '@junobuild/core';
import { AnonymousIdentity } from '@dfinity/agent';
import {
  CkBTCConfig,
  CkBTCBalance,
  CkBTCDepositRequest,
  CkBTCDepositResponse,
  CkBTCWithdrawalRequest,
  CkBTCWithdrawalResponse,
  CkBTCTransferRequest,
  CkBTCTransferResponse,
  CkBTCExchangeRequest,
  CkBTCExchangeResponse,
  BitcoinExchangeRate,
  CkBTCTransaction,
  CkBTCTransactionStatus,
  BitcoinDepositAddress,
  CKBTC_CONSTANTS,
  CKBTC_TESTNET_CONFIG,
  CkBTCUtils,
} from '../types/ckbtc.js';

export class CkBTCService {
  private static config: CkBTCConfig = CKBTC_TESTNET_CONFIG;
  
  // Default satellite configuration for SMS/USSD operations
  private static defaultSatellite: SatelliteOptions = {
    identity: new AnonymousIdentity(),
    satelliteId: "uxrrr-q7777-77774-qaaaq-cai",
    container: true
  };

  /**
   * Initialize ckBTC service with configuration
   */
  static initialize(config: Partial<CkBTCConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  static getConfig(): CkBTCConfig {
    return this.config;
  }

  /**
   * Get satellite configuration for Juno operations
   * Returns satellite config for SMS/USSD operations, undefined for web operations
   */
  private static getSatelliteConfig(useSatellite?: boolean): SatelliteOptions | undefined {
    return useSatellite ? this.defaultSatellite : undefined;
  }

  // ==================== BALANCE OPERATIONS ====================

  /**
   * Get ckBTC balance for a user
   * Calculates balance from completed transactions in Juno datastore
   * @param principalId - User's principal ID
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getBalance(principalId: string, useSatellite?: boolean): Promise<CkBTCBalance> {
    try {
      // ICP ledger canister integration (production)
      // const principal = Principal.fromText(principalId);
      // const ledgerActor = await this.getLedgerActor();
      // const balance = await ledgerActor.icrc1_balance_of({
      //   owner: principal,
      //   subaccount: []
      // });

      // Calculate balance from transaction history in Juno datastore
      const transactions = await this.getTransactionHistory(principalId, useSatellite);
      let balanceSatoshis = 0;

      // Process completed transactions to calculate balance
      for (const tx of transactions) {
        if (tx.status !== 'completed') {
          continue; // Only count completed transactions
        }

        switch (tx.type) {
          case 'deposit':
            // Deposits add to balance
            balanceSatoshis += tx.amountSatoshis;
            break;
          
          case 'withdrawal':
            // Withdrawals subtract from balance (including fees)
            balanceSatoshis -= (tx.amountSatoshis + tx.feeSatoshis);
            break;
          
          case 'transfer':
            // Legacy transfer handling - check if user is sender or recipient
            if (tx.userId === principalId) {
              // User is sender - subtract amount and fees
              balanceSatoshis -= (tx.amountSatoshis + tx.feeSatoshis);
            } else if (tx.recipient === principalId) {
              // User is recipient - add amount (no fees for recipient)
              balanceSatoshis += tx.amountSatoshis;
            }
            break;
          
          case 'transfer_out':
            // User sent ckBTC - amount is already negative, fees are additional deduction
            balanceSatoshis += tx.amountSatoshis; // Add negative amount (subtract)
            balanceSatoshis -= tx.feeSatoshis;   // Subtract fees
            break;
          
          case 'transfer_in':
            // User received ckBTC - amount is positive, no fees for recipient
            balanceSatoshis += tx.amountSatoshis;
            break;
          
          case 'exchange_buy':
            // User bought ckBTC - add to balance (minus fees)
            balanceSatoshis += (tx.amountSatoshis - tx.feeSatoshis);
            break;
          
          case 'exchange_sell':
            // User sold ckBTC - subtract from balance (including fees)
            balanceSatoshis -= (tx.amountSatoshis + tx.feeSatoshis);
            break;
        }
      }

      // Ensure balance doesn't go negative
      balanceSatoshis = Math.max(0, balanceSatoshis);
      
      return {
        balanceSatoshis,
        balanceBTC: CkBTCUtils.formatBTC(balanceSatoshis),
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching ckBTC balance:', error);
      throw new Error('Failed to fetch ckBTC balance');
    }
  }

  /**
   * Get ckBTC balance with local currency equivalent
   * @param principalId - User's principal ID
   * @param currency - Local currency code
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getBalanceWithLocalCurrency(
    principalId: string,
    currency: string,
    useSatellite?: boolean
  ): Promise<CkBTCBalance> {
    const balance = await this.getBalance(principalId, useSatellite);
    const exchangeRate = await this.getExchangeRate(currency);
    
    const btcAmount = CkBTCUtils.satoshisToBTC(balance.balanceSatoshis);
    const localCurrencyEquivalent = btcAmount * exchangeRate.rate;

    return {
      ...balance,
      localCurrencyEquivalent,
      localCurrency: currency,
    };
  }

  // ==================== DEPOSIT OPERATIONS (BTC → ckBTC) ====================

  /**
   * Get Bitcoin deposit address for user
   * ICP minter canister generates unique BTC address per user
   * @param request - Deposit request with principal ID and optional subaccount
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getDepositAddress(
    request: CkBTCDepositRequest,
    useSatellite?: boolean
  ): Promise<CkBTCDepositResponse> {
    try {
      // ICP minter canister integration (production)
      // const principal = Principal.fromText(request.principalId);
      // const minterActor = await this.getMinterActor();
      // const result = await minterActor.get_btc_address({
      //   owner: principal,
      //   subaccount: request.subaccount
      // });

      // Mock implementation - generate deterministic address
      const mockAddress = this.generateMockBitcoinAddress(request.principalId);

      // Store deposit address information if using satellite (SMS/USSD)
      if (useSatellite) {
        const satellite = this.getSatelliteConfig(useSatellite);
        const depositAddressDoc = {
          principalId: request.principalId,
          address: mockAddress,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        };

        await setDoc({
          collection: 'ckbtc_deposit_addresses',
          doc: {
            key: `addr_${request.principalId}`,
            data: depositAddressDoc,
            version: 1n
          },
          satellite
        });
      }

      return {
        success: true,
        depositAddress: mockAddress,
        minConfirmations: this.config.minConfirmations,
      };
    } catch (error: unknown) {
      console.error('Error getting deposit address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deposit address',
      };
    }
  }

  /**
   * Check deposit status
   * ICP minter automatically mints ckBTC when BTC is received
   * @param btcTxId - Bitcoin transaction ID to check
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async checkDepositStatus(btcTxId: string, useSatellite?: boolean): Promise<CkBTCTransaction | null> {
    try {
      // ICP minter canister status check (production)
      // const minterActor = await this.getMinterActor();
      // const status = await minterActor.get_deposit_status(btcTxId);

      // Mock implementation - for SMS/USSD, check stored deposits
      if (useSatellite) {
        const satellite = this.getSatelliteConfig(useSatellite);
        const results = await listDocs({
          collection: 'ckbtc_transactions',
          satellite
        });

        const depositTransaction = results.items.find(item => {
          const txData = item.data as CkBTCTransaction;
          return txData.btcTxId === btcTxId && txData.type === 'deposit';
        });

        if (depositTransaction) {
          const data = depositTransaction.data as CkBTCTransaction;
          return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          };
        }
      }

      // Mock implementation for web users
      return null;
    } catch (error) {
      console.error('Error checking deposit status:', error);
      return null;
    }
  }

  // ==================== WITHDRAWAL OPERATIONS (ckBTC → BTC) ====================

  /**
   * Withdraw ckBTC to Bitcoin address
   * ICP minter burns ckBTC and sends real BTC
   * @param request - Withdrawal request with principal ID, amount, and Bitcoin address
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async withdraw(
    request: CkBTCWithdrawalRequest,
    useSatellite?: boolean
  ): Promise<CkBTCWithdrawalResponse> {
    try {
      // Validate amount
      if (request.amountSatoshis < CKBTC_CONSTANTS.MIN_WITHDRAWAL_SATOSHIS) {
        throw new Error(
          `Minimum withdrawal is ${CkBTCUtils.formatBTC(CKBTC_CONSTANTS.MIN_WITHDRAWAL_SATOSHIS)} BTC`
        );
      }

      // Validate Bitcoin address
      if (!CkBTCUtils.isValidBitcoinAddress(request.btcAddress)) {
        throw new Error('Invalid Bitcoin address');
      }

      // ICP minter canister withdrawal (production)
      // const principal = Principal.fromText(request.principalId);
      // const minterActor = await this.getMinterActor();
      // const result = await minterActor.retrieve_btc({
      //   address: request.btcAddress,
      //   amount: request.amountSatoshis
      // });

      // Mock implementation
      const transactionId = nanoid();
      const mockFeeSatoshis = 1000; // ~$1 at $100k BTC

      // Store withdrawal transaction if using satellite (SMS/USSD)
      if (useSatellite) {
        const satellite = this.getSatelliteConfig(useSatellite);
        const withdrawalDoc = {
          id: transactionId,
          userId: request.principalId,
          type: 'withdrawal',
          amountSatoshis: request.amountSatoshis,
          btcAddress: request.btcAddress,
          feeSatoshis: mockFeeSatoshis,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc({
          collection: 'ckbtc_transactions',
          doc: {
            key: transactionId,
            data: withdrawalDoc,
            version: 1n
          },
          satellite
        });
      }

      return {
        success: true,
        transactionId,
        feeSatoshis: mockFeeSatoshis,
        estimatedConfirmationTime: 60, // ~1 hour for Bitcoin confirmations
      };
    } catch (error: unknown) {
      console.error('Error withdrawing ckBTC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to withdraw ckBTC',
      };
    }
  }

  // ==================== TRANSFER OPERATIONS (ckBTC → ckBTC, INSTANT!) ====================

  /**
   * Transfer ckBTC between ICP users (INSTANT, <$0.01 fee)
   * This is the killer feature - Lightning-like speed without Lightning!
   * @param request - Transfer request with sender, recipient, and amount
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async transfer(
    request: CkBTCTransferRequest,
    useSatellite?: boolean
  ): Promise<CkBTCTransferResponse> {
    try {
      // Validate amount
      if (request.amountSatoshis < CKBTC_CONSTANTS.MIN_TRANSFER_SATOSHIS) {
        throw new Error(
          `Minimum transfer is ${CkBTCUtils.formatBTC(CKBTC_CONSTANTS.MIN_TRANSFER_SATOSHIS)} BTC`
        );
      }

      // ICP ICRC-1 transfer via ledger canister (production)
      // const senderPrincipal = Principal.fromText(request.senderId);
      // const recipientPrincipal = Principal.fromText(request.recipient);
      // const ledgerActor = await this.getLedgerActor();
      // const result = await ledgerActor.icrc1_transfer({
      //   from_subaccount: [],
      //   to: { owner: recipientPrincipal, subaccount: [] },
      //   amount: request.amountSatoshis,
      //   fee: [CKBTC_CONSTANTS.TRANSFER_FEE_SATOSHIS],
      //   memo: request.memo ? new TextEncoder().encode(request.memo) : [],
      //   created_at_time: []
      // });

      // Mock implementation
      const transactionId = nanoid();

      // Store transfer transaction if using satellite (SMS/USSD)
      if (useSatellite) {
        const satellite = this.getSatelliteConfig(useSatellite);
        const baseTransactionData = {
          feeSatoshis: CKBTC_CONSTANTS.TRANSFER_FEE_SATOSHIS,
          status: 'completed',
          memo: request.memo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Create sender transaction (debit)
        const senderTransferDoc = {
          id: transactionId,
          userId: request.senderId,
          type: 'transfer_out',
          amountSatoshis: -request.amountSatoshis, // Negative amount for sender (debit)
          recipient: request.recipient,
          ...baseTransactionData,
        };

        // Create recipient transaction (credit)
        const recipientTransactionId = `${transactionId}_recv`;
        const recipientTransferDoc = {
          id: recipientTransactionId,
          userId: request.recipient,
          type: 'transfer_in',
          amountSatoshis: request.amountSatoshis, // Positive amount for recipient (credit)
          sender: request.senderId,
          ...baseTransactionData,
        };

        // Store both transactions
        await Promise.all([
          setDoc({
            collection: 'ckbtc_transactions',
            doc: {
              key: transactionId,
              data: senderTransferDoc,
              version: 1n
            },
            satellite
          }),
          setDoc({
            collection: 'ckbtc_transactions',
            doc: {
              key: recipientTransactionId,
              data: recipientTransferDoc,
              version: 1n
            },
            satellite
          })
        ]);
      }

      return {
        success: true,
        transactionId,
        feeSatoshis: CKBTC_CONSTANTS.TRANSFER_FEE_SATOSHIS,
      };
    } catch (error: unknown) {
      console.error('Error transferring ckBTC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transfer ckBTC',
        feeSatoshis: 0,
      };
    }
  }

  // ==================== EXCHANGE OPERATIONS (via agents) ====================

  /**
   * Exchange ckBTC with local currency via agent
   * @param request - Exchange request with type, amount, currency, and agent info
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async exchange(
    request: CkBTCExchangeRequest,
    useSatellite?: boolean
  ): Promise<CkBTCExchangeResponse> {
    try {
      // Get exchange rate
      const exchangeRate = await this.getExchangeRate(request.currency);
      
      // Calculate amounts based on type
      let amountSatoshis: number;
      let localCurrencyAmount: number;
      
      if (request.type === 'buy') {
        // User buying ckBTC with local currency
        localCurrencyAmount = request.amount;
        const btcAmount = localCurrencyAmount / exchangeRate.rate;
        amountSatoshis = CkBTCUtils.btcToSatoshis(btcAmount);
      } else {
        // User selling ckBTC for local currency
        amountSatoshis = request.amount;
        const btcAmount = CkBTCUtils.satoshisToBTC(amountSatoshis);
        localCurrencyAmount = btcAmount * exchangeRate.rate;
      }

      // Calculate fee (2% default, can be dynamic based on location)
      const feePercentage = CKBTC_CONSTANTS.DEFAULT_EXCHANGE_FEE;
      const feeSatoshis = Math.round(amountSatoshis * feePercentage);
      const agentCommission = (feeSatoshis / CKBTC_CONSTANTS.SATOSHIS_PER_BTC) * exchangeRate.rate * 0.8;

      // Generate exchange code for in-person verification
      const exchangeCode = `BTC-${nanoid(6).toUpperCase()}`;
      const transactionId = nanoid();

      // Store exchange transaction if using satellite (SMS/USSD)
      if (useSatellite) {
        const satellite = this.getSatelliteConfig(useSatellite);
        const exchangeDoc = {
          id: transactionId,
          userId: request.userId,
          type: request.type === 'buy' ? 'exchange_buy' : 'exchange_sell',
          exchangeType: request.type,
          amountSatoshis,
          localCurrencyAmount,
          currency: request.currency,
          exchangeRate: exchangeRate.rate,
          feeSatoshis,
          agentId: request.agentId,
          exchangeCode,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc({
          collection: 'ckbtc_transactions',
          doc: {
            key: transactionId,
            data: exchangeDoc,
            version: 1n
          },
          satellite
        });
      }

      return {
        success: true,
        transactionId,
        exchangeRate: exchangeRate.rate,
        amountSatoshis,
        amountBTC: CkBTCUtils.satoshisToBTC(amountSatoshis),
        localCurrencyAmount,
        feeSatoshis,
        feePercentage,
        agentCommission,
        exchangeCode,
      };
    } catch (error: unknown) {
      console.error('Error exchanging ckBTC:', error);
      return {
        success: false,
        exchangeRate: 0,
        amountSatoshis: 0,
        amountBTC: 0,
        localCurrencyAmount: 0,
        feeSatoshis: 0,
        feePercentage: 0,
        agentCommission: 0,
        error: error instanceof Error ? error.message : 'Failed to exchange ckBTC',
      };
    }
  }

  // ==================== EXCHANGE RATE OPERATIONS ====================

  /**
   * Get Bitcoin exchange rate for a currency
   * Uses real-time price feeds (CoinGecko, Coinbase, etc.)
   */
  static async getExchangeRate(currency: string): Promise<BitcoinExchangeRate> {
    try {
      const currencyUpper = currency.toUpperCase();
      
      // Use Coinbase API (no CORS, no rate limits for public data)
      const btcResponse = await fetch(
        'https://api.coinbase.com/v2/exchange-rates?currency=BTC'
      );
      
      if (!btcResponse.ok) {
        throw new Error('Failed to fetch BTC exchange rates');
      }
      
      const btcData = await btcResponse.json();
      const btcToLocalRate = btcData.data?.rates?.[currencyUpper];
      
      if (!btcToLocalRate) {
        // If currency not directly available, calculate via USD
        const btcToUsd = btcData.data?.rates?.['USD'];
        if (!btcToUsd) {
          throw new Error('BTC/USD rate not available');
        }
        
        // Get USD to local currency rate
        const fxResponse = await fetch(
          `https://api.exchangerate-api.com/v4/latest/USD`
        );
        
        if (!fxResponse.ok) {
          throw new Error('Failed to fetch forex rates');
        }
        
        const fxData = await fxResponse.json();
        const usdToLocal = fxData.rates[currencyUpper];
        
        if (!usdToLocal) {
          throw new Error(`Exchange rate not available for ${currency}`);
        }
        
        const calculatedRate = parseFloat(btcToUsd) * usdToLocal;
        
        return {
          currency,
          rate: calculatedRate,
          lastUpdated: new Date(),
          source: 'coinbase+exchangerate-api',
        };
      }

      return {
        currency,
        rate: parseFloat(btcToLocalRate),
        lastUpdated: new Date(),
        source: 'coinbase',
      };
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  }

  /**
   * Get exchange rates for multiple currencies
   */
  static async getExchangeRates(currencies: string[]): Promise<BitcoinExchangeRate[]> {
    const rates = await Promise.all(
      currencies.map(currency => this.getExchangeRate(currency))
    );
    return rates;
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Generate mock Bitcoin address for testing
   * In production, this comes from ICP minter canister
   */
  private static generateMockBitcoinAddress(principalId: string): string {
    // Generate deterministic testnet address based on principal
    const hash = principalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const suffix = hash.toString(36).substring(0, 8);
    return `tb1q${suffix}${'x'.repeat(32 - suffix.length)}`;
  }

  /**
   * Get transaction by ID
   * @param transactionId - Transaction ID to look up
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getTransaction(transactionId: string, useSatellite?: boolean): Promise<CkBTCTransaction | null> {
    try {
      const satellite = this.getSatelliteConfig(useSatellite);
      const result = await getDoc({
        collection: 'ckbtc_transactions',
        key: transactionId,
        satellite
      });

      if (!result) return null;

      const data = result.data as CkBTCTransaction;
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Get user's transaction history
   * @param userId - User ID to get transactions for
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getTransactionHistory(userId: string, useSatellite?: boolean): Promise<CkBTCTransaction[]> {
    try {
      const satellite = this.getSatelliteConfig(useSatellite);
      const results = await listDocs({
        collection: 'ckbtc_transactions',
        filter: {
          order: {
            desc: true,
            field: 'created_at'
          }
        },
        satellite
      });

      return results.items
        .filter((item) => (item.data as CkBTCTransaction).userId === userId)
        .map((item) => {
          const data = item.data as CkBTCTransaction;
          return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          };
        });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get Bitcoin deposit address info
   * @param principalId - User's principal ID
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getDepositAddressInfo(
    principalId: string,
    useSatellite?: boolean
  ): Promise<BitcoinDepositAddress | null> {
    try {
      const response = await this.getDepositAddress({ principalId }, useSatellite);
      if (!response.success || !response.depositAddress) {
        return null;
      }

      return {
        address: response.depositAddress,
        principalId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
    } catch (error) {
      console.error('Error getting deposit address info:', error);
      return null;
    }
  }

  /**
   * Store a ckBTC transaction in the datastore
   * @param transaction - Transaction data to store
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async storeTransaction(transaction: CkBTCTransaction, useSatellite?: boolean): Promise<boolean> {
    try {
      const satellite = this.getSatelliteConfig(useSatellite);
      const transactionDoc = {
        ...transaction,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      };

      await setDoc({
        collection: 'ckbtc_transactions',
        doc: {
          key: transaction.id,
          data: transactionDoc,
          version: 1n
        },
        satellite
      });

      console.log(`✅ ckBTC transaction ${transaction.id} stored successfully`);
      return true;
    } catch (error) {
      console.error('Error storing ckBTC transaction:', error);
      return false;
    }
  }

  /**
   * Update transaction status
   * @param transactionId - Transaction ID to update
   * @param status - New status
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async updateTransactionStatus(
    transactionId: string, 
    status: CkBTCTransactionStatus, 
    useSatellite?: boolean
  ): Promise<boolean> {
    try {
      const satellite = this.getSatelliteConfig(useSatellite);
      const existingDoc = await getDoc({
        collection: 'ckbtc_transactions',
        key: transactionId,
        satellite
      });

      if (!existingDoc) {
        console.error(`Transaction ${transactionId} not found`);
        return false;
      }

      const updatedData = {
        ...existingDoc.data,
        status,
        updatedAt: new Date().toISOString()
      };

      await setDoc({
        collection: 'ckbtc_transactions',
        doc: {
          key: transactionId,
          data: updatedData,
          version: existingDoc.version || 1n
        },
        satellite
      });

      console.log(`✅ Transaction ${transactionId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return false;
    }
  }

  /**
   * Get pending transactions for a user (useful for SMS/USSD operations)
   * @param userId - User ID to get pending transactions for
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getPendingTransactions(userId: string, useSatellite?: boolean): Promise<CkBTCTransaction[]> {
    try {
      const allTransactions = await this.getTransactionHistory(userId, useSatellite);
      return allTransactions.filter(tx => tx.status === 'pending');
    } catch (error) {
      console.error('Error getting pending transactions:', error);
      return [];
    }
  }

  /**
   * Get exchange requests for a specific agent
   * @param agentId - Agent ID to get exchange requests for
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async getAgentExchangeRequests(agentId?: string, useSatellite?: boolean): Promise<CkBTCTransaction[]> {
    try {
      if (!agentId) {
        console.log('No agent ID provided, returning empty array');
        return [];
      }

      const satellite = this.getSatelliteConfig(useSatellite);
      const results = await listDocs({
        collection: 'ckbtc_transactions',
        filter: {
          order: {
            desc: true,
            field: 'created_at'
          }
        },
        satellite
      });

      // Filter transactions for this agent that are exchanges
      const agentExchanges = results.items
        .map((item) => {
          const data = item.data as CkBTCTransaction;
          return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          };
        })
        .filter((tx) => 
          tx.agentId === agentId && 
          (tx.type === 'exchange_buy' || tx.type === 'exchange_sell')
        );

      return agentExchanges;
    } catch (error) {
      console.error('Error getting agent exchange requests:', error);
      return [];
    }
  }

  /**
   * Format raw exchange transactions for agent interface display
   * @param exchanges - Raw exchange transactions from getAgentExchangeRequests
   */
  static formatExchangeRequestsForAgent(
    exchanges: CkBTCTransaction[]
  ): Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    type: 'buy' | 'sell';
    amount: number;
    currency: string;
    bitcoinAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: Date;
    location?: string;
    exchangeRate?: number;
    agentFee?: number;
  }> {
    try {
      // Transform to match the expected format without user data lookups
      const formattedRequests = exchanges.map((tx) => {
        // Use userId as fallback for customer identification
        // The actual user data fetching should be handled by the calling component
        const customerName = 'Customer'; // Will be populated by calling component
        const customerPhone = tx.userId; // Use userId as identifier
        
        return {
          id: tx.id,
          customerName,
          customerPhone: this.formatPhoneNumber(customerPhone),
          type: tx.type === 'exchange_buy' ? 'buy' as const : 'sell' as const,
          amount: tx.localCurrencyAmount || 0,
          currency: tx.currency || tx.localCurrency || 'UGX',
          bitcoinAmount: CkBTCUtils.satoshisToBTC(tx.amountSatoshis),
          status: tx.status as 'pending' | 'processing' | 'completed' | 'cancelled',
          createdAt: tx.createdAt,
          location: undefined, // Could be added from user data if available
          exchangeRate: tx.exchangeRate,
          agentFee: tx.feeSatoshis && tx.exchangeRate ? 
            (CkBTCUtils.satoshisToBTC(tx.feeSatoshis) * tx.exchangeRate * 0.8) : undefined
        };
      });

      return formattedRequests;
    } catch (error) {
      console.error('Error formatting exchange requests:', error);
      return [];
    }
  }

  /**
   * Update transaction status for agent interface compatibility
   * @param transactionId - Transaction ID to update
   * @param status - New status
   * @param agentId - Agent ID (for logging/validation, currently unused)
   * @param useSatellite - Whether to use satellite configuration (true for SMS/USSD, false for web)
   */
  static async updateExchangeTransactionStatus(
    transactionId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'failed',
    agentId?: string,
    useSatellite?: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Map status to CkBTCTransactionStatus
      let ckBTCStatus: CkBTCTransactionStatus;
      switch (status) {
        case 'completed':
          ckBTCStatus = 'completed';
          break;
        case 'failed':
          ckBTCStatus = 'failed';
          break;
        case 'confirmed':
          ckBTCStatus = 'confirming';
          break;
        case 'pending':
        default:
          ckBTCStatus = 'pending';
          break;
      }

      const success = await this.updateTransactionStatus(transactionId, ckBTCStatus, useSatellite);
      
      if (success) {
        console.log(`✅ Transaction ${transactionId} status updated to ${status} by agent ${agentId || 'unknown'}`);
        return {
          success: true,
          message: `Transaction status updated to ${status}`
        };
      } else {
        return {
          success: false,
          message: 'Failed to update transaction status'
        };
      }
    } catch (error) {
      console.error('Error updating exchange transaction status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update transaction status'
      };
    }
  }

  /**
   * Helper method to determine if a string is a phone number
   * Phone numbers typically start with + and contain only digits and some special characters
   */
  private static isPhoneNumber(identifier: string): boolean {
    // Check if it looks like a phone number (starts with + or contains only digits)
    const phonePattern = /^(\+)?[0-9\s\-()]+$/;
    return phonePattern.test(identifier) && identifier.length >= 10;
  }

  /**
   * Helper method to format phone numbers for display
   */
  private static formatPhoneNumber(phone: string): string {
    if (!phone || phone === 'Unknown' || phone === 'Web User') {
      return phone;
    }
    
    // If it's already a formatted phone number, return as is
    if (this.isPhoneNumber(phone)) {
      // Ensure it starts with + for international format
      if (!phone.startsWith('+')) {
        // Assume it's a Ugandan number if it doesn't have country code
        if (phone.startsWith('256')) {
          return `+${phone}`;
        } else if (phone.length === 9) {
          return `+256${phone}`;
        } else {
          return `+${phone}`;
        }
      }
      return phone;
    }
    
    // If it's an email or other identifier, return as is
    return phone;
  }

}
