import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
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
  const { user } = useAuth(); 
  const [kpis, setKpis] = useState<KPI[]>(props?.initialKpis || []);
  const [reviews, setReviews] = useState<KPIReview[]>(props?.initialReviews || []);
  const [loading, setLoading] = useState(!props?.initialKpis && !props?.initialReviews);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
   const initialDataSetRef = useRef(false);

  useEffect(() => {
    if (initialDataSetRef.current) {
      return;
    }
    if (props?.initialKpis || props?.initialReviews) {
      if (props.initialKpis && props.initialKpis.length > 0) {
        setKpis(props.initialKpis);
      }
      if (props.initialReviews && props.initialReviews.length > 0) {
        setReviews(props.initialReviews);
      }
      setLoading(false);
      initialDataSetRef.current = true;
    }
  }, [props?.initialKpis, props?.initialReviews]);

  useEffect(() => {
    checkPasswordChange();
  }, []);

  const checkPasswordChange = async () => {
    if (!user) {
      setPasswordChangeRequired(false);
      setShowPasswordModal(false);
      return;
    }
    const backendRequires = !!user.requires_password_change;
    if (backendRequires) {
      setPasswordChangeRequired(true);
      setShowPasswordModal(true);
    } else {
      setPasswordChangeRequired(false);
      setShowPasswordModal(false);
      localStorage.removeItem('passwordChangeRequired');
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('passwordChangeRequired')) {
        urlParams.delete('passwordChangeRequired');
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
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