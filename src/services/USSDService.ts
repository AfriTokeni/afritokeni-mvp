import { nanoid } from 'nanoid';
import { getDoc, setDoc } from '@junobuild/core';
import { RateLimiter } from './rateLimiter';

export interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  currentMenu: string;
  data: Record<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

export class USSDService {
  static async createUSSDSession(sessionId: string, phoneNumber: string): Promise<USSDSession> {
    const rateLimitCheck = RateLimiter.isAllowed(phoneNumber, 'ussd');
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || 'USSD rate limit exceeded');
    }

    const now = new Date();
    const session: USSDSession = {
      sessionId,
      phoneNumber,
      currentMenu: 'main',
      data: {},
      createdAt: now,
      lastActivity: now
    };

    const dataForJuno = {
      ...session,
      createdAt: now.toISOString(),
      lastActivity: now.toISOString()
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
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        lastActivity: new Date(data.lastActivity)
      };
    } catch (error) {
      console.error('Error getting USSD session:', error);
      return null;
    }
  }

  static async updateUSSDSession(sessionId: string, updates: Partial<USSDSession>): Promise<boolean> {
    try {
      const existingSession = await this.getUSSDSession(sessionId);
      if (!existingSession) return false;

      const now = new Date();
      const updated = {
        ...existingSession,
        ...updates,
        lastActivity: now
      };

      const dataForJuno = {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        lastActivity: now.toISOString()
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

      const input = text.trim();

      if (input === '' || input === '*229#') {
        return {
          response: this.getMainMenu(),
          continueSession: true
        };
      }

      if (session.currentMenu === 'main') {
        return this.handleMainMenuSelection(session, input);
      }

      return {
        response: 'Invalid selection. Please try again.',
        continueSession: true
      };
    } catch (error: any) {
      if (error.message.includes('rate limit')) {
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
