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
      console.log('[companyService] Calling GET /companies/list');
      const response = await api.get('/companies/list');
      console.log('[companyService] Response received:', response.data);
      const companies = response.data.companies || response.data.data?.companies || [];
      console.log('[companyService] Returning companies:', companies);
      return companies;
    } catch (error: any) {
      console.error('[companyService] Error fetching companies:', error.message, error.response?.data);
      throw error;
    }
  },

  updateCompany: async (id: number, data: CompanyFormData): Promise<Company> => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data.company;
  },
};