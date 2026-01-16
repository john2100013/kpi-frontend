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
    fetchUsers();
  }, [roleFilter, companyFilter, searchQuery]);

  useEffect(() => {
    if (companyFilter) {
      fetchDepartments();
    }
  }, [companyFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('[useUserManagement] Fetching companies...');
      // First fetch companies
      const companiesData = await userManagementService.fetchCompanies();
      console.log('[useUserManagement] Companies fetched:', companiesData);
      setCompanies(companiesData);
      
      // Set default company to first company if available
      if (companiesData.length > 0) {
        setCompanyFilter(companiesData[0].id.toString());
        // fetchUsers will be triggered by the useEffect when companyFilter changes
      }
    } catch (error: any) {
      console.error('[useUserManagement] Error fetching initial data:', error);
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

      console.log('[useUserManagement] Fetching users with filters:', filters);
      const data = await userManagementService.fetchAllUsers(filters);
      console.log('[useUserManagement] Users fetched:', data.length);
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
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
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveUser = async (userId: number, data: UserUpdateData) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser?.company_id) {
        toast.error('User company ID not found');
        return;
      }

      const updatedUser = await userManagementService.updateUser(userId, targetUser.company_id, data);
      
      setUsers(users.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
      toast.success('User updated successfully');
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
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

  const handleToggleStatus = async (userId: number, currentStatus: boolean, companyId?: number) => {
    try {
      setActionLoading(userId);
      const newStatus = !currentStatus;
      
      // Use the user's company_id or first available company
      const targetUser = users.find(u => u.id === userId);
      const targetCompanyId = companyId || targetUser?.company_id || companies[0]?.id;
      
      if (!targetCompanyId) {
        toast.error('No company ID available for this user');
        return;
      }
      
      await userManagementService.toggleUserStatus(userId, newStatus, targetCompanyId);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: newStatus } : user
      ));
      
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user status');
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
    companies,
    departments,
    loading,
    actionLoading,
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
