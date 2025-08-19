import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataService, Transaction, UserBalance, Agent } from '../services/dataService';

export const useAfriTokeni = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    } else {
      setBalance(null);
      setTransactions([]);
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize user data if needed
      await DataService.initializeUserData(user.id);
      
      // Load balance and transactions
      const [userBalance, userTransactions] = await Promise.all([
        DataService.getUserBalance(user.id),
        DataService.getUserTransactions(user.id)
      ]);
      
      setBalance(userBalance);
      setTransactions(userTransactions);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMoney = async (
    amount: number, 
    recipientPhone: string, 
    recipientName?: string
  ): Promise<{ success: boolean; message: string; transaction?: Transaction }> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    if (!balance || balance.balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create transaction
      const transaction = await DataService.createTransaction({
        userId: user.id,
        type: 'send',
        amount,
        currency: 'UGX',
        recipientPhone,
        recipientName,
        status: 'pending',
        description: `Send money to ${recipientPhone}`
      });

      // Update balance
      const newBalance = balance.balance - amount;
      await DataService.updateUserBalance(user.id, newBalance);

      // Update transaction status
      await DataService.updateTransaction(transaction.id, {
        status: 'completed',
        completedAt: new Date()
      });

      // Refresh data
      await loadUserData();

      // Log SMS
      await DataService.logSMSMessage({
        userId: user.id,
        phoneNumber: recipientPhone,
        message: `You have received UGX ${amount.toLocaleString()}`,
        direction: 'outbound',
        status: 'sent',
        transactionId: transaction.id
      });

      return { 
        success: true, 
        message: `Successfully sent UGX ${amount.toLocaleString()} to ${recipientPhone}`,
        transaction
      };
    } catch (err) {
      setError('Failed to send money');
      console.error('Error sending money:', err);
      return { success: false, message: 'Failed to send money' };
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawMoney = async (
    amount: number,
    agentId?: string
  ): Promise<{ success: boolean; message: string; withdrawalCode?: string }> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    if (!balance || balance.balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate withdrawal code
      const withdrawalCode = Math.random().toString(36).substr(2, 6).toUpperCase();

      // Create transaction
      const transaction = await DataService.createTransaction({
        userId: user.id,
        type: 'withdraw',
        amount,
        currency: 'UGX',
        agentId,
        status: 'pending',
        description: 'Cash withdrawal',
        metadata: {
          withdrawalCode
        }
      });

      return { 
        success: true, 
        message: `Withdrawal initiated. Code: ${withdrawalCode}`,
        withdrawalCode
      };
    } catch (err) {
      setError('Failed to initiate withdrawal');
      console.error('Error withdrawing money:', err);
      return { success: false, message: 'Failed to initiate withdrawal' };
    } finally {
      setIsLoading(false);
    }
  };

  const depositMoney = async (amount: number): Promise<{ success: boolean; message: string }> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create transaction
      await DataService.createTransaction({
        userId: user.id,
        type: 'deposit',
        amount,
        currency: 'UGX',
        status: 'completed',
        description: 'Cash deposit',
        completedAt: new Date()
      });

      // Update balance
      const newBalance = (balance?.balance || 0) + amount;
      await DataService.updateUserBalance(user.id, newBalance);

      // Refresh data
      await loadUserData();

      return { 
        success: true, 
        message: `Successfully deposited UGX ${amount.toLocaleString()}`
      };
    } catch (err) {
      setError('Failed to deposit money');
      console.error('Error depositing money:', err);
      return { success: false, message: 'Failed to deposit money' };
    } finally {
      setIsLoading(false);
    }
  };

  const getNearbyAgents = async (lat: number, lng: number): Promise<Agent[]> => {
    try {
      return await DataService.getNearbyAgents(lat, lng);
    } catch (err) {
      console.error('Error getting nearby agents:', err);
      return [];
    }
  };

  const processSMSCommand = async (phoneNumber: string, message: string): Promise<string> => {
    try {
      return await DataService.processSMSCommand(phoneNumber, message, user?.id);
    } catch (err) {
      console.error('Error processing SMS command:', err);
      return 'Sorry, there was an error processing your request.';
    }
  };

  const refreshData = () => {
    loadUserData();
  };

  return {
    // Data
    user,
    balance,
    transactions,
    isLoading,
    error,
    
    // Actions
    sendMoney,
    withdrawMoney,
    depositMoney,
    getNearbyAgents,
    processSMSCommand,
    refreshData,
    
    // Computed values
    formattedBalance: balance ? `UGX ${balance.balance.toLocaleString()}` : 'UGX 0',
    hasTransactions: transactions.length > 0,
    recentTransactions: transactions.slice(0, 5)
  };
};
