export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Investor {
  id: number;
  investor_id: string;
  prefix: string | null;
  first_name: string;
  second_name: string;
  last_name: string | null;
  phone: string;
  id_number: string;
  other_phone: string | null;
  email: string;
  address: string;
  city: string;
  country: string;
  tax_id: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_branch: string | null;
  total_invested: number;
  interest_rate: number;
  monthly_payout: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'deactivated' | 'completed' | 'closed';
  password_changed: boolean;
  remaining_months: number;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: number;
  investor_id: number;
  type: 'initial' | 'topup' | 'principal_refund';
  amount: number;
  date: string;
  note: string | null;
}

export interface PayoutSchedule {
  id: number;
  investor_id: number;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'paid_in_advance';
  balance: number;
  payment_allocations?: PaymentAllocation[];
}

export interface Payment {
  id: number;
  investor_id: number;
  payment_date: string;
  amount: number;
  method: 'mpesa' | 'cheque';
  reference: string;
  note: string | null;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: number;
  payment_id: number;
  payout_schedule_id: number;
  amount_allocated: number;
  payment?: Payment;
  payout_schedule?: PayoutSchedule;
}

export interface Document {
  id: number;
  investor_id: number;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export interface Activity {
  id: number;
  user_id: number | null;
  investor_id: number | null;
  action: string;
  details: string | null;
  performed_at: string;
  user?: { id: number; name: string };
}

export interface DashboardData {
  new_investors: number;
  total_sum_invested: number;
  total_due_payout: number;
  total_payout_paid: number;
  total_overdue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaymentSummary {
  overdue_entries: PayoutSchedule[];
  current_due: PayoutSchedule | null;
  total_overdue: number;
  total_invested: number;
  interest_rate: number;
  monthly_payout: number;
}
