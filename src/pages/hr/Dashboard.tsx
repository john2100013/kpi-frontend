import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview, Notification } from '../../types';
import NotificationItem from '../../components/NotificationItem';
import { FiFilter, FiEye, FiCheckCircle, FiClock, FiFileText, FiBell, FiUsers, FiSave, FiEdit } from 'react-icons/fi';

interface DepartmentStatistic {
  department: string;
  total_employees: number;
  categories: {
    pending: number;
    acknowledged_review_pending: number;
    self_rating_submitted: number;
    awaiting_employee_confirmation: number;
    review_completed: number;
    review_rejected: number;
    review_pending: number;
    no_kpi: number;
  };
}

interface Employee {
  id: number;
  name: string;
  email: string;
  payroll_number: string;
  department: string;
  position: string;
  manager_name?: string;
}

interface PeriodSetting {
  id: number;
  period_type: string;
  quarter: string | null;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    period: '',
    manager: '',
  });
  const [statistics, setStatistics] = useState<DepartmentStatistic[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>([]);
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [savingDefault, setSavingDefault] = useState(false);
  const [managers, setManagers] = useState<Array<{ id: number; name: string }>>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    fetchDepartmentStatistics();
    fetchAllDepartments();
    fetchPeriodSettings();
    fetchManagers();
    loadDefaultPeriod();
  }, []);

  useEffect(() => {
    if (selectedDepartment && selectedCategory) {
      fetchEmployees(selectedDepartment, selectedCategory);
    } else {
      setEmployees([]);
    }
  }, [selectedDepartment, selectedCategory]);

  // Refetch statistics when filters change
  useEffect(() => {
    fetchDepartmentStatistics();
  }, [filters.department, filters.period, filters.manager]);

  const fetchData = async () => {
    try {
      const [kpisRes, reviewsRes, notificationsRes, activityRes] = await Promise.all([
        api.get('/kpis').catch(err => {
          console.error('Error fetching KPIs:', err);
          return { data: { kpis: [] } };
        }),
        api.get('/kpi-review').catch(err => {
          console.error('Error fetching reviews:', err);
          return { data: { reviews: [] } };
        }),
        api.get('/notifications', { params: { limit: 5, read: 'false' } }).catch(err => {
          console.error('Error fetching notifications:', err);
          return { data: { notifications: [] } };
        }),
        api.get('/notifications/activity').catch(err => {
          console.error('Error fetching activity:', err);
          return { data: { activities: [] } };
        }),
      ]);

      setKpis(kpisRes.data.kpis || []);
      setReviews(reviewsRes.data.reviews || []);
      setNotifications(notificationsRes.data.notifications || []);
      setRecentActivity(activityRes.data.activities || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStatistics = async () => {
    try {
      const params: any = {};
      if (filters.department) params.department = filters.department;
      if (filters.period) params.period = filters.period;
      if (filters.manager) params.manager = filters.manager;

      const response = await api.get('/departments/statistics', { params });
      const stats = response.data.statistics || [];
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchAllDepartments = async () => {
    try {
      // Fetch without filters to get all departments for the dropdown
      const response = await api.get('/departments/statistics');
      const stats = response.data.statistics || [];
      const uniqueDepts = stats.map((stat: DepartmentStatistic) => stat.department);
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployees = async (department: string, category: string) => {
    try {
      const response = await api.get(`/departments/statistics/${department}/${category}`);
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchPeriodSettings = async () => {
    try {
      const response = await api.get('/settings/period-settings');
      setPeriodSettings(response.data.settings || []);
    } catch (error) {
      console.error('Error fetching period settings:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get('/departments/managers');
      setManagers(response.data.managers || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const loadDefaultPeriod = () => {
    const saved = localStorage.getItem('hr_dashboard_default_period');
    if (saved) {
      setDefaultPeriod(saved);
      setFilters(prev => ({ ...prev, period: saved }));
    }
  };

  const saveDefaultPeriod = async () => {
    try {
      setSavingDefault(true);
      localStorage.setItem('hr_dashboard_default_period', filters.period);
      setDefaultPeriod(filters.period);
      // Show success message (you can add a toast notification here)
      alert('Default period filter saved successfully!');
    } catch (error) {
      console.error('Error saving default period:', error);
      alert('Failed to save default period');
    } finally {
      setSavingDefault(false);
    }
  };

  const handleCategoryClick = (department: string, category: string, count: number) => {
    if (count === 0) return;
    setSelectedDepartment(department);
    setSelectedCategory(category);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.related_kpi_id) {
      navigate(`/hr/kpi-details/${notification.related_kpi_id}`);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getKPIStage = (kpi: KPI): { stage: string; color: string; icon: React.ReactNode } => {
    const review = reviews.find(r => r.kpi_id === kpi.id);

    if (kpi.status === 'pending') {
      return {
        stage: 'KPI Setting - Awaiting Acknowledgement',
        color: 'bg-orange-100 text-orange-700',
        icon: <FiClock className="inline" />
      };
    }

    if (kpi.status === 'acknowledged' && !review) {
      return {
        stage: 'KPI Acknowledged - Review Pending',
        color: 'bg-blue-100 text-blue-700',
        icon: <FiFileText className="inline" />
      };
    }

    if (review) {
      if (review.review_status === 'employee_submitted') {
        return {
          stage: 'Self-Rating Submitted - Awaiting Manager Review',
          color: 'bg-yellow-100 text-yellow-700',
          icon: <FiClock className="inline" />
        };
      }

      if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
        return {
          stage: 'KPI Review Completed',
          color: 'bg-green-100 text-green-700',
          icon: <FiCheckCircle className="inline" />
        };
      }

      if (review.review_status === 'pending') {
        return {
          stage: 'KPI Review - Self-Rating Required',
          color: 'bg-purple-100 text-purple-700',
          icon: <FiFileText className="inline" />
        };
      }
    }

    return {
      stage: 'In Progress',
      color: 'bg-gray-100 text-gray-700',
      icon: <FiClock className="inline" />
    };
  };

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      pending: 'KPI Setting - Awaiting Acknowledgement',
      acknowledged_review_pending: 'KPI Acknowledged - Review Pending',
      self_rating_submitted: 'Self-Rating Submitted - Awaiting Manager Review',
      awaiting_employee_confirmation: 'Awaiting Employee Confirmation',
      review_completed: 'KPI Review Completed',
      review_rejected: 'Review Rejected by Employee',
      review_pending: 'KPI Review - Self-Rating Required',
      no_kpi: 'No KPI Assigned',
      rejection_resolved: 'Resolved Issues',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      pending: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      acknowledged_review_pending: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      self_rating_submitted: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      awaiting_employee_confirmation: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
      review_completed: 'bg-green-100 text-green-700 hover:bg-green-200',
      review_rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
      review_pending: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      no_kpi: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      rejection_resolved: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pending':
      case 'review_pending':
        return <FiClock className="inline mr-2" />;
      case 'acknowledged_review_pending':
      case 'self_rating_submitted':
        return <FiFileText className="inline mr-2" />;
      case 'awaiting_employee_confirmation':
        return <FiBell className="inline mr-2" />;
      case 'review_completed':
        return <FiCheckCircle className="inline mr-2" />;
      case 'review_rejected':
        return <FiEye className="inline mr-2" />;
      case 'no_kpi':
        return <FiUsers className="inline mr-2" />;
      case 'rejection_resolved':
        return <FiCheckCircle className="inline mr-2" />;
      default:
        return null;
    }
  };

  const getPeriodLabel = (setting: PeriodSetting): string => {
    if (setting.period_type === 'quarterly') {
      return `${setting.quarter} ${setting.year}`;
    }
    return `${setting.year}`;
  };

  const getPeriodValue = (setting: PeriodSetting): string => {
    return `${setting.period_type}|${setting.quarter || ''}|${setting.year}`;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">HR Compliance Dashboard</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/hr/notifications')}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <FiBell className="text-xl" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/hr/kpi-list')}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FiEye className="text-lg" />
            <span>View All KPIs</span>
          </button>
          <button
            onClick={() => navigate('/hr/acknowledged-kpis')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiCheckCircle className="text-lg" />
            <span>Acknowledged KPIs</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KPI Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Periods</option>
              {periodSettings.map(setting => (
                <option key={setting.id} value={getPeriodValue(setting)}>
                  {getPeriodLabel(setting)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
            <select
              value={filters.manager}
              onChange={(e) => setFilters({ ...filters, manager: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Managers</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
            <button
              onClick={saveDefaultPeriod}
              disabled={savingDefault || !filters.period}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FiSave className="text-lg" />
              <span>{savingDefault ? 'Saving...' : 'Set Default Period'}</span>
            </button>
          </div>
        </div>
        {defaultPeriod && (
          <div className="mt-3 text-sm text-green-600">
            Default period: {periodSettings.find(s => getPeriodValue(s) === defaultPeriod) ? 
              getPeriodLabel(periodSettings.find(s => getPeriodValue(s) === defaultPeriod)!) : 
              defaultPeriod}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-purple-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.reduce((sum, stat) => sum + stat.total_employees, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-blue-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total KPIs</p>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.reduce((sum, stat) => {
                  if (!stat.categories) return sum;
                  return sum + stat.categories.pending + stat.categories.acknowledged_review_pending + 
                    stat.categories.self_rating_submitted + stat.categories.awaiting_employee_confirmation +
                    stat.categories.review_completed + stat.categories.review_rejected +
                    stat.categories.review_pending;
                }, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-green-600 mb-1 font-medium">KPI Review Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {statistics.reduce((sum, stat) => {
                  if (!stat.categories) return sum;
                  return sum + stat.categories.review_completed;
                }, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-blue-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">KPI Setting Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.reduce((sum, stat) => {
                  if (!stat.categories) return sum;
                  return sum + stat.categories.acknowledged_review_pending + 
                    stat.categories.self_rating_submitted + 
                    stat.categories.awaiting_employee_confirmation +
                    stat.categories.review_completed + 
                    stat.categories.review_rejected +
                    stat.categories.review_pending;
                }, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-gray-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">No KPI Assigned</p>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.reduce((sum, stat) => {
                  if (!stat.categories) return sum;
                  return sum + stat.categories.no_kpi;
                }, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      {!selectedDepartment || !selectedCategory ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Department Overview</h2>
          </div>
          {statistics.map((stat) => {
            const totalKPIs = stat.categories.pending + stat.categories.acknowledged_review_pending + 
                             stat.categories.self_rating_submitted + stat.categories.awaiting_employee_confirmation +
                             stat.categories.review_completed + stat.categories.review_rejected +
                             stat.categories.review_pending;
            const kpiSettingCompleted = stat.categories.acknowledged_review_pending + 
                                       stat.categories.self_rating_submitted + 
                                       stat.categories.awaiting_employee_confirmation +
                                       stat.categories.review_completed + 
                                       stat.categories.review_rejected +
                                       stat.categories.review_pending;
            
            return (
            <div key={stat.department} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{stat.department}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-gray-600">Total Employees: </span>
                    <span className="font-semibold text-gray-900">{stat.total_employees}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-gray-600">Total KPIs: </span>
                    <span className="font-semibold text-gray-900">{totalKPIs}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-gray-600">Setting Completed: </span>
                    <span className="font-semibold text-gray-900">{kpiSettingCompleted}</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="text-gray-600">Reviews Completed: </span>
                    <span className="font-semibold text-green-600">{stat.categories.review_completed}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">No KPI: </span>
                    <span className="font-semibold text-gray-900">{stat.categories.no_kpi}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stat.categories).map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(stat.department, category, count)}
                    disabled={count === 0}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${getCategoryColor(category)} border-current ${
                      count === 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">
                          {getCategoryIcon(category)}
                          {getCategoryLabel(category)}
                        </div>
                        <div className="text-2xl font-bold">{count}</div>
                      </div>
                      {count > 0 && <FiEye className="text-lg ml-2" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            );
          })}

          {statistics.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No department statistics available</p>
            </div>
          )}
        </div>
      ) : (
        // Employee List View
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDepartment} - {getCategoryLabel(selectedCategory)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {employees.length} employee{employees.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedDepartment(null);
                setSelectedCategory(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Overview
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payroll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No employees found in this category
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.payroll_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.manager_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => navigate(`/hr/kpi-list?employeeId=${employee.id}`)}
                            className="text-purple-600 hover:text-purple-900 hover:underline"
                          >
                            View KPIs
                          </button>
                          {selectedCategory === 'review_rejected' && (
                            <button
                              onClick={() => navigate(`/hr/kpi-list?employeeId=${employee.id}&status=rejected`)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              View Rejected KPI
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - KPI Overview Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">KPI Overview</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MANAGER</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">REVIEW DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kpis.slice(0, 10).map((kpi) => (
                    <tr key={kpi.id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                        <p className="text-sm text-gray-500">{kpi.employee_department}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{kpi.manager_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const stageInfo = getKPIStage(kpi);
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${stageInfo.color}`}>
                              {stageInfo.icon}
                              <span>{stageInfo.stage}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(kpi.updated_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/hr/kpi-details/${kpi.id}`)}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {kpis.length > 10 && (
              <div className="p-4 border-t border-gray-200 text-center">
                <button
                  onClick={() => navigate('/hr/kpi-list')}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  View More ({kpis.length - 10} more KPIs)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Notifications and Recent Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <button
                onClick={() => navigate('/hr/notifications')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            </div>
            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkNotificationRead}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/hr/notifications')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium w-full text-center"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.type === 'self_rating_submitted' ? (
                          <FiCheckCircle className="text-green-600 text-sm" />
                        ) : activity.type === 'kpi_acknowledged' ? (
                          <FiFileText className="text-blue-600 text-sm" />
                        ) : activity.type === 'kpi_set' ? (
                          <FiCheckCircle className="text-purple-600 text-sm" />
                        ) : activity.type === 'review_completed' ? (
                          <FiCheckCircle className="text-green-600 text-sm" />
                        ) : (
                          <FiFileText className="text-gray-600 text-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;

