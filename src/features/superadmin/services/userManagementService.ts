import api from '../../../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'hr' | 'manager' | 'employee';
  company_name?: string;
  company_id?: number;
  department?: string;
  position?: string;
  payroll_number?: string;
  national_id?: string;
  employment_date?: string;
  created_at: string;
  is_active?: boolean;
}

export interface UserUpdateData {
  name: string;
  email: string;
  payroll_number?: string;
  national_id?: string;
  department?: string;
  position?: string;
  employment_date?: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface UserFilters {
  role?: string;
  company?: string;
  search?: string;
}

export const userManagementService = {
  fetchAllUsers: async (filters?: UserFilters): Promise<User[]> => {
    try {
      console.log('[userManagementService] Calling GET /users/list', filters || {});
      // Backend currently uses authenticated user's company; role filter is not applied server-side yet.
      const response = await api.get('/users/list', { params: filters });
      const users = response.data?.data?.users || response.data?.users || [];
      console.log('[userManagementService] Users fetched:', users.length);
      return users;
    } catch (error: any) {
      console.error('[userManagementService] Error fetching users:', error.message, error.response?.data);
      throw error;
    }
  },

  fetchCompanies: async (): Promise<Array<{ id: number; name: string }>> => {
    try {
      console.log('[userManagementService] Calling GET /companies/list');
      const response = await api.get('/companies/list');
      console.log('[userManagementService] Response:', response.data);
      const companies = response.data.companies || response.data.data?.companies || [];
      console.log('[userManagementService] Returning companies:', companies);
      return companies;
    } catch (error: any) {
      console.error('[userManagementService] Error fetching companies:', error.message, error.response?.data);
      throw error;
    }
  },

  toggleUserStatus: async (userId: number, isActive: boolean, companyId: number): Promise<void> => {
    // Use PUT endpoint with is_active field
    await api.put(`/users/${userId}?companyId=${companyId}`, { is_active: isActive });
  },

  deleteUser: async (_userId: number): Promise<void> => {
    // Note: Backend doesn't have delete endpoint yet
    // This will need to be implemented in the backend first
    throw new Error('Delete user functionality not yet implemented in backend');
  },

  updateUser: async (userId: number, companyId: number, data: UserUpdateData): Promise<User> => {
    const response = await api.put(`/users/${userId}?companyId=${companyId}`, data);
    return response.data.user;
  },

  fetchDepartments: async (companyId: number): Promise<Department[]> => {
    console.log('[userManagementService] Fetching departments for company:', companyId);
    try {
      const response = await api.get(`/departments?companyId=${companyId}`);
      console.log('[userManagementService] Departments response:', response.data);
      const departments = response.data?.data?.departments || response.data?.departments || [];
      console.log('[userManagementService] Returning departments:', departments.length);
      return departments;
    } catch (error) {
      console.error('[userManagementService] Error fetching departments:', error);
      throw error;
    }
  },

  getManagerDepartments: async (userId: number) => {
    console.log('[userManagementService] Fetching manager departments for:', userId);
    try {
      const response = await api.get(`/departments/manager-departments/${userId}`);
      console.log('[userManagementService] Manager departments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[userManagementService] Error fetching manager departments:', error);
      throw error;
    }
  },

  assignManagerDepartments: async (managerId: number, departmentIds: number[]): Promise<void> => {
    await api.post('/users/assign-manager-departments', {
      manager_id: managerId,
      department_ids: departmentIds,
    });
  },
};