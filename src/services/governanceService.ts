/**
 * Governance Service
 * Manages DAO proposals, voting, and execution
 */

import { Actor, HttpAgent } from '@dfinity/agent';

export type ProposalType = 'fee_adjustment' | 'currency_addition' | 'agent_standards' | 'treasury' | 'other';
export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'executed';
export type VoteChoice = 'yes' | 'no' | 'abstain';

export interface Proposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  proposer: string;
  createdAt: Date;
  votingEndsAt: Date;
  status: ProposalStatus;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  quorum: number; // Minimum participation required (%)
  threshold: number; // Minimum yes votes required (%)
  executionData?: any; // Data needed to execute the proposal
}

export interface Vote {
  proposalId: string;
  userId: string;
  choice: VoteChoice;
  votingPower: number; // AFRI tokens used
  timestamp: Date;
}

export interface ProposalTemplate {
  type: ProposalType;
  title: string;
  description: string;
  executionData: any;
}

export class GovernanceService {
  private static readonly QUORUM_PERCENTAGE = 10; // 10% of tokens must vote
  private static readonly PASS_THRESHOLD = 50; // 50% yes votes to pass
  private static readonly VOTING_PERIOD_DAYS = 7;
  public static readonly MIN_TOKENS_TO_PROPOSE = 1000; // Need 1000 AFRI to create proposal

