import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { KPI, KPIReview } from '../../../types';
import {
  calculateDashboardStats,
  getDashboardKPIStage,
  getUniquePeriods,
  filterKpis,
  scrollToTable,
} from './dashboardUtils';

export const useEmployeeDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
    checkPasswordChange();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      console.log('🔄 [useEmployeeDashboard] Fetching KPIs and reviews...');
      setLoading(true);
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);

      console.log('🔍 [useEmployeeDashboard] Raw API responses:', {
        kpisResponse: kpisRes.data,
        reviewsResponse: reviewsRes.data
      });

      // Fix: Backend returns data in response.data.data.kpis, not response.data.kpis
      const kpisData = kpisRes.data.data?.kpis || kpisRes.data.kpis || [];
      const reviewsData = reviewsRes.data.reviews || [];

      console.log('✅ [useEmployeeDashboard] Data fetched:', {
        kpisCount: kpisData.length,
        reviewsCount: reviewsData.length,
        kpisData: kpisData,
        reviewsData: reviewsData
      });

      // DEBUGGING: Log each review's status fields
      reviewsData.forEach((review: KPIReview) => {
        console.log(`📋 [Review ${review.id}] Status fields:`, {
          kpi_id: review.kpi_id,
          review_status: review.review_status,
          status: (review as any).status,
          has_review_status: 'review_status' in review,
          has_status: 'status' in review,
          all_fields: Object.keys(review),
          is_manager_submitted_check_1: review.review_status === 'manager_submitted',
          is_manager_submitted_check_2: (review as any).status === 'manager_submitted'
        });
      });

      // Log reviews with manager_submitted status specifically
      const managerSubmittedReviews = reviewsData.filter((r: any) => 
        r.review_status === 'manager_submitted' || r.status === 'manager_submitted'
      );
      console.log('🎯 [useEmployeeDashboard] Manager submitted reviews found:', {
        count: managerSubmittedReviews.length,
        reviews: managerSubmittedReviews
      });

      setKpis(kpisData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('❌ [useEmployeeDashboard] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordChange = async () => {
    console.log('[useEmployeeDashboard] 🔍 Checking password change requirement...');
    
    // Only check backend - ignore URL params and localStorage
    try {
      console.log('[useEmployeeDashboard] 📡 Fetching user data from backend...');
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      
      console.log('[useEmployeeDashboard] 👤 User data from backend:', {
        id: userData.id,
        email: userData.email,
        password_change_required: userData.password_change_required,
        type: typeof userData.password_change_required
      });
      
      const backendRequires = userData.password_change_required === true || userData.password_change_required === 1;
      console.log('[useEmployeeDashboard] 🔐 Backend password_change_required:', backendRequires);
      
      if (backendRequires) {
        console.log('[useEmployeeDashboard] ⚠️ Password change required - showing modal');
        setPasswordChangeRequired(true);
        setShowPasswordModal(true);
      } else {
        console.log('[useEmployeeDashboard] ✅ Password change not required - hiding modal');
        setPasswordChangeRequired(false);
        setShowPasswordModal(false);
        
        // Clear any stale data
        localStorage.removeItem('passwordChangeRequired');
        
        // Remove URL parameter if present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('passwordChangeRequired')) {
          console.log('[useEmployeeDashboard] 🧹 Removing passwordChangeRequired from URL');
          urlParams.delete('passwordChangeRequired');
          const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
    } catch (error) {
      console.error('[useEmployeeDashboard] ❌ Error fetching user data:', error);
      // On error, don't show modal
      setPasswordChangeRequired(false);
      setShowPasswordModal(false);
    }
  };

  const handleStatusFilterClick = (status: string) => {
    setSelectedStatus(status);
    scrollToTable();
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeRequired(false);
  };

  const handleViewKPI = (kpiId: number) => {
    navigate(`/employee/kpi-details/${kpiId}`);
  };

  const handleAcknowledgeKPI = (kpiId: number) => {
    // FIXED: Navigate directly to KPI acknowledgement form
    navigate(`/employee/kpi-acknowledgement/${kpiId}`);
  };

  const handleReviewKPI = (kpiId: number) => {
    navigate(`/employee/self-rating/${kpiId}`);
  };

  const handleConfirmReview = (reviewId: number) => {
    navigate(`/employee/kpi-confirmation/${reviewId}`);
  };

  const handleEditReview = (kpiId: number) => {
    navigate(`/employee/self-rating/${kpiId}`);
  };

  const stats = calculateDashboardStats(kpis, reviews);
  console.log('📊 [useEmployeeDashboard] Stats calculated:', {
    stats,
    kpis_count: kpis.length,
    reviews_count: reviews.length,
    awaitingConfirmation_count: stats.awaitingConfirmation
  });
  
  const uniquePeriods = getUniquePeriods(kpis);
  const filteredKpis = filterKpis(kpis, reviews, searchTerm, selectedPeriod, selectedStatus);

  return {
    // Data
    kpis,
    reviews,
    filteredKpis,
    stats,
    uniquePeriods,
    loading,

    // Password Modal
    showPasswordModal,
    passwordChangeRequired,
    handleClosePasswordModal,

    // Filters
    searchTerm,
    setSearchTerm,
    selectedPeriod,
    setSelectedPeriod,
    selectedStatus,
    setSelectedStatus,

    // Actions
    handleStatusFilterClick,
    handleViewKPI,
    handleAcknowledgeKPI,
    handleReviewKPI,
    handleConfirmReview,
    handleEditReview,

    // Utilities
    getDashboardKPIStage,
    navigate,
  };
};