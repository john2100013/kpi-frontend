/**
 * useManagerEmployeeSelection
 * 
 * Custom hook for managing employee selection page state and logic.
 */

import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { User, ManagerDepartmentAssignment } from '../../../types';

interface UseManagerEmployeeSelectionReturn {
  employees: User[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  departmentFilter: 'all' | 'primary';
  setDepartmentFilter: (filter: 'all' | 'primary') => void;
  reviews: any[];
  managerDepartments: ManagerDepartmentAssignment[];
  currentPage: number;
  employeesPerPage: number;
  filteredEmployees: User[];
  currentEmployees: User[];
  totalPages: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
  pendingReviewsCount: number;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  handleScrollToEmployees: () => void;
  handleNavigateToTemplates: () => void;
  handleNavigateToReviews: () => void;
  handleNavigateToScheduleMeeting: () => void;
  handleViewKPIs: (employeeId: number) => void;
  handleSetKPI: (employeeId: number) => void;
  handleBack: () => void;
}

export const useManagerEmployeeSelection = (): UseManagerEmployeeSelectionReturn => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'primary'>('all');
  const [reviews, setReviews] = useState<any[]>([]);
  const [managerDepartments, setManagerDepartments] = useState<ManagerDepartmentAssignment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const employeesPerPage = 15;

  const toast = useToast();

  // Fetch employees with pagination whenever filters or page changes
  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchQuery, departmentFilter]);

  // Fetch reviews and departments on mount
  useEffect(() => {
    fetchReviews();
    fetchManagerDepartments();
  }, []);

  // Reset to page 1 when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Build query parameters for server-side pagination
      const params: any = {
        page: currentPage,
        limit: employeesPerPage,
        role: 'employee', // Only fetch employees (backend will filter by role_id = 4)
        department_filter: departmentFilter, // Send filter to backend: 'all' or 'primary'
      };
      
      // Add search query if present
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      // Fetch from the users list endpoint with pagination
      const response = await api.get('/users/list', { params });
      
      // Parse response - backend returns: { success: true, data: { users: [...], pagination: {...} } }
      const data = response.data.data || response.data;
      const users = data.users || [];
      const pagination = data.pagination || {};
      
      setEmployees(users);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || users.length);
    } catch (error) {
      toast.error('Unable to load employees. Please try again.');
      setEmployees([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerDepartments = async () => {
    try {
      const response = await api.get('/departments/manager/my-departments');
      const departments = response.data.data?.departments || response.data.data?.assignments || [];
      setManagerDepartments(departments);
    } catch (error) {
      toast.error('Unable to load your departments. Please refresh the page.');
      setManagerDepartments([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get('/kpi-review');
      const reviews = response.data.reviews || response.data.data || [];
      setReviews(reviews);
    } catch (error) {
      toast.error('Server error. Please try reloading or try later.');
    }
  };

  // Backend now handles department filtering (primary vs all)
  // No need for client-side filtering anymore
  const filteredEmployees = employees;

  // Server already provides paginated data
  const currentEmployees = filteredEmployees;
  
  // Pagination metadata from server (used for UI display)
  const startIndex = (currentPage - 1) * employeesPerPage;
  const endIndex = startIndex + filteredEmployees.length;

  // Calculate pending reviews count
  const pendingReviewsCount = reviews.filter(r => r.review_status === 'employee_submitted').length;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleScrollToEmployees = () => {
    const employeeList = document.querySelector('.employee-list-section');
    if (employeeList) {
      employeeList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavigateToTemplates = () => {
    navigate('/manager/kpi-templates');
  };

  const handleNavigateToReviews = () => {
    navigate('/manager/reviews');
  };

  const handleNavigateToScheduleMeeting = () => {
    navigate('/manager/schedule-meeting');
  };

  const handleViewKPIs = (employeeId: number) => {
    navigate(`/manager/employee-kpis/${employeeId}`);
  };

  const handleSetKPI = (employeeId: number) => {
    navigate(`/manager/kpi-setting/${employeeId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return {
    employees,
    loading,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    reviews,
    managerDepartments,
    currentPage,
    employeesPerPage,
    filteredEmployees,
    currentEmployees,
    totalPages,
    totalCount,
    startIndex,
    endIndex,
    pendingReviewsCount,
    handlePreviousPage,
    handleNextPage,
    handleScrollToEmployees,
    handleNavigateToTemplates,
    handleNavigateToReviews,
    handleNavigateToScheduleMeeting,
    handleViewKPIs,
    handleSetKPI,
    handleBack,
  };
};
