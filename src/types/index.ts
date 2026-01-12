export type UserRole = 'employee' | 'manager' | 'hr' | 'super_admin';

export interface User {
  id: number;
  name: string;
  email?: string;
  role: UserRole;
  payroll_number: string;
  national_id?: string;
  department?: string;
  position?: string;
  employment_date?: string;
  manager_id?: number;
  company_id?: number;
  signature?: string;
}

export interface KPIItem {
  id: number;
  kpi_id: number;
  title: string;
  description?: string;
  target_value?: string;
  actual_value?: string;  // NEW: Actual value achieved (manager enters)
  measure_unit?: string;
  measure_criteria?: string;
  current_performance_status?: string;
  expected_completion_date?: string;
  goal_weight?: string;
  item_order: number;
  created_at: string;
  updated_at: string;
  is_qualitative?: boolean;
  qualitative_rating?: 'exceeds' | 'meets' | 'needs_improvement';
  qualitative_comment?: string;
}

// NEW: Accomplishment interface for structured major accomplishments
export interface Accomplishment {
  id?: number;
  review_id: number;
  title: string;
  description?: string;
  employee_rating?: number;  // Self-rating 0-1.5 scale
  employee_comment?: string;
  manager_rating?: number;   // Manager rating 0-1.5 scale
  manager_comment?: string;
  item_order: number;
  created_at?: string;
  updated_at?: string;
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
  manager_name: string;
  manager: any;
  kpi: any;
  id: number;
  kpi_id: number;
  employee_id: number;
  employee_rating: number;
  employee_final_rating?: number;
  employee_comment: string;
  employee_signature?: string;
  employee_self_rating_signed_at?: string;
  manager_rating: number;
  manager_final_rating?: number;
  manager_comment: string;
  manager_signature?: string;
  manager_review_signed_at?: string;
  review_status: 'pending' | 'employee_submitted' | 'manager_submitted' | 'completed' | 'rejected' | 'awaiting_employee_confirmation';
  review_quarter?: string;
  review_year?: number;
  review_period?: string;
  major_accomplishments?: string;
  disappointments?: string;
  improvement_needed?: string;
  major_accomplishments_manager_comment?: string;
  disappointments_manager_comment?: string;
  improvement_needed_manager_comment?: string;
  overall_manager_comment?: string;
  future_plan?: string;  // NEW: Employee's future plans
  accomplishments?: Accomplishment[];  // NEW: Structured accomplishments
  manager_signed_at?: string;
  employee_rejection_note?: string;
  employee_confirmation_status?: string;
  employee_confirmation_signed_at?: string;
  
  // Rejection fields
  rejection_reason?: string;
  rejection_resolved_status?: string;
  rejection_resolved_note?: string;
  rejection_resolved_at?: string;
  rejection_resolved_by_name?: string;
  
  // ADD THESE MISSING FIELDS (from backend JOIN):
  employee_name?: string;
  employee_position?: string;
  employee_payroll?: string;
  employee_department?: string;
  kpi_title?: string;
  kpi_description?: string;
  target_value?: string;
  measure_unit?: string;
  
  // NEW: Structured ratings from kpi_item_ratings table
  item_ratings?: {
    employee: {
      [itemId: number]: {
        rating: number | string;
        comment: string;
        type: 'quantitative' | 'qualitative';
        id: number;
      };
    };
    manager: {
      [itemId: number]: {
        rating: number | string;
        comment: string;
        type: 'quantitative' | 'qualitative';
        id: number;
      };
    };
  };
  
  // Items with ratings attached
  items?: Array<{
    id: number;
    kpi_id: number;
    item_description: string;
    goal_weight: string;
    is_qualitative: boolean;
    item_order: number;
    employee_rating?: number | string;
    employee_comment?: string;
    employee_rating_id?: number;
    employee_rating_type?: 'quantitative' | 'qualitative';
    manager_rating?: number | string;
    manager_comment?: string;
    manager_rating_id?: number;
    manager_rating_type?: 'quantitative' | 'qualitative';
    qualitative_rating?: string;
    qualitative_comment?: string;
  }>;
  
  created_at?: string;
  updated_at?: string;
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

export interface Company {
  id: number;
  name: string;
  domain?: string;
  is_primary?: boolean;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  company_id: number;
}

