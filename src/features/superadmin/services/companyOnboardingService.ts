import api from '../../../services/api';

export interface HRUser {
  name: string;
  email: string;
  password: string;
  payrollNumber: string;
}

export interface Manager {
  name: string;
  email: string;
  password: string;
  payrollNumber: string;
  departments: string[];
}

export interface Employee {
  name: string;
  email: string;
  payrollNumber: string;
  nationalId: string;
  department: string;
  position: string;
  employmentDate: string;
}

export interface OnboardingFormData {
  companyName: string;
  companyDomain: string;
  departments: string[];
  hrUsers: HRUser[];
  managers: Manager[];
  employees: Employee[];
}

export interface OnboardingResponse {
  message: string;
  companyId: number;
  company: {
    id: number;
    name: string;
    domain: string;
  };
  departments: Array<{ id: number; name: string }>;
  hrUsers: Array<{ id: number; name: string; email: string }>;
  managers: Array<{ id: number; name: string; email: string }>;
}

export interface ExcelUploadResponse {
  message: string;
  imported: number;
  skipped: number;
}

export const companyOnboardingService = {
  onboardCompany: async (data: OnboardingFormData): Promise<OnboardingResponse> => {
    // Log the payload being sent




    
    const response = await api.post('/companies/create', data);
    return response.data;
  },

  uploadEmployeesExcel: async (companyId: number, file: File): Promise<ExcelUploadResponse> => {
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/companies/${companyId}/bulk-upload-users`, formData);
    
    return response.data.data || response.data;
  },
};