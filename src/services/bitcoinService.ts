import { nanoid } from 'nanoid';
import { AfricanCurrency, formatCurrencyAmount } from '../types/currency';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';

// Bitcoin wallet and transaction interfaces
export interface BitcoinWallet {
  id: string;
  userId: string;
  address: string;
  privateKey?: string; // For POC - in production use threshold signatures
  balance: number; // in satoshis
  createdAt: Date;
}

export interface BitcoinTransaction {
  id: string;
  userId: string;
  agentId?: string;
  type: 'bitcoin_to_local' | 'local_to_bitcoin' | 'bitcoin_send' | 'bitcoin_receive';
  bitcoinAmount: number; // in satoshis
  localAmount?: number; // equivalent local currency amount
  localCurrency: AfricanCurrency; // The local African currency being exchanged
  exchangeRate: number; // BTC to local currency rate at time of transaction
  bitcoinTxHash?: string; // actual Bitcoin network transaction hash
  fromAddress?: string;
  toAddress?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  confirmations: number;
  fee: number; // Bitcoin network fee in satoshis
  agentFee?: number; // Agent commission in local currency
  createdAt: Date;
  confirmedAt?: Date;
  metadata?: {
    smsReference?: string;
    exchangeMethod?: 'agent_cash' | 'agent_digital';
  };
}

export interface ExchangeRate {
  btcToLocal: number;
  localToBtc: number;
  currency: AfricanCurrency;
  lastUpdated: Date;
  source: string;
}

export interface MultiCurrencyExchangeRates {
  [currency: string]: ExchangeRate;
}

// Bitcoin service for ICP integration
export class BitcoinService {
  private static readonly SATOSHIS_PER_BTC = 100000000;
  private static readonly NETWORK_FEE_SATS = 1000; // Default network fee
  
  // Bitcoin networks
  private static readonly MAINNET = bitcoin.networks.bitcoin;
  private static readonly TESTNET = bitcoin.networks.testnet;
  
  // Use testnet for development, mainnet for production
  private static readonly NETWORK = process.env.NODE_ENV === 'production' ? this.MAINNET : this.TESTNET;
  
  // Initialize ECPair with secp256k1
  private static readonly ECPair = ECPairFactory(ecc);
  
  // Generate REAL Bitcoin address using bitcoinjs-lib
  static generateBitcoinAddress(): { address: string; privateKey: string; publicKey: string } {
    // Generate a random private key
    const keyPair = this.ECPair.makeRandom({ network: this.NETWORK });
    
    // Get the private key in WIF format
    const privateKey = keyPair.toWIF();
    
    // Get the public key as hex string
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
    
    // Generate P2WPKH (native segwit) address
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: Buffer.from(keyPair.publicKey), 
      network: this.NETWORK 
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    return {
      address,
      privateKey,
      publicKey
    };
  }
  
