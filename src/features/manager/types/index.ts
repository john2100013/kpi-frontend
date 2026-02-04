/**
 * Manager Feature Types
 */

export interface DashboardFilters {
  period: string;
  department: string;
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

export interface ManagerDepartment {
  id: number;
  name: string;
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
  };
}

export interface EmployeeWithStatus extends Employee {
  kpiCount: number;
  status: {
    stage: string;
    color: string;
    progress: number;
  };
}

export interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
  field?: string;
  itemId?: number;
}
