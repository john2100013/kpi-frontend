import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiFileText, FiSettings } from 'react-icons/fi';

/**
 * Manager Rating Navigation Component
 * Reusable navigation tabs for all manager rating pages
 */
export const ManagerRatingNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/hr/manager-rating/assignments',
      label: 'Assignments',
      icon: FiUsers,
      description: 'Manage and track assignments'
    },
    {
      path: '/hr/manager-rating/templates',
      label: 'Templates',
      icon: FiFileText,
      description: 'Create rating templates'
    },
    {
      path: '/hr/manager-rating/options',
      label: 'Rating Options',
      icon: FiSettings,
      description: 'Manage rating scales'
    }
  ];

  const isActive = (path: string) => {
    // Check if current path starts with the nav item path
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Manager Rating Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${active
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                title={item.description}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ManagerRatingNav;
