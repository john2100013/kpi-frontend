import api from '../../../services/api';

export interface Company {
  id: number;
  name: string;
  domain?: string;
  created_at: string;
  total_employees: number;
  total_managers: number;
  total_hr: number;
  total_departments: number;
}

export interface CompanyFormData {
  name: string;
  domain: string;
}

export const companyService = {
  fetchCompanies: async (): Promise<Company[]> => {
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

  updateCompany: async (id: number, data: CompanyFormData): Promise<Company> => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data.company;
  },
};