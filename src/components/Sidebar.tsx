import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppSelector } from '../store/hooks';
import { selectAllKPIs, selectAllReviews } from '../store/slices/kpiSlice';
import api from '../services/api';
import { isManager, isEmployee, isHR, isSuperAdmin } from '../utils/roleUtils';
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
  FiAlertTriangle,
  FiSliders,
  FiCheck,
  FiClipboard,
  FiFlag,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialKpis?: any[];
  initialReviews?: any[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  initialKpis, 
  initialReviews,
  isCollapsed,
  onToggleCollapse 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, selectedCompany } = useAuth();
  
  // Get Redux auth state
  const reduxSelectedCompany = useAppSelector((state) => state.auth.selectedCompany);
  
  // Use Redux selectedCompany if AuthContext one is null
  const activeSelectedCompany = selectedCompany || reduxSelectedCompany;
  
  // Get KPIs and reviews from Redux store
  const reduxKpis = useAppSelector(selectAllKPIs);
  const reduxReviews = useAppSelector(selectAllReviews);
  
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [pendingAcknowledgementsCount, setPendingAcknowledgementsCount] = useState<number>(0);
  const [pendingEmployeeReviewsCount, setPendingEmployeeReviewsCount] = useState<number>(0);
  const toast = useToast();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (isManager(user)) {
      fetchPendingReviewsCount();
    } else if (isEmployee(user)) {
      if (initialKpis && initialReviews) {
        calculateEmployeeCounts(initialKpis, initialReviews);
      } else {
        fetchEmployeeCounts();
      }
    }
  }, [user?.id]);

  // Refresh count when navigating to/from relevant pages
  useEffect(() => {
    if (isManager(user) && location.pathname === '/manager/reviews') {
      fetchPendingReviewsCount();
    } else if (isEmployee(user) && (
      location.pathname === '/employee/acknowledge' || 
      location.pathname === '/employee/reviews'
    )) {
      // Use Redux data for calculations
      const kpis = reduxKpis.length > 0 ? reduxKpis : (initialKpis || []);
      const reviews = reduxReviews.length > 0 ? reduxReviews : (initialReviews || []);
      
      if (kpis.length > 0) {
        calculateEmployeeCounts(kpis, reviews);
      }
    }
  }, []);

  const calculateEmployeeCounts = (kpis: any[], reviews: any[]) => {
    const pendingAcknowledgements = kpis.filter((kpi: any) => kpi.status === 'pending').length;
    setPendingAcknowledgementsCount(pendingAcknowledgements);
    const acknowledgedKPIs = kpis.filter((kpi: any) => kpi.status === 'acknowledged');
    const needReview = acknowledgedKPIs.filter((kpi: any) => {
      const review = reviews.find((r: any) => r.kpi_id === kpi.id);
      return !review || review.review_status === 'pending';
    }).length;
    setPendingEmployeeReviewsCount(needReview);
  };

  const fetchPendingReviewsCount = async () => {
    try {
      const response = await api.get('/kpi-review/pending/count');
      setPendingReviewsCount(response.data.count || 0);
    } catch (error) {
      setPendingReviewsCount(0);
    }
  };

  const fetchEmployeeCounts = async () => {
    try {
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);
      const kpis = kpisRes.data.data?.kpis || kpisRes.data.kpis || [];
      const reviews = reviewsRes.data.data?.reviews || reviewsRes.data.reviews || [];
      calculateEmployeeCounts(kpis, reviews);
    } catch (error) {
      setPendingAcknowledgementsCount(0);
      setPendingEmployeeReviewsCount(0);
    }
  };
  
  const handleLogout = async () => {
    onClose();
    try {
      await logout();
    } catch (error) {
      toast.error('Unable to logout. Please try again or refresh the page.');
    }
    navigate('/login');
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
    { path: '/manager/kpi-templates', label: 'KPI Templates', icon: FiFileText },
    { 
      path: '/manager/reviews', 
      label: 'Reviews', 
      icon: FiClipboard, 
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined 
    },
    { path: '/manager/schedule-meeting', label: 'Schedule Meeting', icon: FiCalendar },
    { path: '/manager/kpi-setting-completed', label: 'KPI Setting Completed', icon: FiFlag },
    { path: '/manager/acknowledged-kpis', label: 'Acknowledged KPIs', icon: FiCheckCircle },
    { path: '/manager/completed-reviews', label: 'Completed Reviews', icon: FiCheck },
  ];

  const employeeNavItems: NavItem[] = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: FiHome },
    { 
      path: '/employee/acknowledge', 
      label: 'Acknowledge', 
      icon: FiCheckCircle,
      badge: pendingAcknowledgementsCount > 0 ? pendingAcknowledgementsCount : undefined
    },
    { 
      path: '/employee/reviews', 
      label: 'Reviews', 
      icon: FiClipboard,
      badge: pendingEmployeeReviewsCount > 0 ? pendingEmployeeReviewsCount : undefined
    },
    { path: '/employee/kpi-setting-completed', label: 'KPI Setting Completed', icon: FiFlag },
    { path: '/employee/completed-reviews', label: 'Completed Reviews', icon: FiCheck },
  ];

  const hrNavItems: NavItem[] = [
    { path: '/hr/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/hr/employees', label: 'Employees', icon: FiUsers },
    { path: '/hr/departments', label: 'Department Analytics', icon: FiUsers },
    { path: '/hr/kpi-list', label: 'KPI Overview', icon: FiTarget },
    { path: '/hr/rejected-kpis', label: 'Rejected KPIs', icon: FiAlertTriangle },
    { path: '/hr/kpi-setting-completed', label: 'KPI Setting Completed', icon: FiFlag },
    { path: '/hr/acknowledged-kpis', label: 'Acknowledged KPIs', icon: FiCheckCircle },
    { path: '/hr/completed-reviews', label: 'Completed Reviews', icon: FiCheck },
    { path: '/hr/review-report', label: 'Review Report', icon: FiFileText },
    { path: '/hr/email-templates', label: 'Email Templates', icon: FiMail },
    { path: '/hr/settings', label: 'Settings', icon: FiSettings },
  ];

  const superAdminNavItems: NavItem[] = [
    { path: '/super-admin/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/super-admin/company-management', label: 'Company Management', icon: FiHome },
    { path: '/super-admin/user-management', label: 'User Management', icon: FiUsers },
    { path: '/super-admin/calculation-settings', label: 'Calculation Settings', icon: FiSliders },
    { path: '/super-admin/sms-configuration', label: 'SMS Configuration', icon: FiMail },
    { path: '/onboard', label: 'Onboard Company', icon: FiUsers },
  ];

  const getNavItems = () => {
    if (isSuperAdmin(user)) {
      return superAdminNavItems;
    }
    if (isManager(user)) {
      return managerNavItems;
    }
    if (isEmployee(user)) {
      return employeeNavItems;
    }
    if (isHR(user)) {
      return hrNavItems;
    }
    
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
on the       <aside
        className={`fixed left-0 top-0 h-full bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'w-24' : 'w-64'}`}
        style={{ zIndex: 50 }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Company Logo Section - Top */}
          <div className={`${isCollapsed ? 'p-4' : 'p-6'} bg-white border-b border-gray-200 flex flex-col items-center transition-all duration-300 flex-shrink-0`}>
            {isCollapsed ? (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {activeSelectedCompany?.logo_url ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${activeSelectedCompany.logo_url}`} 
                    alt={`${activeSelectedCompany.name} logo`} 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <FiHome className="text-gray-400 text-xl" />
                )}
              </div>
            ) : (
              <div className="w-full">
                {/* Company Logo and Name */}
                <div className="flex flex-col items-center">
                  {activeSelectedCompany?.logo_url ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${activeSelectedCompany.logo_url}`} 
                      alt={`${activeSelectedCompany.name} logo`}
                      className="max-w-full h-16 object-contain mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <FiHome className="text-gray-400 text-2xl" />
                    </div>
                  )}
                  {activeSelectedCompany && (
                    <h2 className="text-lg font-bold text-gray-800 text-center">{activeSelectedCompany.name}</h2>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${isCollapsed ? 'px-2 py-3' : 'p-4'} overflow-y-auto`}>
            <div className={isCollapsed ? 'space-y-1' : 'space-y-1'}>
              {!isCollapsed && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                  MAIN
                </p>
              )}
              {getNavItems().map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <div key={item.path} className="relative">
                    <Link
                      to={item.path}
                      onClick={onClose}
                      title={isCollapsed ? item.label : ''}
                      className={`flex items-center ${
                        isCollapsed 
                          ? 'justify-center w-14 h-14 mx-auto' 
                          : 'justify-between px-3 py-2.5'
                      } rounded-lg mb-1 transition-colors relative group ${
                        active
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isCollapsed ? (
                        <>
                          <Icon className={`text-xl flex-shrink-0 ${active ? 'text-purple-600' : ''}`} />
                          {item.badge && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3 min-w-0">
                            <Icon className={`text-lg flex-shrink-0 ${active ? 'text-purple-600' : ''}`} />
                            <span className="font-medium truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                                active
                                  ? 'bg-purple-200 text-purple-700'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                    
                    {/* Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] shadow-lg">
                        {item.label}
                        {item.badge && <span className="ml-2 text-xs">({item.badge})</span>}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* ICT Africa Branding - Bottom */}
          <div className={`${isCollapsed ? 'px-2 py-3' : 'p-4'} bg-white border-t border-gray-200 flex-shrink-0`}>
            {isCollapsed ? (
              <div className="flex justify-center">
                <img src="/ICTA.jpeg" alt="ICT Africa" className="w-8 h-8 object-contain" />
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <img src="/ICTA.jpeg" alt="ICT Africa" className="w-8 h-8 object-contain" />
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  KPI Management Process<br />
                  <span className="font-semibold text-gray-600">Designed by ICT Africa</span>
                </p>
              </div>
            )}
          </div>

          {/* Logout - Only for HR and Super Admin */}
          {(isHR(user) || isSuperAdmin(user)) && (
            <div className={`${isCollapsed ? 'px-2 py-3' : 'p-4'} border-t border-gray-200 flex-shrink-0`}>
              <div className="relative">
                <button
                  onClick={handleLogout}
                  title={isCollapsed ? 'Logout' : ''}
                  className={`flex items-center ${
                    isCollapsed 
                      ? 'justify-center w-14 h-14 mx-auto' 
                      : 'w-full space-x-3 px-3 py-2.5'
                  } rounded-lg text-red-600 hover:bg-red-50 transition-colors relative group`}
                >
                  <FiLogOut className={`${isCollapsed ? 'text-xl' : 'text-lg'} flex-shrink-0`} />
                  {!isCollapsed && (
                    <span className="font-medium">Logout</span>
                  )}
                </button>
                
                {/* Tooltip for Logout */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] shadow-lg">
                    Logout
                    {/* Arrow */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

