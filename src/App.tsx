import { initSatellite } from "@junobuild/core";
import { FC, useEffect } from "react";
import junoConfig from "../juno.config";
import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom";
import { AuthenticationProvider } from "./context/AuthenticationContext.tsx";
import Layout from "./components/Layout.tsx";
import { user_desktop_routes, user_mobile_routes } from "./routes/userRoutes.ts";
import { agent_desktop_routes, agent_mobile_routes } from "./routes/agentRoutes.ts";

// User Pages
import UserDashboard from "./pages/UserDashboard.tsx";
import SendMoney from "./pages/send/SendMoney.tsx";
import UserTransactions from "./pages/transactions/Transactions.tsx";
import UserProfile from "./pages/profile/Profile.tsx";
import WithdrawMoney from "./pages/withdraw/Withdraw.tsx";
import BitcoinPage from "./pages/users/BitcoinPage.tsx";
import ExchangePage from "./pages/users/ExchangePage.tsx";

//Agent Pages
import AgentDashboard from './pages/AgentDashboard';
import ProcessWithdrawal from './pages/withdraw/ProcessWithdrawal';
import ProcessDeposit from './pages/ProcessDeposit';
import AgentCustomers from './pages/AgentCustomers';
import AgentBitcoinPage from './pages/agents/AgentBitcoinPage';
import AgentExchangePage from './pages/agents/AgentExchangePage';
import AgentSettings from './pages/AgentSettings';
import RoleSelection from './pages/auth/RoleSelection';
import AgentTransactions from "./pages/transactions/AgentTransactions.tsx";

// Auth Pages - Only KYC pages needed
import UserKYCPage from "./pages/auth/UserKYCPage";
import AgentKYCPage from "./pages/auth/AgentKYCPage";

// SMS Interface
import SMSUI from "./components/SMSUI.tsx";

// Landing Page
import LandingPage from "./pages/LandingPage";
import TariffPage from "./pages/TariffPage";

const App: FC = () => {
  useEffect(() => {
    const initJuno = async () => {
      try {
        await initSatellite({
          satelliteId: junoConfig.satellite.ids?.production || "dkk74-oyaaa-aaaal-askxq-cai",
          workers: {
            auth: true,
          },
        });
        console.log("Juno satellite initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Juno satellite:", error);
      }
    };
    
    initJuno();
  }, []);

  return (
    <BrowserRouter>
      <AuthenticationProvider>
        <Routes>
          {/* Auth Routes - Only Juno/ICP authentication used */}
          
          {/* SMS Interface Demo */}
          <Route path="/sms" element={<SMSUI />} />
    
          {/* User Routes */}
          <Route path="/users/*" element={
            <Layout desktop_routes={user_desktop_routes} mobile_routes={user_mobile_routes} user_type="user">
              <Routes>
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="send" element={<SendMoney />} />
                <Route path="history" element={<UserTransactions />} />
                <Route path="withdraw" element={<WithdrawMoney />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="user-kyc" element={<UserKYCPage />} />
                <Route path="bitcoin" element={<BitcoinPage />} />
                <Route path="exchange" element={<ExchangePage />} />
              </Routes>
            </Layout>
          } />
          
          {/* Agent Routes */}
          <Route path="/agents/*" element={
            <Layout desktop_routes={agent_desktop_routes} mobile_routes={agent_mobile_routes} user_type="agent">
              <Routes>
                <Route path="dashboard" element={<AgentDashboard />} />
                <Route path="withdraw" element={<ProcessWithdrawal/>} />
                <Route path="deposit" element={<ProcessDeposit/>} />
                <Route path="customers" element={<AgentCustomers/>} />
                <Route path="transactions" element={<AgentTransactions/>} />
                <Route path="bitcoin" element={<AgentBitcoinPage/>} />
                <Route path="exchange" element={<AgentExchangePage/>} />
                <Route path="location" element={<div>Location Page</div>} />
                <Route path="settings" element={<AgentSettings/>} />
                <Route path="agent-kyc" element={<AgentKYCPage />} />
              </Routes>
            </Layout>
          } />
          
          {/* Auth Routes */}
          <Route path="/auth/role-selection" element={<RoleSelection />} />
          
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Tariff Page */}
          <Route path="/tariff" element={<TariffPage />} />
          
          {/* Default redirects */}
          <Route path="/dashboard" element={<Navigate to="/users/dashboard" replace />} />
        </Routes>
      </AuthenticationProvider>
    </BrowserRouter>
  );
};

export default App;