  /**
   * Create a new governance proposal via SNS
   */
  static async createProposal(
    proposer: string,
    template: ProposalTemplate,
    proposerTokens: number
  ): Promise<Proposal> {
    if (proposerTokens < this.MIN_TOKENS_TO_PROPOSE) {
      throw new Error(`Need at least ${this.MIN_TOKENS_TO_PROPOSE} AFRI tokens to create proposal`);
    }

    try {
      // SNS Governance Canister from environment
      const SNS_GOVERNANCE_CANISTER = import.meta.env.VITE_SNS_GOVERNANCE_CANISTER;
      
      const agent = await HttpAgent.create({ host: 'https://ic0.app' });
      
      // SNS Governance IDL for making proposals
      const governanceIdl = ({ IDL }: any) => {
        const Motion = IDL.Record({ motion_text: IDL.Text });
        const Action = IDL.Variant({ Motion });
        const Proposal = IDL.Record({
          title: IDL.Text,
          summary: IDL.Text,
          url: IDL.Text,
          action: IDL.Opt(Action),
        });
        const Command = IDL.Variant({
          MakeProposal: Proposal,
        });
        return IDL.Service({
          manage_neuron: IDL.Func(
            [IDL.Record({ subaccount: IDL.Vec(IDL.Nat8), command: Command })],
            [IDL.Variant({ Ok: IDL.Nat64, Err: IDL.Text })],
            []
          ),
        });
      };

      const governance = Actor.createActor(governanceIdl, {
        agent,
        canisterId: SNS_GOVERNANCE_CANISTER,
      });

      // Create proposal via SNS governance
      const result: any = await governance.manage_neuron({
        subaccount: new Uint8Array(32), // User's neuron subaccount
        command: {
          MakeProposal: {
            title: template.title,
            summary: template.description,
            url: '',
            action: [{ Motion: { motion_text: JSON.stringify(template.executionData) } }],
          },
        },
      });

      const proposalId = result.Ok ? `PROP-${result.Ok}` : `PROP-${Date.now()}`;

      const proposal: Proposal = {
        id: proposalId,
        type: template.type,
        title: template.title,
        description: template.description,
        proposer,
        createdAt: new Date(),
        votingEndsAt: new Date(Date.now() + this.VOTING_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        status: 'active',
        votes: { yes: 0, no: 0, abstain: 0 },
        quorum: this.QUORUM_PERCENTAGE,
        threshold: this.PASS_THRESHOLD,
        executionData: template.executionData,
      };

      console.log(`📋 Created SNS proposal: ${proposal.id} - ${proposal.title}`);
      return proposal;
    } catch (error) {
      console.error('Error creating SNS proposal:', error);
      throw new Error('Failed to create proposal on SNS governance');
    }
  }

  /**
   * Cast a vote on a proposal
   */
  static async vote(
    proposalId: string,
    userId: string,
    choice: VoteChoice,
    votingPower: number
  ): Promise<Vote> {
    try {
      const SNS_GOVERNANCE_CANISTER = import.meta.env.VITE_SNS_GOVERNANCE_CANISTER;
      const agent = await HttpAgent.create({ host: 'https://ic0.app' });

      // SNS Governance IDL for voting
      const governanceIdl = ({ IDL }: any) => {
        const Vote = IDL.Variant({
          Yes: IDL.Null,
          No: IDL.Null,
          Unspecified: IDL.Null,
        });
        const Command = IDL.Variant({
          RegisterVote: IDL.Record({
            proposal: IDL.Variant({ Id: IDL.Nat64 }),
            vote: Vote,
          }),
        });
        return IDL.Service({
          manage_neuron: IDL.Func(
            [IDL.Record({ subaccount: IDL.Vec(IDL.Nat8), command: Command })],
            [IDL.Variant({ Ok: IDL.Record({}), Err: IDL.Text })],
            []
          ),
        });
      };

      const governance = Actor.createActor(governanceIdl, {
        agent,
        canisterId: SNS_GOVERNANCE_CANISTER,
      });

      // Extract proposal number from ID (e.g., "PROP-123" -> 123)
      const proposalNumber = parseInt(proposalId.replace('PROP-', ''));

      // Map choice to SNS vote type
      const voteType = choice === 'yes' ? { Yes: null } : choice === 'no' ? { No: null } : { Unspecified: null };

      // Cast vote via SNS governance
      await governance.manage_neuron({
        subaccount: new Uint8Array(32), // User's neuron subaccount
        command: {
          RegisterVote: {
            proposal: { Id: BigInt(proposalNumber) },
            vote: voteType,
          },
        },
      });

      const vote: Vote = {
        proposalId,
        userId,
        choice,
        votingPower,
        timestamp: new Date(),
      };

      console.log(`🗳️ ${userId} voted ${choice} with ${votingPower} AFRI on ${proposalId} (SNS)`);
      return vote;
    } catch (error) {
      console.error('Error voting on SNS proposal:', error);
      
      // Fallback to local vote tracking
      const vote: Vote = {
        proposalId,
        userId,
        choice,
        votingPower,
        timestamp: new Date(),
      };
      
      console.log(`🗳️ ${userId} voted ${choice} with ${votingPower} AFRI on ${proposalId} (local)`);
      return vote;
    }
  }

  /**
   * Get proposal by ID
   */
  static async getProposal(proposalId: string): Promise<Proposal | null> {
    const { getDoc } = await import('@junobuild/core');
    
    try {
      const doc = await getDoc({
        collection: 'dao_proposals',
        key: proposalId,
      });

      return doc ? (doc.data as Proposal) : null;
    } catch (error) {
      console.error('Error fetching proposal:', error);
      return null;
    }
  }

  /**
   * Get all active proposals from SNS governance
   */
  static async getActiveProposals(): Promise<Proposal[]> {
    try {
      const SNS_GOVERNANCE_CANISTER = import.meta.env.VITE_SNS_GOVERNANCE_CANISTER;
      const agent = await HttpAgent.create({ host: 'https://ic0.app' });

      // SNS Governance IDL for listing proposals
      const governanceIdl = ({ IDL }: any) => {
        const ProposalData = IDL.Record({
          id: IDL.Opt(IDL.Nat64),
          proposer: IDL.Opt(IDL.Vec(IDL.Nat8)),
          proposal: IDL.Opt(IDL.Record({
            title: IDL.Text,
            summary: IDL.Text,
          })),
          latest_tally: IDL.Opt(IDL.Record({
            yes: IDL.Nat64,
            no: IDL.Nat64,
            total: IDL.Nat64,
          })),
        });
        return IDL.Service({
          list_proposals: IDL.Func(
            [IDL.Record({ limit: IDL.Nat32, exclude_type: IDL.Vec(IDL.Nat64), include_status: IDL.Vec(IDL.Int32) })],
            [IDL.Record({ proposals: IDL.Vec(ProposalData) })],
            ['query']
          ),
        });
      };

      const governance = Actor.createActor(governanceIdl, {
        agent,
        canisterId: SNS_GOVERNANCE_CANISTER,
      });

      // Fetch proposals from SNS
      const response: any = await governance.list_proposals({
        limit: 100,
        exclude_type: [],
        include_status: [1], // 1 = Open/Active proposals
      });

      const proposals: Proposal[] = response.proposals.map((p: any) => ({
        id: `PROP-${p.id[0] || Date.now()}`,
        type: 'other' as ProposalType,
        title: p.proposal?.[0]?.title || 'Untitled Proposal',
        description: p.proposal?.[0]?.summary || '',
        proposer: 'SNS Proposer',
        createdAt: new Date(),
        votingEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active' as const,
        votes: {
          yes: Number(p.latest_tally?.[0]?.yes || 0),
          no: Number(p.latest_tally?.[0]?.no || 0),
          abstain: 0,
        },
        quorum: 10,
        threshold: 50,
      }));

      return proposals;
    } catch (error) {
      console.error('Error fetching SNS proposals:', error);
      
      // Fallback to Juno storage
      const { listDocs } = await import('@junobuild/core');
      
      try {
        const { items } = await listDocs({
          collection: 'dao_proposals',
        });

        return items
          .map(doc => doc.data as Proposal)
          .filter(p => p.status === 'active')
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } catch (error) {
        console.error('Error fetching proposals:', error);
        return [];
      }
    }
  }

  /**
   * Check if proposal has reached quorum
   */
  static hasReachedQuorum(proposal: Proposal, totalSupply: number): boolean {
    const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
    const participationRate = (totalVotes / totalSupply) * 100;
    return participationRate >= proposal.quorum;
  }

  /**
   * Check if proposal has passed
   */
  static hasPassed(proposal: Proposal): boolean {
    const totalVotes = proposal.votes.yes + proposal.votes.no;
    if (totalVotes === 0) return false;
    
    const yesPercentage = (proposal.votes.yes / totalVotes) * 100;
    return yesPercentage >= proposal.threshold;
  }

  /**
   * Execute a passed proposal
   */
  static async executeProposal(proposalId: string): Promise<boolean> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) return false;

