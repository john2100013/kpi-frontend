import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KPI, KPIReview } from '../../../types';
import api from '../../../services/api';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

interface ReviewStatusInfo {
  stage: string;
  color: string;
}

export const useEmployeeReviews = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { features } = useCompanyFeatures();

  useEffect(() => {
    fetchReviewPendingKPIs();
  }, []);

  // Helper: Check if self-rating is enabled for a specific KPI based on its period
  const isSelfRatingEnabledForKPI = (kpi: KPI): boolean => {
    if (!features) return true; // Default to enabled if features not loaded
    
    const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
    
    if (kpiPeriod === 'yearly') {
      return features.enable_employee_self_rating_yearly !== false;
    } else {
      return features.enable_employee_self_rating_quarterly !== false;
    }
  };

  const fetchReviewPendingKPIs = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useEmployeeReviews] Fetching KPIs and reviews...');
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);

      console.log('🔍 [useEmployeeReviews] Raw API responses:', {
        kpisResponse: kpisRes.data,
        reviewsResponse: reviewsRes.data
      });

      // Fix: Backend returns data in response.data.data.kpis or response.data.kpis
      const allKpis = kpisRes.data.data?.kpis || kpisRes.data.kpis || [];
      const reviewsList = reviewsRes.data.reviews || [];

      console.log('✅ [useEmployeeReviews] Data fetched:', {
        allKpisCount: allKpis.length,
        reviewsCount: reviewsList.length
      });

      // Filter KPIs that need employee action based on the same logic as dashboard
      const needReviewKPIs = allKpis.filter((kpi: KPI) => {
        const review = reviewsList.find((r: KPIReview) => r.kpi_id === kpi.id);
        const reviewStatus = (review as any)?.status || review?.review_status;

        // Show KPIs where:
        // 1. Review Pending - acknowledged but no review exists
        // 2. Self-Rating Required - review exists with status 'pending'
        // 3. Awaiting Your Confirmation - review with status 'manager_submitted' or 'awaiting_employee_confirmation'
        
        if (kpi.status === 'acknowledged' && !review) {
          console.log(`📋 [Review Pending] KPI ${kpi.id}: ${kpi.title}`);
          return true; // Review Pending
        }
        
        if (review && reviewStatus === 'pending') {
          console.log(`✍️ [Self-Rating Required] KPI ${kpi.id}: ${kpi.title}`);
          return true; // Self-Rating Required
        }
        
        if (review && (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation')) {
          console.log(`🔔 [Awaiting Confirmation] KPI ${kpi.id}: ${kpi.title}`);
          return true; // Awaiting Your Confirmation
        }

        return false;
      });

      console.log('🎯 [useEmployeeReviews] Filtered KPIs:', {
        total: allKpis.length,
        needReview: needReviewKPIs.length,
        kpis: needReviewKPIs.map((k: KPI) => ({ id: k.id, title: k.title, status: k.status }))
      });

      setKpis(needReviewKPIs);
      setReviews(reviewsList);
    } catch (err) {
      console.error('❌ [useEmployeeReviews] Error fetching review pending KPIs:', err);
      setError('Failed to load review pending KPIs');
    } finally {
      setLoading(false);
    }
  };

  const getReviewStatus = (kpi: KPI): ReviewStatusInfo => {
    const review = reviews.find(r => r.kpi_id === kpi.id);
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
    reviews,
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