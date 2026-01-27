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
  const [filters, setFilters] = useState<DashboardFilters>({
    period: '',
    department: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [categoryEmployees, setCategoryEmployees] = useState<Employee[]>([]);
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [savingDefault, setSavingDefault] = useState(false);
  const [managerDepartments, setManagerDepartments] = useState<ManagerDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoading = loading || kpisLoading || statsLoading;

  const toast = useToast();
  

  
  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
    loadDefaultPeriod();
  }, [dispatch]);

  // Fetch employees when category is selected
  useEffect(() => {
    if (selectedCategory && selectedDepartment) {
      fetchCategoryEmployees(selectedDepartment, selectedCategory);
    } else {
      setCategoryEmployees([]);
    }
  }, [selectedCategory, selectedDepartment]);

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
      const [reviewsData, notificationsData, activityData, employeesData, departmentsData] = 
        await Promise.all([
          managerService.fetchReviews().catch(err => {
            return [];
          }),
          managerService.fetchNotifications(5).catch(err => {
            return [];
          }),
          managerService.fetchRecentActivity().catch(err => {
            return [];
          }),
          managerService.fetchEmployees().catch(err => {
            return [];
          }),
          managerService.fetchManagerDepartments().catch(err => {
            return [];
          }),
        ]);

      

      setReviews(reviewsData);
      setNotifications(notificationsData);
      setRecentActivity(activityData);
      setEmployees(employeesData);
      setManagerDepartments(departmentsData);
   
    } catch (error) {
     
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
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
    filters,
    selectedCategory,
    selectedDepartment,
    categoryEmployees,
    defaultPeriod,
    savingDefault,
    managerDepartments,
    loading: isLoading,
    
    // Computed
    employeeStatusList: getEmployeeStatusList(),
    
    // Actions
    setFilters,
    saveDefaultPeriod,
    handleCategoryClick,
    clearCategorySelection,
    handleNotificationClick,
    handleMarkNotificationRead,
    getEmployeeKPICount,
    getEmployeeKPIStatus,
    navigate,
  };
};