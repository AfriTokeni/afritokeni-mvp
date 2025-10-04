/**
 * AFRI Governance Token Service
 * Manages AfriTokeni DAO governance token distribution and balances
 */

import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// SNS Canister IDs from environment
const SNS_LEDGER_CANISTER = import.meta.env.VITE_SNS_LEDGER_CANISTER;

// ICRC-1 Ledger Interface
const icrc1Idl = ({ IDL }: any) => {
  const Account = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) });
  const TransferArgs = IDL.Record({
    to: Account,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
    amount: IDL.Nat,
  });
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    icrc1_transfer: IDL.Func([TransferArgs], [IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text })], []),
    icrc1_total_supply: IDL.Func([], [IDL.Nat], ['query']),
  });
};

export interface TokenBalance {
  userId: string;
  balance: number;
  earned: {
    transactions: number;
    agentActivity: number;
    referrals: number;
    staking: number;
  };
  locked: number; // Tokens locked in active votes
  lastUpdated: Date;
}

export interface TokenDistribution {
  community: {
    agents: number; // 25%
    users: number; // 20%
  };
  investors: {
    seed: number; // 5%
    privateSale: number; // 10%
    publicSale: number; // 5%
  };
  treasury: number; // 20%
  team: number; // 10%
  advisors: number; // 5%
}

export interface TokenReward {
  action: 'transaction' | 'agent_service' | 'referral' | 'staking' | 'bonus';
  amount: number;
  multiplier?: number;
}

export class AfriTokenService {
  private static readonly TOTAL_SUPPLY = 1_000_000_000; // 1 billion AFRI tokens
  private static readonly DISTRIBUTION: TokenDistribution = {
    community: {
      agents: 250_000_000, // 25%
      users: 200_000_000, // 20%
    },
    investors: {
      seed: 50_000_000, // 5%
      privateSale: 100_000_000, // 10%
      publicSale: 50_000_000, // 5%
    },
    treasury: 200_000_000, // 20%
    team: 100_000_000, // 10%
    advisors: 50_000_000, // 5%
  };

  // Reward amounts for different actions
  private static readonly REWARDS = {
    transaction: 10, // 10 AFRI per transaction
    agent_deposit: 50, // 50 AFRI for processing deposit
    agent_withdrawal: 50, // 50 AFRI for processing withdrawal
    agent_bitcoin: 100, // 100 AFRI for Bitcoin exchange
    referral: 25, // 25 AFRI for successful referral
    staking_daily: 5, // 5 AFRI per day for staking
  };

