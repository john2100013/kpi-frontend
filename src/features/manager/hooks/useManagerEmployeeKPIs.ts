/**
 * useManagerEmployeeKPIs
 * 
 * Custom hook for managing employee KPIs page state and logic.
 * Displays all KPIs for a specific employee with search functionality.
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate, useParams } from 'react-router-dom';
import { managerService } from '../services/managerService';
import { getKPIStage } from './managerDashboardUtils';
import type { KPI, KPIReview, User } from '../../../types';

interface UseManagerEmployeeKPIsReturn {
  kpis: KPI[];
  reviews: KPIReview[];
  employee: User | null;
  loading: boolean;
  searchQuery: string;
  filteredKPIs: KPI[];
  setSearchQuery: (query: string) => void;
  getKPIStageInfo: (kpi: KPI) => ReturnType<typeof getKPIStage>;
  handleKPIClick: (kpiId: number) => void;
  handleBack: () => void;
}

export const useManagerEmployeeKPIs = (): UseManagerEmployeeKPIsReturn => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (!employeeId) {
      console.error('No employeeId provided');
      return;
    }

    try {
      setLoading(true);
            const [employeeKPIs, allReviews, employeeData] = await Promise.all([
        managerService.fetchEmployeeKPIs(employeeId),
        managerService.fetchReviews(),
        managerService.fetchEmployeeById(employeeId),
      ]);

      setKpis(employeeKPIs || []);
      setReviews(allReviews || []);
      setEmployee(employeeData || null);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
      setKpis([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const filteredKPIs = useMemo(() => {
    if (!kpis || kpis.length === 0) {
      return [];
    }

    if (!searchQuery.trim()) {
      return kpis;
    }

    const query = searchQuery.toLowerCase();
    const filtered = kpis.filter((kpi) =>
      kpi.title?.toLowerCase().includes(query) ||
      kpi.quarter?.toLowerCase().includes(query) ||
      kpi.description?.toLowerCase().includes(query)
    );
    
    return filtered;
  }, [kpis, searchQuery]);

  // Get KPI stage information
  const getKPIStageInfo = (kpi: KPI) => {
    return getKPIStage(kpi, reviews);
  };

  // Navigate to KPI details
  const handleKPIClick = (kpiId: number) => {
    navigate(`/manager/kpi-details/${kpiId}`);
  };

  // Go back
  const handleBack = () => {
    navigate(-1);
  };

  return {
    kpis,
    reviews,
    employee,
    loading,
    searchQuery,
    filteredKPIs,
    setSearchQuery,
    getKPIStageInfo,
    handleKPIClick,
    handleBack,
  };
};
