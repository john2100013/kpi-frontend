import api from '../../../services/api';

export interface DashboardStats {
  totalCompanies: number;
  totalHRUsers: number;
  totalManagers: number;
  totalEmployees: number;
  totalDepartments: number;
}

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

export const superAdminDashboardService = {
  fetchDashboardStats: async (): Promise<DashboardStats> => {
    try {
      console.log('[superAdminDashboardService] Fetching dashboard stats...');
      const response = await api.get('/companies/list');
      console.log('[superAdminDashboardService] Response received:', response.data);
      
      const companies = response.data.companies || response.data.data?.companies || [];
      console.log('[superAdminDashboardService] Companies extracted:', companies);
      console.log('[superAdminDashboardService] Companies length:', companies.length);
      
      // Convert string values to numbers before summing
      // Convert string values to numbers before summing
      const totalHRUsers = companies.reduce((sum: number, c: Company) => {
        const val = Number(c.total_hr) || 0;
        console.log(`[superAdminDashboardService] Company ${c.name}: total_hr = ${val}`);
        return sum + val;
      }, 0);
      
      const totalManagers = companies.reduce((sum: number, c: Company) => {
        const val = Number(c.total_managers) || 0;
        console.log(`[superAdminDashboardService] Company ${c.name}: total_managers = ${val}`);
        return sum + val;
      }, 0);
      
      const totalEmployees = companies.reduce((sum: number, c: Company) => {
        const val = Number(c.total_employees) || 0;
        console.log(`[superAdminDashboardService] Company ${c.name}: total_employees = ${val}`);
        return sum + val;
      }, 0);
      
      const totalDepartments = companies.reduce((sum: number, c: Company) => {
        const val = Number(c.total_departments) || 0;
        console.log(`[superAdminDashboardService] Company ${c.name}: total_departments = ${val}`);
        return sum + val;
      }, 0);
      
      const stats: DashboardStats = {
        totalCompanies: companies.length,
        totalHRUsers,
        totalManagers,
        totalEmployees,
        totalDepartments,
      };
      
      console.log('[superAdminDashboardService] Calculated stats:', stats);
      return stats;
    } catch (error: any) {
      console.error('[superAdminDashboardService] Error fetching stats:', error);
      throw error;
    }
  },

  fetchRecentCompanies: async (limit: number = 5): Promise<Company[]> => {
    try {
      console.log('[superAdminDashboardService] Fetching recent companies...');
      const response = await api.get('/companies/list');
      console.log('[superAdminDashboardService] Companies response:', response.data);
      
      const companies = response.data.companies || response.data.data?.companies || [];
      console.log('[superAdminDashboardService] Recent companies extracted:', companies);
      
      const sorted = companies
        .sort((a: Company, b: Company) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, limit);
      
      console.log('[superAdminDashboardService] Sorted recent companies:', sorted);
      return sorted;
    } catch (error: any) {
      console.error('[superAdminDashboardService] Error fetching recent companies:', error);
      throw error;
    }
  },
};