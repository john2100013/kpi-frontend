import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview, Notification } from '../../types';
import NotificationItem from '../../components/NotificationItem';
import { FiDownload, FiFilter, FiEye, FiCheckCircle, FiClock, FiFileText, FiBell } from 'react-icons/fi';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [kpisRes, reviewsRes, notificationsRes, activityRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
        api.get('/notifications', { params: { limit: 5, read: 'false' } }),
        api.get('/notifications/activity'),
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
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <FiDownload className="text-lg" />
            <span>Export Data</span>
          </button>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
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
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
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
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total KPIs</p>
          <p className="text-3xl font-bold text-gray-900">{kpis.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">KPI Review Completed</p>
          <p className="text-3xl font-bold text-gray-900">
            {kpis.filter(kpi => {
              const review = reviews.find(r => r.kpi_id === kpi.id);
              return review && (review.review_status === 'manager_submitted' || review.review_status === 'completed');
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">KPI Acknowledged - Review Pending</p>
          <p className="text-3xl font-bold text-gray-900">
            {kpis.filter(kpi => kpi.status === 'acknowledged' && !reviews.find(r => r.kpi_id === kpi.id)).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">KPI Setting - Awaiting Acknowledgement</p>
          <p className="text-3xl font-bold text-gray-900">
            {kpis.filter(kpi => kpi.status === 'pending').length}
          </p>
        </div>
      </div>

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
                  {kpis.map((kpi) => (
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

