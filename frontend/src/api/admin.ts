import apiClient, { getCsrfCookie } from './client';
import type { DashboardData, Investor, PaginatedResponse, Payment, PaymentSummary, PayoutSchedule, Activity, Document, Contract } from '../types';

// Auth
export const adminLogin = async (email: string, password: string) => {
  await getCsrfCookie();
  return apiClient.post('/admin/login', { email, password });
};
export const adminLogout = () => apiClient.post('/admin/logout');
export const getAdminUser = () => apiClient.get('/admin/user');
export const updateAdminProfile = (data: { name: string; email: string }) =>
  apiClient.put('/admin/profile', data);
export const changeAdminPassword = (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
  apiClient.post('/admin/change-password', data);

// Dashboard
export const getDashboard = (range: string, startDate?: string, endDate?: string) =>
  apiClient.get<DashboardData>('/admin/dashboard', { params: { range, start_date: startDate, end_date: endDate } });
export const getDashboardCalendar = (month?: string) =>
  apiClient.get('/admin/dashboard/calendar', { params: month ? { month } : {} });

// Investors
export const getInvestors = (params: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<Investor>>('/admin/investors', { params });
export const getInvestor = (id: number) =>
  apiClient.get(`/admin/investors/${id}`);
export const createInvestor = (data: Record<string, unknown>) =>
  apiClient.post('/admin/investors', data);
export const updateInvestor = (id: number, data: Record<string, unknown>) =>
  apiClient.put(`/admin/investors/${id}`, data);
export const deleteInvestor = (id: number) =>
  apiClient.delete(`/admin/investors/${id}`);
export const deactivateInvestor = (id: number) =>
  apiClient.patch(`/admin/investors/${id}/deactivate`);
export const reactivateInvestor = (id: number) =>
  apiClient.patch(`/admin/investors/${id}/reactivate`);
export const approveInvestor = (id: number) =>
  apiClient.patch(`/admin/investors/${id}/approve`);
export const rejectInvestor = (id: number) =>
  apiClient.delete(`/admin/investors/${id}/reject`);

// Top ups
export const processTopUp = (investorId: number, data: { amount: number; date?: string; note?: string }) =>
  apiClient.post(`/admin/investors/${investorId}/topup`, data);

// Payments
export const getPayments = (investorId: number, page = 1) =>
  apiClient.get<PaginatedResponse<Payment>>(`/admin/investors/${investorId}/payments`, { params: { page } });
export const createPayment = (investorId: number, data: Record<string, unknown>) =>
  apiClient.post(`/admin/investors/${investorId}/payments`, data);
export const updatePayment = (investorId: number, paymentId: number, data: Record<string, unknown>) =>
  apiClient.put(`/admin/investors/${investorId}/payments/${paymentId}`, data);
export const deletePayment = (investorId: number, paymentId: number) =>
  apiClient.delete(`/admin/investors/${investorId}/payments/${paymentId}`);
export const getPaymentSummary = (investorId: number, contractId?: number) =>
  apiClient.get<PaymentSummary>(`/admin/investors/${investorId}/payment-summary`, { params: contractId ? { contract_id: contractId } : {} });

// Schedules
export const getSchedules = (investorId: number) =>
  apiClient.get<{ schedules: PayoutSchedule[]; commissions: any[] }>(`/admin/investors/${investorId}/schedules`);

// Statement
export const getStatement = (investorId: number, from?: string, to?: string) =>
  apiClient.get(`/admin/investors/${investorId}/statement`, { params: { from, to } });

// Documents
export const getDocuments = (investorId: number) =>
  apiClient.get<Document[]>(`/admin/investors/${investorId}/documents`);
export const uploadDocument = (investorId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/admin/investors/${investorId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteDocument = (documentId: number) =>
  apiClient.delete(`/admin/documents/${documentId}`);

// Activities
export const getActivities = (investorId: number, page = 1) =>
  apiClient.get<PaginatedResponse<Activity>>(`/admin/investors/${investorId}/activities`, { params: { page } });

// Referrals
export const getInvestorReferrals = (investorId: number) =>
  apiClient.get(`/admin/investors/${investorId}/referrals`);

// Contracts
export const getContracts = (params: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<Contract>>('/admin/contracts', { params });
export const getContract = (id: number) =>
  apiClient.get(`/admin/contracts/${id}`);
export const getInvestorContracts = (investorId: number) =>
  apiClient.get<Contract[]>(`/admin/investors/${investorId}/contracts`);
export const createContract = (investorId: number, data: { amount: number; start_date?: string; custom_interest_rate?: number }) =>
  apiClient.post(`/admin/investors/${investorId}/contracts`, data);
export const renewContract = (investorId: number) =>
  apiClient.post(`/admin/investors/${investorId}/renew`);

// Reports
export const getMonthlyPayoutReport = (month: number, year: number) =>
  apiClient.get('/admin/reports/monthly-payout', { params: { month, year } });
export const getOverdueReport = () =>
  apiClient.get('/admin/reports/overdue');

// Settings
export const getSettings = () => apiClient.get('/settings');
export const updateSettings = (data: FormData) =>
  apiClient.post('/admin/settings', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
