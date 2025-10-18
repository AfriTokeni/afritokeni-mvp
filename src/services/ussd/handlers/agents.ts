/**
 * Agent Finder Handler
 * Handles finding and displaying available agents
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { WebhookDataService as DataService, Agent } from '../../webHookServices.js';
import { TranslationService } from '../../translations.js';

/**
 * Handle find agent - show available agents
 */
export async function handleFindAgent(input: string, session: USSDSession, handleLocalCurrency: any): Promise<string> {
  const lang = session.language || 'en';
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  try {
    // Get list of available agents
    const agents = await DataService.getAvailableAgents();
    const availableAgents = agents.filter((agent: Agent) => agent.isActive);
    
    if (availableAgents.length === 0) {
      return endSession(`No agents available at this time.

Please try again later.

Thank you for using AfriTokeni!`);
    }
    
    let agentList = `Find Agent

Available agents near you:

`;
    
    availableAgents.slice(0, 5).forEach((agent: Agent, index: number) => {
      agentList += `${index + 1}. ${agent.businessName}
   ${agent.location?.city || 'Location'}, ${agent.location?.address || ''}

`;
    });
    
    agentList += `For directions or to contact agents directly, visit them at their listed locations.

0. Back to Local Currency Menu`;
    
    if (!currentInput) {
      return continueSession(agentList);
    }
    
    if (currentInput === '0') {
      session.currentMenu = 'local_currency';
      session.step = 0;
      return handleLocalCurrency('', session);
    }
    
    // If user selects an agent number, show detailed info
    const agentChoice = parseInt(currentInput);
    if (!isNaN(agentChoice) && agentChoice >= 1 && agentChoice <= availableAgents.length) {
      const selectedAgent = availableAgents[agentChoice - 1];
      return endSession(`Agent Details

${selectedAgent.businessName}
Location: ${selectedAgent.location?.city || 'Location'}
Address: ${selectedAgent.location?.address || 'N/A'}

Services:
- Deposit money
- Withdraw money
- Buy/Sell Bitcoin

Visit the agent at their location for assistance.

Thank you for using AfriTokeni!`);
    }
    
    return continueSession(`Invalid selection.
${agentList}\n\n${TranslationService.translate('back_or_menu', lang)}`);
    
  } catch (error) {
    console.error('Error getting agents:', error);
    return endSession(`Error loading agents.
Please try again later.

Thank you for using AfriTokeni!`);
  }
}
