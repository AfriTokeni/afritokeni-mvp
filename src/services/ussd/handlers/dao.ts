/**
 * DAO Governance Handler
 * Handles USSD DAO voting and governance
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { WebhookDataService as DataService } from '../../webHookServices.js';
import { TranslationService } from '../../translations.js';

interface Proposal {
  id: string;
  title: string;
  description: string;
  votingEndsAt: Date;
  status: string;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
}

/**
 * Handle DAO Governance menu
 */
export async function handleDAO(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  const lang = session.language || 'en';
  
  // If we're already in a sub-menu, route to the appropriate handler
  const menu = session.currentMenu as string;
  if (menu === 'dao_proposals') {
    return handleViewProposals(input, session);
  }
  if (menu === 'dao_voting_power') {
    return handleVotingPower(input, session);
  }
  if (menu === 'dao_active_votes') {
    return handleActiveVotes(input, session);
  }
  
  if (!input || sanitized_input === '') {
    return continueSession(`DAO Governance

1. View Proposals
2. My Voting Power
3. Active Votes
0. Back to Main Menu`);
  }
  
  switch (sanitized_input) {
    case '1':
      if (menu !== 'dao_proposals') {
        session.currentMenu = 'dao_proposals' as any;
        session.step = 0;
      }
      return handleViewProposals('', session);
    
    case '2':
      if (menu !== 'dao_voting_power') {
        session.currentMenu = 'dao_voting_power' as any;
        session.step = 0;
      }
      return handleVotingPower('', session);
    
    case '3':
      if (menu !== 'dao_active_votes') {
        session.currentMenu = 'dao_active_votes' as any;
        session.step = 0;
      }
      return handleActiveVotes('', session);
    
    case '0':
      session.currentMenu = 'main';
      session.step = 0;
      session.data = {};
      return continueSession(`AfriTokeni Main Menu
1. Local Currency (UGX)
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. DAO Governance
0. Exit`);
    
    default:
      return continueSession(`Invalid option.

DAO Governance
1. View Proposals
2. My Voting Power
3. Active Votes
0. Back to Main Menu`);
  }
}

/**
 * Handle viewing proposals
 */
