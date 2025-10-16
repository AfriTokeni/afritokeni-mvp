import { nanoid } from 'nanoid';
import { getDoc, setDoc } from '@junobuild/core';
import { RateLimiter } from './rateLimiter';
import { USSDSessionImpl } from './ussd/types';
import type { USSDSession } from './ussd/types';
import { handleMainMenu } from './ussd/handlers/mainMenu';
import { handleLocalCurrency } from './ussd/handlers/localCurrency';
import { handleBitcoin, handleBTCBalance, handleBTCRate } from './ussd/handlers/bitcoin';
import { handleSendMoney } from './ussd/handlers/sendMoney';
import { handleWithdraw } from './ussd/handlers/withdraw';
import { handleDeposit } from './ussd/handlers/deposit';
import { handleFindAgent } from './ussd/handlers/agents';
import { handleDAO } from './ussd/handlers/dao';

// Re-export for backward compatibility
export type { USSDSession };

export class USSDService {
  static async createUSSDSession(sessionId: string, phoneNumber: string): Promise<USSDSession> {
    const rateLimitCheck = RateLimiter.isAllowed(phoneNumber, 'ussd');
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || 'USSD rate limit exceeded');
    }

    // Use the proper USSDSessionImpl class
    const session = new USSDSessionImpl(sessionId, phoneNumber);
    
    // USSD sessions start at main menu (not registration_check)
    session.currentMenu = 'main';

    const dataForJuno = {
      sessionId: session.sessionId,
      phoneNumber: session.phoneNumber,
      currentMenu: session.currentMenu,
      data: session.data,
      step: session.step,
      lastActivity: session.lastActivity
    };

    await setDoc({
      collection: 'ussd_sessions',
      doc: {
        key: sessionId,
        data: dataForJuno
      }
    });

    return session;
  }

  static async getUSSDSession(sessionId: string): Promise<USSDSession | null> {
    try {
      const doc = await getDoc({
        collection: 'ussd_sessions',
        key: sessionId
      });

      if (!doc?.data) return null;

      const data = doc.data as any;
      
      // Reconstruct the session object with proper methods
      const session = new USSDSessionImpl(data.sessionId, data.phoneNumber);
      session.currentMenu = data.currentMenu;
      session.data = data.data || {};
      session.step = data.step || 0;
      session.lastActivity = data.lastActivity || Date.now();
      
      return session;
    } catch (error) {
      console.error('Error getting USSD session:', error);
      return null;
    }
  }

  static async updateUSSDSession(sessionId: string, updates: Partial<USSDSession>): Promise<boolean> {
    try {
      const existingSession = await this.getUSSDSession(sessionId);
      if (!existingSession) return false;

      // Update the session
      if (updates.currentMenu) existingSession.currentMenu = updates.currentMenu;
      if (updates.data) existingSession.data = { ...existingSession.data, ...updates.data };
      if (updates.step !== undefined) existingSession.step = updates.step;
      if (updates.lastActivity !== undefined) existingSession.lastActivity = updates.lastActivity;
      
      // Update activity only if not explicitly set
      if (updates.lastActivity === undefined) {
        existingSession.updateActivity();
      }

      const dataForJuno = {
        sessionId: existingSession.sessionId,
        phoneNumber: existingSession.phoneNumber,
        currentMenu: existingSession.currentMenu,
        data: existingSession.data,
        step: existingSession.step,
        lastActivity: existingSession.lastActivity
      };

      const existingDoc = await getDoc({
        collection: 'ussd_sessions',
        key: sessionId
      });

      await setDoc({
        collection: 'ussd_sessions',
        doc: {
          key: sessionId,
          data: dataForJuno,
          version: existingDoc?.version || 1n
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating USSD session:', error);
      return false;
    }
  }

  static async processUSSDRequest(
    sessionId: string,
    phoneNumber: string,
    text: string
  ): Promise<{ response: string; continueSession: boolean }> {
    try {
      let session = await this.getUSSDSession(sessionId);

      if (!session) {
        session = await this.createUSSDSession(sessionId, phoneNumber);
      }
      
      // Check if session expired
      if (session.isExpired()) {
        return {
          response: 'END Session expired. Please dial *229# again to start a new session.',
          continueSession: false
        };
      }
      
      // Update activity
      session.updateActivity();

      const input = text.trim();

      // Route to appropriate handler based on current menu
      let response: string;
      
      console.log(`🔀 Routing: menu=${session.currentMenu}, input="${input}"`);
      
      switch (session.currentMenu) {
        case 'main':
          response = await handleMainMenu(input, session, handleLocalCurrency, handleBitcoin, async () => 'USDC Menu', handleDAO);
          break;
        
        case 'local_currency':
          response = await handleLocalCurrency(input, session, handleSendMoney, handleDeposit, handleWithdraw, handleFindAgent, async () => this.getMainMenu());
          break;
        
        case 'check_balance':
          // Balance check is handled by localCurrency handler
          response = await handleLocalCurrency(input, session, handleSendMoney, handleDeposit, handleWithdraw, handleFindAgent, async () => this.getMainMenu());
          break;
        
        case 'send_money':
          response = await handleSendMoney(input, session, async () => {});
          break;
        
        case 'withdraw':
          response = await handleWithdraw(input, session, async () => {}, async () => this.getMainMenu());
          break;
        
        case 'deposit':
          response = await handleDeposit(input, session, async () => {});
          break;
        
        case 'find_agent':
          response = await handleFindAgent(input, session, handleLocalCurrency);
          break;
        
        case 'bitcoin':
          response = await handleBitcoin(input, session);
          break;
        
        case 'btc_balance':
          response = await handleBTCBalance(input, session);
          break;
        
        case 'btc_rate':
          response = await handleBTCRate(input, session);
          break;
        
        case 'dao':
          response = await handleDAO(input, session);
          break;
        
        case 'dao_proposals':
        case 'dao_voting_power':
        case 'dao_active_votes':
          // These are handled by their respective functions via handleDAO
          // but we need to pass the actual input, not route through DAO menu
          response = await handleDAO(input, session);
          break;
        
        default:
          if (input === '' || input === '*229#') {
            response = this.getMainMenu();
          } else {
            response = 'Invalid selection. Please try again.';
          }
      }

      // Save updated session - handlers modify session in place
      console.log(`💾 Saving session: menu=${session.currentMenu}, step=${session.step}`);
      await this.updateUSSDSession(sessionId, {
        currentMenu: session.currentMenu,
        data: session.data,
        step: session.step
      });

      return {
        response,
        continueSession: !response.startsWith('END')
      };
    } catch (error: any) {
      if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
        return {
          response: 'Too many requests. Please wait a moment and try again.',
          continueSession: false
        };
      }
      console.error('Error processing USSD request:', error);
      return {
        response: 'An error occurred. Please try again.',
        continueSession: false
      };
    }
  }

  private static handleMainMenuSelection(
    session: USSDSession,
    input: string
  ): { response: string; continueSession: boolean } {
    switch (input) {
      case '1':
        return {
          response: 'Enter phone number to send money to:',
          continueSession: true
        };
      case '2':
        return {
          response: 'Your balance is UGX 0',
          continueSession: false
        };
      case '3':
        return {
          response: 'Enter amount to withdraw:',
          continueSession: true
        };
      case '4':
        return {
          response: 'Nearest agents:\n1. Kampala Rd - 0.2km\n2. Nakawa - 0.8km',
          continueSession: false
        };
      default:
        return {
          response: 'Invalid selection. Please try again.',
          continueSession: true
        };
    }
  }

  private static getMainMenu(): string {
    return `*229# - AfriTokeni
1. Send Money
2. Check Balance
3. Withdraw Cash
4. Find Agents
5. Bitcoin
0. Help`;
  }
}
