import { useState, useEffect, useMemo } from 'react';
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
  const [error] = useState<string | null>(null);
  const [kpiDeptFeaturesCache, setKpiDeptFeaturesCache] = useState<Record<number, DepartmentFeatures>>({});

  const dispatch = useAppDispatch();
  
  // Get data from Redux store
  const allKpis = useAppSelector(selectAllKPIs);
  const allReviews = useAppSelector(selectAllReviews);
  const loading = useAppSelector(selectKPILoading);
  const [, setDepartmentFeatures] = useState<DepartmentFeatures | null>(null);
  
  useEffect(() => {
    // Dispatch Redux action to fetch KPIs and reviews
    dispatch(fetchKPIsAndReviews());
    fetchDepartmentFeatures();
  }, [dispatch]);

  // Memoize filtered KPIs that need review
  const kpis = useMemo(() => {
    return allKpis.filter((kpi: KPI) => {
      const review = allReviews.find((r: KPIReview) => r.kpi_id === kpi.id);
      const reviewStatus = (review as any)?.status || review?.review_status;

      // Show KPIs where employee needs to take action for REVIEW only:
      // 1. Review Pending - acknowledged but no SUBMITTED review exists (drafts don't count)
      // 2. Self-Rating Required - review exists with status 'pending'
      // NOTE: We do NOT show 'Awaiting Your Confirmation' or 'completed' here
      
      // Check if review is SUBMITTED (not a draft)
      const submittedReview = allReviews.find((r: KPIReview) => r.kpi_id === kpi.id && r.is_draft !== true);
      
      if (kpi.status === 'acknowledged' && !submittedReview) {
        return true; // Review Pending
      }
      
      if (review && reviewStatus === 'pending') {
        return true; // Self-Rating Required
      }

      return false;
    });
  }, [allKpis, allReviews]);

  // Helper: Check if self-rating is enabled for a specific KPI based on its period and department features
  const isSelfRatingEnabledForKPI = (kpi: KPI): boolean => {
    if (kpi.id && kpiDeptFeaturesCache[kpi.id]) {
      const features = kpiDeptFeaturesCache[kpi.id];
      const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
      
      if (kpiPeriod === 'yearly') {
        return features.enable_employee_self_rating_yearly !== false;
      } else {
        return features.enable_employee_self_rating_quarterly !== false;
      }
    }
    return true;
  };

  // Fetch department features for KPIs (only for filtering, after Redux loads them)
  const fetchDepartmentFeatures = async () => {
    try {
      // Fetch department features once (applies to all employee KPIs)
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
  };

  // Fetch KPI-specific department features once KPIs are loaded from Redux
  useEffect(() => {
    if (kpis.length > 0 && Object.keys(kpiDeptFeaturesCache).length === 0) {
      const fetchKPIDepartmentFeatures = async () => {
        const newCache: Record<number, DepartmentFeatures> = {};
        await Promise.all(
          kpis.map(async (kpi: KPI) => {
            if (kpi.id) {
              try {
                const response = await api.get(`/department-features/kpi/${kpi.id}`);
                if (response.data) {
                  newCache[kpi.id] = response.data;
                }
              } catch (err) {
                newCache[kpi.id] = {
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
                };
              }
            }
          })
        );
        setKpiDeptFeaturesCache(newCache);
      };
      fetchKPIDepartmentFeatures();
    }
  }, [kpis.length]);

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
    refetch: () => dispatch(fetchKPIsAndReviews()),
  };
};