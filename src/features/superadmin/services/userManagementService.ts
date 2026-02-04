import api from '../../../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'hr' | 'manager' | 'employee';
  role_id?: number;
  company_name?: string;
  company_id?: number;
  department?: string;
  department_id?: number;
  position?: string;
  payroll_number?: string;
  national_id?: string;
  phone_number?: string;
  employment_date?: string;
  created_at: string;
  is_active?: boolean;
}

export interface UserUpdateData {
  name: string;
  email: string;
  phone_number?: string;
  payroll_number?: string;
  national_id?: string;
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

      // Backend currently uses authenticated user's company; role filter is not applied server-side yet.
      const response = await api.get('/users/list', { params: filters });
      const users = response.data?.data?.users || response.data?.users || [];

      return users;
    } catch (error: any) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Failed to fetch users. Please try again.');
      }
      throw error;
    }
  },

  fetchCompanies: async (): Promise<Array<{ id: number; name: string }>> => {
    try {

      const response = await api.get('/companies/list');

      const companies = response.data.companies || response.data.data?.companies || [];

      return companies;
    } catch (error: any) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Failed to fetch companies. Please try again.');
      }
      throw error;
    }
  },

  toggleUserStatus: async (userId: number, isActive: boolean): Promise<void> => {
    await api.put(`/users/${userId}/status`, { is_active: isActive });
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  updateUser: async (userId: number, data: UserUpdateData): Promise<User> => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data.user;
  },

  fetchDepartments: async (companyId: number): Promise<Department[]> => {

    try {
      const response = await api.get(`/departments?companyId=${companyId}`);

      const departments = response.data?.data?.departments || response.data?.departments || [];

      return departments;
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Failed to fetch departments. Please try again.');
      }
      throw error;
    }
  },

  getManagerDepartments: async (userId: number) => {

    try {
      const response = await api.get(`/departments/manager-departments/${userId}`);

      return response.data;
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Failed to fetch manager departments. Please try again.');
      }
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