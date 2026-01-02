export type UserRole = 'employee' | 'manager' | 'hr';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  payroll_number: string;
  national_id?: string;
  department?: string;
  position?: string;
  employment_date?: string;
  manager_id?: number;
}

export interface KPIItem {
  id: number;
  kpi_id: number;
  title: string;
  description?: string;
  target_value?: string;
  measure_unit?: string;
  measure_criteria?: string;
  item_order: number;
  created_at: string;
  updated_at: string;
}

export interface KPI {
  id: number;
  employee_id: number;
  manager_id: number;
  title: string;
  description?: string;
  target_value?: string;
  measure_unit?: string;
  measure_criteria?: string;
  period: 'quarterly' | 'yearly';
  quarter?: string;
  year?: number;
  status: 'pending' | 'acknowledged' | 'completed' | 'overdue';
  meeting_date?: string;
  manager_signature?: string;
  manager_signed_at?: string;
  employee_signature?: string;
  employee_signed_at?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_department?: string;
  employee_payroll_number?: string;
  manager_name?: string;
  items?: KPIItem[]; // Array of KPI items for this form
  item_count?: number; // Number of items in this KPI form
}

export interface KPIReview {
  id: number;
  kpi_id: number;
  employee_id: number;
  manager_id: number;
  review_period: string;
  review_quarter?: string;
  review_year?: number;
  employee_rating?: number;
  employee_comment?: string;
  employee_signature?: string;
  employee_signed_at?: string;
  manager_rating?: number;
  manager_comment?: string;
  overall_manager_comment?: string;
  manager_signature?: string;
  manager_signed_at?: string;
  review_status: 'pending' | 'employee_submitted' | 'manager_submitted' | 'hr_reviewed' | 'completed';
  pdf_generated?: boolean;
  pdf_path?: string;
  created_at: string;
  updated_at: string;
  kpi_title?: string;
  kpi_description?: string;
  target_value?: string;
  measure_unit?: string;
  employee_name?: string;
  employee_department?: string;
  employee_position?: string;
  employee_payroll?: string;
  manager_name?: string;
  manager_position?: string;
}

export interface Notification {
  id: number;
  recipient_id: number;
  message: string;
  type: string;
  related_kpi_id?: number;
  related_review_id?: number;
  read: boolean;
  scheduled_at?: string;
  sent_at?: string;
  email_sent?: boolean;
  created_at: string;
  kpi_title?: string;
  kpi_quarter?: string;
  kpi_year?: number;
  kpi_period?: string;
  employee_name?: string;
  manager_name?: string;
  review_status?: string;
}

export interface DashboardStats {
  totalEmployees?: number;
  totalKPIs?: number;
  pendingKPIs?: number;
  completedKPIs?: number;
  avgPerformance?: number;
}

