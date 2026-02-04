import { KPI } from '../../../types';

/**
 * Employee Types
 */

export interface EmployeeState {
  currentKPI: KPI | null;
  loading: boolean;
  error: string | null;
}

export interface AcknowledgementData {
  kpi_id: number;
  acknowledged: boolean;
  acknowledgement_date: string;
  comments?: string;
}

export interface EmployeeKPIFilter {
  status?: string;
  period?: string;
  year?: number;
}

export interface KPIAcknowledgement {
  id: number;
  kpi_id: number;
  employee_id: number;
  acknowledged: boolean;
  acknowledgement_date: string;
  comments: string | null;
  created_at: string;
}

export interface EmployeeDashboardStats {
  total_kpis: number;
  pending_acknowledgement: number;
  in_progress: number;
  completed: number;
  average_score?: number;
}

export interface RatingOption {
  rating_type: string;
  rating_value: number | string; // Database returns string, needs conversion
  label: string;
  description?: string;
}

export interface ItemRatings {
  [key: number]: number;
}

export interface ItemComments {
  [key: number]: string;
}

export interface SelfRatingDraft {
  ratings: ItemRatings;
  comments: ItemComments;
  employeeSignature: string;
  reviewDate: string;
  majorAccomplishments: string;
  disappointments: string;
}

export interface SelfRatingSubmission {
  employee_rating: number;
  employee_comment: string;
  employee_signature: string;
  review_period: string;
  review_quarter?: string;
  review_year?: number;
  major_accomplishments?: string;
  disappointments?: string;
}

export interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
  field?: string;
  itemId?: number;
  onChange?: (value: string) => void;
}

export interface KPIReviewConfirmation {
  id: number;
  kpi_id: number;
  employee_id: number;
  manager_id: number;
  employee_rating: number;
  employee_final_rating?: number;
  employee_rating_percentage?: number;
  employee_final_rating_percentage?: number;
  employee_comment: string;
  manager_rating: number;
  manager_final_rating?: number;
  manager_final_rating_percentage?: number;
  manager_comment: string;
  overall_comment: string;
  overall_manager_comment?: string;
  review_status: string;
  kpi_title: string;
  kpi_description: string;
  manager_name: string;
  
  // KPI items array
  items?: Array<{
    id: number;
    kpi_id: number;
    title: string;
    description?: string;
    target_value?: string;
    actual_value?: string;
    measure_unit?: string;
    measure_criteria?: string;
    current_performance_status?: string;
    expected_completion_date?: string;
    goal_weight?: string;
    item_order: number;
    percentage_value_obtained?: number;
    manager_rating_percentage?: number;
    exclude_from_calculation?: number;
  }>;
  
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
}

export interface ConfirmationSubmission {
  confirmation_status: 'approved' | 'rejected';
  rejection_note: string | null;
  signature: string | null;
  // Physical Meeting Confirmation - Employee
  employee_confirmation_meeting_confirmed?: boolean;
  employee_confirmation_meeting_location?: string | null;
  employee_confirmation_meeting_date?: string | null;
  employee_confirmation_meeting_time?: string | null;
}
