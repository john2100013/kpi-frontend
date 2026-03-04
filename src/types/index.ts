export type UserRole = 'employee' | 'manager' | 'hr' | 'super_admin' | 'superadmin' | 'managers' | 'employees';

export interface User {
  id: number;
  name: string;
  email?: string;
  role: UserRole;
  role_id: number;  // Primary role identifier (1=superadmin, 2=managers, 3=hr, 4=employees)
  payroll_number: string;
  national_id?: string;
  department?: string;
  position?: string;
  employment_date?: string;
  manager_id?: number;
  company_id?: number;
  signature?: string;
  requires_password_change?: boolean;
  is_primary?: number;  // 1 = primary manager, 0 = oversight manager
  assigned_manager_name?: string;  // Name of the primary manager
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
  percentage_value_obtained?: number;  // Percentage achieved from actual vs target
  manager_rating_percentage?: number;  // Manager's rating as percentage for actual vs target method
  exclude_from_calculation?: number;  // 0 = included, 1 = excluded from rating calculation (qualitative items only)
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
  // Physical meeting fields - Manager (KPI Setting phase)
  manager_meeting_confirmed?: boolean;
  manager_meeting_location?: string;
  manager_meeting_date?: string;
  manager_meeting_time?: string;
  // Physical meeting fields - Employee (Acknowledgement phase)
  employee_meeting_confirmed?: boolean;
  employee_meeting_location?: string;
  employee_meeting_date?: string;
  employee_meeting_time?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_department?: string;
  employee_department_id?: number;  // NEW: Department ID for checking is_primary
  employee_payroll_number?: string;
  manager_name?: string;
  items?: KPIItem[]; // Array of KPI items for this form
  item_count?: number; // Number of items in this KPI form
  // NEW: Hierarchical manager fields
  is_primary?: number;  // 1 = primary manager (can review), 0 = oversight manager (view only)
  assigned_manager_id?: number;  // ID of the primary manager for this department
  assigned_manager_name?: string;  // Name of the primary manager for this department
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
  employee_rating_percentage?: number;
  employee_final_rating_percentage?: number;
  employee_comment: string;
  employee_signature?: string;
  employee_self_rating_signed_at?: string;
  manager_rating: number;
  manager_final_rating?: number;
  manager_final_rating_percentage?: number;
  manager_comment: string;
  manager_signature?: string;
  manager_review_signed_at?: string;
  review_status: 'pending' | 'employee_submitted' | 'manager_submitted' | 'completed' | 'rejected' | 'awaiting_employee_confirmation';
  status?: 'pending' | 'employee_submitted' | 'manager_submitted' | 'completed' | 'rejected' | 'awaiting_employee_confirmation' | 'manager_initiated';  // Alias for review_status (backend sometimes sends this)
  review_quarter?: string;
  review_year?: number;
  review_period?: string;
  major_accomplishments?: string;
  disappointments?: string;
  improvement_needed?: string;
  major_accomplishments_comment?: string;
  disappointments_comment?: string;
  improvement_needed_manager_comment?: string;
  overall_comment?: string;
  overall_manager_comment?: string;  // Overall manager comments on the review
  overall_manager_rating?: number;   // NEW: Overall manager rating (separate from item-level ratings)
  future_plan?: string;  // NEW: Employee's future plans
  accomplishments?: Accomplishment[];  // NEW: Structured accomplishments
  manager_signed_at?: string;
  employee_rejection_note?: string;
  employee_confirmation_status?: string;
  employee_confirmation_signed_at?: string;
  // Physical meeting fields - Manager (Review phase)
  manager_review_meeting_confirmed?: boolean;
  manager_review_meeting_location?: string;
  manager_review_meeting_date?: string;
  manager_review_meeting_time?: string;
  // Physical meeting fields - Employee (Confirmation phase)
  employee_confirmation_meeting_confirmed?: boolean;
  employee_confirmation_meeting_location?: string;
  employee_confirmation_meeting_date?: string;
  employee_confirmation_meeting_time?: string;
  
