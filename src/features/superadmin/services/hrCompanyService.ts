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
    console.log('[hrCompanyService] Fetching HR users from /companies/hr-users');
    const response = await api.get('/companies/hr-users');
    console.log('[hrCompanyService] HR users response:', response.data);
    const hrUsers = response.data?.data?.hrUsers || response.data?.hrUsers || [];
    console.log('[hrCompanyService] Returning HR users:', hrUsers.length);
    return hrUsers;
  },

  fetchAvailableCompaniesForHr: async (hrId: string): Promise<CompanyOption[]> => {
    console.log('[hrCompanyService] Fetching available companies for HR:', hrId);
    const response = await api.get(`/companies/available-companies-for-hr/${hrId}`);
    console.log('[hrCompanyService] Available companies response:', response.data);
    const companies = response.data?.data?.companies || response.data?.companies || [];
    console.log('[hrCompanyService] Returning companies:', companies.length);
    return companies;
  },

  assignHrToCompany: async (data: AssignHrData): Promise<void> => {
    console.log('[hrCompanyService] Assigning HR to company:', data);
    await api.post('/companies/assign-hr-to-company', data);
    console.log('[hrCompanyService] HR assigned successfully');
  },
};