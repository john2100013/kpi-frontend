import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { KPI, KPIReview } from '../../../types';
import api from '../../../services/api';
import {
  calculateDashboardStats,
  getDashboardKPIStage,
  getUniquePeriods,
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
  
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filteredKpis, setFilteredKpis] = useState<KPI[]>([]);
  
  const initialDataSetRef = useRef(false);

  // Fetch KPIs with server-side pagination
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query parameters for server-side filtering and pagination
        const params: Record<string, any> = {
          page: currentPage,
          limit: itemsPerPage,
        };
        
        if (searchTerm) {
          params.search = searchTerm;
        }
        
        if (selectedStatus) {
          params.status = selectedStatus;
        }
        
        if (selectedPeriod) {
          params.period = selectedPeriod;
        }
        
        // Fetch KPIs with pagination
        const [kpisResponse, reviewsResponse] = await Promise.all([
          api.get('/kpis', { params }),
          api.get('/kpi-review')
        ]);
        
        const kpisData = kpisResponse.data.data?.kpis || kpisResponse.data.kpis || [];
        const paginationData = kpisResponse.data.data?.pagination || kpisResponse.data.pagination;
        const reviewsData = reviewsResponse.data.reviews || [];
        
        setKpis(kpisData);
        setFilteredKpis(kpisData);
        setReviews(reviewsData);
        
        if (paginationData) {
          setTotalPages(paginationData.totalPages || paginationData.total_pages || 1);
          setTotalCount(paginationData.total || paginationData.total_count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch KPIs:', error);
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error('Failed to load KPIs');
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if not using initial props
    if (!props?.initialKpis && !initialDataSetRef.current) {
      fetchData();
    } else if (props?.initialKpis && !initialDataSetRef.current) {
      // Use initial props data if provided
      if (props.initialKpis) {
        setKpis(props.initialKpis);
        setFilteredKpis(props.initialKpis);
      }
      if (props.initialReviews) {
        setReviews(props.initialReviews);
      }
      setLoading(false);
      initialDataSetRef.current = true;
    }
  }, [currentPage, searchTerm, selectedStatus, selectedPeriod, itemsPerPage, props?.initialKpis, props?.initialReviews]);

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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      scrollToTable();
    }
  };
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  const handleFilterChange = (filterType: 'period' | 'status', value: string) => {
    if (filterType === 'period') {
      setSelectedPeriod(value);
    } else {
      setSelectedStatus(value);
    }
    setCurrentPage(1); // Reset to first page on filter change
  };

  const stats = calculateDashboardStats(kpis, reviews);
  
  const uniquePeriods = getUniquePeriods(kpis);

  return {
    // Data
    kpis,
    reviews,
    filteredKpis,
    stats,
    uniquePeriods,
    loading,

    // Pagination
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    handlePageChange,

    // Password Modal
    showPasswordModal,
    passwordChangeRequired,
    handleClosePasswordModal,

    // Filters
    searchTerm,
    setSearchTerm: handleSearchChange,
    selectedPeriod,
    setSelectedPeriod,
    selectedStatus,
    setSelectedStatus,
    handleFilterChange,

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