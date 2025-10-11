/**
 * ckUSDC Service for AfriTokeni
 * 
 * Handles all ckUSDC operations:
 * - Deposits (USDC → ckUSDC via Ethereum bridge)
 * - Withdrawals (ckUSDC → USDC)
 * - Transfers (ckUSDC between ICP users)
 * - Balance queries
 * - Exchange rate fetching
 */

import { ethers } from 'ethers';
import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import { nanoid } from 'nanoid';
import {
  CkUSDCConfig,
  CkUSDCBalance,
  CkUSDCDepositRequest,
  CkUSDCDepositResponse,
  CkUSDCWithdrawalRequest,
  CkUSDCWithdrawalResponse,
  CkUSDCTransferRequest,
  CkUSDCTransferResponse,
  CkUSDCExchangeRequest,
  CkUSDCExchangeResponse,
  CkUSDCExchangeRate,
  CkUSDCTransaction,
  ERC20_APPROVE_ABI,
  HELPER_CONTRACT_ABI,
  CKUSDC_CONSTANTS,
  SEPOLIA_CONFIG,
} from '../types/ckusdc.js';
import { setDoc, getDoc, listDocs } from '@junobuild/core';

export class CkUSDCService {
  private static config: CkUSDCConfig = SEPOLIA_CONFIG;

  /**
   * Initialize ckUSDC service with configuration
   */
  static initialize(config: Partial<CkUSDCConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  static getConfig(): CkUSDCConfig {
    return this.config;
  }

  // ==================== BALANCE OPERATIONS ====================

  /**
   * Get ckUSDC balance for a user
   */
  static async getBalance(principalId: string): Promise<CkUSDCBalance> {
    try {
      // Fetch balance from Juno datastore
      const results = await listDocs({
        collection: 'ckusdc_transactions',
        filter: {
          order: {
            desc: true,
            field: 'created_at'
          }
        }
      });

      // Calculate balance from transaction history
      let balance = 0;
      results.items
        .filter((item: any) => item.data.userId === principalId)
        .forEach((item: any) => {
          const tx = item.data;
          if (tx.type === 'deposit' && tx.status === 'completed') {
            balance += tx.amount;
          } else if (tx.type === 'withdrawal' && tx.status === 'completed') {
            balance -= tx.amount;
          } else if (tx.type === 'transfer') {
            if (tx.userId === principalId) {
              balance -= (tx.amount + (tx.fee || 0));
            }
            if (tx.recipient === principalId) {
              balance += tx.amount;
            }
          }
        });
      
      return {
        balance,
        balanceFormatted: this.formatAmount(balance),
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching ckUSDC balance:', error);
      throw new Error('Failed to fetch ckUSDC balance');
    }
  }

  /**
   * Get ckUSDC balance with local currency equivalent
   */
  static async getBalanceWithLocalCurrency(
    principalId: string,
    currency: string
  ): Promise<CkUSDCBalance> {
    const balance = await this.getBalance(principalId);
    const exchangeRate = await this.getExchangeRate(currency);
    
    const localCurrencyEquivalent = 
      parseFloat(balance.balanceFormatted) * exchangeRate.rate;

    return {
      ...balance,
      localCurrencyEquivalent,
      localCurrency: currency,
    };
  }

  // ==================== DEPOSIT OPERATIONS ====================

  /**
   * Approve USDC spending by helper contract
   */
  static async approveUSDC(amount: number): Promise<string> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const contract = new ethers.Contract(
        this.config.sepoliaUSDCAddress,
        ERC20_APPROVE_ABI,
        signer
      );

      const amountInSmallestUnit = ethers.utils.parseUnits(
        amount.toString(),
        CKUSDC_CONSTANTS.DECIMALS
      );

      const tx = await contract.approve(
        this.config.helperContractAddress,
        amountInSmallestUnit
      );

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error approving USDC:', error);
      throw new Error('Failed to approve USDC spending');
    }
  }

