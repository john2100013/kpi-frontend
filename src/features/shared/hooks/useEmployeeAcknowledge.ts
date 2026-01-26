import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KPI } from '../../../types';
import { employeeService } from '../services/employeeService';

export const useEmployeeAcknowledge = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingKPIs();
  }, []);

  const fetchPendingKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const pendingKPIs = await employeeService.fetchPendingKPIs();
      setKpis(pendingKPIs);
    } catch (err) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Failed to load pending KPIs. Please try again.');
      }
      setError('Failed to load pending KPIs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewKPI = (kpiId: number) => {
    navigate(`/employee/kpi-details/${kpiId}`);
  };

  const handleAcknowledgeKPI = (kpiId: number) => {
    navigate(`/employee/kpi-acknowledgement/${kpiId}`);
  };

  return {
    kpis,
    loading,
    error,
    handleViewKPI,
    handleAcknowledgeKPI,
    refetch: fetchPendingKPIs,
  };
};