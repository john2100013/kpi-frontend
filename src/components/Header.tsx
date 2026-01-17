import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiBell, FiMenu, FiLogOut, FiUser, FiHome } from 'react-icons/fi';
import { getRoleDisplayName } from '../utils/roleUtils';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  title,
  subtitle,
  showSearch = true,
  actionButton,
}) => {
  const { user, logout, companies, hasMultipleCompanies, selectedCompany, selectCompany } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <FiMenu className="text-xl text-gray-700" />
            </button>

            {title && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {/* Center - Search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search KPIs, employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Company Selector (if multiple companies) */}
            {hasMultipleCompanies && companies.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                  <FiHome className="text-lg text-gray-700" />
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {selectedCompany?.name || 'Select Company'}
                  </span>
                </button>

                {showCompanyMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Switch Company</p>
                      </div>
                      {companies.map((company) => (
                        <button
                          key={company.id}
                          onClick={async () => {
                            try {
                              await selectCompany(company.id);
                              setShowCompanyMenu(false);
                              window.location.reload(); // Reload to refresh data
                            } catch (error) {
                              console.error('Failed to switch company:', error);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedCompany?.id === company.id
                              ? 'bg-purple-50 text-purple-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <FiHome className="text-lg" />
                            <span>{company.name}</span>
                          </div>
                          {selectedCompany?.id === company.id && (
                            <span className="text-purple-600">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100"
              >
                <FiBell className="text-xl text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <button className="text-sm text-purple-600 hover:text-purple-700">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <p className="p-4 text-sm text-gray-500 text-center">
                      No new notifications
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {actionButton.icon}
                <span>{actionButton.label}</span>
              </button>
            )}

            {/* Action Button */}
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {actionButton.icon}
                <span>{actionButton.label}</span>
              </button>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role_id)}</p>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{getRoleDisplayName(user?.role_id)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiUser className="text-lg" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                    >
                      <FiLogOut className="text-lg" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Click outside to close menus */}
          {(showNotifications || showUserMenu || showCompanyMenu) && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setShowNotifications(false);
                setShowUserMenu(false);
                setShowCompanyMenu(false);
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

