/**
 * HR Dashboard Hook
 * 
 * Manages HR dashboard state and logic
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchKPIs } from '../../../store/slices/kpiSlice';
import { fetchDepartmentStatistics } from '../../../store/slices/statisticsSlice';
import { fetchDepartments } from '../../../store/slices/departmentSlice';
import { fetchPeriodSettings } from '../../../store/slices/settingsSlice';
import { hrService } from '../services';
import { DashboardFilters, Employee, Manager } from '../types';
import { KPIReview, Notification } from '../../../types';
import api from '../../../services/api';

interface PeriodSetting {
  id: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  is_active: boolean;
}

export const useHRDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const { kpis, loading: kpisLoading } = useAppSelector((state) => state.kpi);
  const { departmentStatistics, loading: statsLoading } = useAppSelector((state) => state.statistics);
  const { departments: departmentsList } = useAppSelector((state) => state.departments);
  const { periodSettings } = useAppSelector((state) => state.settings);

  // Local state for non-Redux data
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeKPIs, setEmployeeKPIs] = useState<any[]>([]);
  const [loadingEmployeeKPIs, setLoadingEmployeeKPIs] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [filters, setFilters] = useState<DashboardFilters>({
    department: '',
    period: '',
    manager: '',
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [kpisByCategory, setKpisByCategory] = useState<any[]>([]);
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [savingDefault, setSavingDefault] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [kpiType, setKpiType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<PeriodSetting[]>([]);
  const [yearlyPeriods, setYearlyPeriods] = useState<PeriodSetting[]>([]);

  const loading = kpisLoading || statsLoading;


  // Initial data fetch
  useEffect(() => {
    dispatch(fetchKPIs({}));
    dispatch(fetchDepartmentStatistics(filters));
    dispatch(fetchDepartments());
    dispatch(fetchPeriodSettings());
    
    fetchReviewsData();
    fetchNotificationsData();
    fetchRecentActivityData();
    fetchManagersData();
    fetchEmployeesData();
    loadDefaultPeriod();
    fetchAvailablePeriods();
  }, [dispatch]);

  // Fetch KPIs when category is selected
  useEffect(() => {
    if (selectedDepartment && selectedCategory) {
      fetchKPIsByCategoryData(selectedDepartment, selectedCategory);
    } else {
      setKpisByCategory([]);
    }
  }, [selectedDepartment, selectedCategory, filters.period]);

  // Refetch statistics when filters change
  useEffect(() => {
    dispatch(fetchDepartmentStatistics(filters));
  }, [dispatch, filters.department, filters.period, filters.manager]);

  const fetchReviewsData = async () => {
    try {
      const data = await hrService.fetchReviews();
      setReviews(data);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch reviews.');
      }
    }
  };

  const fetchNotificationsData = async () => {
    try {
      const data = await hrService.fetchNotifications(5);
      setNotifications(data);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch notifications.');
      }
    }
  };

  const fetchRecentActivityData = async () => {
    try {

      const data = await hrService.fetchRecentActivity();
      setRecentActivity(data);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch activity.');
      }
    }
  };

  const fetchKPIsByCategoryData = async (department: string, category: string) => {
    try {
      const data = await hrService.fetchKPIsByCategory(department, category, filters.period);
      setKpisByCategory(data);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch KPIs.');
      }
      setKpisByCategory([]);
    }
  };

  const fetchManagersData = async () => {
    try {
      const data = await hrService.fetchManagers();
      setManagers(data);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch managers.');
      }
    }
  };

  const fetchEmployeesData = async () => {
    try {
      const data = await hrService.fetchEmployees();
      setEmployees(data);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch employees.');
      }
    }
  };

  const handleEmployeeSelect = async (employeeId: number | null) => {
    setSelectedEmployeeId(employeeId);
    
    if (employeeId) {
      try {
        setLoadingEmployeeKPIs(true);
        // Use the existing KPI fetching with employee filter
        const response = await api.get('/kpis', { params: { employee_id: employeeId } });
        const kpisData = response.data.data?.kpis || response.data.kpis || [];
        setEmployeeKPIs(kpisData);
      } catch (error) {
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error('Could not load employee KPIs');
        }
        setEmployeeKPIs([]);
      } finally {
        setLoadingEmployeeKPIs(false);
      }
    } else {
      setEmployeeKPIs([]);
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      // Fetch both quarterly and yearly periods
      const [quarterlyRes, yearlyRes] = await Promise.all([
        api.get('/settings/available-periods', { params: { period_type: 'quarterly' } }),
        api.get('/settings/available-periods', { params: { period_type: 'yearly' } })
      ]);

      const quarterly = Array.isArray(quarterlyRes.data?.periods) ? quarterlyRes.data.periods : [];
      const yearly = Array.isArray(yearlyRes.data?.periods) ? yearlyRes.data.periods : [];

      setQuarterlyPeriods(quarterly);
      setYearlyPeriods(yearly);

      // Set default selected period based on current type
      if (kpiType === 'quarterly' && quarterly.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(quarterly[0].id);
        updateFilterPeriod(quarterly[0]);
      } else if (kpiType === 'yearly' && yearly.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(yearly[0].id);
        updateFilterPeriod(yearly[0]);
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch available periods.');
      }
    }
  };

  const updateFilterPeriod = (period: PeriodSetting) => {
    // Format: period_type|quarter|year (same as existing format)
    const periodValue = `${period.period_type}|${period.quarter || ''}|${period.year}`;
    setFilters(prev => ({ ...prev, period: periodValue }));
  };

  const loadDefaultPeriod = () => {
    const saved = localStorage.getItem('hr_dashboard_default_period');
    if (saved) {
      setDefaultPeriod(saved);
      setFilters(prev => ({ ...prev, period: saved }));
    }
  };

  const saveDefaultPeriod = (period: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        setSavingDefault(true);
        localStorage.setItem('hr_dashboard_default_period', period);
        setDefaultPeriod(period);
        resolve(true);
      } catch (error) {
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error('Could not save default period.');
        }
        resolve(false);
      } finally {
        setSavingDefault(false);
      }
    });
  };

  const handleCategoryClick = (department: string, category: string, count: number) => {
    if (count === 0) return;
    setSelectedDepartment(department);
    setSelectedCategory(category);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.related_kpi_id) {

      navigate(`/hr/kpi-details/${notification.related_kpi_id}`);
    } else {

    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {

      await hrService.markNotificationRead(id);

      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);

        return updated;
      });
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not mark notification as read.');
      }
    }
  };

  const clearCategorySelection = () => {
    setSelectedCategory(null);
    setSelectedDepartment(null);
  };

  const handleKpiTypeChange = (newType: 'quarterly' | 'yearly') => {
    setKpiType(newType);
    // Reset to first period of new type
    const newPeriods = newType === 'quarterly' ? quarterlyPeriods : yearlyPeriods;
    if (newPeriods.length > 0) {
      setSelectedPeriodId(newPeriods[0].id);
      updateFilterPeriod(newPeriods[0]);
    } else {
      setSelectedPeriodId(null);
      setFilters(prev => ({ ...prev, period: '' }));
    }
  };

  const handlePeriodChange = (periodId: number) => {
    setSelectedPeriodId(periodId);
    const currentPeriods = kpiType === 'quarterly' ? quarterlyPeriods : yearlyPeriods;
    const selectedPeriod = currentPeriods.find(p => p.id === periodId);
    if (selectedPeriod) {
      updateFilterPeriod(selectedPeriod);
    }
  };

  return {
    // State
    kpis,
    reviews,
    departmentStatistics,
    departmentsList,
    periodSettings,
    notifications,
    recentActivity,
    employees,
    selectedEmployeeId,
    employeeKPIs,
    loadingEmployeeKPIs,
    employeeSearch,
    filters,
    selectedDepartment,
    selectedCategory,
    kpisByCategory,
    defaultPeriod,
    savingDefault,
    managers,
    loading,
    kpiType,
    selectedPeriodId,
    quarterlyPeriods,
    yearlyPeriods,
    
    // Computed
    filteredEmployees: employees.filter(emp => 
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.payroll_number && emp.payroll_number.toLowerCase().includes(employeeSearch.toLowerCase()))
    ),
    
    // Actions
    setFilters,
    saveDefaultPeriod,
    handleCategoryClick,
    handleNotificationClick,
    handleMarkNotificationRead,
    handleEmployeeSelect,
    setEmployeeSearch,
    clearCategorySelection,
    navigate,
    handleKpiTypeChange,
    handlePeriodChange,
  };
};
