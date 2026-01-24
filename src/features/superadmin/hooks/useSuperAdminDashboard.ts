import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { isSuperAdmin } from '../../../utils/roleUtils';
import { superAdminDashboardService, DashboardStats, Company } from '../services/superAdminDashboardService';

export const useSuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalHRUsers: 0,
    totalManagers: 0,
    totalEmployees: 0,
    totalDepartments: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !isSuperAdmin(user)) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { stats, companies } = await superAdminDashboardService.fetchDashboardData();
      setStats(stats);
      setRecentCompanies(companies);
    } catch (err: any) {
      console.error('[useSuperAdminDashboard] Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return {
    user,
    stats,
    recentCompanies,
    loading,
    error,
    navigateTo,
  };
};