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

    const response = await api.get('/departments', { params: { companyId } });

    const departments = response.data?.data?.departments || response.data?.departments || [];

    return departments;
  },

  createDepartment: async (name: string, companyId: number): Promise<Department> => {

    const payload = { name, companyId };

    const response = await api.post('/departments', payload);

    return response.data.department || response.data.data;
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
