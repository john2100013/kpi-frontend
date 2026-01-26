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

export interface DashboardData {
  stats: DashboardStats;
  companies: Company[];
}

let cachedRequest: Promise<DashboardData> | null = null;

function calculateStats(companies: Company[]): DashboardStats {
  return {
    totalCompanies: companies.length,
    totalHRUsers: companies.reduce((sum, c) => sum + (Number(c.total_hr) || 0), 0),
    totalManagers: companies.reduce((sum, c) => sum + (Number(c.total_managers) || 0), 0),
    totalEmployees: companies.reduce((sum, c) => sum + (Number(c.total_employees) || 0), 0),
    totalDepartments: companies.reduce((sum, c) => sum + (Number(c.total_departments) || 0), 0),
  };
}

function getRecentCompanies(companies: Company[], limit: number = 5): Company[] {
  return companies
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

async function loadDashboardData(): Promise<DashboardData> {
  const response = await api.get('/companies/list');
  const companies = response.data.companies || response.data.data?.companies || [];
  
  return {
    stats: calculateStats(companies),
    companies: getRecentCompanies(companies),
  };
}

export const superAdminDashboardService = {
  fetchDashboardData: async (): Promise<DashboardData> => {
    // If there's already a request happening, return that instead of making a new one
    if (cachedRequest) {
      return cachedRequest;
    }
    cachedRequest = loadDashboardData();
    try {
      return await cachedRequest;
    } finally {
      cachedRequest = null;
    }
  },
};