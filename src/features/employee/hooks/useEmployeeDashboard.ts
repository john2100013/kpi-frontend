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

interface UseEmployeeDashboardProps {
  initialKpis?: KPI[];
  initialReviews?: KPIReview[];
}

export const useEmployeeDashboard = (props?: UseEmployeeDashboardProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

 
  const [kpis, setKpis] = useState<KPI[]>(props?.initialKpis || []);
  const [reviews, setReviews] = useState<KPIReview[]>(props?.initialReviews || []);
  const [loading, setLoading] = useState(!props?.initialKpis && !props?.initialReviews);

  // Update state when props change
  useEffect(() => {
    if (props?.initialKpis && props.initialKpis.length > 0) {
      setKpis(props.initialKpis);
    }
    if (props?.initialReviews && props.initialReviews.length > 0) {
      setReviews(props.initialReviews);
    }
    if (props?.initialKpis || props?.initialReviews) {
      setLoading(false);
    }
  }, [props?.initialKpis, props?.initialReviews]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    // Only fetch if no initial data is provided
    const hasInitialData = props?.initialKpis && props?.initialKpis.length > 0 && props?.initialReviews && props?.initialReviews.length > 0;
    const shouldFetch = !hasInitialData;
    
    
    checkPasswordChange();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);


      // Fix: Backend returns data in response.data.data.kpis, not response.data.kpis
      const kpisData = kpisRes.data.data?.kpis || kpisRes.data.kpis || [];
      const reviewsData = reviewsRes.data.reviews || [];

      

      setKpis(kpisData);
      setReviews(reviewsData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordChange = async () => {

    
    // Only check backend - ignore URL params and localStorage
    try {

      const response = await api.get('/auth/me');
      const userData = response.data.user;
      
      
      const backendRequires = userData.password_change_required === true || userData.password_change_required === 1;

      
      if (backendRequires) {

        setPasswordChangeRequired(true);
        setShowPasswordModal(true);
      } else {

        setPasswordChangeRequired(false);
        setShowPasswordModal(false);
        
        // Clear any stale data
        localStorage.removeItem('passwordChangeRequired');
        
        // Remove URL parameter if present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('passwordChangeRequired')) {

          urlParams.delete('passwordChangeRequired');
          const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
    } catch (error) {
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