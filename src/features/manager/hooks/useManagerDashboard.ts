/**
 * Manager Dashboard Hook
 * 
 * Manages Manager dashboard state and logic
 */

import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchKPIs, selectAllKPIs, selectKPILoading } from '../../../store/slices/kpiSlice';
import { fetchDepartmentStatistics } from '../../../store/slices/statisticsSlice';
import { fetchDepartments } from '../../../store/slices/departmentSlice';
import { fetchPeriodSettings } from '../../../store/slices/settingsSlice';
import { managerService } from '../services';
import { DashboardFilters, Employee, ManagerDepartment, EmployeeWithStatus } from '../types';
import { KPI, KPIReview, Notification } from '../../../types';
import { getKPIStageWithProgress } from './managerDashboardUtils';
import { useDepartmentFeatures, DepartmentFeatures } from '../../../hooks/useDepartmentFeatures';
import api from '../../../services/api';

interface PeriodSetting {
  id: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  is_active: boolean;
}

export const useManagerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state (global cached data)
  const kpis = useAppSelector(selectAllKPIs);
  const kpisLoading = useAppSelector(selectKPILoading);
  const { departmentStatistics, loading: statsLoading } = useAppSelector((state) => state.statistics);
  const { departments: departmentsList } = useAppSelector((state) => state.departments);
  const { periodSettings } = useAppSelector((state) => state.settings);

  // Local state (manager-specific, non-cacheable data)
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentKPIs, setRecentKPIs] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeKPIs, setEmployeeKPIs] = useState<any[]>([]);
  const [loadingEmployeeKPIs, setLoadingEmployeeKPIs] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [filters, setFilters] = useState<DashboardFilters>({
    period: '',
    department: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [categoryEmployees, setCategoryEmployees] = useState<Employee[]>([]);
  const [kpisByCategory, setKpisByCategory] = useState<any[]>([]);
  const [employeeDeptFeaturesCache, setEmployeeDeptFeaturesCache] = useState<Record<number, DepartmentFeatures>>({});
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [savingDefault, setSavingDefault] = useState(false);
  const [managerDepartments, setManagerDepartments] = useState<ManagerDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiType, setKpiType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<PeriodSetting[]>([]);
  const [yearlyPeriods, setYearlyPeriods] = useState<PeriodSetting[]>([]);

  const isLoading = loading || kpisLoading || statsLoading;

  const toast = useToast();
  const { fetchDepartmentFeaturesById } = useDepartmentFeatures();
  

  
  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
    loadDefaultPeriod();
    fetchAvailablePeriods();
  }, [dispatch]);

  // Fetch KPIs when category is selected (except for no_kpi which needs employees)
  useEffect(() => {
    if (selectedCategory && selectedDepartment) {
      if (selectedCategory === 'no_kpi') {
        // For no_kpi, fetch employees instead
        fetchCategoryEmployees(selectedDepartment, selectedCategory);
        setKpisByCategory([]);
      } else {
        // For other categories, fetch KPIs
        fetchKPIsByCategoryData(selectedDepartment, selectedCategory);
        setCategoryEmployees([]);
      }
    } else {
      setCategoryEmployees([]);
      setKpisByCategory([]);
    }
  }, [selectedCategory, selectedDepartment, filters.period]);

  // Refetch statistics when filters change
  useEffect(() => {
    const params: any = {};
    if (filters.period) params.period = filters.period;
    if (filters.department) params.department = filters.department;
    dispatch(fetchDepartmentStatistics(params));
  }, [dispatch, filters.period, filters.department]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch Redux-managed data
      dispatch(fetchKPIs({}));
      dispatch(fetchDepartmentStatistics({}));
      dispatch(fetchPeriodSettings());
      dispatch(fetchDepartments());

      // Fetch manager-specific data in parallel
      const [reviewsData, notificationsData, activityData, employeesData, departmentsData, recentKPIsData] = 
        await Promise.all([
          managerService.fetchReviews().catch(() => []),
          managerService.fetchNotifications(5).catch(() => []),
          managerService.fetchRecentActivity().catch(() => []),
          managerService.fetchEmployees().catch(() => []),
          managerService.fetchManagerDepartments().catch(() => []),
          managerService.fetchRecentKPIs(10).catch(() => []),
        ]);

      setReviews(reviewsData);
      setNotifications(notificationsData);
      setRecentActivity(activityData);
      setEmployees(employeesData);
      setManagerDepartments(departmentsData);
      setRecentKPIs(recentKPIsData);
   
    } catch (error) {
     
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIsByCategoryData = async (department: string, category: string) => {
    try {
      const data = await managerService.fetchKPIsByCategory(department, category, filters.period);
      
      // Fetch department features for all unique employee departments
      const employeeDeptIds = [...new Set(
        data
          .map((kpi: any) => kpi.employee_department_id)
          .filter((id: any) => id != null)
      )] as number[];
      
      // Fetch department features for all employee departments
      const newCache: Record<number, DepartmentFeatures> = {};
      await Promise.all(
        employeeDeptIds.map(async (deptId) => {
          const features = await fetchDepartmentFeaturesById(deptId);
          if (features) {
            newCache[deptId] = features;
          }
        })
      );
      
      setEmployeeDeptFeaturesCache(newCache);
      setKpisByCategory(data);
    } catch (error) {
      setKpisByCategory([]);
    }
  };

  const fetchCategoryEmployees = async (department: string, category: string) => {
    try {
      const data = await managerService.fetchEmployeesByCategory(department, category);
      setCategoryEmployees(data);
    } catch (error) {
      setCategoryEmployees([]);
    }
  };

  const loadDefaultPeriod = () => {
    const saved = localStorage.getItem('manager_dashboard_default_period');
    if (saved) {
      setDefaultPeriod(saved);
      setFilters(prev => ({ ...prev, period: saved }));
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
      if (toast) toast.error('Could not fetch available periods.');
    }
  };

  const updateFilterPeriod = (period: PeriodSetting) => {
    // Format: period_type|quarter|year (same as existing format)
    const periodValue = `${period.period_type}|${period.quarter || ''}|${period.year}`;
    setFilters(prev => ({ ...prev, period: periodValue }));
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

  const saveDefaultPeriod = async (): Promise<boolean> => {
    try {
      setSavingDefault(true);
      localStorage.setItem('manager_dashboard_default_period', filters.period);
      setDefaultPeriod(filters.period);
      return true;
    } catch (error) {
      toast.error('Could not save your default period.');
      return false;
    } finally {
      setSavingDefault(false);
    }
  };

  const handleCategoryClick = (department: string, category: string, count: number) => {
    if (count === 0) return;
    setSelectedDepartment(department);
    setSelectedCategory(category);
  };

  const clearCategorySelection = () => {
    setSelectedCategory(null);
    setSelectedDepartment(null);
  };

  const handleEmployeeSelect = async (employeeId: number | null) => {
    setSelectedEmployeeId(employeeId);
    
    if (employeeId) {
      try {
        setLoadingEmployeeKPIs(true);
        const employeeKPIsData = await managerService.fetchEmployeeKPIs(employeeId.toString());
        setEmployeeKPIs(employeeKPIsData || []);
      } catch (error) {
        toast.error('Could not load employee KPIs');
        setEmployeeKPIs([]);
      } finally {
        setLoadingEmployeeKPIs(false);
      }
    } else {
      setEmployeeKPIs([]);
    }
  };

  const getEmployeeKPICount = (employeeId: number): number => {
    return kpis.filter((k: KPI) => k.employee_id === employeeId).length;
  };

  const getEmployeeKPIStatus = (employeeId: number) => {
    const employeeKPIs = kpis.filter((k: KPI) => k.employee_id === employeeId);
    if (employeeKPIs.length === 0) {
      return { stage: 'No KPIs', color: 'bg-gray-100 text-gray-700', progress: 0, icon: null };
    }
    
    // Get the most recent KPI status
    const latestKPI = employeeKPIs[0];
    return getKPIStageWithProgress(latestKPI, reviews);
  };

  const getEmployeeStatusList = (): EmployeeWithStatus[] => {
    return employees
      .filter(emp => emp.role === 'employee')
      .map(emp => ({
        ...emp,
        kpiCount: getEmployeeKPICount(emp.id),
        status: getEmployeeKPIStatus(emp.id),
      }))
      .slice(0, 5);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.related_kpi_id) {
      navigate(`/manager/kpi-details/${notification.related_kpi_id}`);
    } else if (notification.related_review_id) {
      navigate(`/manager/kpi-review/${notification.related_review_id}`);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await managerService.markNotificationRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      toast.error('Could not mark notification as read.');
    }
  };

  // Check if a KPI should show "Manager to initiate" based on employee dept features
  const shouldShowAsManagerInitiated = (kpi: any): boolean => {
    if (kpi.employee_department_id && employeeDeptFeaturesCache[kpi.employee_department_id]) {
      const employeeFeatures = employeeDeptFeaturesCache[kpi.employee_department_id];
      const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
      
      if (kpiPeriod === 'yearly') {
        return employeeFeatures.enable_employee_self_rating_yearly === false;
      } else {
        return employeeFeatures.enable_employee_self_rating_quarterly === false;
      }
    }
    return false;
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
    recentKPIs,
    selectedEmployeeId,
    employeeKPIs,
    loadingEmployeeKPIs,
    employeeSearch,
    filters,
    selectedCategory,
    selectedDepartment,
    categoryEmployees,
    kpisByCategory,
    defaultPeriod,
    savingDefault,
    managerDepartments,
    loading: isLoading,
    kpiType,
    selectedPeriodId,
    quarterlyPeriods,
    yearlyPeriods,
    
    // Computed
    employeeStatusList: getEmployeeStatusList(),
    filteredEmployees: employees.filter(emp => 
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.payroll_number && emp.payroll_number.toLowerCase().includes(employeeSearch.toLowerCase()))
    ),
    
    // Actions
    setFilters,
    saveDefaultPeriod,
    handleCategoryClick,
    clearCategorySelection,
    handleNotificationClick,
    handleMarkNotificationRead,
    handleEmployeeSelect,
    setEmployeeSearch,
    getEmployeeKPICount,
    getEmployeeKPIStatus,
    shouldShowAsManagerInitiated,
    navigate,
    handleKpiTypeChange,
    handlePeriodChange,
  };
};