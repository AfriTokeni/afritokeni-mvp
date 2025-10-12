/**
 * DAO Demo Data Service
 * Provides mock data for DAO governance in demo mode
 */

import { TokenBalance } from './afriTokenService';
import { Proposal } from './governanceService';

export class DaoDemoDataService {
  static getDemoTokenBalance(): TokenBalance {
    return {
      userId: 'demo-user',
      balance: 5420,
      earned: {
        transactions: 1250,
        agentActivity: 2800,
        referrals: 1000,
        staking: 370,
      },
      locked: 500,
      lastUpdated: new Date(),
    };
  }

  static getDemoProposals(): Proposal[] {
    return [
      {
        id: 'DEMO-001',
        type: 'fee_adjustment',
        title: 'Reduce Transaction Fees for Rural Areas',
        description: 'Proposal to reduce transaction fees from 2.5% to 1.5% for rural and remote areas to increase financial inclusion and make AfriTokeni more accessible to underserved communities.',
        proposer: 'Community Member #1247',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        votingEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'active',
        votes: {
          yes: 125000,
          no: 45000,
          abstain: 12000,
        },
        quorum: 10,
        threshold: 50,
        executionData: {
          newFeePercentage: 1.5,
          applicableRegions: ['rural', 'remote'],
        },
      },
      {
        id: 'DEMO-002',
        type: 'currency_addition',
        title: 'Add Support for Rwandan Franc (RWF)',
        description: 'Expand AfriTokeni services to Rwanda by adding support for Rwandan Franc (RWF). This will enable 8.5M additional users to access Bitcoin banking services.',
        proposer: 'Agent Network Lead',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        votingEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'active',
        votes: {
          yes: 98000,
          no: 15000,
          abstain: 8000,
        },
        quorum: 10,
        threshold: 50,
        executionData: {
          currencyCode: 'RWF',
          currencyName: 'Rwandan Franc',
          currencySymbol: 'FRw',
          exchangeRate: 0.00082,
        },
      },
      {
        id: 'DEMO-003',
        type: 'agent_standards',
        title: 'Increase Agent Commission for Bitcoin Exchanges',
        description: 'Increase agent commission for Bitcoin exchange transactions from 2% to 3% to incentivize more agents to offer Bitcoin services and improve liquidity.',
        proposer: 'Agent Association',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        votingEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: 'active',
        votes: {
          yes: 67000,
          no: 89000,
          abstain: 5000,
        },
        quorum: 10,
        threshold: 50,
        executionData: {
          bitcoinCommissionPercentage: 3,
          applicableServices: ['bitcoin_buy', 'bitcoin_sell'],
        },
      },
    ];
  }

  static getDemoLeaderboard(): any[] {
    return [
      {
        rank: 1,
        name: 'Agent Network Uganda',
        userId: 'agent-network-001',
        balance: 245000,
        proposalsCreated: 12,
        votesParticipated: 47,
        votingPower: '24.5%',
      },
      {
        rank: 2,
        name: 'Community Treasury',
        userId: 'treasury-001',
        balance: 180000,
        proposalsCreated: 5,
        votesParticipated: 52,
        votingPower: '18.0%',
      },
      {
        rank: 3,
        name: 'Early Adopter #0042',
        userId: 'user-0042',
        balance: 125000,
        proposalsCreated: 8,
        votesParticipated: 45,
        votingPower: '12.5%',
      },
      {
        rank: 4,
        name: 'Kampala Agents Collective',
        userId: 'agent-collective-kampala',
        balance: 98000,
        proposalsCreated: 3,
        votesParticipated: 38,
        votingPower: '9.8%',
      },
      {
        rank: 5,
        name: 'Mobile Money Pioneer',
        userId: 'user-1337',
        balance: 87000,
        proposalsCreated: 15,
        votesParticipated: 51,
        votingPower: '8.7%',
      },
      {
        rank: 6,
        name: 'Bitcoin Advocate UG',
        userId: 'btc-advocate-001',
        balance: 72000,
        proposalsCreated: 9,
        votesParticipated: 42,
        votingPower: '7.2%',
      },
      {
        rank: 7,
        name: 'Rural Agent Network',
        userId: 'rural-agents-001',
        balance: 65000,
        proposalsCreated: 4,
        votesParticipated: 35,
        votingPower: '6.5%',
      },
      {
        rank: 8,
        name: 'Financial Inclusion DAO',
        userId: 'fi-dao-001',
        balance: 58000,
        proposalsCreated: 7,
        votesParticipated: 48,
        votingPower: '5.8%',
      },
      {
        rank: 9,
        name: 'SMS Banking Enthusiast',
        userId: 'user-sms-789',
        balance: 45000,
        proposalsCreated: 2,
        votesParticipated: 29,
        votingPower: '4.5%',
      },
      {
        rank: 10,
        name: 'Agent #2048',
        userId: 'agent-2048',
        balance: 38000,
        proposalsCreated: 1,
        votesParticipated: 31,
        votingPower: '3.8%',
      },
    ];
  }

  static getTotalHolders(): number {
    return 2847;
  }

  static getTotalSupply(): number {
    return 1_000_000_000;
  }
}
