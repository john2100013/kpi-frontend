import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiHome,
  FiTarget,
  FiUsers,
  FiFileText,
  FiLogOut,
  FiCheckCircle,
  FiCalendar,
  FiMail,
  FiSettings,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user?.role === 'manager') {
      fetchPendingReviewsCount();
    }
  }, [user]);

  // Refresh count when navigating to/from reviews page
  useEffect(() => {
    if (user?.role === 'manager' && location.pathname === '/manager/reviews') {
      fetchPendingReviewsCount();
    }
  }, [location.pathname, user]);

  const fetchPendingReviewsCount = async () => {
    try {
      const response = await api.get('/kpi-review/pending/count');
      setPendingReviewsCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching pending reviews count:', error);
      setPendingReviewsCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  interface NavItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }

  const managerNavItems: NavItem[] = [
    { path: '/manager/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/manager/kpi-management', label: 'KPI Management', icon: FiTarget },
    { path: '/manager/employees', label: 'Employees', icon: FiUsers },
    { 
      path: '/manager/reviews', 
      label: 'Reviews', 
      icon: FiFileText, 
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined 
    },
    { path: '/manager/schedule-meeting', label: 'Schedule Meeting', icon: FiCalendar },
    { path: '/manager/kpi-setting-completed', label: 'KPI Setting Completed', icon: FiCheckCircle },
    { path: '/manager/acknowledged-kpis', label: 'Acknowledged KPIs', icon: FiCheckCircle },
    { path: '/manager/completed-reviews', label: 'Completed Reviews', icon: FiCheckCircle },
  ];

  const employeeNavItems: NavItem[] = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/employee/my-kpis', label: 'My KPIs', icon: FiTarget, badge: '3' },
    { path: '/employee/reviews', label: 'Reviews', icon: FiFileText },
    { path: '/employee/history', label: 'History', icon: FiFileText },
  ];

  const hrNavItems: NavItem[] = [
    { path: '/hr/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/hr/employees', label: 'Employees', icon: FiUsers },
    { path: '/hr/departments', label: 'Departments', icon: FiUsers },
    { path: '/hr/kpi-list', label: 'All KPIs', icon: FiTarget },
     { path: '/hr/kpi-setting-completed', label: 'KPI Setting Completed', icon: FiCheckCircle },
    { path: '/hr/acknowledged-kpis', label: 'Acknowledged KPIs', icon: FiCheckCircle },
    { path: '/hr/completed-reviews', label: 'Completed Reviews', icon: FiCheckCircle },
    { path: '/hr/email-templates', label: 'Email Templates', icon: FiMail },
    { path: '/hr/settings', label: 'Settings', icon: FiSettings },
  ];

  const superAdminNavItems: NavItem[] = [
    { path: '/super-admin/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/super-admin/company-management', label: 'Company Management', icon: FiHome },
    { path: '/super-admin/user-management', label: 'User Management', icon: FiUsers },
    { path: '/onboard', label: 'Onboard Company', icon: FiUsers },
  ];

  const getNavItems = () => {
    if (user?.role === 'super_admin') return superAdminNavItems;
    if (user?.role === 'manager') return managerNavItems;
    if (user?.role === 'employee') return employeeNavItems;
    if (user?.role === 'hr') return hrNavItems;
    return [];
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gray-50 border-r border-gray-200 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/ICTA.jpeg" alt="ICTA Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">KPI Manager</h1>
                <p className="text-purple-100 text-xs">Performance System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                MAIN
              </p>
              {getNavItems().map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                      active
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`text-lg ${active ? 'text-purple-600' : ''}`} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          active
                            ? 'bg-purple-200 text-purple-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

          </nav>

          {/* Logout - Only for HR and Super Admin */}
          {(user?.role === 'hr' || user?.role === 'super_admin') && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <FiLogOut className="text-lg" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

