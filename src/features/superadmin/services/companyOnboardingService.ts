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
    console.log('=== Company Onboarding Payload ===');
    console.log('Company:', { name: data.companyName, domain: data.companyDomain });
    console.log('Departments:', data.departments);
    console.log('HR Users:', data.hrUsers.map(hr => ({ 
      name: hr.name, 
      email: hr.email, 
      payrollNumber: hr.payrollNumber,
      hasPassword: !!hr.password 
    })));
    console.log('Managers:', data.managers.map(mgr => ({ 
      name: mgr.name, 
      email: mgr.email, 
      payrollNumber: mgr.payrollNumber,
      departments: mgr.departments,
      hasPassword: !!mgr.password 
    })));
    console.log('Employees:', data.employees.map(emp => ({ 
      name: emp.name, 
      email: emp.email, 
      payrollNumber: emp.payrollNumber,
      nationalId: emp.nationalId,
      department: emp.department,
      position: emp.position,
      employmentDate: emp.employmentDate
    })));
    console.log('=== End Payload ===');
    
    const response = await api.post('/companies/create', data);
    return response.data;
  },

  uploadEmployeesExcel: async (companyId: number, file: File): Promise<ExcelUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/companies/${companyId}/employees/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};