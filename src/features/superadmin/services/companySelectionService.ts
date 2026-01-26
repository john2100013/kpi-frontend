import api from '../../../services/api';

export interface CompanyOption {
  id: number;
  name: string;
  domain?: string;
}

export const companySelectionService = {
  fetchAvailableCompanies: async (): Promise<CompanyOption[]> => {
    const response = await api.get('/companies/my-companies');
    return response.data.companies || [];
  },

  selectCompany: async (companyId: number): Promise<{ message: string; token: string }> => {
    const response = await api.post('/companies/select', { companyId });
    return response.data;
  },
};