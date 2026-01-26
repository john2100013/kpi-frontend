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
  const [filters, setFilters] = useState<DashboardFilters>({
    department: '',
    period: '',
    manager: '',
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [savingDefault, setSavingDefault] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);

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
    loadDefaultPeriod();
  }, [dispatch]);

  // Fetch employees when category is selected
  useEffect(() => {
    if (selectedDepartment && selectedCategory) {
      fetchEmployeesData(selectedDepartment, selectedCategory);
    } else {
      setEmployees([]);
    }
  }, [selectedDepartment, selectedCategory]);

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

  const fetchEmployeesData = async (department: string, category: string) => {
    try {
      const data = await hrService.fetchEmployeesByCategory(department, category);
      setEmployees(data);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch employees.');
      }
      setEmployees([]);
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

  return {
    // State
    kpis,
    reviews,
    departmentStatistics,
    departmentsList,
    periodSettings,
    notifications,
    recentActivity,
    filters,
    selectedDepartment,
    selectedCategory,
    employees,
    defaultPeriod,
    savingDefault,
    managers,
    loading,
    
    // Actions
    setFilters,
    saveDefaultPeriod,
    handleCategoryClick,
    handleNotificationClick,
    handleMarkNotificationRead,
    clearCategorySelection,
    navigate,
  };
};
