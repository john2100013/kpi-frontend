import React from 'react';
import { Notification } from '../types';
import { FiClock, FiCheckCircle, FiFileText, FiAlertCircle, FiCalendar, FiUser } from 'react-icons/fi';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onClick }) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'kpi_review_due':
      case 'review_due':
        return <FiClock className="text-orange-600" />;
      case 'kpi_submitted':
      case 'self_rating_submitted':
        return <FiCheckCircle className="text-green-600" />;
      case 'signature_required':
      case 'kpi_acknowledged':
        return <FiFileText className="text-blue-600" />;
      case 'meeting_reminder':
        return <FiCalendar className="text-purple-600" />;
      case 'overdue_kpi':
        return <FiAlertCircle className="text-red-600" />;
      case 'kpi_assigned':
      case 'kpi_set':
        return <FiUser className="text-blue-600" />;
      case 'review_completed':
        return <FiCheckCircle className="text-green-600" />;
      default:
        return <FiFileText className="text-gray-600" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'kpi_review_due':
      case 'review_due':
        return 'bg-orange-100';
      case 'kpi_submitted':
      case 'self_rating_submitted':
        return 'bg-green-100';
      case 'signature_required':
      case 'kpi_acknowledged':
        return 'bg-blue-100';
      case 'meeting_reminder':
        return 'bg-purple-100';
      case 'overdue_kpi':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
      } hover:bg-gray-50`}
      onClick={() => {
        if (!notification.read && onMarkAsRead) {
          onMarkAsRead(notification.id);
        }
        if (onClick) {
          onClick();
        }
      }}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor()}`}>
          {getNotificationIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.type === 'kpi_review_due' || notification.type === 'review_due'
                  ? 'KPI Review Due'
                  : notification.type === 'kpi_submitted' || notification.type === 'self_rating_submitted'
                  ? 'KPI Submitted'
                  : notification.type === 'signature_required'
                  ? 'Signature Required'
                  : notification.type === 'meeting_reminder'
                  ? 'Meeting Reminder'
                  : notification.type === 'overdue_kpi'
                  ? 'Overdue KPI'
                  : notification.type === 'kpi_assigned' || notification.type === 'kpi_set'
                  ? 'KPI Assigned'
                  : notification.type === 'review_completed'
                  ? 'Review Completed'
                  : 'Notification'}
              </h4>
              <p className="text-sm text-gray-700 mb-1">{notification.message}</p>
              <p className="text-xs text-gray-500">{formatTimeAgo(notification.created_at)}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;

