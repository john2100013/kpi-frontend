import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { userManagementService, User, UserFilters, UserUpdateData, Department } from '../services/userManagementService';

export const useUserManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  // Filters - default to 'employee' role (ID: 4)
  const [roleFilter, setRoleFilter] = useState<string>('4');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit and assign states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [assigningManager, setAssigningManager] = useState<User | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    fetchUsers();
  }, [roleFilter, companyFilter, searchQuery]);

  useEffect(() => {
    if (companyFilter) {
      fetchDepartments();
    }
  }, [companyFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // First fetch companies
      const companiesData = await userManagementService.fetchCompanies();

      setCompanies(companiesData);
      
      // Set default company to first company if available
      if (companiesData.length > 0) {
        setCompanyFilter(companiesData[0].id.toString());
        // fetchUsers will be triggered by the useEffect when companyFilter changes
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Backend requires both role and company
      if (!roleFilter || !companyFilter) {
        setUsers([]);
        return;
      }
      
      const filters: UserFilters = {
        role: roleFilter,
        company: companyFilter
      };
      
      if (searchQuery) filters.search = searchQuery;


      const data = await userManagementService.fetchAllUsers(filters);

      setUsers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch users');
      setUsers([]);
    }
  };

  const fetchDepartments = async () => {
    if (!companyFilter) return;
    
    try {
      const data = await userManagementService.fetchDepartments(parseInt(companyFilter));
      setDepartments(data);
    } catch (error: any) {
      toast.error('Failed to fetch departments. Please try again.');
      setDepartments([]);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveUser = async (userId: number, data: UserUpdateData) => {
    try {
      await userManagementService.updateUser(userId, data);
      
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update user');
      throw error;
    }
  };

  const handleAssignDepartments = (manager: User) => {
    setAssigningManager(manager);
  };

  const handleSaveManagerDepartments = async (managerId: number, departmentIds: number[]) => {
    try {
      await userManagementService.assignManagerDepartments(managerId, departmentIds);
      toast.success('Manager departments assigned successfully');
      setAssigningManager(null);
      // Optionally refresh the users list to show updated department assignments
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign departments');
      throw error;
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      const newStatus = !currentStatus;
      
      await userManagementService.toggleUserStatus(userId, newStatus);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: newStatus } : user
      ));
      
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      
      await userManagementService.deleteUser(userId);
      
      // Remove from local state
      setUsers(users.filter(user => user.id !== userId));
      
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetFilters = () => {
    setRoleFilter('4'); // Employee role ID
    setCompanyFilter(companies.length > 0 ? companies[0].id.toString() : '');
    setSearchQuery('');
  };

  const handleBack = () => {
    navigate('/super-admin/dashboard');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'hr':
        return 'bg-blue-100 text-blue-700';
      case 'manager':
        return 'bg-green-100 text-green-700';
      case 'employee':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return {
    users,
    paginatedUsers,
    companies,
    departments,
    loading,
    actionLoading,
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    roleFilter,
    setRoleFilter,
    companyFilter,
    setCompanyFilter,
    searchQuery,
    setSearchQuery,
    editingUser,
    setEditingUser,
    assigningManager,
    setAssigningManager,
    handleEditUser,
    handleSaveUser,
    handleAssignDepartments,
    handleSaveManagerDepartments,
    handleToggleStatus,
    handleDeleteUser,
    handleResetFilters,
    handleBack,
    getRoleBadgeColor,
    fetchUsers,
  };
};
