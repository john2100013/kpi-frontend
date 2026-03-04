import api from './api';

export interface BonusType {
  id: number;
  name: string;
  description: string;
  calculation_type: 'sales' | 'manager_rating';
  is_active: number;
}

export interface EmployeeBonus {
  id: number;
  company_id: number;
  employee_id: number;
  bonus_scheme_id?: number | null;
  kpi_id?: number;
  calculation_type:  'sales' | 'manager_rating';
  sales_percentage?: number;
  average_non_sales_rating?: number;
  sales_bonus_amount?: number;
  kpi_bonus_amount?: number;
  sales_multiplier?: number;
  calculated_bonus_amount: number;
  final_bonus_amount?: number;
  adjustment_reason?: string;
  payment_status: 'pending' | 'paid' | 'rejected';
  payment_date?: string;
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  employee_name?: string;
  employee_email?: string;
  has_sales_component?: number;
  scheme_name?: string;
  period_type?: string;
  year?: number;
  quarter?: string;
  bonus_type_name?: string;
  department_name?: string;
  approved_by_name?: string;
}

export interface BonusMultiplier {
  id: number;
  company_id: number;
  achievement_percentage: number;
  multiplier: number;
  display_order: number;
  is_active: number;
}

/**
 * Get all bonus types
 */
export const getBonusTypes = async (): Promise<BonusType[]> => {
  const response = await api.get('/bonus/types');
  return response.data.bonusTypes;
};


/**
 * Get employee bonuses
 */
export const getEmployeeBonuses = async (filters?: {
  employeeId?: number;
  departmentId?: number;
  paymentStatus?: string;
  year?: number;
  quarter?: string;
}): Promise<EmployeeBonus[]> => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
  if (filters?.departmentId) params.append('departmentId', filters.departmentId.toString());
  if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  if (filters?.year) params.append('year', filters.year.toString());
  if (filters?.quarter) params.append('quarter', filters.quarter);
  
  const response = await api.get(`/bonus/employee-bonuses?${params.toString()}`);
  return response.data.bonuses;
};

/**
 * Update bonus status
 */
export const updateBonusStatus = async (
  bonusId: number,
  status: 'pending' | 'paid' | 'rejected',
  notes?: string
): Promise<EmployeeBonus> => {
  const response = await api.put(`/bonus/employee-bonuses/${bonusId}/status`, { status, notes });
  return response.data.bonus;
};

/**
 * Adjust bonus amount
 */
export const adjustBonusAmount = async (
  bonusId: number,
  amount: number,
  reason: string
): Promise<EmployeeBonus> => {
  const response = await api.put(`/bonus/employee-bonuses/${bonusId}/adjust`, { amount, reason });
  return response.data.bonus;
};

/**
 * Get bonus multipliers
 */
export const getBonusMultipliers = async (): Promise<BonusMultiplier[]> => {
  const response = await api.get('/bonus/multipliers');
 
  return response.data.multipliers;
};

/**
 * Create bonus multiplier
 */
export const createBonusMultiplier = async (multiplierData: {
  achievementPercentage: number;
  multiplier: number;
  displayOrder?: number;
}): Promise<BonusMultiplier> => {
  const response = await api.post('/bonus/multipliers', multiplierData);
  return response.data.multiplier;
};

/**
 * Update bonus multiplier
 */
export const updateBonusMultiplier = async (
  multiplierId: number,
  multiplierData: {
    achievementPercentage: number;
    multiplier: number;
    displayOrder?: number;
  }
): Promise<BonusMultiplier> => {
  const response = await api.put(`/bonus/multipliers/${multiplierId}`, multiplierData);
  return response.data.multiplier;
};

/**
 * Delete bonus multiplier
 */
export const deleteBonusMultiplier = async (multiplierId: number): Promise<void> => {
  await api.delete(`/bonus/multipliers/${multiplierId}`);
};

/**
 * Bulk upload bonus multipliers from Excel file
 */
export const bulkUploadMultipliers = async (file: File): Promise<{
  success: boolean;
  created: number;
  updated: number;
  errors: any[];
  multipliers: BonusMultiplier[];
}> => {
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/bonus/multipliers/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Calculate employee bonus with new logic
 */
export const calculateEmployeeBonus = async (bonusData: {
  employeeId: number;
  kpiId: number;
  periodType?: 'quarterly' | 'yearly';
}): Promise<EmployeeBonus> => {
  const response = await api.post('/bonus/calculate-employee', bonusData);
  return response.data.bonus;
};