  /**
   * Convert Principal ID to Byte32 address for deposits
   */
  static principalToByte32(principalId: string): string {
    try {
      const principal = Principal.fromText(principalId);
      const bytes = principal.toUint8Array();
      
      // Pad to 32 bytes
      const paddedBytes = new Uint8Array(32);
      paddedBytes.set(bytes);
      
      // Convert to hex string
      return '0x' + Array.from(paddedBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Error converting Principal to Byte32:', error);
      throw new Error('Invalid Principal ID');
    }
  }

  /**
   * Deposit USDC to get ckUSDC
   */
  static async deposit(request: CkUSDCDepositRequest): Promise<CkUSDCDepositResponse> {
    try {
      // Validate amount
      if (request.amount < CKUSDC_CONSTANTS.MIN_DEPOSIT) {
        throw new Error(`Minimum deposit is ${CKUSDC_CONSTANTS.MIN_DEPOSIT} USDC`);
      }
      if (request.amount > CKUSDC_CONSTANTS.MAX_DEPOSIT) {
        throw new Error(`Maximum deposit is ${CKUSDC_CONSTANTS.MAX_DEPOSIT} USDC`);
      }

      // Step 1: Approve USDC spending
      await this.approveUSDC(request.amount);

      // Step 2: Convert Principal to Byte32
      const depositAddress = this.principalToByte32(request.principalId);

      // Step 3: Deposit via helper contract
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const contract = new ethers.Contract(
        this.config.helperContractAddress,
        HELPER_CONTRACT_ABI,
        signer
      );

      const amountInSmallestUnit = ethers.utils.parseUnits(
        request.amount.toString(),
        CKUSDC_CONSTANTS.DECIMALS
      );

      const tx = await contract.deposit(
        this.config.sepoliaUSDCAddress,
        amountInSmallestUnit,
        depositAddress
      );

      await tx.wait();

      // Step 4: Store transaction in Juno database
      const transactionId = nanoid();
      const transaction: CkUSDCTransaction = {
        id: transactionId,
        userId: request.principalId,
        type: 'deposit',
        amount: request.amount * Math.pow(10, CKUSDC_CONSTANTS.DECIMALS),
        status: 'confirming',
        ethTxHash: tx.hash,
        fee: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + CKUSDC_CONSTANTS.TX_EXPIRATION_MS),
      };

      await setDoc({
        collection: 'ckusdc_transactions',
        doc: {
          key: transactionId,
          data: {
            ...transaction,
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
            expiresAt: transaction.expiresAt?.toISOString(),
          }
        }
      });

      return {
        success: true,
        transactionId,
        depositAddress,
        ethTxHash: tx.hash,
        estimatedConfirmationTime: 5, // ~5 minutes for Sepolia
      };
    } catch (error: any) {
      console.error('Error depositing USDC:', error);
      return {
        success: false,
        error: error.message || 'Failed to deposit USDC',
      };
    }
  }

  // ==================== WITHDRAWAL OPERATIONS ====================

