import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Layouts
import AdminLayout from './components/AdminLayout';
import InvestorLayout from './components/InvestorLayout';

// Admin Pages
import AdminLoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import InvestorsPage from './pages/admin/InvestorsPage';
import InvestorDetailPage from './pages/admin/InvestorDetailPage';
import ReportsPage from './pages/admin/ReportsPage';
import ProfilePage from './pages/admin/ProfilePage';
import SettingsPage from './pages/admin/SettingsPage';
import InvestmentSettingsPage from './pages/admin/InvestmentSettingsPage';
import ContractsPage from './pages/admin/ContractsPage';
import ContractDetailPage from './pages/admin/ContractDetailPage';

// Investor Pages
import InvestorLoginPage from './pages/investor/LoginPage';
import InvestorDashboardPage from './pages/investor/DashboardPage';
import InvestorProfilePage from './pages/investor/ProfilePage';
import InvestorContractsPage from './pages/investor/ContractsPage';
import InvestorResetPasswordPage from './pages/investor/ResetPasswordPage';
import InvestorRegisterPage from './pages/investor/RegisterPage';
import InvestorReferralsPage from './pages/investor/ReferralsPage';
import LandingPage from './pages/LandingPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!adminUser) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const InvestorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { investorUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!investorUser) return <Navigate to="/investor/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
        <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="investors" element={<InvestorsPage />} />
                <Route path="investors/:id" element={<InvestorDetailPage />} />
                <Route path="contracts" element={<ContractsPage />} />
                <Route path="contracts/:id" element={<ContractDetailPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/investment" element={<InvestmentSettingsPage />} />
              </Route>

              {/* Investor Routes */}
              <Route path="/investor/login" element={<InvestorLoginPage />} />
              <Route path="/investor/register" element={<InvestorRegisterPage />} />
              <Route path="/investor/reset-password" element={<InvestorResetPasswordPage />} />
              <Route path="/investor" element={<InvestorRoute><InvestorLayout /></InvestorRoute>}>
                <Route index element={<InvestorDashboardPage />} />
                <Route path="contracts" element={<InvestorContractsPage />} />
                <Route path="referrals" element={<InvestorReferralsPage />} />
                <Route path="profile" element={<InvestorProfilePage />} />
              </Route>

              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        </SettingsProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
