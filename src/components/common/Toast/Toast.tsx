/**
 * Toast Component
 * 
 * Individual toast notification with different variants and animations.
 * Supports success, error, warning, and info types.
 */

import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <FiCheckCircle className="w-5 h-5" />,
    error: <FiAlertCircle className="w-5 h-5" />,
    warning: <FiAlertTriangle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />,
  };

  const styles = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-600',
      closeBtn: 'text-green-600 hover:text-green-800',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-600',
      closeBtn: 'text-red-600 hover:text-red-800',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-600',
      closeBtn: 'text-yellow-600 hover:text-yellow-800',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      closeBtn: 'text-blue-600 hover:text-blue-800',
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        animate-slide-in max-w-md w-full
        ${currentStyle.container}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`flex-shrink-0 mt-0.5 ${currentStyle.icon}`}>
        {icons[type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{message}</p>
      </div>

      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors ${currentStyle.closeBtn}`}
        aria-label="Close notification"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
