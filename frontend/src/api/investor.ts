import apiClient, { getCsrfCookie } from './client';

export const investorLogin = async (email: string, password: string) => {
  await getCsrfCookie();
  return apiClient.post('/investor/login', { email, password });
};
export const investorRegister = async (data: Record<string, unknown>) => {
  await getCsrfCookie();
  return apiClient.post('/investor/register', data);
};
export const forgotPassword = async (email: string) => {
  await getCsrfCookie();
  return apiClient.post('/investor/forgot-password', { email });
};
export const resetPassword = async (data: { token: string; email: string; password: string; password_confirmation: string }) => {
  await getCsrfCookie();
  return apiClient.post('/investor/reset-password', data);
};
export const investorLogout = () => apiClient.post('/investor/logout');
export const getInvestorUser = () => apiClient.get('/investor/user');
export const changePassword = (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
  apiClient.post('/investor/change-password', data);

export const getInvestorDashboard = () => apiClient.get('/investor/dashboard');
export const getInvestorSchedules = () => apiClient.get('/investor/schedules');
export const getInvestorPayments = (page = 1) => apiClient.get('/investor/payments', { params: { page } });
export const getInvestorDocuments = () => apiClient.get('/investor/documents');
export const getInvestorReferrals = () => apiClient.get('/investor/referrals');
