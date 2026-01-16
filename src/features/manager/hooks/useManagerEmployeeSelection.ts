/**
 * useManagerEmployeeSelection
 * 
 * Custom hook for managing employee selection page state and logic.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { User } from '../../../types';

interface UseManagerEmployeeSelectionReturn {
  employees: User[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  reviews: any[];
  currentPage: number;
  employeesPerPage: number;
  filteredEmployees: User[];
  currentEmployees: User[];
  totalPages: number;
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 15;

  useEffect(() => {
    fetchEmployees();
    fetchReviews();
  }, []);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchEmployees = async () => {
    try {
      console.log('[useManagerEmployeeSelection] Fetching employees for manager');
      // Fetch from the manager service which uses correct endpoint
      const response = await api.get('/users/list');
      console.log('[useManagerEmployeeSelection] Raw response:', response.data);
      
      // Parse response - backend returns: { success: true, data: { users: [...], pagination: {...} } }
      let allUsers = [];
      if (response.data.data && response.data.data.users && Array.isArray(response.data.data.users)) {
        allUsers = response.data.data.users;
        console.log('[useManagerEmployeeSelection] Format: data.data.users array');
      } else if (response.data.users && Array.isArray(response.data.users)) {
        allUsers = response.data.users;
        console.log('[useManagerEmployeeSelection] Format: data.users array');
      } else if (response.data.data && Array.isArray(response.data.data)) {
        allUsers = response.data.data;
        console.log('[useManagerEmployeeSelection] Format: data.data array');
      } else if (Array.isArray(response.data)) {
        allUsers = response.data;
        console.log('[useManagerEmployeeSelection] Format: direct array');
      } else {
        console.log('[useManagerEmployeeSelection] Unknown format, defaulting to empty array');
        allUsers = [];
      }
      
      console.log('[useManagerEmployeeSelection] Parsed users count:', allUsers.length);
      console.log('[useManagerEmployeeSelection] Users is array?', Array.isArray(allUsers));
      
      // Filter to get only employees (exclude managers, hr, superadmin)
      const employees = allUsers.filter((user: any) => 
        user.role_id !== 1 && user.role_id !== 2 && user.role_id !== 3
      );
      
      console.log('[useManagerEmployeeSelection] Employees fetched:', employees.length);
      setEmployees(employees);
    } catch (error) {
      console.error('[useManagerEmployeeSelection] Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      console.log('[useManagerEmployeeSelection] Fetching reviews from /kpi-review');
      const response = await api.get('/kpi-review');
      const reviews = response.data.reviews || response.data.data || [];
      console.log('[useManagerEmployeeSelection] Reviews fetched:', reviews.length);
      setReviews(reviews);
    } catch (error) {
      console.error('[useManagerEmployeeSelection] Error fetching reviews:', error);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.payroll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const startIndex = (currentPage - 1) * employeesPerPage;
  const endIndex = startIndex + employeesPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

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
    reviews,
    currentPage,
    employeesPerPage,
    filteredEmployees,
    currentEmployees,
    totalPages,
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
