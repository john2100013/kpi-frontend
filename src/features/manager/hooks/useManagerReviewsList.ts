/**
 * useManagerReviewsList
 * 
 * Custom hook for managing reviews list page state and logic.
 * Now includes acknowledged KPIs waiting for manager to initiate review
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { KPIReview, KPI } from '../../../types';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

interface UseManagerReviewsListReturn {
  reviews: KPIReview[];
  acknowledgedKPIs: KPI[];
  loading: boolean;
  pendingCount: number;
  getStatusColor: (status: string) => string;
  handleBack: () => void;
  handleReview: (reviewId: number) => void;
  handleEdit: (reviewId: number) => void;
  handleViewKPI: (kpiId: number) => void;
  handleView: (reviewId: number) => void;
  handleStartReview: (kpiId: number) => void;
  shouldShowAsManagerInitiated: (kpi: KPI) => boolean;
}

export const useManagerReviewsList = (): UseManagerReviewsListReturn => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [acknowledgedKPIs, setAcknowledgedKPIs] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const { features } = useCompanyFeatures();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('🔍 [useManagerReviewsList] Fetching reviews and acknowledged KPIs...');
    try {
      // Fetch both reviews and acknowledged KPIs waiting for review
      const [reviewsResponse, kpisResponse] = await Promise.all([
        api.get('/kpi-review'),
        api.get('/kpis/acknowledged-review-pending')
      ]);
      
      console.log('📦 [useManagerReviewsList] Raw responses:', {
        reviewsResponse: reviewsResponse.data,
        kpisResponse: kpisResponse.data
      });
      
      // Handle nested response structure: response.data.data.kpis OR response.data.kpis
      const acknowledgedKPIsData = kpisResponse.data.data?.kpis || kpisResponse.data.kpis || [];
      const reviewsData = reviewsResponse.data.data?.reviews || reviewsResponse.data.reviews || [];
      
      console.log('✅ [useManagerReviewsList] Data extracted:', {
        reviews: reviewsData.length,
        acknowledgedKPIs: acknowledgedKPIsData.length
      });
      console.log('✅ [useManagerReviewsList] Reviews data:', reviewsData);
      console.log('✅ [useManagerReviewsList] Acknowledged KPIs:', acknowledgedKPIsData);
      
      setReviews(reviewsData);
      setAcknowledgedKPIs(acknowledgedKPIsData);
    } catch (error) {
      console.error('❌ [useManagerReviewsList] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a KPI should be shown as "Manager to initiate" based on period and settings
  const shouldShowAsManagerInitiated = (kpi: KPI): boolean => {
    if (!features) {
      console.log('⚠️ [shouldShowAsManagerInitiated] No features loaded yet');
      return false;
    }
    
    console.log(`🔍 [shouldShowAsManagerInitiated] Checking KPI ${kpi.id}:`, {
      period: kpi.period,
      quarterly_self_rating_enabled: features.enable_employee_self_rating_quarterly
    });
    
    // For quarterly KPIs, check quarterly self-rating setting
    if (kpi.period === 'quarterly') {
      const result = features.enable_employee_self_rating_quarterly === false;
      console.log(`✅ [shouldShowAsManagerInitiated] KPI ${kpi.id} (quarterly): ${result ? 'Manager initiates' : 'Employee self-rates'}`);
      return result;
    }
    
    // For yearly KPIs - currently we only have quarterly self-rating flag
    // You may need to add a yearly flag in the future
    // For now, assume yearly follows same logic as quarterly
    const result = features.enable_employee_self_rating_quarterly === false;
    console.log(`✅ [shouldShowAsManagerInitiated] KPI ${kpi.id} (yearly): ${result ? 'Manager initiates' : 'Employee self-rates'}`);
    return result;
  };

  const pendingCount = reviews.filter(
    r => r.review_status === 'employee_submitted' || r.review_status === 'pending'
  ).length + acknowledgedKPIs.filter(shouldShowAsManagerInitiated).length;

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
    // Simply navigate to the KPI review page with the KPI ID
    // The review record will be created when the manager submits ratings, not now
    console.log(`🚀 [handleStartReview] Navigating to review KPI ID: ${kpiId}`);
    navigate(`/manager/kpi-review/kpi/${kpiId}`);
  };

  return {
    reviews,
    acknowledgedKPIs,
    loading,
    pendingCount,
    getStatusColor,
    handleBack,
    handleReview,
    handleEdit,
    handleViewKPI,
    handleView,
    handleStartReview,
    shouldShowAsManagerInitiated,
  };
};
