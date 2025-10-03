/**
 * Governance Service
 * Manages DAO proposals, voting, and execution
 */

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
  private static readonly MIN_TOKENS_TO_PROPOSE = 1000; // Need 1000 AFRI to create proposal

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

    // TODO: Create proposal via SNS governance canister
    // const governance = Actor.createActor(governanceIdl, {
    //   agent,
    //   canisterId: SNS_GOVERNANCE_CANISTER_ID,
    // });
    // const proposalId = await governance.manage_neuron({
    //   command: [{
    //     MakeProposal: {
    //       title: template.title,
    //       summary: template.description,
    //       action: [{ Motion: { motion_text: JSON.stringify(template.executionData) } }]
    //     }
    //   }]
    // });

    const proposal: Proposal = {
      id: `PROP-${Date.now()}`,
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
    const vote: Vote = {
      proposalId,
      userId,
      choice,
      votingPower,
      timestamp: new Date(),
    };

    // In production, save to Juno/ICP and update proposal
    console.log(`🗳️ ${userId} voted ${choice} with ${votingPower} AFRI on ${proposalId}`);

    return vote;
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
   * Get all active proposals
   */
  static async getActiveProposals(): Promise<Proposal[]> {
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
