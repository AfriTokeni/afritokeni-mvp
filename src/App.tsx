import { initSatellite } from "@junobuild/core";
import { FC, useEffect } from "react";
import UserDashboard from "./pages/UserDashboard.tsx";
import { Route, Routes,BrowserRouter, Navigate } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import { user_desktop_routes, user_mobile_routes } from "./routes/userRoutes.ts";
import SendMoney from "./pages/send/SendMoney.tsx";
import UserTransactions from "./pages/transactions/Transactions.tsx";
import UserProfile from "./pages/profile/Profile.tsx";
import WithdrawMoney from "./pages/withdraw/Withdraw.tsx";

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
      <Layout desktop_routes={user_desktop_routes} mobile_routes={user_mobile_routes}>
        <Routes>
          <Route path="/" element={<Navigate to="/users/dashboard" replace/>} />
          <Route path="/users/dashboard" element={<UserDashboard />} />
          <Route path="/users/send" element={<SendMoney />} />
          <Route path="/users/history" element={<UserTransactions />} />
          <Route path="/users/withdraw" element={<WithdrawMoney />} />
          <Route path="/users/profile" element={<UserProfile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