  // Generate Bitcoin address from existing private key
  static getAddressFromPrivateKey(privateKeyWIF: string): { address: string; publicKey: string } {
    const keyPair = this.ECPair.fromWIF(privateKeyWIF, this.NETWORK);
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
    
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: Buffer.from(keyPair.publicKey), 
      network: this.NETWORK 
    });
    
    if (!address) {
      throw new Error('Failed to generate address from private key');
    }
    
    return { address, publicKey };
  }

  // Create Bitcoin wallet for user
  static async createBitcoinWallet(userId: string): Promise<BitcoinWallet> {
    const { address, privateKey } = this.generateBitcoinAddress();
    
    const wallet: BitcoinWallet = {
      id: nanoid(),
      userId,
      address,
      privateKey, // Store securely in production
      balance: 0,
      createdAt: new Date()
    };

    // In production, store in Juno datastore
    // For now, return the wallet object
    return wallet;
  }

  // Get REAL BTC to local currency exchange rate
  static async getExchangeRate(currency: AfricanCurrency = 'UGX'): Promise<ExchangeRate> {
    try {
      // Get real BTC price in USD first
      const btcUsdResponse = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
      const btcUsdData = await btcUsdResponse.json();
      const btcToUsd = parseFloat(btcUsdData.data.rates.USD);
      
      // Get USD to local currency rate
      let usdToLocal = 1;
      
      if (currency !== 'BTC') {
        try {
          // Use exchangerate-api for real forex rates
          const forexResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
          const forexData = await forexResponse.json();
          
          // Map African currencies to their forex codes
          const currencyMap: Record<AfricanCurrency, string> = {
            'UGX': 'UGX', 'KES': 'KES', 'TZS': 'TZS', 'RWF': 'RWF', 'ETB': 'ETB',
            'NGN': 'NGN', 'GHS': 'GHS', 'XOF': 'XOF', 'XAF': 'XAF', 'CDF': 'CDF',
            'AOA': 'AOA', 'ZAR': 'ZAR', 'BWP': 'BWP', 'EGP': 'EGP', 'MAD': 'MAD',
            'TND': 'TND', 'DZD': 'DZD', 'MUR': 'MUR', 'SLL': 'SLL', 'LRD': 'LRD',
            'GMD': 'GMD', 'SZL': 'SZL', 'LSL': 'LSL', 'NAD': 'NAD', 'ZMW': 'ZMW',
            'ZWL': 'ZWL', 'MWK': 'MWK', 'MZN': 'MZN', 'SCR': 'SCR', 'CVE': 'CVE',
            'STN': 'STN', 'KMF': 'KMF', 'DJF': 'DJF', 'ERN': 'ERN', 'MGA': 'MGA',
            'SOS': 'SOS', 'LYD': 'LYD', 'SDG': 'SDG', 'BTC': 'BTC'
          };
          
          const forexCode = currencyMap[currency];
          if (forexCode && forexData.rates[forexCode]) {
            usdToLocal = forexData.rates[forexCode];
          } else {
            // Fallback to estimated rates if not available in forex API
            const fallbackRates: Record<AfricanCurrency, number> = {
              'UGX': 3700, 'KES': 129, 'TZS': 2300, 'RWF': 1240, 'ETB': 120,
              'NGN': 1550, 'GHS': 15, 'XOF': 600, 'XAF': 600, 'CDF': 2800,
              'AOA': 900, 'ZAR': 18, 'BWP': 13.5, 'EGP': 49, 'MAD': 10,
              'TND': 3.1, 'DZD': 135, 'MUR': 46, 'SLL': 22000, 'LRD': 190,
              'GMD': 67, 'SZL': 18, 'LSL': 18, 'NAD': 18, 'ZMW': 27,
              'ZWL': 25000, 'MWK': 1730, 'MZN': 64, 'SCR': 13.5, 'CVE': 101,
              'STN': 22.5, 'KMF': 450, 'DJF': 178, 'ERN': 15, 'MGA': 4500,
              'SOS': 570, 'LYD': 4.8, 'SDG': 600, 'BTC': 1
            };
            usdToLocal = fallbackRates[currency] || 1;
          }
        } catch (forexError) {
          console.warn('Forex API failed, using fallback rates:', forexError);
          // Use fallback rates
          const fallbackRates: Record<AfricanCurrency, number> = {
            'UGX': 3700, 'KES': 129, 'TZS': 2300, 'RWF': 1240, 'ETB': 120,
            'NGN': 1550, 'GHS': 15, 'XOF': 600, 'XAF': 600, 'CDF': 2800,
            'AOA': 900, 'ZAR': 18, 'BWP': 13.5, 'EGP': 49, 'MAD': 10,
            'TND': 3.1, 'DZD': 135, 'MUR': 46, 'SLL': 22000, 'LRD': 190,
            'GMD': 67, 'SZL': 18, 'LSL': 18, 'NAD': 18, 'ZMW': 27,
            'ZWL': 25000, 'MWK': 1730, 'MZN': 64, 'SCR': 13.5, 'CVE': 101,
            'STN': 22.5, 'KMF': 450, 'DJF': 178, 'ERN': 15, 'MGA': 4500,
            'SOS': 570, 'LYD': 4.8, 'SDG': 600, 'BTC': 1
          };
          usdToLocal = fallbackRates[currency] || 1;
        }
      }
      
      const btcToLocal = currency === 'BTC' ? 1 : btcToUsd * usdToLocal;
      
      return {
        btcToLocal,
        localToBtc: 1 / btcToLocal,
        currency,
        lastUpdated: new Date(),
        source: 'coinbase_exchangerate_api'
      };
    } catch (error) {
      console.error('Error fetching real exchange rate:', error);
      // Fallback to estimated rates
      const fallbackRates: Record<AfricanCurrency, number> = {
        'UGX': 150000000, 'KES': 6500000, 'NGN': 65000000, 'ZAR': 1200000,
        'GHS': 800000, 'EGP': 3200000, 'MAD': 650000, 'TZS': 150000000,
        'RWF': 85000000, 'ETB': 7500000, 'XOF': 40000000, 'XAF': 40000000,
        'CDF': 180000000, 'AOA': 55000000, 'BWP': 900000, 'TND': 200000,
        'DZD': 8800000, 'MUR': 3000000, 'BTC': 1, 'SLL': 1200000000,
        'LRD': 12000000, 'GMD': 4200000, 'SZL': 1200000, 'LSL': 1200000,
        'NAD': 1200000, 'ZMW': 18000000, 'ZWL': 32000000000, 'MWK': 85000000,
        'MZN': 4200000, 'SCR': 900000, 'CVE': 6800000, 'STN': 1500000,
        'KMF': 30000000, 'DJF': 12000000, 'ERN': 1000000, 'MGA': 300000000,
        'SOS': 38000000, 'LYD': 320000, 'SDG': 40000000
      };
      
      const rate = fallbackRates[currency] || fallbackRates['UGX'];
      
      return {
        btcToLocal: rate,
        localToBtc: 1 / rate,
        currency,
        lastUpdated: new Date(),
        source: 'fallback'
      };
    }
  }

  // Convert satoshis to BTC
  static satoshisToBtc(satoshis: number): number {
    return satoshis / this.SATOSHIS_PER_BTC;
  }

  // Convert BTC to satoshis
  static btcToSatoshis(btc: number): number {
    return Math.round(btc * this.SATOSHIS_PER_BTC);
  }

  // Calculate local currency equivalent of Bitcoin amount
  static async calculateLocalFromBitcoin(satoshis: number, currency: AfricanCurrency): Promise<number> {
    const rate = await this.getExchangeRate(currency);
    const btc = this.satoshisToBtc(satoshis);
    return Math.round(btc * rate.btcToLocal);
  }

  // Calculate Bitcoin equivalent of local currency amount
  static async calculateBitcoinFromLocal(amount: number, currency: AfricanCurrency): Promise<number> {
    const rate = await this.getExchangeRate(currency);
    const btc = amount * rate.localToBtc;
    return this.btcToSatoshis(btc);
  }

  // Create Bitcoin transaction record
  static async createBitcoinTransaction(
    transaction: Omit<BitcoinTransaction, 'id' | 'createdAt' | 'confirmations'>
  ): Promise<BitcoinTransaction> {
    const newTransaction: BitcoinTransaction = {
      ...transaction,
      id: nanoid(),
      confirmations: 0,
      createdAt: new Date()
    };

    // In production, store in Juno datastore
    return newTransaction;
  }

  // Send REAL Bitcoin transaction
  static async sendBitcoin(
    fromAddress: string,
    toAddress: string,
    amountSats: number,
    privateKeyWIF: string
  ): Promise<{ txHash: string; success: boolean; error?: string }> {
    try {
      // Get UTXOs for the from address
      const utxos = await this.getUTXOs(fromAddress);
      
      if (utxos.length === 0) {
        return {
          txHash: '',
          success: false,
          error: 'No UTXOs available for this address'
        };
      }
      
      // Calculate total available balance
      const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      
      if (totalBalance < amountSats + this.NETWORK_FEE_SATS) {
        return {
          txHash: '',
          success: false,
          error: `Insufficient balance. Available: ${totalBalance} sats, Required: ${amountSats + this.NETWORK_FEE_SATS} sats`
        };
      }
      
      // Create transaction
      const keyPair = this.ECPair.fromWIF(privateKeyWIF, this.NETWORK);
      const psbt = new bitcoin.Psbt({ network: this.NETWORK });
      
      // Add inputs
      let inputValue = 0;
      for (const utxo of utxos) {
        if (inputValue >= amountSats + this.NETWORK_FEE_SATS) break;
        
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: bitcoin.payments.p2wpkh({ pubkey: Buffer.from(keyPair.publicKey), network: this.NETWORK }).output!,
            value: utxo.value,
          },
        });
        inputValue += utxo.value;
      }
      
      // Add output to recipient
      psbt.addOutput({
        address: toAddress,
        value: amountSats,
      });
      
      // Add change output if necessary
      const change = inputValue - amountSats - this.NETWORK_FEE_SATS;
      if (change > 0) {
        psbt.addOutput({
          address: fromAddress,
          value: change,
        });
      }
      
      // Sign all inputs
      for (let i = 0; i < psbt.inputCount; i++) {
        psbt.signInput(i, keyPair as any);
      }
      
      // Finalize and extract transaction
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();
      
      // Broadcast transaction
      const txHash = await this.broadcastTransaction(txHex);
      
      return {
        txHash,
        success: true
      };
    } catch (error) {
      console.error('Bitcoin transaction error:', error);
      return {
        txHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }
  
  // Get UTXOs for an address using blockchain API
  static async getUTXOs(address: string): Promise<Array<{
    txid: string;
    vout: number;
    value: number;
  }>> {
    try {
      // Use BlockCypher API for testnet/mainnet
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/addrs/${address}?unspentOnly=true`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (!data.txrefs) {
        return [];
      }
      
      return data.txrefs.map((utxo: any) => ({
        txid: utxo.tx_hash,
        vout: utxo.tx_output_n,
        value: utxo.value
      }));
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      return [];
    }
  }
  
  // Broadcast transaction to Bitcoin network
  static async broadcastTransaction(txHex: string): Promise<string> {
    try {
      // Use BlockCypher API to broadcast
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/txs/push`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tx: txHex }),
      });
      
      const data = await response.json();
      
      if (data.tx && data.tx.hash) {
        return data.tx.hash;
      } else {
        throw new Error(data.error || 'Failed to broadcast transaction');
      }
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw error;
    }
  }

  // Check REAL Bitcoin transaction confirmations
  static async checkTransactionConfirmations(txHash: string): Promise<number> {
    try {
      // Use BlockCypher API to get transaction details
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/txs/${txHash}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.confirmations !== undefined) {
        return data.confirmations;
      } else {
        console.warn('Transaction not found or pending:', txHash);
        return 0;
      }
    } catch (error) {
      console.error('Error checking confirmations:', error);
      return 0;
    }
  }
  
  // Get REAL Bitcoin balance for an address
  static async getBitcoinBalance(address: string): Promise<number> {
    try {
      // Use BlockCypher API to get address balance
      const network = this.NETWORK === this.MAINNET ? 'main' : 'test3';
      const apiUrl = `https://api.blockcypher.com/v1/btc/${network}/addrs/${address}/balance`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      return data.balance || 0; // Balance in satoshis
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error);
      return 0;
    }
  }

  // Process Bitcoin to local currency exchange through agent with dynamic fees
  static async processBitcoinToLocalExchange(
    userId: string,
    agentId: string,
    bitcoinAmount: number, // in satoshis
    localCurrency: AfricanCurrency,
    exchangeMethod: 'agent_cash' | 'agent_digital',
    customerLocation?: { latitude: number; longitude: number; accessibility: 'urban' | 'suburban' | 'rural' | 'remote' },
    agentDistance?: number,
    urgency: 'standard' | 'express' | 'emergency' = 'standard'
  ): Promise<{
    success: boolean;
    transaction?: BitcoinTransaction;
    message: string;
    feeBreakdown?: any;
  }> {
    try {
      const rate = await this.getExchangeRate(localCurrency);
      const localAmount = await this.calculateLocalFromBitcoin(bitcoinAmount, localCurrency);
      
      // Calculate dynamic fee if location data is available
      let agentFee: number;
      let feeBreakdown: any = null;
      
      if (customerLocation && agentDistance !== undefined) {
        const { DynamicFeeService } = await import('./dynamicFeeService');
        const now = new Date();
        const hour = now.getHours();
        const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
        const dayOfWeek = now.getDay() === 0 || now.getDay() === 6 ? 'weekend' : 'weekday';
        
        const feeCalculation = DynamicFeeService.calculateDynamicFee(
          {
            amount: localAmount,
            currency: localCurrency,
            type: 'bitcoin_sell',
            customerLocation: {
              latitude: customerLocation.latitude,
              longitude: customerLocation.longitude,
              accessibility: customerLocation.accessibility
            },
            urgency,
            timeOfDay: timeOfDay as any,
            dayOfWeek: dayOfWeek as any
          },
          agentDistance,
          { latitude: 0, longitude: 0, accessibility: 'urban' } // Agent location placeholder
        );
        
        agentFee = feeCalculation.totalFeeAmount;
        feeBreakdown = feeCalculation;
      } else {
        // Fallback to fixed 3% fee for remote areas, 2% for others
        const feeRate = customerLocation?.accessibility === 'remote' ? 0.03 : 0.02;
        agentFee = Math.round(localAmount * feeRate);
      }
      
      const netLocalAmount = localAmount - agentFee;

      const transaction = await this.createBitcoinTransaction({
        userId,
        agentId,
        type: 'bitcoin_to_local',
        bitcoinAmount,
        localAmount: netLocalAmount,
        localCurrency,
        exchangeRate: rate.btcToLocal,
        status: 'pending',
        fee: this.NETWORK_FEE_SATS,
        agentFee,
        metadata: {
          exchangeMethod,
          smsReference: `BTC${Date.now().toString().slice(-6)}`
        }
      });

      return {
        success: true,
        transaction,
        message: `Exchange initiated: ${this.satoshisToBtc(bitcoinAmount).toFixed(8)} BTC → ${formatCurrencyAmount(netLocalAmount, localCurrency)}`,
        feeBreakdown
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process Bitcoin exchange'
      };
    }
  }

  // Process local currency to Bitcoin exchange through agent
  static async processLocalToBitcoinExchange(
    userId: string,
    agentId: string,
    localAmount: number,
    localCurrency: AfricanCurrency,
    userBitcoinAddress: string
  ): Promise<{
    success: boolean;
    transaction?: BitcoinTransaction;
    message: string;
  }> {
    try {
      const rate = await this.getExchangeRate(localCurrency);
      const agentFee = Math.round(localAmount * 0.02); // 2% agent fee
      const netLocalAmount = localAmount - agentFee;
      const bitcoinAmount = await this.calculateBitcoinFromLocal(netLocalAmount, localCurrency);

      const transaction = await this.createBitcoinTransaction({
        userId,
        agentId,
        type: 'local_to_bitcoin',
        bitcoinAmount,
        localAmount: netLocalAmount,
        localCurrency,
        exchangeRate: rate.btcToLocal,
        toAddress: userBitcoinAddress,
        status: 'pending',
        fee: this.NETWORK_FEE_SATS,
        agentFee,
        metadata: {
          exchangeMethod: 'agent_cash',
          smsReference: `${localCurrency}${Date.now().toString().slice(-6)}`
        }
      });

      return {
        success: true,
        transaction,
        message: `Exchange initiated: ${formatCurrencyAmount(localAmount, localCurrency)} → ${this.satoshisToBtc(bitcoinAmount).toFixed(8)} BTC`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process local currency exchange'
      };
    }
  }

  // Format Bitcoin amount for display
  static formatBitcoinAmount(satoshis: number): string {
    const btc = this.satoshisToBtc(satoshis);
    if (btc >= 1) {
      return `${btc.toFixed(8)} BTC`;
    } else if (btc >= 0.001) {
      return `${(btc * 1000).toFixed(5)} mBTC`;
    } else {
      return `${satoshis} sats`;
    }
  }

  // Generate SMS message for Bitcoin transaction
  static generateBitcoinSMS(transaction: BitcoinTransaction, userPhone: string): string {
    const btcAmount = this.formatBitcoinAmount(transaction.bitcoinAmount);
    const localAmount = transaction.localAmount ? formatCurrencyAmount(transaction.localAmount, transaction.localCurrency) : '0';
    
    // Log SMS generation for the user
    console.log(`Generating Bitcoin SMS for ${userPhone}`);
    
    switch (transaction.type) {
      case 'bitcoin_to_local':
        return `AfriTokeni: Bitcoin exchange completed. ${btcAmount} → ${localAmount}. Ref: ${transaction.metadata?.smsReference}`;
      
      case 'local_to_bitcoin':
        return `AfriTokeni: ${transaction.localCurrency} exchange completed. ${localAmount} → ${btcAmount}. Address: ${transaction.toAddress}. Ref: ${transaction.metadata?.smsReference}`;
      
      case 'bitcoin_receive':
        return `AfriTokeni: Bitcoin received. ${btcAmount} to your wallet. TxHash: ${transaction.bitcoinTxHash?.slice(0, 8)}...`;
      
      default:
        return `AfriTokeni: Bitcoin transaction ${transaction.type}. Amount: ${btcAmount}. Ref: ${transaction.id}`;
    }
  }
}
