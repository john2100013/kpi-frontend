import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiTarget,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiDownload,
  FiBell,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const managerNavItems = [
    { path: '/manager/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/manager/kpi-management', label: 'KPI Management', icon: FiTarget },
    { path: '/manager/employees', label: 'Employees', icon: FiUsers, badge: '24' },
    { path: '/manager/reviews', label: 'Reviews', icon: FiFileText, badge: '5' },
  ];

  const employeeNavItems = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/employee/my-kpis', label: 'My KPIs', icon: FiTarget, badge: '3' },
    { path: '/employee/reviews', label: 'Reviews', icon: FiFileText },
    { path: '/employee/history', label: 'History', icon: FiFileText },
  ];

  const hrNavItems = [
    { path: '/hr/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/hr/analytics', label: 'Analytics', icon: FiBarChart2 },
    { path: '/hr/export', label: 'Export Data', icon: FiDownload },
  ];

  const commonNavItems = [
    { path: '/notifications', label: 'Notifications', icon: FiBell },
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ];

  const getNavItems = () => {
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
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <FiTarget className="text-purple-600 text-xl" />
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

            {user?.role === 'manager' && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                  REPORTS
                </p>
                <Link
                  to="/manager/analytics"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive('/manager/analytics')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={onClose}
                >
                  <FiBarChart2 className="text-lg" />
                  <span className="flex-1 font-medium">Analytics</span>
                </Link>
                <Link
                  to="/manager/export"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive('/manager/export')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={onClose}
                >
                  <FiDownload className="text-lg" />
                  <span className="flex-1 font-medium">Export Data</span>
                </Link>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                SETTINGS
              </p>
              {commonNavItems.map((item) => {
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
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="text-lg" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

