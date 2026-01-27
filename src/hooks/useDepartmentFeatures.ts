/**
 * useDepartmentFeatures Hook
 * Manages fetching department-specific KPI calculation features
 * This hook replaces company-level features with department-level features
 */

import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface DepartmentFeatures {
  id?: number;
  department_id: number;
  company_id: number;
  use_goal_weight_yearly: boolean;
  use_goal_weight_quarterly: boolean;
  use_actual_values_yearly: boolean;
  use_actual_values_quarterly: boolean;
  use_normal_calculation: boolean;
  enable_employee_self_rating_quarterly: boolean;
  enable_employee_self_rating_yearly: boolean;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
}

export const useDepartmentFeatures = (kpiId?: number, initialData?: DepartmentFeatures | null) => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<DepartmentFeatures | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData); // If initialData exists, start with loading=false
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  

  /**
   * Fetch department features for current user's department
   * OR for a specific KPI's employee department if kpiId is provided
   */
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '';
      let response;
      // If kpiId is provided, fetch features for that KPI's employee department
      if (kpiId) {
        endpoint = `/department-features/kpi/${kpiId}`;
        response = await api.get(endpoint);
      }
      setFeatures(response?.data ?? null);
    } catch (err: any) {
      toast.error('Could not fetch department features. Please try again.');
      setError(err.response?.data?.error || 'Failed to fetch department features');
      
      // Set default features on error
      setFeatures({
        department_id: 0,
        company_id: user?.company_id || 0,
        use_goal_weight_yearly: false,
        use_goal_weight_quarterly: false,
        use_actual_values_yearly: false,
        use_actual_values_quarterly: false,
        use_normal_calculation: true,
        enable_employee_self_rating_quarterly: false,
        enable_employee_self_rating_yearly: false,
        is_default: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update department features (HR/Super Admin only)
   */
  const updateFeatures = async (
    departmentId: number, 
    updatedFeatures: Partial<DepartmentFeatures>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put(
        `/department-features/${departmentId}`,
        updatedFeatures
      );

      setFeatures(response.data.features);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update department features');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get calculation method name for display
   */
  const getCalculationMethodName = (kpiType: 'yearly' | 'quarterly'): string => {
    if (!features) return 'Normal Calculation';

    if (kpiType === 'yearly') {
      if (features.use_actual_values_yearly) return 'Actual vs Target Values';
      if (features.use_goal_weight_yearly) return 'Goal Weight Calculation';
      return 'Normal Calculation';
    } else {
      if (features.use_actual_values_quarterly) return 'Actual vs Target Values';
      if (features.use_goal_weight_quarterly) return 'Goal Weight Calculation';
      return 'Normal Calculation';
    }
  };

  /**
   * Check if goal weights are required
   */
  const areGoalWeightsRequired = (kpiType: 'yearly' | 'quarterly'): boolean => {
    if (!features) return false;

    if (kpiType === 'yearly') {
      return features.use_goal_weight_yearly || features.use_actual_values_yearly;
    } else {
      return features.use_goal_weight_quarterly || features.use_actual_values_quarterly;
    }
  };

  /**
   * Check if actual values are required
   */
  const areActualValuesRequired = (kpiType: 'yearly' | 'quarterly'): boolean => {
    if (!features) return false;

    if (kpiType === 'yearly') {
      return features.use_actual_values_yearly;
    } else {
      return features.use_actual_values_quarterly;
    }
  };

  /**
   * Check if employee self-rating is enabled
   * @param kpiPeriod - The KPI period type: 'yearly' or 'quarterly'. If not provided, defaults to 'quarterly'
   */
  const isEmployeeSelfRatingEnabled = (kpiPeriod?: 'yearly' | 'quarterly'): boolean => {
    if (!features) return false;
    
    // Default to quarterly for backward compatibility
    const period = kpiPeriod || 'quarterly';
    
    if (period === 'yearly') {
      return features.enable_employee_self_rating_yearly || false;
    } else {
      return features.enable_employee_self_rating_quarterly || false;
    }
  };

  /**
   * HELPER: Fetch department features for a specific department ID
   * This is useful whenca checking features for an employee's department that differs from the current user's
   */
  const fetchDepartmentFeaturesById = async (departmentId: number): Promise<DepartmentFeatures | null> => {
    try {
      const response = await api.get(`/department-features/${departmentId}/details`);

      return response.data;
    } catch (err: any) {
      toast.error('Could not fetch department features for this department.');
      return null;
    }
  };

  // Fetch features on mount or when kpiId or user ID changes
  useEffect(() => {
    
    // If initialData is provided, use it and don't fetch
    if (initialData) {
      setFeatures(initialData);
      setLoading(false);
      return;
    }
    
    // Only fetch if no initialData is provided and user exists
    if (user?.id) {
      fetchFeatures();
    } else {
      setLoading(false);
    }
  }, [user?.id, kpiId, initialData]);

  return {
    features,
    loading,
    error,
    fetchFeatures,
    updateFeatures,
    getCalculationMethodName,
    areGoalWeightsRequired,
    areActualValuesRequired,
    isEmployeeSelfRatingEnabled,
    fetchDepartmentFeaturesById, // Export the new helper
  };
};
