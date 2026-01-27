import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchKPIsAndReviews, selectAllKPIs, selectAllReviews, selectKPILoading } from '../../../store/slices/kpiSlice';
import { KPI, KPIReview } from '../../../types';
import api from '../../../services/api';
import { DepartmentFeatures } from '../../../hooks/useDepartmentFeatures';

interface ReviewStatusInfo {
  stage: string;
  color: string;
}

export const useEmployeeReviews = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  
  // Get data from Redux store
  const allKpis = useAppSelector(selectAllKPIs);
  const allReviews = useAppSelector(selectAllReviews);
  const loading = useAppSelector(selectKPILoading);
  
  const [error, setError] = useState<string | null>(null);
  const [departmentFeatures, setDepartmentFeatures] = useState<DepartmentFeatures | null>(null);
  
  useEffect(() => {
    fetchReviewPendingKPIs();
  }, []);

  // Helper: Check if self-rating is enabled for a specific KPI based on its period and department features
  const isSelfRatingEnabledForKPI = (kpi: KPI): boolean => {
    if (!departmentFeatures) return true;
    
    const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
    
    if (kpiPeriod === 'yearly') {
      return departmentFeatures.enable_employee_self_rating_yearly !== false;
    } else {
      return departmentFeatures.enable_employee_self_rating_quarterly !== false;
    }
  };

  const fetchReviewPendingKPIs = async () => {
    try {
      setError(null);

      // Fetch from Redux if not already loaded
      if (allKpis.length === 0 && allReviews.length === 0) {
        await dispatch(fetchKPIsAndReviews()).unwrap();
      }
      
      // Fetch department features once (applies to all employee KPIs)
      try {
        const response = await api.get('/department-features/my-department');
        if (response.data) {
          setDepartmentFeatures(response.data);
        }
      } catch (err) {
        // Set default features on error
        setDepartmentFeatures({
          department_id: 0,
          company_id: 0,
          use_goal_weight_yearly: false,
          use_goal_weight_quarterly: false,
          use_actual_values_yearly: false,
          use_actual_values_quarterly: false,
          use_normal_calculation: true,
          enable_employee_self_rating_quarterly: true,
          enable_employee_self_rating_yearly: true,
          is_default: true,
        });
      }
    } catch (err) {
      toast.error('Could not load your review pending KPIs. Please try again.');
      setError('Failed to load review pending KPIs');
    }
  };
  
  // Memoize filtered KPIs that need review
  const kpis = useMemo(() => {
    return allKpis.filter((kpi: KPI) => {
      const review = allReviews.find((r: KPIReview) => r.kpi_id === kpi.id);
      const reviewStatus = (review as any)?.status || review?.review_status;

      // Show KPIs where:
      // 1. Review Pending - acknowledged but no review exists
      // 2. Self-Rating Required - review exists with status 'pending'
      // 3. Awaiting Your Confirmation - review with status 'manager_submitted' or 'awaiting_employee_confirmation'
      
      if (kpi.status === 'acknowledged' && !review) {
        return true; // Review Pending
      }
      
      if (review && reviewStatus === 'pending') {
        return true; // Self-Rating Required
      }
      
      if (review && (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation')) {
        return true; // Awaiting Your Confirmation
      }

      return false;
    });
  }, [allKpis, allReviews]);

  const getReviewStatus = (kpi: KPI): ReviewStatusInfo => {
    const review = allReviews.find(r => r.kpi_id === kpi.id);
    const reviewStatus = (review as any)?.status || review?.review_status;
    const selfRatingEnabled = isSelfRatingEnabledForKPI(kpi);
    
    if (!review && kpi.status === 'acknowledged') {
      // Check if self-rating is disabled for this KPI period
      if (!selfRatingEnabled) {
        return {
          stage: 'Manager Will Initiate Review',
          color: 'bg-purple-100 text-purple-700'
        };
      }
      return {
        stage: 'Review Pending - Action Required',
        color: 'bg-blue-100 text-blue-700'
      };
    }
    
    if (review && reviewStatus === 'pending') {
      return {
        stage: 'Self-Rating Required',
        color: 'bg-purple-100 text-purple-700'
      };
    }

    if (review && (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation')) {
      return {
        stage: 'Awaiting Your Confirmation',
        color: 'bg-indigo-100 text-indigo-700'
      };
    }

    return {
      stage: 'Review Pending',
      color: 'bg-blue-100 text-blue-700'
    };
  };

  const handleViewKPI = (kpiId: number) => {
    navigate(`/employee/kpi-details/${kpiId}`);
  };

  const handleStartReview = (kpiId: number) => {
    navigate(`/employee/self-rating/${kpiId}`);
  };

  const handleConfirmReview = (reviewId: number) => {
    navigate(`/employee/kpi-confirmation/${reviewId}`);
  };

  return {
    kpis,
    reviews: allReviews,
    loading,
    error,
    getReviewStatus,
    isSelfRatingEnabledForKPI,
    handleViewKPI,
    handleStartReview,
    handleConfirmReview,
    refetch: fetchReviewPendingKPIs,
  };
};