  // Correct rejection field names from database (not prefixed with employee_)
  rejection_note?: string;  // Actual database column name
  confirmation_status?: string;  // Actual database column name
  confirmation_signed_at?: string;  // Actual database column name
  confirmation_signature?: string;  // Actual database column name
  
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
  employee_department_id?: number;  // NEW: Department ID for checking is_primary
  kpi_title?: string;
  kpi_description?: string;
  target_value?: string;
  measure_unit?: string;
  
  // NEW: Hierarchical manager fields
  is_primary?: number;  // 1 = primary manager (can review), 0 = oversight manager (view only)
  assigned_manager_id?: number;  // ID of the primary manager for this department
  assigned_manager_name?: string;  // Name of the primary manager for this department
  
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
  
  // Draft flag - true for drafts, false/undefined for submitted reviews
  is_draft?: boolean;
  
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
  logo_url?: string;
  is_primary?: boolean;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  company_id: number;
}

export interface ManagerDepartmentAssignment {
  id: number;
  name: string;
  is_primary: number;  // 1 = primary, 0 = oversight
  employee_count: number;
  department_id: number;
  manager_id: number;
  company_id: number;
}

// ============================================================================
// Manager Rating Types
// ============================================================================

export interface ManagerRatingOption {
  id: number;
  company_id: number;
  rating_scale_name: string; // e.g., "Agreement Scale", "Frequency Scale"
  rating_value: number; // 1-5
  label: string; // e.g., "Strongly Agree", "Every Day"
  description?: string;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ManagerRatingQuestion {
  id?: number;
  section_id?: number;
  question_text: string;
  description?: string;
  rating_scale_name: string; // References rating scale name
  question_order: number;
  is_required: boolean;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  response?: ManagerRatingResponse | null; // For employee view
}

export interface ManagerRatingSection {
  id?: number;
  template_id?: number;
  section_name: string;
  description?: string;
  section_order: number;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  questions: ManagerRatingQuestion[];
}

export interface ManagerRatingTemplate {
  id: number;
  company_id: number;
  template_name: string;
  description?: string;
  period?: 'quarterly' | 'yearly' | 'annual';
  quarter?: string;
  year?: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  section_count?: number;
  assignment_count?: number;
}

export interface ManagerRatingAssignment {
  id: number;
  company_id: number;
  template_id: number;
  department_id: number;
  assigned_by: number;
  due_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  is_active: number;
  created_at: string;
  updated_at: string;
  template_name?: string;
  department_name?: string;
  assigned_by_name?: string;
  total_submissions?: number;
  submitted_count?: number;
}

export interface ManagerRatingResponse {
  id?: number;
  submission_id?: number;
  question_id: number;
  section_id: number;
  rating_value: number;
  response_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ManagerRatingSubmission {
  id: number;
  company_id: number;
  assignment_id: number;
  template_id: number;
  employee_id: number;
  manager_id?: number;
  department_id: number;
  status: 'pending' | 'submitted' | 'reviewed';
  overall_rating?: number;
  overall_percentage?: number;
  employee_comments?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  manager_name?: string;
  template_name?: string;
  template_description?: string;
  due_date?: string;
  assignment_status?: string;
  department_name?: string;
  employee_email?: string;
  employee_payroll_number?: string;
}

export interface ManagerRatingSectionResult {
  id: number;
  submission_id: number;
  section_id: number;
  total_questions: number;
  total_rating: number;
  average_rating: number;
  percentage: number;
  section_name?: string;
}

export interface ManagerRatingResults {
  submission: ManagerRatingSubmission;
  sectionResults: ManagerRatingSectionResult[];
  responses: Array<ManagerRatingResponse & {
    question_text?: string;
    rating_scale_name?: string;
    section_name?: string;
  }>;
}

export interface ManagerRatingAssignmentResults {
  totalSubmissions: number;
  averageOverallRating: number;
  averageOverallPercentage: number;
  sectionAverages: Array<{
    id: number;
    section_name: string;
    avg_rating: number;
    avg_percentage: number;
  }>;
  submissions: ManagerRatingSubmission[];
}
