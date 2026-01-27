import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { KPI, Notification, KPIReview } from '../../types';
import NotificationItem from '../../components/NotificationItem';
import { StatsCard, Button } from '../../components/common';
import {
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiArrowRight,
  FiEye,
  FiEdit,
  FiCalendar,
  FiDownload,
  FiBell,
  FiFilter,
  FiSave,
  FiClock,
} from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDepartmentStatistics } from '../../store/slices/statisticsSlice';


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

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { kpis } = useAppSelector(state => state.kpi);
  const { departmentStatistics } = useAppSelector(state => state.statistics);
  const { periodSettings } = useAppSelector(state => state.settings);
  useAppSelector(state => state.departments);
  
  // Local state (non-cacheable data)
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: '',
    department: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [categoryEmployees, setCategoryEmployees] = useState<Employee[]>([]);
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [savingDefault, setSavingDefault] = useState(false);
  const [managerDepartments, setManagerDepartments] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchData();
    fetchManagerDepartments();
    loadDefaultPeriod();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedDepartment) {
      fetchCategoryEmployees(selectedDepartment, selectedCategory);
    } else {
      setCategoryEmployees([]);
    }
  }, [selectedCategory, selectedDepartment]);

  useEffect(() => {
    const params: any = {};
    if (filters.period) params.period = filters.period;
    if (filters.department) params.department = filters.department;
    dispatch(fetchDepartmentStatistics(params));
  }, [dispatch, filters.period, filters.department]);

  const fetchData = async () => {
    try {
      const [, reviewsRes, notificationsRes, activityRes, employeesRes] = await Promise.all([
        api.get('/kpis').catch(err => {
          return { data: { kpis: [] } };
        }),
        api.get('/kpi-review').catch(err => {
          return { data: { reviews: [] } };
        }),
        api.get('/notifications', { params: { limit: 5, read: 'false' } }).catch(err => {
          return { data: { notifications: [] } };
        }),
        api.get('/notifications/activity').catch(err => {
          return { data: { activities: [] } };
        }),
        api.get('/employees').catch(err => {
          return { data: { employees: [] } };
        }),
      ]);

      setReviews(reviewsRes.data.reviews || []);
      setNotifications(notificationsRes.data.notifications || []);
      setRecentActivity(activityRes.data.activities || []);
      setEmployees(employeesRes.data.employees || []);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerDepartments = async () => {
    try {
      const response = await api.get('/departments/manager-departments');
      setManagerDepartments(response.data.departments || []);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    }
  };

  const fetchCategoryEmployees = async (department: string, category: string) => {
    try {
      const response = await api.get(`/departments/statistics/${department}/${category}`);
      setCategoryEmployees(response.data.employees || []);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
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

  const saveDefaultPeriod = async () => {
    try {
      setSavingDefault(true);
      localStorage.setItem('manager_dashboard_default_period', filters.period);
      setDefaultPeriod(filters.period);
      toast.success('Default period filter saved successfully!');
    } catch (error) {
      toast.error('Failed to save default period');
    } finally {
      setSavingDefault(false);
    }
  };

  const handleCategoryClick = (department: string, category: string, count: number) => {
    if (count === 0) return;
    setSelectedDepartment(department);
    setSelectedCategory(category);
  };

  const getKPIStage = (kpi: KPI): { stage: string; color: string; progress: number } => {
    const review = reviews.find(r => r.kpi_id === kpi.id);

    if (kpi.status === 'pending') {
      return { stage: 'Pending Review', color: 'bg-orange-100 text-orange-700', progress: 25 };
    }

    if (kpi.status === 'acknowledged' && !review) {
      return { stage: 'In Progress', color: 'bg-blue-100 text-blue-700', progress: 45 };
    }

    if (review) {
      if (review.review_status === 'employee_submitted') {
        return { stage: 'Pending Review', color: 'bg-orange-100 text-orange-700', progress: 75 };
      }

      if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
        return { stage: 'Completed', color: 'bg-green-100 text-green-700', progress: 100 };
      }

      if (review.review_status === 'pending') {
        return { stage: 'In Progress', color: 'bg-blue-100 text-blue-700', progress: 60 };
      }
    }

    return { stage: 'In Progress', color: 'bg-blue-100 text-blue-700', progress: 45 };
  };

  const getEmployeeKPICount = (employeeId: number) => {
    return kpis.filter(k => k.employee_id === employeeId).length;
  };

  const getEmployeeKPIStatus = (employeeId: number) => {
    const employeeKPIs = kpis.filter(k => k.employee_id === employeeId);
    if (employeeKPIs.length === 0) return { stage: 'No KPIs', color: 'bg-gray-100 text-gray-700', progress: 0 };
    
    // Get the most recent KPI status
    const latestKPI = employeeKPIs[0];
    return getKPIStage(latestKPI);
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
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      toast.error('Could not mark notification as read.');
    }
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
        return <FiEdit className="inline mr-2" />;
      case 'no_kpi':
        return <FiUsers className="inline mr-2" />;
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Get unique employees with their KPI status
  const employeeStatusList = employees
    .filter(emp => emp.role_id === 4) // Employee role ID
    .map(emp => ({
      ...emp,
      kpiCount: getEmployeeKPICount(emp.id),
      status: getEmployeeKPIStatus(emp.id),
    }))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Button
              variant="ghost"
              icon={FiBell}
              rounded
              onClick={() => navigate('/manager/notifications')}
              aria-label="Notifications"
            />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            icon={FiEye}
            onClick={() => navigate('/manager/kpi-list')}
          >
            View All KPIs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KPI Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {managerDepartments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
            <Button
              variant="success"
              icon={FiSave}
              onClick={saveDefaultPeriod}
              disabled={savingDefault || !filters.period}
              loading={savingDefault}
              fullWidth
            >
              Set Default Period
            </Button>
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
        <StatsCard
          title="Total Employees"
          value={departmentStatistics.reduce((sum, stat) => sum + stat.total_employees, 0)}
          icon={<FiUsers />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        
        <StatsCard
          title="Total KPIs"
          value={departmentStatistics.reduce((sum, stat) => 
            sum + stat.categories.pending + stat.categories.acknowledged_review_pending + 
            stat.categories.self_rating_submitted + stat.categories.awaiting_employee_confirmation +
            stat.categories.review_completed + stat.categories.review_rejected +
            stat.categories.review_pending, 0)}
          icon={<FiFileText />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatsCard
          title="KPI Review Completed"
          value={departmentStatistics.reduce((sum, stat) => sum + stat.categories.review_completed, 0)}
          icon={<FiCheckCircle />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          titleColor="text-green-600 font-medium"
          valueColor="text-green-600"
        />
        
        <StatsCard
          title="KPI Setting Completed"
          value={departmentStatistics.reduce((sum, stat) => 
            sum + stat.categories.acknowledged_review_pending + 
            stat.categories.self_rating_submitted + 
            stat.categories.awaiting_employee_confirmation +
            stat.categories.review_completed + 
            stat.categories.review_rejected +
            stat.categories.review_pending, 0)}
          icon={<FiCheckCircle />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatsCard
          title="Employees without KPI"
          value={departmentStatistics.reduce((sum, stat) => sum + stat.categories.no_kpi, 0)}
          icon={<FiUsers />}
          iconBgColor="bg-gray-100"
          iconColor="text-gray-600"
        />
      </div>

      {/* Department Statistics */}
      {!selectedCategory ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Department Overview</h2>
          </div>
          {departmentStatistics.map((stat: any) => {
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
                {Object.entries(stat.categories).map(([category, count]: [string, any]) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(stat.department, category, Number(count))}
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
                        <div className="text-2xl font-bold">{count as number}</div>
                      </div>
                      {count > 0 && <FiEye className="text-lg ml-2" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

          {departmentStatistics.length === 0 && (
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
                {categoryEmployees.length} employee{categoryEmployees.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedDepartment(null);
              }}
            >
              Back to Overview
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payroll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No employees found in this category
                    </td>
                  </tr>
                ) : (
                  categoryEmployees.map((employee) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="link"
                            onClick={() => navigate(`/manager/employee-kpis/${employee.id}`)}
                          >
                            View KPIs
                          </Button>
                          {selectedCategory === 'review_rejected' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => navigate(`/manager/employee-kpis/${employee.id}?status=rejected`)}
                            >
                              View Rejected KPI
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/manager/kpi-setting/${employee.id}`)}
                          >
                            Set KPI
                          </Button>
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

      {/* Summary Cards - kept for backward compatibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee KPI Status - Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee KPI Status Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Employee KPI Status</h2>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Employees</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DEPARTMENT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPIS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PROGRESS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employeeStatusList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employeeStatusList.map((emp) => {
                      const latestKPI = kpis.find(k => k.employee_id === emp.id);
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-semibold">
                                  {emp.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{emp.name}</p>
                                <p className="text-sm text-gray-500">{emp.position || 'Employee'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{emp.department || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {emp.kpiCount} Active
                            </span>
                            {latestKPI && (
                              <p className="text-xs text-gray-500">
                                {latestKPI.quarter} {latestKPI.year}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${emp.status.color}`}>
                              {emp.status.stage}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    emp.status.progress === 100
                                      ? 'bg-green-500'
                                      : emp.status.progress >= 75
                                      ? 'bg-orange-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${emp.status.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {emp.status.progress}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {emp.status.stage === 'Pending Review' ? (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                  if (latestKPI) {
                                    const review = reviews.find(r => r.kpi_id === latestKPI.id);
                                    if (review) {
                                      navigate(`/manager/kpi-review/${review.id}`);
                                    } else {
                                      navigate(`/manager/kpi-details/${latestKPI.id}`);
                                    }
                                  }
                                }}
                              >
                                Review
                              </Button>
                            ) : emp.status.stage === 'Completed' ? (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                  if (latestKPI) {
                                    navigate(`/manager/kpi-details/${latestKPI.id}`);
                                  }
                                }}
                              >
                                View
                              </Button>
                            ) : (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => navigate(`/manager/employee-kpis/${emp.id}`)}
                              >
                                Monitor
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/manager/select-employee')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiEdit className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Set New KPI</p>
                    <p className="text-sm text-gray-500">Create KPI for employee</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/manager/kpi-templates')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FiFileText className="text-indigo-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">KPI Templates</p>
                    <p className="text-sm text-gray-500">Create & use templates</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/manager/reviews')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FiFileText className="text-orange-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Review KPIs</p>
                    <p className="text-sm text-gray-500">
                      {reviews.filter(r => r.review_status === 'employee_submitted').length} pending reviews
                    </p>
                  </div>
                </div>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Schedule Meeting</p>
                    <p className="text-sm text-gray-500">KPI review meetings</p>
                  </div>
                </div>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiDownload className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Export Report</p>
                    <p className="text-sm text-gray-500">Generate KPI reports</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Notifications and Recent Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/manager/notifications')}
              >
                Mark all read
              </Button>
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
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/manager/notifications')}
                  fullWidth
                >
                  View All Notifications
                </Button>
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
                          <FiEdit className="text-purple-600 text-sm" />
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

export default ManagerDashboard;
