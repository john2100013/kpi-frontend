import api from '../../../services/api';

export interface Department {
  id: number;
  name: string;
  company_id: number;
  company_name?: string;
  employee_count?: number;
  created_at: string;
}

export const departmentService = {
  fetchDepartments: async (companyId: number): Promise<Department[]> => {
    console.log('[departmentService] Fetching departments for company:', companyId);
    const response = await api.get('/departments', { params: { companyId } });
    console.log('[departmentService] Departments response:', response.data);
    const departments = response.data?.data?.departments || response.data?.departments || [];
    console.log('[departmentService] Returning departments:', departments.length);
    return departments;
  },

  createDepartment: async (name: string, companyId: number): Promise<Department> => {
    const response = await api.post('/departments', { name, companyId });
    return response.data.department;
  },

  updateDepartment: async (id: number, name: string): Promise<Department> => {
    const response = await api.put(`/departments/${id}`, { name });
    return response.data.department;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },

  addEmployeesToDepartment: async (employeeIds: number[], departmentId: number): Promise<void> => {
    await api.post('/departments/add-employees', { employeeIds, departmentId });
  },
};
