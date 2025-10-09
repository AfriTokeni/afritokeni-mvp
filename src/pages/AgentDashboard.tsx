import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { BalanceService } from "../services/BalanceService";
import { formatCurrencyAmount } from "../types/currency";
import { useAfriTokeni } from "../hooks/useAfriTokeni";
import { useDemoMode } from "../context/DemoModeContext";
import { DemoDataService } from "../services/demoDataService";
import { DataService } from "../services/dataService";
import { Transaction } from "../types/transaction";

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent } = useAfriTokeni();
  const { isDemoMode } = useDemoMode();
  const [showBalance, setShowBalance] = useState(true);
  const [showVerificationAlert, setShowVerificationAlert] = useState(true);

  // Initialize demo data if demo mode is enabled
  useEffect(() => {
    if (isDemoMode && agent?.id) {
      DemoDataService.initializeDemoAgent(agent.id);
    }
  }, [isDemoMode, agent?.id]);

  // Get customers count
  const [customersCount, setCustomersCount] = useState(0);
  const [agentTransactions, setAgentTransactions] = useState<Transaction[]>([]);

  // Calculate real daily earnings from actual transactions
  const calculateDailyEarnings = (): number => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    let totalEarnings = 0;

    // Calculate earnings from regular transactions (2% commission)
    const todayRegularTxs = agentTransactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        txDate >= startOfDay && txDate < endOfDay && tx.status === "completed"
      );
    });

    todayRegularTxs.forEach((tx) => {
      totalEarnings += Math.round(tx.amount * 0.02); // 2% commission on regular transactions
    });

    return totalEarnings;
  };

  React.useEffect(() => {
    // Load customers count asynchronously
    DataService.getAllCustomers().then((customers) => {
      setCustomersCount(customers.length);
    });

    // Load agent transactions
    if (agent) {
      // Use agent.userId for BalanceService since it tracks by user ID, not agent ID
      const transactions = BalanceService.getTransactionHistory(
        agent.userId || agent.id,
      );
      setAgentTransactions(transactions);
    }
  }, [agent]);

  const dailyEarnings = calculateDailyEarnings();

  // Combine regular transactions for display
  const allTransactions = React.useMemo(() => {
    const combined = [
      ...agentTransactions.map((tx) => ({
        ...tx,
        source: "regular" as const,
        displayType:
          tx.type.charAt(0).toUpperCase() +
          tx.type.slice(1).replace(/[_-]/g, " "),
        displayAmount: formatCurrencyAmount(tx.amount, tx.currency as "UGX"),
        commission: formatCurrencyAmount(
          Math.round(tx.amount * 0.02),
          tx.currency as "UGX",
        ),
        description: tx.description || "Transaction",
      })),
    ];

    // Sort by creation date, newest first
    return combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [agentTransactions]);

  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, "UGX");
  };


  const getLiquidityAlerts = () => {
    if (!agent) return [];

    const alerts = [];
    const digitalBalance = agent.digitalBalance || 0;
    const cashBalance = agent.cashBalance || 0;

    // Critical digital balance
    if (digitalBalance < 50000) {
      alerts.push({
        type: "critical",
        title: "Critical Digital Balance",
        message: `Your digital balance is critically low. You may not be able to process large deposits.`,
        balance: digitalBalance,
        action: "Fund Now",
        link: "/agents/funding",
      });
    }
    // Low digital balance
    else if (digitalBalance < 100000) {
      alerts.push({
        type: "warning",
        title: "Low Digital Balance",
        message: `Your digital balance is running low. Consider funding your account.`,
        balance: digitalBalance,
        action: "Fund Account",
        link: "/agents/funding",
      });
    }

    // Critical cash balance
    if (cashBalance < 25000) {
      alerts.push({
        type: "critical",
        title: "Critical Cash Balance",
        message: `Your cash balance is critically low. You may not be able to process withdrawals.`,
        balance: cashBalance,
        action: "Urgent Settlement",
        link: "/agents/settlement",
      });
    }

    return alerts;
  };

  const liquidityAlerts = getLiquidityAlerts();

  return (
    <div className="space-y-6">
      {/* <NotificationSystem 
        notifications={notifications}
        onDismiss={dismissNotification}
      /> */}
      <div className="space-y-6">
        {/* Agent Verification Status */}
        {showVerificationAlert &&
          (agent?.isActive ? (
            <div className="relative rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-800">
                  ✓ Agent verified and active
                </p>
                <button
                  onClick={() => setShowVerificationAlert(false)}
                  className="text-green-600 transition-colors hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">
                  ⚠ Agent verification pending
                </p>
                <button
                  onClick={() => setShowVerificationAlert(false)}
                  className="text-yellow-600 transition-colors hover:text-yellow-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

        {/* Liquidity Alerts */}
        {liquidityAlerts.map((alert, index) => (
          <div
            key={index}
            className={`rounded-2xl border p-4 ${
              alert.type === "critical"
                ? "border-red-200 bg-red-50"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4
                  className={`mb-1 text-sm font-semibold ${
                    alert.type === "critical"
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}
                >
                  {alert.title}
                </h4>
                <p
                  className={`text-sm ${
                    alert.type === "critical"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}
                >
                  {alert.message}
                </p>
                <p
                  className={`mt-1 font-mono text-xs ${
                    alert.type === "critical"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  Current balance: {formatCurrency(alert.balance)}
                </p>
              </div>
              <button
                onClick={() => navigate(alert.link)}
                className={`ml-4 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  alert.type === "critical"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-yellow-600 text-white hover:bg-yellow-700"
                }`}
              >
                {alert.action} →
              </button>
            </div>
          </div>
        ))}

        {/* Agent Status and Location */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <AgentStatusIndicator 
                  status={agent?.status || 'available'}
                  isActive={agent?.isActive || true}
                  size="lg"
                />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Agent Status</h2>
                  <p className="text-neutral-600 text-sm sm:text-base">
                    {agent?.status === 'available' && 'Currently available for transactions'}
                    {agent?.status === 'busy' && 'Currently busy with other transactions'}
                    {agent?.status === 'cash_out' && 'Currently out of cash'}
                    {agent?.status === 'offline' && 'Currently offline'}
                    {!agent?.status && 'Status unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-neutral-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm truncate">
                    {isUpdatingLocation ? (
                      <span className="text-blue-600">Updating location...</span>
                    ) : (
                      currentLocation
                    )}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={updateLocation}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200 w-full sm:w-auto"
            >
              <MapPin className="w-4 h-4" />
              <span>Update</span>
            </button>
          </div>
        </div> */}

        {/* Liquidity Alerts */}
        {/* {liquidityAlerts.length > 0 && (
          <div className="space-y-3">
            {liquidityAlerts.map((alert, index) => (
              <LiquidityAlert
                key={index}
                type={alert.type}
                currentBalance={alert.balance}
                threshold={alert.threshold}
                onActionClick={() => {
                  if (alert.type.includes('digital')) {
                    navigate('/agents/funding');
                  } else {
                    navigate('/agents/settlement');
                  }
                }}
              />
            ))}
          </div>
        )} */}

        {/* Balance Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Balance Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Cash Balance
                </p>
                <div className="flex items-center space-x-3">
                  <p className="font-mono text-3xl font-bold text-gray-900">
                    {showBalance
                      ? formatCurrency(agent?.cashBalance || 0)
                      : "••••••"}
                  </p>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-gray-400"
                  >
                    {showBalance ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">Earnings</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <button
              onClick={() => navigate("/agents/settlement")}
              className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Withdraw
            </button>
          </div>

          {/* Digital Balance Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Digital Balance
                </p>
                <div className="flex items-center space-x-3">
                  <p className="font-mono text-3xl font-bold text-gray-900">
                    {showBalance
                      ? formatCurrency(agent?.digitalBalance || 0)
                      : "••••••"}
                  </p>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-gray-400"
                  >
                    {showBalance ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">Operations</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <button
              onClick={() => navigate("/agents/funding")}
              className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Add Funds
            </button>
          </div>

        </div>

        {/* Quick Actions - Reorganized by Category */}
        <div className="space-y-6">
          {/* Transaction Processing */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">
              Transaction Processing
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <button
                onClick={() => navigate("/agents/deposit")}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md sm:p-6"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 sm:mb-3 sm:h-12 sm:w-12">
                  <Plus className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
                </div>
                <span className="block text-center text-xs font-semibold text-neutral-900 sm:text-sm">
                  Process Deposits
                </span>
              </button>

              <button
                onClick={() => navigate("/agents/withdraw")}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md sm:p-6"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 sm:mb-3 sm:h-12 sm:w-12">
                  <Minus className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
                </div>
                <span className="block text-center text-xs font-semibold text-neutral-900 sm:text-sm">
                  Process Withdrawals
                </span>
              </button>

              <button
                onClick={() => navigate("/agents/customers")}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md sm:p-6"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 sm:mb-3 sm:h-12 sm:w-12">
                  <Users className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                </div>
                <span className="block text-center text-xs font-semibold text-neutral-900 sm:text-sm">
                  Manage Customers
                </span>
              </button>

              <button
                onClick={() => navigate("/agents/exchange")}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md sm:p-6"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 sm:mb-3 sm:h-12 sm:w-12">
                  <ArrowRightLeft className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
                </div>
                <span className="block text-center text-xs font-semibold text-neutral-900 sm:text-sm">
                  Exchange Center
                </span>
                <p className="mt-1 text-xs text-neutral-600">
                  Bitcoin ↔ Cash trades
                </p>
              </button>
            </div>
          </div>

          {/* Liquidity Management */}
          {/* <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Liquidity Management</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/agents/funding')}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Fund Digital Balance</span>
                <p className="text-xs text-neutral-600 mt-1">Add operational funds</p>
              </button>

              <button 
                onClick={() => navigate('/agents/settlement')}
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-200"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Withdraw Earnings</span>
                <p className="text-xs text-neutral-600 mt-1">Cash out commissions</p>
              </button>
            </div>
          </div> */}

          {/* Bitcoin Services */}
          {/* <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Bitcoin Services</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/agents/bitcoin')}
                className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Bitcoin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Bitcoin Wallet</span>
                <p className="text-xs text-neutral-600 mt-1">Manage Bitcoin funds</p>
              </button>

              <button 
                onClick={() => navigate('/agents/exchange')}
                className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Exchange Center</span>
                <p className="text-xs text-neutral-600 mt-1">Bitcoin ↔ Cash trades</p>
              </button>
            </div>
          </div> */}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 sm:h-12 sm:w-12">
                <TrendingUp className="h-5 w-5 text-neutral-600 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-600 sm:text-sm">
                  Daily Earnings
                </p>
                <p className="mt-1 truncate font-mono text-lg font-bold text-neutral-900 sm:text-xl">
                  {formatCurrency(dailyEarnings)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 sm:h-12 sm:w-12">
                <CreditCard className="h-5 w-5 text-neutral-600 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-600 sm:text-sm">
                  Today&apos;s Transactions
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-neutral-900 sm:text-xl">
                  {allTransactions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 sm:h-12 sm:w-12">
                <Users className="h-5 w-5 text-neutral-600 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-600 sm:text-sm">
                  Active Customers
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-neutral-900 sm:text-xl">
                  {customersCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-base font-bold text-neutral-900 sm:text-lg">
              Recent Transactions
            </h2>
            <button
              onClick={() => navigate("/agents/transactions")}
              className="text-xs font-semibold text-neutral-600 transition-colors duration-200 hover:text-neutral-900 sm:text-sm"
            >
              View All
            </button>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {allTransactions.slice(0, 4).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-neutral-100 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-3 sm:space-x-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 sm:h-10 sm:w-10">
                      <span className="text-xs font-bold text-neutral-600 sm:text-sm">
                        {transaction.description
                          ? transaction.description
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)
                          : "TX"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-neutral-900 sm:text-sm">
                        {transaction.description}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-neutral-600">
                        {transaction.displayType}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-right">
                    <div className="font-mono text-xs font-bold text-neutral-900 sm:text-sm">
                      {transaction.displayAmount}
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-mono font-bold text-green-600">
                        +{transaction.commission}
                      </span>
                      <div
                        className={`mt-1 text-xs font-semibold ${
                          transaction.status === "completed"
                            ? "text-green-600"
                            : transaction.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {allTransactions.length === 0 && (
                <div className="py-6 text-center sm:py-8">
                  <p className="text-sm text-neutral-600">
                    No transactions yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
