/**
 * Manager KPI List Hook
 * 
 * Manages KPI list state and logic
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchKPIs } from '../../../store/slices/kpiSlice';
import { managerService } from '../services';
import { KPIReview } from '../../../types';
import { getKPIStage } from './managerDashboardUtils';
import { useToast } from '../../../context/ToastContext';

export const useManagerKPIList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const { kpis, loading: kpisLoading } = useAppSelector((state) => state.kpi);

  // Local state
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, [dispatch]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch KPIs from Redux
      dispatch(fetchKPIs({}));
      
      // Fetch reviews from service
      const reviewsData = await managerService.fetchReviews();
      setReviews(reviewsData);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter KPIs based on search query
  const filteredKPIs = useMemo(() => {
    if (!searchQuery.trim()) return kpis;
    
    const query = searchQuery.toLowerCase();
    return kpis.filter((kpi) =>
      kpi.title?.toLowerCase().includes(query) ||
      kpi.employee_name?.toLowerCase().includes(query) ||
      kpi.employee_department?.toLowerCase().includes(query)
    );
  }, [kpis, searchQuery]);

  // Get stage info for a KPI
  const getKPIStageInfo = (kpiId: number) => {
    const kpi = kpis.find(k => k.id === kpiId);
    if (!kpi) return { stage: '', color: '', icon: null };
    return getKPIStage(kpi, reviews);
  };

  const handleKPIClick = (kpiId: number) => {
    navigate(`/manager/kpi-details/${kpiId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return {
    // State
    kpis: filteredKPIs,
    reviews,
    searchQuery,
    loading: loading || kpisLoading,
    
    // Actions
    setSearchQuery,
    getKPIStageInfo,
    handleKPIClick,
    handleBack,
  };
};
