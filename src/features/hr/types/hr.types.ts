/**
 * HR TypeScript Types
 */

export interface DepartmentStatistic {
  department: string;
  total_employees: number;
  categories: {
    pending: number;
    acknowledged_review_pending: number;
    self_rating_submitted: number;
    awaiting_employee_confirmation: number;
    review_completed: number;
    review_rejected: number;
    review_pending: number;
    no_kpi: number;
    rejection_resolved?: number;
  };
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  payroll_number: string;
  department: string;
  position: string;
  role?: string;
  role_id?: number;
  manager_name?: string;
}

export interface PeriodSetting {
  id: number;
  period_type: string;
  quarter: string | null;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Manager {
  id: number;
  name: string;
}

export interface DashboardFilters {
  department: string;
  period: string;
  manager: string;
}

export interface KPIFilters {
  department: string;
  status: string;
  period: string;
  manager: string;
}

export interface KPIPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
}

export interface RatingOption {
  id?: number;
  rating_value: number | string | null; // Database returns DECIMAL as string
  label: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  rating_type: 'yearly' | 'quarterly' | 'qualitative';
}

export interface ReminderSetting {
  id?: number;
  reminder_type: 'kpi_setting' | 'kpi_review';
  period_type?: 'quarterly' | 'yearly';
  reminder_number: number;
  reminder_days_before: number;
  reminder_label?: string;
  is_active: boolean;
}

export interface DailyReminderSetting {
  send_daily_reminders: boolean;
  days_before_meeting: number;
  cc_emails?: string;
}

export interface RejectedKPIFilter {
  filter: 'rejected' | 'resolved' | null;
}

export interface RejectedKPIStats {
  rejectedCount: number;
  resolvedCount: number;
}

export interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
}

export interface StageInfo {
  stage: string;
  color: string;
  icon: React.ReactNode;
}

export interface ItemCalculation {
  item_id: number;
  title: string;
  manager_rating: number;
  goal_weight: number;
  contribution: number;
}

