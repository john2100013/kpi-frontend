/**
 * useDepartmentFeatures Hook
 * Manages fetching department-specific KPI calculation features
 * This hook replaces company-level features with department-level features
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
}

export const useDepartmentFeatures = (kpiId?: number) => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<DepartmentFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch department features for current user's department
   * OR for a specific KPI's employee department if kpiId is provided
   */
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      
      let endpoint = `${API_URL}/department-features/my-department`;
      
      // If kpiId is provided, fetch features for that KPI's employee department
      if (kpiId) {
        endpoint = `${API_URL}/department-features/kpi/${kpiId}`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 [useDepartmentFeatures] Fetched features:', {
        kpiId,
        endpoint,
        features: response.data
      });

      setFeatures(response.data);
    } catch (err: any) {
      console.error('❌ [useDepartmentFeatures] Error fetching features:', err);
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

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/department-features/${departmentId}`,
        updatedFeatures,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ [useDepartmentFeatures] Updated features:', response.data);
      setFeatures(response.data.features);
      return true;
    } catch (err: any) {
      console.error('❌ [useDepartmentFeatures] Error updating features:', err);
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
   * Check if employee self-rating is enabled for quarterly KPIs
   */
  const isEmployeeSelfRatingEnabled = (): boolean => {
    return features?.enable_employee_self_rating_quarterly || false;
  };

  // Fetch features on mount or when kpiId changes
  useEffect(() => {
    if (user?.department || kpiId) {
      fetchFeatures();
    }
  }, [user?.department, kpiId]);

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
  };
};
