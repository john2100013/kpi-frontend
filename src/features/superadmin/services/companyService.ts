import api from '../../../services/api';

export interface Company {
  id: number;
  name: string;
  domain?: string;
  logo_url?: string;
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
      // Error will be handled by the calling component
      throw error;
    }
  },

  updateCompany: async (id: number, data: CompanyFormData, logoFile?: File | null): Promise<Company> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('domain', data.domain || '');
    
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    
    const response = await api.put(`/companies/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.company;
  },
};