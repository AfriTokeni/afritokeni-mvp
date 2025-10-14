import { nanoid } from 'nanoid';
import { getDoc, setDoc, listDocs } from '@junobuild/core';
import { FraudDetectionService } from './fraudDetection';
import { UserService } from './UserService';
import { AgentService } from './AgentService';
import { TransactionService } from './TransactionService';
import { BalanceService } from './BalanceService';
import { SMSService } from './SMSService';
import { AfriTokenService } from './afritokenService';
import type { AfricanCurrency } from '../types/currency';

export interface DepositRequest {
  id: string;
  userId: string;
  agentId: string;
  amount: number;
  currency: string;
  depositCode: string;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userPhone?: string;
  userLocation?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  agentId: string;
  amount: number;
  currency: string;
  withdrawalCode: string;
  fee: number;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  withdrawalType?: 'digital_balance' | 'ckbtc' | 'ckusdc';
  userName?: string;
  userPhone?: string;
  userLocation?: string;
}

export class DepositWithdrawalService {
  static async createDepositRequest(
    userId: string,
    agentId: string,
    amount: number,
    currency: string
  ): Promise<DepositRequest> {
    const fraudCheck = await FraudDetectionService.checkTransaction(
      userId,
      amount,
      agentId
    );

    if (fraudCheck.isSuspicious && fraudCheck.requiresVerification) {
      throw new Error(`Deposit blocked: ${fraudCheck.reason}`);
    }

    const now = new Date().toISOString();
    const depositCode = `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const request: DepositRequest = {
      id: nanoid(),
      userId,
      agentId,
      amount,
      currency,
      depositCode,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    await setDoc({
      collection: 'deposit_requests',
      doc: {
        key: request.id,
        data: request
      }
    });

    return request;
  }

  static async getAgentDepositRequests(agentId: string, status?: string): Promise<DepositRequest[]> {
    try {
      const docs = await listDocs({
        collection: 'deposit_requests'
      });

      let requests = docs.items.map(doc => doc.data as DepositRequest);

      requests = requests.filter(req => req.agentId === agentId);

      if (status) {
        requests = requests.filter(req => req.status === status);
      }

      return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting agent deposit requests:', error);
      return [];
    }
  }

  static async updateDepositRequestStatus(
    requestId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'rejected'
  ): Promise<boolean> {
    try {
      const doc = await getDoc({
        collection: 'deposit_requests',
        key: requestId
      });

      if (!doc?.data) return false;

      const request = doc.data as DepositRequest;
      const updated = {
        ...request,
        status,
        updatedAt: new Date().toISOString()
      };

      await setDoc({
        collection: 'deposit_requests',
        doc: {
          key: requestId,
          data: updated,
          version: doc.version
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating deposit request status:', error);
      return false;
    }
  }

  static async getDepositRequestByCode(depositCode: string): Promise<DepositRequest | null> {
    try {
      const docs = await listDocs({
        collection: 'deposit_requests'
      });

      const request = docs.items.find(doc => {
        const data = doc.data as DepositRequest;
        return data.depositCode === depositCode;
      });

      return request ? request.data as DepositRequest : null;
    } catch (error) {
      console.error('Error getting deposit request by code:', error);
      return null;
    }
  }

  static async createWithdrawalRequest(
    userId: string,
    agentId: string,
    amount: number,
    currency: string,
    fee: number = 0
  ): Promise<WithdrawalRequest> {
    const fraudCheck = await FraudDetectionService.checkTransaction(
      userId,
      amount,
      agentId
    );

    if (fraudCheck.isSuspicious && fraudCheck.requiresVerification) {
      throw new Error(`Withdrawal blocked: ${fraudCheck.reason}`);
    }

    const now = new Date().toISOString();
    const withdrawalCode = `WD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const request: WithdrawalRequest = {
      id: nanoid(),
      userId,
      agentId,
      amount,
      currency,
      withdrawalCode,
      fee,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    await setDoc({
      collection: 'withdrawal_requests',
      doc: {
        key: request.id,
        data: request
      }
    });

    return request;
  }

  static async getAgentWithdrawalRequests(agentId: string, status?: string): Promise<WithdrawalRequest[]> {
    try {
      const docs = await listDocs({
        collection: 'withdrawal_requests'
      });

      let requests = docs.items.map(doc => doc.data as WithdrawalRequest);

      requests = requests.filter(req => req.agentId === agentId);

      if (status) {
        requests = requests.filter(req => req.status === status);
      }

      return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting agent withdrawal requests:', error);
      return [];
    }
  }

  static async updateWithdrawalRequestStatus(
    requestId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'rejected'
  ): Promise<boolean> {
    try {
      const doc = await getDoc({
        collection: 'withdrawal_requests',
        key: requestId
      });

      if (!doc?.data) return false;

      const request = doc.data as WithdrawalRequest;
      const updated = {
        ...request,
        status,
        updatedAt: new Date().toISOString()
      };

      await setDoc({
        collection: 'withdrawal_requests',
        doc: {
          key: requestId,
          data: updated,
          version: doc.version
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating withdrawal request status:', error);
      return false;
    }
  }

  static async getWithdrawalRequestByCode(withdrawalCode: string): Promise<WithdrawalRequest | null> {
    try {
      const docs = await listDocs({
        collection: 'withdrawal_requests'
      });

      const request = docs.items.find(doc => {
        const data = doc.data as WithdrawalRequest;
        return data.withdrawalCode === withdrawalCode;
      });

      return request ? request.data as WithdrawalRequest : null;
    } catch (error) {
      console.error('Error getting withdrawal request by code:', error);
      return null;
    }
  }

  static async processDepositRequest(
    requestId: string,
    agentId: string,
    processedBy?: string
  ): Promise<{ success: boolean; transactionId?: string; userTransactionId?: string; error?: string }> {
    try {
      const requestDoc = await getDoc({
        collection: 'deposit_requests',
        key: requestId
      });

      if (!requestDoc?.data) {
        return { success: false, error: 'Deposit request not found' };
      }

      const request = requestDoc.data as DepositRequest;

      if (request.status !== 'pending' && request.status !== 'confirmed') {
        return { success: false, error: 'Deposit request is not available for processing' };
      }

      if (request.agentId !== agentId) {
        return { success: false, error: 'Agent not authorized for this deposit request' };
      }

      const userBalance = await BalanceService.getUserBalance(request.userId);
      const agent = await AgentService.getAgent(agentId);
      
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      if (agent.digitalBalance < request.amount) {
        return { success: false, error: 'Insufficient agent digital balance' };
      }

      const userTransaction = await TransactionService.createTransaction({
        userId: request.userId,
        type: 'deposit',
        amount: request.amount,
        currency: request.currency as AfricanCurrency,
        agentId: agentId,
        status: 'completed',
        description: `Cash deposit via agent - Code: ${request.depositCode}`,
        metadata: {
          depositRequestId: requestId,
          depositCode: request.depositCode,
          processedBy: processedBy || agentId
        }
      });

      const agentTransaction = await TransactionService.createTransaction({
        userId: agent.userId,
        type: 'send',
        amount: request.amount,
        currency: request.currency as AfricanCurrency,
        recipientId: request.userId,
        agentId: agentId,
        status: 'completed',
        description: `Deposit facilitation - Code: ${request.depositCode}`,
        metadata: {
          depositRequestId: requestId,
          depositCode: request.depositCode,
          processedBy: processedBy || agentId
        }
      });

      const currentUserBalance = userBalance?.balance || 0;
      await BalanceService.updateUserBalance(request.userId, currentUserBalance + request.amount);

      await AgentService.updateAgentBalance(agentId, {
        digitalBalance: agent.digitalBalance - request.amount
      });

      await this.updateDepositRequestStatus(requestId, 'completed');

      try {
        await AfriTokenService.rewardAgentService(agentId, 'deposit');
        console.log(`✅ Rewarded agent ${agentId} with 50 AFRI for deposit`);
      } catch (error) {
        console.error('Error rewarding agent with AFRI:', error);
      }

      try {
        const user = await UserService.getUserByKey(request.userId);
        if (user?.email && user.email.match(/^\d+$/)) {
          await SMSService.sendDepositSuccessSMS(
            user.email, 
            request.amount, 
            request.currency, 
            request.depositCode
          );
        }
      } catch (smsError) {
        console.warn('Failed to send SMS notification:', smsError);
      }

      console.log(`Successfully processed deposit request ${requestId}, user transaction ${userTransaction.id}, agent transaction ${agentTransaction.id}`);
      return { 
        success: true, 
        transactionId: agentTransaction.id, 
        userTransactionId: userTransaction.id 
      };
    } catch (error) {
      console.error('Error processing deposit request:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async processWithdrawalRequest(
    requestId: string,
    agentId: string,
    processedBy?: string
  ): Promise<{ success: boolean; transactionId?: string; userTransactionId?: string; error?: string }> {
    try {
      const requestDoc = await getDoc({
        collection: 'withdrawal_requests',
        key: requestId
      });

      if (!requestDoc?.data) {
        return { success: false, error: 'Withdrawal request not found' };
      }

      const request = requestDoc.data as WithdrawalRequest;

      if (request.status !== 'pending' && request.status !== 'confirmed') {
        return { success: false, error: 'Withdrawal request is not available for processing' };
      }

      if (request.agentId !== agentId) {
        return { success: false, error: 'Agent not authorized for this withdrawal request' };
      }

      const userBalance = await BalanceService.getUserBalance(request.userId);
      const agent = await AgentService.getAgent(agentId);
      
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      if (!userBalance || userBalance.balance < request.amount) {
        return { success: false, error: 'Insufficient user balance' };
      }

      if (agent.cashBalance < request.amount) {
        return { success: false, error: 'Insufficient agent cash balance' };
      }

      const userTransaction = await TransactionService.createTransaction({
        userId: request.userId,
        type: 'withdraw',
        amount: request.amount,
        currency: request.currency as AfricanCurrency,
        agentId: agentId,
        status: 'completed',
        description: `Cash withdrawal via agent - Code: ${request.withdrawalCode}`,
        metadata: {
          withdrawalRequestId: requestId,
          withdrawalCode: request.withdrawalCode,
          processedBy: processedBy || agentId
        }
      });

      const agentTransaction = await TransactionService.createTransaction({
        userId: agent.userId,
        type: 'receive',
        amount: request.amount,
        currency: request.currency as AfricanCurrency,
        senderId: request.userId,
        agentId: agentId,
        status: 'completed',
        description: `Withdrawal facilitation - Code: ${request.withdrawalCode}`,
        metadata: {
          withdrawalRequestId: requestId,
          withdrawalCode: request.withdrawalCode,
          processedBy: processedBy || agentId
        }
      });

      await BalanceService.updateUserBalance(request.userId, userBalance.balance - request.amount);

      await AgentService.updateAgentBalance(agentId, {
        cashBalance: agent.cashBalance - request.amount,
        digitalBalance: agent.digitalBalance + request.amount
      });

      await this.updateWithdrawalRequestStatus(requestId, 'completed');

      try {
        await AfriTokenService.rewardAgentService(agentId, 'withdrawal');
        console.log(`✅ Rewarded agent ${agentId} with 50 AFRI for withdrawal`);
      } catch (error) {
        console.error('Error rewarding agent with AFRI:', error);
      }

      try {
        const user = await UserService.getUserByKey(request.userId);
        if (user?.email && user.email.match(/^\d+$/)) {
          await SMSService.sendWithdrawalSuccessSMS(
            user.email,
            request.amount,
            request.currency,
            request.withdrawalCode
          );
        }
      } catch (smsError) {
        console.warn('Failed to send SMS notification:', smsError);
      }

      console.log(`Successfully processed withdrawal transaction ${requestId}, agent transaction ${agentTransaction.id}`);
      return { 
        success: true, 
        transactionId: agentTransaction.id, 
        userTransactionId: requestId
      };
    } catch (error) {
      console.error('Error processing withdrawal request:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