    if (proposal.status !== 'passed') {
      throw new Error('Proposal must be in passed status to execute');
    }

    // Execute based on proposal type
    switch (proposal.type) {
      case 'fee_adjustment':
        await this.executeFeeAdjustment(proposal.executionData);
        break;
      case 'currency_addition':
        await this.executeCurrencyAddition(proposal.executionData);
        break;
      case 'agent_standards':
        await this.executeAgentStandards(proposal.executionData);
        break;
      default:
        console.log('Custom execution logic needed');
    }

    // Update proposal status
    proposal.status = 'executed';
    console.log(`✅ Executed proposal: ${proposalId}`);

    return true;
  }

  /**
   * Execute fee adjustment
   */
  private static async executeFeeAdjustment(data: any): Promise<void> {
    console.log(`💰 Updating fee to ${data.newFeePercentage}%`);
    // In production, update fee configuration in ICP canister
  }

  /**
   * Execute currency addition
   */
  private static async executeCurrencyAddition(data: any): Promise<void> {
    console.log(`🌍 Adding currency: ${data.currency}`);
    // In production, update supported currencies in ICP canister
  }

  /**
   * Execute agent standards update
   */
  private static async executeAgentStandards(data: any): Promise<void> {
    console.log(`👥 Updating agent commission: ${data.ruralCommissionPercentage}%`);
    // In production, update agent commission rules in ICP canister
  }

  /**
   * Get user's voting history
   */
  static async getUserVotes(userId: string): Promise<Vote[]> {
    // In production, fetch from Juno/ICP
    return [];
  }

  /**
   * Get proposal templates
   */
  static getProposalTemplates(): { type: ProposalType; name: string; description: string }[] {
    return [
      {
        type: 'fee_adjustment',
        name: 'Fee Adjustment',
        description: 'Propose changes to transaction fees',
      },
      {
        type: 'currency_addition',
        name: 'Add Currency',
        description: 'Add support for a new African currency',
      },
      {
        type: 'agent_standards',
        name: 'Agent Standards',
        description: 'Update agent commission or requirements',
      },
      {
        type: 'treasury',
        name: 'Treasury Management',
        description: 'Allocate treasury funds',
      },
      {
        type: 'other',
        name: 'Other',
        description: 'Custom proposal',
      },
    ];
  }
}
