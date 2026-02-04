import api from '../../../services/api';

export interface HrCompany {
  id: number;
  name: string;
  domain?: string;
  is_primary?: boolean;
}

export interface HrUser {
  id: number;
  name: string;
  email?: string;
  companies: HrCompany[];
}

export interface CompanyOption {
  id: number;
  name: string;
  domain?: string;
}

export interface AssignHrData {
  userId: number;
  companyId: number;
}

export const hrCompanyService = {
  fetchHrUsers: async (): Promise<HrUser[]> => {

    const response = await api.get('/companies/hr-users');

    const hrUsers = response.data?.data?.hrUsers || response.data?.hrUsers || [];

    return hrUsers;
  },

  fetchAvailableCompaniesForHr: async (hrId: string): Promise<CompanyOption[]> => {

    const response = await api.get(`/companies/available-companies-for-hr/${hrId}`);

    const companies = response.data?.data?.companies || response.data?.companies || [];

    return companies;
  },

  assignHrToCompany: async (data: AssignHrData): Promise<void> => {

    await api.post('/companies/assign-hr-to-company', data);

  },
};