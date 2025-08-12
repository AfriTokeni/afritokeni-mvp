import { initSatellite } from "@junobuild/core";
import { FC, useEffect } from "react";
import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout.tsx";
import { user_desktop_routes, user_mobile_routes } from "./routes/userRoutes.ts";
import { agent_desktop_routes, agent_mobile_routes } from "./routes/agentRoutes.ts";

// Pages
import UserDashboard from "./pages/UserDashboard.tsx";
import AgentDashboard from "./pages/AgentDashboard.tsx";
import SendMoney from "./pages/send/SendMoney.tsx";
import UserTransactions from "./pages/transactions/Transactions.tsx";
import UserProfile from "./pages/profile/Profile.tsx";
import WithdrawMoney from "./pages/withdraw/Withdraw.tsx";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UserKYCPage from "./pages/auth/UserKYCPage";
import AgentKYCPage from "./pages/auth/AgentKYCPage";

const App: FC = () => {
  useEffect(() => {
    (async () =>
      await initSatellite({
        workers: {
          auth: true,
        },
      }))();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
    
          {/* User Routes */}
          <Route path="/users/*" element={
            <Layout desktop_routes={user_desktop_routes} mobile_routes={user_mobile_routes}>
              <Routes>
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="send" element={<SendMoney />} />
                <Route path="history" element={<UserTransactions />} />
                <Route path="withdraw" element={<WithdrawMoney />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="user-kyc" element={<UserKYCPage />} />
              </Routes>
            </Layout>
          } />
          
          {/* Agent Routes */}
          <Route path="/agents/*" element={
            <Layout desktop_routes={agent_desktop_routes} mobile_routes={agent_mobile_routes}>
              <Routes>
                <Route path="dashboard" element={<AgentDashboard />} />
                <Route path="customers" element={<div>Customers Page</div>} />
                <Route path="transactions" element={<div>Agent Transactions Page</div>} />
                <Route path="analytics" element={<div>Analytics Page</div>} />
                <Route path="location" element={<div>Location Page</div>} />
                <Route path="settings" element={<div>Settings Page</div>} />
                <Route path="agent-kyc" element={<AgentKYCPage />} />
              </Routes>
            </Layout>
          } />
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/dashboard" element={<Navigate to="/users/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