  /**
   * Withdraw ckUSDC to get USDC on Ethereum
   */
  static async withdraw(request: CkUSDCWithdrawalRequest): Promise<CkUSDCWithdrawalResponse> {
    try {
      // Validate amount
      if (request.amount < CKUSDC_CONSTANTS.MIN_TRANSFER) {
        throw new Error(`Minimum withdrawal is ${CKUSDC_CONSTANTS.MIN_TRANSFER} ckUSDC`);
      }

      // Call ICP minter canister to initiate withdrawal
      const minterActor = await this.getMinterActor();
      
      const result: any = await minterActor.withdraw({
        amount: BigInt(request.amount * Math.pow(10, CKUSDC_CONSTANTS.DECIMALS)),
        address: request.ethereumAddress
      });

      // Check if withdrawal was successful
      if ('Err' in result) {
        throw new Error(`Withdrawal failed: ${result.Err}`);
      }

      // Store withdrawal transaction
      const transactionId = nanoid();
      const transaction: CkUSDCTransaction = {
        id: transactionId,
        userId: request.principalId,
        type: 'withdrawal',
        amount: request.amount * Math.pow(10, CKUSDC_CONSTANTS.DECIMALS),
        status: 'pending',
        recipient: request.ethereumAddress,
        fee: 0.1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc({
        collection: 'ckusdc_transactions',
        doc: {
          key: transactionId,
          data: {
            ...transaction,
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
          }
        }
      });

      return {
        success: true,
        transactionId,
        estimatedProcessingTime: 10, // ~10 minutes
      };
    } catch (error: any) {
      console.error('Error withdrawing ckUSDC:', error);
      return {
        success: false,
        error: error.message || 'Failed to withdraw ckUSDC',
      };
    }
  }

  // ==================== TRANSFER OPERATIONS ====================

  /**
   * Transfer ckUSDC between ICP users
   */
  static async transfer(request: CkUSDCTransferRequest): Promise<CkUSDCTransferResponse> {
    try {
      // Validate amount
      if (request.amount < CKUSDC_CONSTANTS.MIN_TRANSFER) {
        throw new Error(`Minimum transfer is ${CKUSDC_CONSTANTS.MIN_TRANSFER} ckUSDC`);
      }

      // Call ICP ledger canister to execute transfer
      const recipientPrincipal = Principal.fromText(request.recipient);
      const ledgerActor = await this.getLedgerActor();
      
      const result: any = await ledgerActor.icrc1_transfer({
        from_subaccount: [],
        to: { owner: recipientPrincipal, subaccount: [] },
        amount: BigInt(request.amount * Math.pow(10, CKUSDC_CONSTANTS.DECIMALS)),
        fee: [],
        memo: request.memo ? Array.from(new TextEncoder().encode(request.memo)) : [],
        created_at_time: []
      });

      // Check if transfer was successful
      if ('Err' in result) {
        throw new Error(`Transfer failed: ${result.Err}`);
      }

      const transactionId = nanoid();
      const fee = 0.001;

      const transaction: CkUSDCTransaction = {
        id: transactionId,
        userId: request.senderId,
        type: 'transfer',
        amount: request.amount * Math.pow(10, CKUSDC_CONSTANTS.DECIMALS),
        status: 'completed',
        recipient: request.recipient,
        fee,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc({
        collection: 'ckusdc_transactions',
        doc: {
          key: transactionId,
          data: {
            ...transaction,
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
          }
        }
      });

      return {
        success: true,
        transactionId,
        fee,
      };
    } catch (error: any) {
      console.error('Error transferring ckUSDC:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer ckUSDC',
        fee: 0,
      };
    }
  }

  // ==================== EXCHANGE OPERATIONS ====================

  /**
   * Exchange ckUSDC with local currency via agent
   */
  static async exchange(request: CkUSDCExchangeRequest): Promise<CkUSDCExchangeResponse> {
    try {
      // Get exchange rate
      const exchangeRate = await this.getExchangeRate(request.currency);
      
      // Calculate amounts based on type
      let ckusdcAmount: number;
      let localCurrencyAmount: number;
      
      if (request.type === 'buy') {
        // User buying ckUSDC with local currency
        localCurrencyAmount = request.amount;
        ckusdcAmount = localCurrencyAmount / exchangeRate.rate;
      } else {
        // User selling ckUSDC for local currency
        ckusdcAmount = request.amount;
        localCurrencyAmount = ckusdcAmount * exchangeRate.rate;
      }

      // Calculate fee (2% default, can be dynamic based on location)
      const feePercentage = CKUSDC_CONSTANTS.DEFAULT_EXCHANGE_FEE;
      const fee = ckusdcAmount * feePercentage;
      const agentCommission = fee * 0.8; // Agent gets 80% of fee

      // Generate exchange code for in-person verification
      const exchangeCode = `USDC-${nanoid(6).toUpperCase()}`;

      // Create and store exchange transaction
      const transactionId = nanoid();
      const transaction: CkUSDCTransaction = {
        id: transactionId,
        userId: request.userId,
        type: request.type === 'buy' ? 'exchange_buy' : 'exchange_sell',
        amount: ckusdcAmount * Math.pow(10, CKUSDC_CONSTANTS.DECIMALS),
        status: 'pending',
        agentId: request.agentId,
        localCurrencyAmount,
        localCurrency: request.currency,
        exchangeRate: exchangeRate.rate,
        fee,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + CKUSDC_CONSTANTS.TX_EXPIRATION_MS),
      };

      await setDoc({
        collection: 'ckusdc_transactions',
        doc: {
          key: transactionId,
          data: {
            ...transaction,
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
            expiresAt: transaction.expiresAt?.toISOString(),
          }
        }
      });

      return {
        success: true,
        transactionId,
        exchangeRate: exchangeRate.rate,
        ckusdcAmount,
        localCurrencyAmount,
        fee,
        feePercentage,
        agentCommission,
        exchangeCode,
      };
    } catch (error: any) {
      console.error('Error exchanging ckUSDC:', error);
      return {
        success: false,
        exchangeRate: 0,
        ckusdcAmount: 0,
        localCurrencyAmount: 0,
        fee: 0,
        feePercentage: 0,
        agentCommission: 0,
        error: error.message || 'Failed to exchange ckUSDC',
      };
    }
  }
  // ==================== EXCHANGE RATE OPERATIONS ====================

  /**
   * Get ckUSDC exchange rate for a currency
   * ckUSDC is pegged 1:1 with USD, so we fetch real USD exchange rates from CoinGecko
   */
  static async getExchangeRate(currency: string): Promise<CkUSDCExchangeRate> {
    try {
      const currencyUpper = currency.toUpperCase();
      
      // ckUSDC is pegged 1:1 with USD, so we just need USD to local currency rate
      // Use exchangerate-api.com (free, no key needed, supports all currencies)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/USD`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forex rates');
      }
      
      const data = await response.json();
      const rate = data.rates[currencyUpper];
      
      if (!rate) {
        throw new Error(`Exchange rate not available for ${currency}`);
      }

      return {
        currency,
        rate, // 1 USDC = X local currency
        lastUpdated: new Date(),
        source: 'exchangerate-api',
      };
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  }

  /**
   * Get exchange rates for multiple currencies
   */
  static async getExchangeRates(currencies: string[]): Promise<CkUSDCExchangeRate[]> {
    const rates = await Promise.all(
      currencies.map(currency => this.getExchangeRate(currency))
    );
    return rates;
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Format ckUSDC amount for display
   */
  static formatAmount(amount: number): string {
    const amountInUSDC = amount / Math.pow(10, CKUSDC_CONSTANTS.DECIMALS);
    return amountInUSDC.toFixed(2);
  }

  /**
   * Parse ckUSDC amount from string
   */
  static parseAmount(amountStr: string): number {
    const amount = parseFloat(amountStr);
    return amount * Math.pow(10, CKUSDC_CONSTANTS.DECIMALS);
  }

  /**
   * Validate Ethereum address
   */
  static isValidEthereumAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  /**
   * Validate Principal ID
   */
  static isValidPrincipalId(principalId: string): boolean {
    try {
      Principal.fromText(principalId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(transactionId: string): Promise<CkUSDCTransaction | null> {
    try {
      const result = await getDoc({
        collection: 'ckusdc_transactions',
        key: transactionId
      });

      if (!result) return null;

      const data = result.data as any;
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Get user's transaction history
   */
  static async getTransactionHistory(userId: string): Promise<CkUSDCTransaction[]> {
    try {
      const results = await listDocs({
        collection: 'ckusdc_transactions',
        filter: {
          order: {
            desc: true,
            field: 'created_at'
          }
        }
      });

      return results.items
        .filter((item: any) => item.data.userId === userId)
        .map((item: any) => {
          const data = item.data;
          return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          };
        });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  // ==================== ICP CANISTER INTEGRATION ====================

  /**
   * Create ICP agent for canister calls
   */
  private static async createAgent(): Promise<HttpAgent> {
    const agent = new HttpAgent({
      host: process.env.NODE_ENV === 'production' 
        ? 'https://ic0.app' 
        : 'http://localhost:4943'
    });

    // Fetch root key for local development
    if (process.env.NODE_ENV !== 'production') {
      await agent.fetchRootKey();
    }

    return agent;
  }

  /**
   * Get ckUSDC ledger canister actor
   */
  private static async getLedgerActor() {
    const agent = await this.createAgent();
    
    // ICRC-1 Ledger IDL
    const ledgerIdl = ({ IDL }: any) => {
      return IDL.Service({
        'icrc1_balance_of': IDL.Func(
          [IDL.Record({ 'owner': IDL.Principal, 'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)) })],
          [IDL.Nat],
          ['query']
        ),
        'icrc1_transfer': IDL.Func(
          [IDL.Record({
            'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
            'to': IDL.Record({ 'owner': IDL.Principal, 'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)) }),
            'amount': IDL.Nat,
            'fee': IDL.Opt(IDL.Nat),
            'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
            'created_at_time': IDL.Opt(IDL.Nat64)
          })],
          [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text })],
          []
        ),
      });
    };

    return Actor.createActor(ledgerIdl, {
      agent,
      canisterId: this.config.ledgerCanisterId,
    });
  }

  /**
   * Get ckUSDC minter canister actor
   */
  private static async getMinterActor() {
    const agent = await this.createAgent();
    
    // Minter canister IDL
    const minterIdl = ({ IDL }: any) => {
      return IDL.Service({
        'get_deposit_address': IDL.Func(
          [IDL.Record({ 'owner': IDL.Principal, 'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)) })],
          [IDL.Text],
          ['query']
        ),
        'withdraw': IDL.Func(
          [IDL.Record({
            'amount': IDL.Nat,
            'address': IDL.Text
          })],
          [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text })],
          []
        ),
      });
    };

    return Actor.createActor(minterIdl, {
      agent,
      canisterId: this.config.minterCanisterId,
    });
  }
}