async function handleViewProposals(input: string, session: USSDSession): Promise<string> {
  const inputParts = input.split('*');
  const sanitized_input = inputParts[inputParts.length - 1] || '';
  
  // Step 0: Show list of proposals
  if (session.step === 0) {
    // Mock proposals for now - will integrate with GovernanceService later
    const proposals: Proposal[] = [
      {
        id: 'PROP-1',
        title: 'Increase Agent Commission',
        description: 'Increase agent commission from 2% to 3%',
        votingEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
        votes: { yes: 10000, no: 5000, abstain: 1000 }
      },
      {
        id: 'PROP-2',
        title: 'Add New Currency Support',
        description: 'Add support for Kenyan Shilling (KES)',
        votingEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'active',
        votes: { yes: 8000, no: 2000, abstain: 500 }
      }
    ];
    
    session.data.proposals = proposals;
    session.step = 1;
    
    const lang = session.language || 'en';
    let response = `Active Proposals\n\n`;
    proposals.forEach((prop, index) => {
      response += `${index + 1}. ${prop.title}\n`;
    });
    response += `\n${TranslationService.translate('press_zero_back', lang)}`;
    
    return continueSession(response);
  }
  
  // Step 1: Show proposal details
  if (session.step === 1) {
    if (sanitized_input === '0') {
      session.currentMenu = 'dao';
      session.step = 0;
      return handleDAO('', session);
    }
    
    const proposalIndex = parseInt(sanitized_input) - 1;
    const proposals = session.data.proposals || [];
    
    if (proposalIndex < 0 || proposalIndex >= proposals.length) {
      return continueSession(`Invalid proposal number.

Reply with number (1-${proposals.length})
0. Back`);
    }
    
    const proposal = proposals[proposalIndex];
    session.data.selectedProposal = proposal;
    session.step = 2;
    
    // Check if already voted
    const userVotes = session.data.userVotes || [];
    const existingVote = userVotes.find((v: any) => v.proposalId === proposal.id);
    
    if (existingVote) {
      return endSession(`Already voted on this proposal!

Your vote: ${existingVote.choice.toUpperCase()}
Amount: ${existingVote.amount} AFRI

Thank you for participating in governance!`);
    }
    
    // Handle date conversion (Juno stores dates as ISO strings)
    const votingEndsAt = typeof proposal.votingEndsAt === 'string' 
      ? new Date(proposal.votingEndsAt) 
      : proposal.votingEndsAt;
    const daysLeft = Math.ceil((votingEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    
    const lang = session.language || 'en';
    return continueSession(`${proposal.title}

${proposal.description}

Voting ends in ${daysLeft} days

Current votes:
YES: ${proposal.votes.yes}
NO: ${proposal.votes.no}
ABSTAIN: ${proposal.votes.abstain}

1. Vote YES
2. Vote NO
3. Vote ABSTAIN

${TranslationService.translate('press_zero_back', lang)}`);
  }
  
  // Step 2: Select vote choice
  if (session.step === 2) {
    if (sanitized_input === '0') {
      session.step = 0;
      return handleViewProposals('', session);
    }
    
    let choice: string;
    switch (sanitized_input) {
      case '1':
        choice = 'yes';
        break;
      case '2':
        choice = 'no';
        break;
      case '3':
        choice = 'abstain';
        break;
      default:
        return continueSession(`Invalid option.

1. Vote YES
2. Vote NO
3. Vote ABSTAIN
0. Back`);
    }
    
    session.data.voteChoice = choice;
    session.step = 3;
    
    const afriTokens = session.data.afriTokens || 5000;
    const lockedTokens = session.data.lockedTokens || 0;
    const available = afriTokens - lockedTokens;
    
    const lang = session.language || 'en';
    return continueSession(`Vote ${choice.toUpperCase()}

Available: ${available} AFRI
Locked: ${lockedTokens} AFRI

Enter amount to vote (min 1 AFRI):

${TranslationService.translate('press_zero_back', lang)}`);
  }
  
  // Step 3: Enter voting amount
  if (session.step === 3) {
    const amount = parseInt(sanitized_input);
    
    // Validate amount first (0 is invalid, not cancel)
    if (isNaN(amount) || amount < 1) {
      return continueSession(`Invalid amount.
Minimum: 1 AFRI

Enter amount to vote:`);
    }
    
    const afriTokens = session.data.afriTokens || 5000;
    const lockedTokens = session.data.lockedTokens || 0;
    const available = afriTokens - lockedTokens;
    
    if (amount > available) {
      return continueSession(`Insufficient tokens!

Available: ${available} AFRI
Requested: ${amount} AFRI

Enter amount to vote:`);
    }
    
    session.data.voteAmount = amount;
    session.step = 4;
    
    return continueSession(`Confirm Vote

Proposal: ${session.data.selectedProposal.title}
Vote: ${session.data.voteChoice.toUpperCase()}
Amount: ${amount} AFRI

Enter your 4-digit PIN to confirm:`);
  }
  
  // Step 4: PIN verification and vote submission
  if (session.step === 4) {
    if (!/^\d{4}$/.test(sanitized_input)) {
      return continueSession('Invalid PIN format.\nEnter your 4-digit PIN:');
    }
    
    // Verify PIN (verifyUserPin adds + prefix internally)
    const phoneNumber = session.phoneNumber.replace(/^\+/, '');
    const pinCorrect = await DataService.verifyUserPin(phoneNumber, sanitized_input);
    if (!pinCorrect) {
      return continueSession('Incorrect PIN.\nEnter your 4-digit PIN:');
    }
    
    // Record vote
    const vote = {
      proposalId: session.data.selectedProposal.id,
      choice: session.data.voteChoice,
      amount: session.data.voteAmount,
      timestamp: new Date()
    };
    
    if (!session.data.userVotes) {
      session.data.userVotes = [];
    }
    session.data.userVotes.push(vote);
    
    // Update locked tokens
    session.data.lockedTokens = (session.data.lockedTokens || 0) + session.data.voteAmount;
    
    return endSession(`✅ Vote Successful!

Voted ${vote.choice.toUpperCase()} on:
${session.data.selectedProposal.title}

Amount: ${vote.amount} AFRI

Your vote is locked until proposal ends.

Thank you for participating in AfriTokeni governance!`);
  }
  
  return endSession('Error processing request. Please try again.');
}

/**
 * Handle viewing voting power
 */
async function handleVotingPower(input: string, session: USSDSession): Promise<string> {
  const lang = session.language || 'en';
  const afriTokens = session.data.afriTokens || 5000;
  const lockedTokens = session.data.lockedTokens || 0;
  const available = afriTokens - lockedTokens;
  
  // Handle menu navigation
  if (input && input.trim() !== '') {
    if (input.trim() === '9') {
      // Show DAO menu
      session.currentMenu = 'dao';
      session.step = 0;
      return continueSession('__SHOW_DAO_MENU__');
    }
    // Any other input goes back to DAO menu
    session.currentMenu = 'dao';
    session.step = 0;
    return continueSession('__SHOW_DAO_MENU__');
  }
  
  return continueSession(`Your Voting Power

${afriTokens} AFRI
${lockedTokens} AFRI locked

Available: ${available} AFRI

Locked tokens released when proposals end.

${TranslationService.translate('back_or_menu', lang)}`);
}

/**
 * Handle viewing active votes
 */
async function handleActiveVotes(input: string, session: USSDSession): Promise<string> {
  const lang = session.language || 'en';
  const userVotes = session.data.userVotes || [];
  const lockedTokens = session.data.lockedTokens || 0;
  
  // Handle navigation
  if (input && input.trim() !== '') {
    if (input.trim() === '9') {
      // Show DAO menu
      session.currentMenu = 'dao';
      session.step = 0;
      return continueSession('__SHOW_DAO_MENU__');
    }
    // Any other input (including 0) goes back to DAO menu
    session.currentMenu = 'dao';
    session.step = 0;
    return continueSession('__SHOW_DAO_MENU__');
  }
  
  if (userVotes.length === 0) {
    return continueSession(`Your Active Votes

You have no active votes.

Vote on proposals to participate in governance!

${TranslationService.translate('back_or_menu', lang)}`);
  }
  
  let response = `Your Active Votes\n\n`;
  response += `${userVotes.length} active votes\n`;
  response += `Total locked: ${lockedTokens} AFRI\n\n`;
  
  userVotes.forEach((vote: any, index: number) => {
    response += `${index + 1}. ${vote.choice.toUpperCase()} - ${vote.amount} AFRI\n`;
  });
  
  response += `\nThank you for participating in governance!`;
  
  return endSession(response);
}
