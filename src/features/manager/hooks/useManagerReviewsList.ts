/**
 * useManagerReviewsList
 * 
 * Custom hook for managing reviews list page state and logic.
 * Now includes acknowledged KPIs waiting for manager to initiate review
 * UPDATED: Supports filtering between all reviews and primary department reviews only
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { KPIReview, KPI } from '../../../types';
import { useDepartmentFeatures, DepartmentFeatures } from '../../../hooks/useDepartmentFeatures';

interface ManagerDepartment {
  id: number;
  name: string;
  is_primary: number;
  assigned_at: string;
  employee_count: number;
  active_kpi_count: number;
}

interface UseManagerReviewsListReturn {
  reviews: KPIReview[];
  acknowledgedKPIs: KPI[];
  loading: boolean;
  pendingCount: number;
  reviewFilter: 'all' | 'primary-only';
  managerDepartments: ManagerDepartment[];
  filteredReviews: KPIReview[];
  filteredAcknowledgedKPIs: KPI[];
  getStatusColor: (status: string) => string;
  handleBack: () => void;
  handleReview: (reviewId: number) => void;
  handleEdit: (reviewId: number) => void;
  handleViewKPI: (kpiId: number) => void;
  handleView: (reviewId: number) => void;
  handleStartReview: (kpiId: number) => void;
  shouldShowAsManagerInitiated: (kpi: KPI) => boolean;
  setReviewFilter: (filter: 'all' | 'primary-only') => void;
}

export const useManagerReviewsList = (): UseManagerReviewsListReturn => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [acknowledgedKPIs, setAcknowledgedKPIs] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'primary-only'>('all');
  const [managerDepartments, setManagerDepartments] = useState<ManagerDepartment[]>([]);
  const toast = useToast();
  const { fetchDepartmentFeaturesById } = useDepartmentFeatures();
  
  // Cache for employee department features to avoid repeated API calls
  const [employeeDeptFeaturesCache, setEmployeeDeptFeaturesCache] = useState<Record<number, DepartmentFeatures>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch reviews, acknowledged KPIs, and manager departments with access levels
      const [reviewsResponse, kpisResponse, departmentsResponse] = await Promise.all([
        api.get('/kpi-review'),
        api.get('/kpis/acknowledged-review-pending'),
        api.get('/users/managers/departments-with-access')
      ]);
      
      // Handle nested response structure: response.data.data.kpis OR response.data.kpis
      const acknowledgedKPIsData = kpisResponse.data.data?.kpis || kpisResponse.data.kpis || [];
      const reviewsData = reviewsResponse.data.data?.reviews || reviewsResponse.data.reviews || [];
      const departmentsData = departmentsResponse.data.departments || [];
      
     
      // Extract unique employee department IDs from acknowledged KPIs
      const employeeDeptIds = [...new Set(
        acknowledgedKPIsData
          .map((kpi: any) => kpi.employee_department_id)
          .filter((id: any) => id != null)
      )] as number[];
      
      // Fetch department features for all employee departments
      const newCache: Record<number, DepartmentFeatures> = {};
      await Promise.all(
        employeeDeptIds.map(async (deptId) => {
          const features = await fetchDepartmentFeaturesById(deptId);
          if (features) {
            newCache[deptId] = features;
          }
        })
      );
      
      setEmployeeDeptFeaturesCache(newCache);
      setReviews(reviewsData);
      setAcknowledgedKPIs(acknowledgedKPIsData);
      setManagerDepartments(departmentsData);
    } catch (error) {
      toast.error('Could not fetch manager reviews data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter reviews based on selected filter
  const filteredReviews = useMemo(() => {
    
    
    if (reviewFilter === 'primary-only') {
      const filtered = reviews.filter(r => r.is_primary === 1);
      return filtered;
    }
    
    return reviews;
  }, [reviews, reviewFilter]);

  // Filter acknowledged KPIs based on selected filter
  const filteredAcknowledgedKPIs = useMemo(() => {
   
    
    if (reviewFilter === 'primary-only') {
      const filtered = acknowledgedKPIs.filter(kpi => kpi.is_primary === 1);
      return filtered;
    }
    
    return acknowledgedKPIs;
  }, [acknowledgedKPIs, reviewFilter]);

  // Check if a KPI should be shown as "Manager to initiate" based on period and settings
  // CHECKS THE EMPLOYEE'S DEPARTMENT FEATURES
  const shouldShowAsManagerInitiated = (kpi: KPI & { employee_department_id?: number }): boolean => {
    // If employee_department_id is available, use cached department features
    if (kpi.employee_department_id && employeeDeptFeaturesCache[kpi.employee_department_id]) {
      const employeeFeatures = employeeDeptFeaturesCache[kpi.employee_department_id];
      const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
      
      if (kpiPeriod === 'yearly') {
        return employeeFeatures.enable_employee_self_rating_yearly === false;
      } else {
        return employeeFeatures.enable_employee_self_rating_quarterly === false;
      }
    }
    
    // If no employee department features available, return false (default to employee self-rate)
    return false;
  };

  const pendingCount = filteredReviews.filter(
    r => r.review_status === 'employee_submitted' || r.review_status === 'pending'
  ).length + filteredAcknowledgedKPIs.filter(shouldShowAsManagerInitiated).length;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'manager_submitted':
      case 'awaiting_employee_confirmation':
        return 'bg-blue-100 text-blue-700';
      case 'employee_submitted':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'manager_initiate':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleReview = (reviewId: number) => {
    navigate(`/manager/kpi-review/${reviewId}`);
  };

  const handleEdit = (reviewId: number) => {
    navigate(`/manager/kpi-review/${reviewId}`);
  };

  const handleViewKPI = (kpiId: number) => {
    navigate(`/manager/kpi-details/${kpiId}`);
  };

  const handleView = (reviewId: number) => {
    navigate(`/manager/kpi-review/${reviewId}`);
  };

  const handleStartReview = (kpiId: number) => {
    navigate(`/manager/kpi-review/kpi/${kpiId}`);
  };

  return {
    reviews,
    acknowledgedKPIs,
    loading,
    pendingCount,
    reviewFilter,
    managerDepartments,
    filteredReviews,
    filteredAcknowledgedKPIs,
    getStatusColor,
    handleBack,
    handleReview,
    handleEdit,
    handleViewKPI,
    handleView,
    handleStartReview,
    shouldShowAsManagerInitiated,
    setReviewFilter,
  };
};
