import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Eye,
  EyeOff,
  Wallet,
  CreditCard,
  X,
} from "lucide-react";
import { BalanceService } from "../services/BalanceService";
import { formatCurrencyAmount, AfricanCurrency } from "../types/currency";
import { useAfriTokeni } from "../hooks/useAfriTokeni";
import { useDemoMode } from "../context/DemoModeContext";
import { AgentDemoDataService } from "../services/agentDemoDataService";
import { Transaction } from "../types/transaction";
import { CurrencySelector } from "../components/CurrencySelector";
import { CkBTCBalanceCard } from "../components/CkBTCBalanceCard";
import { CkUSDCBalanceCard } from "../components/CkUSDCBalanceCard";
import { AgentOnboardingModal, AgentOnboardingData } from "../components/AgentOnboardingModal";
import { AgentKYCBanner } from "../components/AgentKYCBanner";
import { DemoModeModal } from "../components/DemoModeModal";
import { useAuthentication } from "../context/AuthenticationContext";

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent } = useAfriTokeni();
  const { user } = useAuthentication();
  const { isDemoMode } = useDemoMode();
  const [showBalance, setShowBalance] = useState(true);
  const [showVerificationAlert, setShowVerificationAlert] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');

  // Get current agent
  const currentAgent = user.agent || agent;
  const agentCurrency = selectedCurrency || (currentAgent as any)?.preferredCurrency || 'UGX';

  // Initialize demo data if demo mode is enabled
  useEffect(() => {
    if (isDemoMode && (currentAgent as any)?.email) {
      AgentDemoDataService.initializeDemoAgent((currentAgent as any).email);
    }
  }, [isDemoMode, currentAgent]);

  const [agentTransactions, setAgentTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKYCBanner, setShowKYCBanner] = useState(true);
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'rejected' | 'not_started'>('not_started');


  useEffect(() => {
    if (isDemoMode) {
      // Load demo transactions
      const demoTransactions = AgentDemoDataService.getTransactions();
      setAgentTransactions(demoTransactions as any);
    } else if (agent) {
      const transactions = BalanceService.getTransactionHistory(
        agent.userId || agent.id,
      );
      setAgentTransactions(transactions);
    }
  }, [agent, isDemoMode]);

  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, agentCurrency as AfricanCurrency);
  };

  // Check if profile is complete
  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    const agentData = currentAgent as any;
    
    if (!agentData?.businessName) missing.push('Business Name');
    if (!agentData?.phone) missing.push('Phone Number');
    if (!agentData?.address) missing.push('Business Address');
    if (!agentData?.city) missing.push('City');
    if (!agentData?.country) missing.push('Country');
    
    return missing;
  };

  const handleOnboardingComplete = async (data: AgentOnboardingData) => {
    console.log('Agent onboarding data:', data);
    
    // Save to localStorage for persistence
    localStorage.setItem('agent_profile_data', JSON.stringify(data));
    localStorage.setItem('agent_kyc_status', 'verified'); // Auto-verify in demo
    
    setShowOnboarding(false);
    setKycStatus('verified');
    setShowKYCBanner(false); // Hide banner after completion
  };

  // Show demo modal ONLY on first login for this agent (not on every page)
  useEffect(() => {
    if (!currentAgent?.id) return; // Wait for agent to be loaded
    
    const globalModalKey = `afritokeni_first_login_${currentAgent.id}`;
    const hasSeenDemoModal = localStorage.getItem(globalModalKey);
    
    if (!hasSeenDemoModal) {
      setShowDemoModal(true);
      localStorage.setItem(globalModalKey, 'true');
    }
  }, [currentAgent?.id]);

  // Load saved profile data and KYC status
  useEffect(() => {
    if (!currentAgent?.id) return; // Wait for agent to be loaded
    
    // Load KYC status from localStorage
    const savedKycStatus = localStorage.getItem('agent_kyc_status');
    if (savedKycStatus) {
      setKycStatus(savedKycStatus as 'pending' | 'verified' | 'rejected' | 'not_started');
    }
    
    // Load profile data
    const savedProfileData = localStorage.getItem('agent_profile_data');
    if (savedProfileData) {
      const profileData = JSON.parse(savedProfileData);
      console.log('Loaded agent profile data:', profileData);
      // Profile data is loaded, so hide banner if KYC is verified
      if (savedKycStatus === 'verified') {
        setShowKYCBanner(false);
      }
    }
    
    // Only show onboarding/banner AFTER demo modal has been seen
    const globalModalKey = `afritokeni_first_login_${currentAgent.id}`;
    const hasSeenDemoModal = localStorage.getItem(globalModalKey);
    if (!hasSeenDemoModal) return; // Wait for demo modal first

    // Show onboarding on first visit if profile incomplete
    const hasSeenOnboarding = localStorage.getItem('agent_onboarding_seen');
    if (!hasSeenOnboarding && !savedProfileData) {
      setShowOnboarding(true);
      localStorage.setItem('agent_onboarding_seen', 'true');
    }
  }, [currentAgent?.id]);


  const getLiquidityAlerts = () => {
    const alerts = [];
    
    // Get balances from demo mode or real agent
    const digitalBalance = isDemoMode 
      ? (AgentDemoDataService.getDemoAgent()?.digitalBalance || 0)
      : (agent?.digitalBalance || 0);
    const cashBalance = isDemoMode 
      ? (AgentDemoDataService.getDemoAgent()?.cashBalance || 0)
      : (agent?.cashBalance || 0);

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
  const missingFields = getMissingFields();

  return (
    <div className="space-y-6">
      {/* Demo Mode Modal */}
      <DemoModeModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)}
        userType="agent"
      />

      {/* Onboarding Modal */}
      <AgentOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
        currentData={{
          businessName: (currentAgent as any)?.businessName,
          ownerName: (currentAgent as any)?.ownerName,
          email: (currentAgent as any)?.email,
          phone: (currentAgent as any)?.phone,
          preferredCurrency: agentCurrency as AfricanCurrency,
          country: (currentAgent as any)?.country,
          city: (currentAgent as any)?.city,
          address: (currentAgent as any)?.address,
          kycStatus: kycStatus === 'not_started' ? undefined : kycStatus
        }}
      />

      {/* <NotificationSystem 
        notifications={notifications}
        onDismiss={dismissNotification}
      /> */}
      <div className="space-y-6">
        {/* KYC Banner - Critical if not verified */}
        {showKYCBanner && (kycStatus !== 'verified' || missingFields.length > 0) && (
          <AgentKYCBanner
            missingFields={missingFields}
            kycStatus={kycStatus}
            onDismiss={() => setShowKYCBanner(false)}
            onComplete={() => setShowOnboarding(true)}
          />
        )}

        {/* Agent Verification Status - Only show if KYC is verified */}
        {showVerificationAlert && kycStatus === 'verified' &&
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

        {/* Stats Row - AT THE TOP */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 mb-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 sm:h-12 sm:w-12">
                <TrendingUp className="h-5 w-5 text-neutral-600 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-600 sm:text-sm">
                  Daily Earnings
                </p>
                <p className="text-lg font-bold text-neutral-900 sm:text-2xl">
                  {isDemoMode 
                    ? formatCurrencyAmount(125000, agentCurrency as AfricanCurrency)
                    : formatCurrencyAmount(0, agentCurrency as AfricanCurrency)}
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
                  Today's Transactions
                </p>
                <p className="text-lg font-bold text-neutral-900 sm:text-2xl">
                  {isDemoMode ? '47' : '0'}
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
                <p className="text-lg font-bold text-neutral-900 sm:text-2xl">
                  {isDemoMode ? '28' : '2'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Digital Balance Card (Primary - Operations) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-600">Digital Balance</p>
                  <span className="text-xs text-gray-400">Operations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <p className="font-mono text-3xl font-bold text-gray-900">
                    {showBalance
                      ? formatCurrencyAmount(
                          isDemoMode 
                            ? (AgentDemoDataService.getDemoAgent()?.digitalBalance || 0)
                            : (agent?.digitalBalance || 0),
                          agentCurrency as AfricanCurrency
                        )
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
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="rounded-xl bg-blue-50 p-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <CurrencySelector
                  currentCurrency={agentCurrency}
                  onCurrencyChange={(currency) => setSelectedCurrency(currency)}
                />
              </div>
            </div>
            <button
              onClick={() => navigate("/agents/funding")}
              className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Add Funds
            </button>
          </div>

          {/* Cash Balance Card (Earnings) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-600">Cash Balance</p>
                  <span className="text-xs text-gray-400">Earnings</span>
                </div>
                <div className="flex items-center space-x-3">
                  <p className="font-mono text-3xl font-bold text-gray-900">
                    {showBalance
                      ? formatCurrencyAmount(
                          isDemoMode 
                            ? (AgentDemoDataService.getDemoAgent()?.cashBalance || 0)
                            : (agent?.cashBalance || 0),
                          agentCurrency as AfricanCurrency
                        )
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
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="rounded-xl bg-green-50 p-3">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <CurrencySelector
                  currentCurrency={agentCurrency}
                  onCurrencyChange={(currency) => setSelectedCurrency(currency)}
                />
              </div>
            </div>
            <button
              onClick={() => navigate("/agents/settlement")}
              className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Withdraw Earnings
            </button>
          </div>
        </div>

        {/* ckBTC and ckUSDC Balance Cards - Always show */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <CkBTCBalanceCard
            principalId={currentAgent?.id || 'demo-agent'}
            preferredCurrency={agentCurrency}
            showActions={false}
          />
          <CkUSDCBalanceCard
            principalId={currentAgent?.id || 'demo-agent'}
            preferredCurrency={agentCurrency}
            showActions={false}
          />
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
                onClick={() => navigate('/agents/process-withdrawals')}
                className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-200"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 block text-center">Process Withdrawals</span>
                <p className="text-xs text-neutral-600 mt-1">Cash to customers</p>
              </button>
            </div>
          </div> */}

        {/* Recent Transactions */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                Recent Transactions
              </h3>
              <CurrencySelector
                currentCurrency={agentCurrency}
                onCurrencyChange={(currency) => setSelectedCurrency(currency)}
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
          </div>
          <div className="divide-y divide-neutral-100 p-4 sm:p-6 max-h-96 overflow-y-auto">
            {agentTransactions.filter(tx => 
              !searchQuery || 
              tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              tx.type.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">
                No recent transactions
              </p>
            ) : (
              agentTransactions.filter(tx => 
                !searchQuery || 
                tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.type.toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 20).map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-neutral-100 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-3 sm:space-x-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 sm:h-10 sm:w-10">
                      <span className="text-xs font-bold text-neutral-600 sm:text-sm">
                        {transaction.type === "send" ? "S" : transaction.type === "receive" ? "R" : transaction.type === "withdraw" ? "W" : "TX"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-neutral-900 sm:text-sm">
                        {transaction.description || `${transaction.type} transaction`}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-neutral-600">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-right">
                    <div className="font-mono text-xs font-bold text-neutral-900 sm:text-sm">
                      {formatCurrencyAmount(transaction.amount, agentCurrency as AfricanCurrency)}
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-mono font-bold text-green-600">
                        +{formatCurrencyAmount(Math.round(transaction.amount * 0.02), agentCurrency as AfricanCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgentDashboard;