  /**
   * Get user's AFRI token balance from SNS Ledger
   */
  static async getBalance(userId: string): Promise<TokenBalance> {
    try {
      const agent = await HttpAgent.create({ host: 'https://ic0.app' });
      const ledger = Actor.createActor(icrc1Idl, {
        agent,
        canisterId: SNS_LEDGER_CANISTER,
      });

      const balanceResult = await ledger.icrc1_balance_of({
        owner: Principal.fromText(userId),
        subaccount: [],
      });

      // Convert from e8s to AFRI (divide by 100_000_000)
      const balance = Number(balanceResult) / 100_000_000;

      return {
        userId,
        balance,
        earned: {
          transactions: 0,
          agentActivity: 0,
          referrals: 0,
          staking: 0,
        },
        locked: 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching AFRI balance:', error);
      return {
        userId,
        balance: 0,
        earned: { transactions: 0, agentActivity: 0, referrals: 0, staking: 0 },
        locked: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Reward user with AFRI tokens for actions
   * This will transfer from treasury to user via SNS ledger
   */
  static async rewardUser(userId: string, reward: TokenReward): Promise<number> {
    const multiplier = reward.multiplier || 1;
    const amount = reward.amount * multiplier;

    try {
      const agent = await HttpAgent.create({ host: 'https://ic0.app' });
      const ledger = Actor.createActor(icrc1Idl, {
        agent,
        canisterId: SNS_LEDGER_CANISTER,
      });

      // Transfer AFRI tokens from treasury to user
      await ledger.icrc1_transfer({
        to: { owner: Principal.fromText(userId), subaccount: [] },
        amount: BigInt(amount * 100_000_000), // Convert to e8s
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
      });

      return amount;
    } catch (error) {
      console.error('Error rewarding user:', error);
      return 0;
    }
  }

  /**
   * Reward user for transaction
   */
  static async rewardTransaction(userId: string, transactionAmount: number): Promise<number> {
    // Base reward + bonus for large transactions
    let reward = this.REWARDS.transaction;
    
    if (transactionAmount > 100000) {
      reward *= 1.5; // 50% bonus for large transactions
    }

    return this.rewardUser(userId, {
      action: 'transaction',
      amount: reward,
    });
  }

  /**
   * Reward agent for service
   */
  static async rewardAgentService(
    agentId: string,
    serviceType: 'deposit' | 'withdrawal' | 'bitcoin'
  ): Promise<number> {
    const rewardMap = {
      deposit: this.REWARDS.agent_deposit,
      withdrawal: this.REWARDS.agent_withdrawal,
      bitcoin: this.REWARDS.agent_bitcoin,
    };

    return this.rewardUser(agentId, {
      action: 'agent_service',
      amount: rewardMap[serviceType],
    });
  }

  /**
   * Reward user for referral
   */
  static async rewardReferral(userId: string): Promise<number> {
    return this.rewardUser(userId, {
      action: 'referral',
      amount: this.REWARDS.referral,
    });
  }

  /**
   * Calculate staking rewards
   */
  static async calculateStakingReward(stakedAmount: number, days: number): Promise<number> {
    // APY calculation: 5 AFRI per day per 1000 AFRI staked
    const dailyRate = 0.005; // 0.5% daily
    return Math.floor(stakedAmount * dailyRate * days);
  }

  /**
   * Lock tokens for voting (via SNS neuron staking)
   */
  static async lockTokens(userId: string, amount: number): Promise<boolean> {
    try {
      // Create neuron by staking AFRI tokens
      // This locks tokens in SNS governance for voting
      const amountE8s = BigInt(amount * 100_000_000);
      
      // Note: Actual implementation requires SNS governance canister interface
      // and proper neuron management commands
      console.log(`Locking ${amount} AFRI (${amountE8s} e8s) for ${userId}`);
      
      return true;
    } catch (error) {
      console.error('Error locking tokens:', error);
      return false;
    }
  }

  /**
   * Unlock tokens after vote (dissolve neuron)
   */
  static async unlockTokens(userId: string, amount: number): Promise<boolean> {
    try {
      // Start dissolving neuron to unlock tokens
      const amountE8s = BigInt(amount * 100_000_000);
      
      // Note: Actual implementation requires SNS governance canister interface
      // and proper neuron dissolve commands
      console.log(`Unlocking ${amount} AFRI (${amountE8s} e8s) for ${userId}`);
      
      return true;
    } catch (error) {
      console.error('Error unlocking tokens:', error);
      return false;
    }
  }

  /**
   * Get token distribution stats
   */
  static getDistribution(): TokenDistribution {
    return this.DISTRIBUTION;
  }

  /**
   * Get total supply
   */
  static getTotalSupply(): number {
    return this.TOTAL_SUPPLY;
  }

  /**
   * Get leaderboard (top token holders from SNS)
   */
  static async getLeaderboard(limit: number = 10): Promise<TokenBalance[]> {
    try {
      const agent = await HttpAgent.create({ host: 'https://ic0.app' });
      
      // Query SNS governance for all neurons (token holders)
      const SNS_GOVERNANCE_CANISTER_ID = import.meta.env.VITE_SNS_GOVERNANCE_CANISTER;
      
      // Get governance neuron holders
      // Note: This queries the actual SNS governance canister for neuron data
      const governanceIdl = ({ IDL }: any) => {
        return IDL.Service({
          list_neurons: IDL.Func(
            [IDL.Record({ limit: IDL.Nat32, start_page_at: IDL.Opt(IDL.Vec(IDL.Nat8)) })],
            [IDL.Record({ neurons: IDL.Vec(IDL.Record({ id: IDL.Vec(IDL.Nat8), stake_e8s: IDL.Nat64 })) })],
            ['query']
          ),
        });
      };

      const governance = Actor.createActor(governanceIdl, {
        agent,
        canisterId: SNS_GOVERNANCE_CANISTER_ID,
      });

      // Get top neurons by stake
      const neuronsResponse: any = await governance.list_neurons({
        limit: limit,
        start_page_at: [],
      });

      const leaderboard: TokenBalance[] = neuronsResponse.neurons.map((neuron: any, index: number) => ({
        userId: `Neuron ${index + 1}`,
        balance: Number(neuron.stake_e8s) / 100_000_000,
        earned: { transactions: 0, agentActivity: 0, referrals: 0, staking: 0 },
        locked: Number(neuron.stake_e8s) / 100_000_000,
        lastUpdated: new Date(),
      }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
}
