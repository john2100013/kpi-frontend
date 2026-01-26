import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { KPI, KPIReview } from '../../../types';
import { getKPIStage, getPrimaryAction, canEditReview } from './kpiListUtils';

export const useEmployeeKPIList = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const toast = useToast();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);

      setKpis(kpisRes.data.kpis || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      toast.error('Could not fetch your KPIs. Please try again.');
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

  const handleReviewKPI = (kpiId: number) => {
    navigate(`/employee/self-rating/${kpiId}`);
  };

  const handleConfirmReview = (reviewId: number) => {
    navigate(`/employee/kpi-confirmation/${reviewId}`);
  };

  const handleEditReview = (kpiId: number) => {
    navigate(`/employee/self-rating/${kpiId}`);
  };

  // ADD: handleBack function
  const handleBack = () => {
    navigate(-1);
  };

  // Filter logic
  const filteredKpis = kpis.filter((kpi) => {
    const matchesSearch =
      !searchTerm ||
      kpi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const period = `${kpi.quarter} ${kpi.year}`;
    const matchesPeriod = !selectedPeriod || period === selectedPeriod;

    const matchesStatus = !selectedStatus || kpi.status === selectedStatus;

    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const uniquePeriods = Array.from(
    new Set(kpis.map((kpi) => `${kpi.quarter} ${kpi.year}`))
  ).sort();

  return {
    kpis,
    reviews,
    filteredKpis,
    loading,
    searchTerm,
    setSearchTerm,
    selectedPeriod,
    setSelectedPeriod,
    selectedStatus,
    setSelectedStatus,
    uniquePeriods,
    handleViewKPI,
    handleAcknowledgeKPI,
    handleReviewKPI,
    handleConfirmReview,
    handleEditReview,
    handleBack, // ADD: Export handleBack
    getKPIStage,
    getPrimaryAction,
    canEditReview,
    navigate, // ADD: Export navigate for use in components
  };
};