import { nanoid } from 'nanoid';
import { getDoc, setDoc, listDocs } from '@junobuild/core';
import { FraudDetectionService } from './fraudDetection';

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
}
