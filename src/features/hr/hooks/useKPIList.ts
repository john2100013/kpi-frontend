/**
 * Custom hook for KPI List page logic
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KPI, KPIReview } from '../../../types';
import { PeriodSetting, Manager, KPIFilters, KPIPagination } from '../types';
import { hrService } from '../services';
import { useToast } from '../../../context/ToastContext';

export const useKPIList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<KPIFilters>({
    department: '',
    status: '',
    period: '',
    manager: '',
  });
  const [pagination, setPagination] = useState<KPIPagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 50,
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const toast = useToast();
  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string>('');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Initialize filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') || '';
    const employeeId = params.get('employee_id') || '';

    if (status) {
      setFilters(prev => ({ ...prev, status }));
    }
    if (employeeId) {
      setEmployeeIdFilter(employeeId);
    }
  }, [location.search]);

  // Fetch data when filters or page change
  useEffect(() => {
    fetchData();
  }, [filters, pagination.currentPage, searchQuery, employeeIdFilter]);

  // Fetch additional data on mount
  useEffect(() => {
    fetchPeriodSettings();
    fetchManagers();
    fetchDepartments();
  }, []);

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showExportMenu]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodType, quarter, year] = filters.period.split('|');

      const params: any = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: searchQuery || undefined,
        department: filters.department || undefined,
        status: filters.status || undefined,
        manager_id: filters.manager || undefined,
        employee_id: employeeIdFilter || undefined,
      };

      if (filters.period) {
        params.period = periodType;
        if (quarter) params.quarter = quarter;
        params.year = year;
      }

      const [kpisRes, reviewsRes] = await Promise.all([
        hrService.fetchKPIs(params),
        hrService.fetchReviews(),
      ]);


      const kpisArray = kpisRes.data?.kpis || kpisRes.kpis || [];
      const paginationData = kpisRes.data?.pagination || kpisRes.pagination;


      setKpis(kpisArray);
      setReviews(reviewsRes || []);
      setPagination(prev => ({
        ...prev,
        totalPages: paginationData?.total_pages || paginationData?.totalPages || 1,
        totalCount: paginationData?.total_count || paginationData?.total || 0,
      }));
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodSettings = async () => {
    try {
      const settings = await hrService.fetchPeriodSettings();
      setPeriodSettings(settings);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    }
  };

  const fetchManagers = async () => {
    try {
      const managersList = await hrService.fetchManagers();
      setManagers(managersList);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    }
  };

  const fetchDepartments = async () => {
    try {
      const deptList = await hrService.fetchDepartments();
      setDepartments(deptList);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
      window.scrollTo(0, 0);
    }
  };

  const handleFilterChange = (key: keyof KPIFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getPageTitle = () => {
    if (filters.status === 'rejected' && employeeIdFilter) {
      const kpi = kpis[0];
      return kpi ? `Rejected KPI - ${kpi.employee_name}` : 'Rejected KPIs';
    }
    if (filters.status === 'rejected') {
      return 'Rejected KPIs';
    }
    return 'KPI Overview';
  };

  const getPageSubtitle = () => {
    if (filters.status === 'rejected' && employeeIdFilter) {
      return `View rejected KPIs for this employee (${pagination.totalCount} total)`;
    }
    return `View all KPIs across the organization (${pagination.totalCount} total)`;
  };

  return {
    // State
    kpis,
    reviews,
    loading,
    searchQuery,
    filters,
    pagination,
    departments,
    managers,
    periodSettings,
    showExportMenu,
    employeeIdFilter,
    exportMenuRef,
    
    // Actions
    handlePageChange,
    handleFilterChange,
    handleSearchChange,
    setShowExportMenu,
    getPageTitle,
    getPageSubtitle,
    navigate,
  };
};
