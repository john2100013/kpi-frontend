import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { DashboardStats, KPI, Notification, KPIReview } from '../../types';
import NotificationItem from '../../components/NotificationItem';
import {
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiStar,
  FiArrowRight,
  FiEye,
  FiEdit,
  FiCalendar,
  FiDownload,
  FiBell,
} from 'react-icons/fi';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({});
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, kpisRes, reviewsRes, notificationsRes, activityRes, employeesRes] = await Promise.all([
        api.get('/kpis/dashboard/stats'),
        api.get('/kpis'),
        api.get('/kpi-review'),
        api.get('/notifications', { params: { limit: 5, read: 'false' } }),
        api.get('/notifications/activity'),
        api.get('/employees'),
      ]);

      setStats(statsRes.data.stats);
      setKpis(kpisRes.data.kpis || []);
      setReviews(reviewsRes.data.reviews || []);
      setNotifications(notificationsRes.data.notifications || []);
      setRecentActivity(activityRes.data.activities || []);
      setEmployees(employeesRes.data.employees || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      console.error('Error marking notification as read:', error);
    }
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
    .filter(emp => emp.role === 'employee')
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
          <button
            onClick={() => navigate('/manager/notifications')}
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
            onClick={() => navigate('/manager/kpi-list')}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FiEye className="text-lg" />
            <span>View All KPIs</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees || 0}</p>
              <p className="text-xs text-green-600 mt-2">+12% from last month</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingKPIs || 0}</p>
              <p className="text-xs text-orange-600 mt-2">5 Due</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed KPIs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedKPIs || 0}</p>
              <p className="text-xs text-green-600 mt-2">+5% from last month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Performance</p>
              <p className="text-3xl font-bold text-gray-900">87%</p>
              <p className="text-xs text-purple-600 mt-2">Excellent</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiStar className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPIS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PROGRESS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employeeStatusList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
                                <p className="text-sm text-gray-500">{emp.position || emp.department}</p>
                              </div>
                            </div>
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
                              <button
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
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Review
                              </button>
                            ) : emp.status.stage === 'Completed' ? (
                              <button
                                onClick={() => {
                                  if (latestKPI) {
                                    navigate(`/manager/kpi-details/${latestKPI.id}`);
                                  }
                                }}
                                className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                              >
                                View
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/manager/employee-kpis/${emp.id}`)}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Monitor
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/manager/employees')}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-1"
              >
                <span>View All Employees</span>
                <FiArrowRight className="text-lg" />
              </button>
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
              <button
                onClick={() => navigate('/manager/notifications')}
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
                  onClick={() => navigate('/manager/notifications')}
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
