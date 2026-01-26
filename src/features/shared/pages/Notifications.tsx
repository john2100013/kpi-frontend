import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { Notification } from '../../../types';
import NotificationItem from '../../../components/NotificationItem';
import { FiArrowLeft, FiCheck, FiFilter } from 'react-icons/fi';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const toast = useToast();
  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const fetchAllNotifications = async () => {
    try {
      const response = await api.get('/notifications', { params: { limit: 100 } });
      setAllNotifications(response.data.notifications || []);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter notifications based on selected filter
  const notifications = React.useMemo(() => {
    if (filter === 'unread') {
      return allNotifications.filter(n => !n.read);
    } else if (filter === 'read') {
      return allNotifications.filter(n => n.read);
    }
    return allNotifications;
  }, [allNotifications, filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setAllNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      toast.error('Could not mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      toast.error('Could not mark all notifications as read.');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type and related IDs
    if (notification.related_kpi_id) {
      if (user?.role === 'hr') {
        navigate(`/hr/kpi-details/${notification.related_kpi_id}`);
      } else if (user?.role === 'manager') {
        navigate(`/manager/kpi-details/${notification.related_kpi_id}`);
      } else {
        navigate(`/employee/kpi-details/${notification.related_kpi_id}`);
      }
    } else if (notification.related_review_id) {
      if (user?.role === 'manager') {
        navigate(`/manager/kpi-review/${notification.related_review_id}`);
      }
    }
  };

  // Calculate counts from all notifications (not filtered)
  const totalCount = allNotifications.length;
  const unreadCount = allNotifications.filter(n => !n.read).length;
  const readCount = allNotifications.filter(n => n.read).length;

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiCheck className="text-lg" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <FiFilter className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read ({readCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {filter === 'all' ? 'All Notifications' : filter === 'unread' ? 'Unread Notifications' : 'Read Notifications'}
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClick={() => handleNotificationClick(notification)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

