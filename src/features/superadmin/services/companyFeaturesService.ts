/**
 * Company Features Service
 * API calls for managing company calculation features
 */

import api from '../../../services/api';

export interface CompanyFeatures {
  id?: number;
  company_id: number;
  company_name?: string;
  use_goal_weight_yearly: boolean;
  use_goal_weight_quarterly: boolean;
  use_actual_values_yearly: boolean;
  use_actual_values_quarterly: boolean;
  use_normal_calculation: boolean;
  enable_employee_self_rating_quarterly: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyFeaturesUpdatePayload {
  use_goal_weight_yearly?: boolean;
  use_goal_weight_quarterly?: boolean;
  use_actual_values_yearly?: boolean;
  use_actual_values_quarterly?: boolean;
  use_normal_calculation?: boolean;
  enable_employee_self_rating_quarterly?: boolean;
}

/**
 * Get all companies with their calculation features
 */
export const getAllCompanyFeatures = async (): Promise<CompanyFeatures[]> => {
  try {
    console.log('[companyFeaturesService] Calling GET /company-features');
    const response = await api.get('/company-features');
    console.log('[companyFeaturesService] Response:', response.data);
    const features = response.data.data || response.data || [];
    console.log('[companyFeaturesService] Returning features:', features);
    return features;
  } catch (error: any) {
    console.error('[companyFeaturesService] Error fetching company features:', error.message, error.response?.data);
    throw error;
  }
};

/**
 * Get calculation features for a specific company
 */
export const getCompanyFeatures = async (companyId: number): Promise<CompanyFeatures> => {
  const response = await api.get(`/company-features/${companyId}`);
  return response.data;
};

/**
 * Update calculation features for a specific company
 */
export const updateCompanyFeatures = async (
  companyId: number,
  features: CompanyFeaturesUpdatePayload
): Promise<CompanyFeatures> => {
  console.log('[companyFeaturesService] updateCompanyFeatures called for company ID:', companyId);
  console.log('[companyFeaturesService] Features being sent:', features);
  try {
    const response = await api.put(`/company-features/${companyId}`, features);
    console.log('[companyFeaturesService] Update successful, response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[companyFeaturesService] Update failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Helper function to determine the calculation method name
 */
export const getCalculationMethodName = (features: CompanyFeatures, periodType: 'yearly' | 'quarterly'): string => {
  if (periodType === 'yearly') {
    if (features.use_actual_values_yearly) return 'Actual vs Target Values';
    if (features.use_goal_weight_yearly) return 'Goal Weight';
    return 'Normal Calculation';
  } else {
    if (features.use_actual_values_quarterly) return 'Actual vs Target Values';
    if (features.use_goal_weight_quarterly) return 'Goal Weight';
    return 'Normal Calculation';
  }
};

/**
 * Helper function to check if goal weights are required
 */
export const areGoalWeightsRequired = (features: CompanyFeatures, periodType: 'yearly' | 'quarterly'): boolean => {
  if (periodType === 'yearly') {
    return features.use_goal_weight_yearly || features.use_actual_values_yearly;
  } else {
    return features.use_goal_weight_quarterly || features.use_actual_values_quarterly;
  }
};

/**
 * Helper function to check if actual values are required
 */
export const areActualValuesRequired = (features: CompanyFeatures, periodType: 'yearly' | 'quarterly'): boolean => {
  if (periodType === 'yearly') {
    return features.use_actual_values_yearly;
  } else {
    return features.use_actual_values_quarterly;
  }
};
