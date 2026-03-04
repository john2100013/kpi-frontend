import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { 
  companyOnboardingService, 
  HRUser, 
  Manager, 
  Employee, 
  OnboardingFormData 
} from '../services/companyOnboardingService';

export const useCompanyOnboarding = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [departments, setDepartments] = useState<string[]>(['']);
  const [hrUsers, setHrUsers] = useState<HRUser[]>([{ name: '', email: '', password: '', payrollNumber: '' }]);
  const [managers, setManagers] = useState<Manager[]>([{ name: '', email: '', password: '', payrollNumber: '', departments: [] }]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [showHRPasswords, setShowHRPasswords] = useState<boolean[]>([false]);
  const [showManagerPasswords, setShowManagerPasswords] = useState<boolean[]>([false]);

  // Department handlers
  const addDepartment = () => {
    setDepartments([...departments, '']);
  };

  const removeDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const updateDepartment = (index: number, value: string) => {
    const updated = [...departments];
    updated[index] = value;
    setDepartments(updated);
  };

  // HR User handlers
  const addHRUser = () => {
    setHrUsers([...hrUsers, { name: '', email: '', password: '', payrollNumber: '' }]);
    setShowHRPasswords([...showHRPasswords, false]);
  };

  const removeHRUser = (index: number) => {
    setHrUsers(hrUsers.filter((_, i) => i !== index));
    setShowHRPasswords(showHRPasswords.filter((_, i) => i !== index));
  };

  const updateHRUser = (index: number, field: keyof HRUser, value: string) => {
    const updated = [...hrUsers];
    updated[index] = { ...updated[index], [field]: value };
    setHrUsers(updated);
  };

  const toggleHRPasswordVisibility = (index: number) => {
    const updated = [...showHRPasswords];
    updated[index] = !updated[index];
    setShowHRPasswords(updated);
  };

  // Manager handlers
  const addManager = () => {
    setManagers([...managers, { name: '', email: '', password: '', payrollNumber: '', departments: [] }]);
    setShowManagerPasswords([...showManagerPasswords, false]);
  };

  const removeManager = (index: number) => {
    setManagers(managers.filter((_, i) => i !== index));
    setShowManagerPasswords(showManagerPasswords.filter((_, i) => i !== index));
  };

  const updateManager = (index: number, field: keyof Manager, value: string | string[]) => {
    const updated = [...managers];
    updated[index] = { ...updated[index], [field]: value };
    setManagers(updated);
  };

  const toggleManagerDepartment = (managerIndex: number, department: string) => {
    const manager = managers[managerIndex];
    const deptIndex = manager.departments.indexOf(department);
    const updated = [...managers];
    
    if (deptIndex >= 0) {
      updated[managerIndex].departments = manager.departments.filter(d => d !== department);
    } else {
      updated[managerIndex].departments = [...manager.departments, department];
    }
    
    setManagers(updated);
  };

  const toggleManagerPasswordVisibility = (index: number) => {
    const updated = [...showManagerPasswords];
    updated[index] = !updated[index];
    setShowManagerPasswords(updated);
  };

  // Employee handlers
  const addEmployee = () => {
    setEmployees([...employees, {
      name: '',
      email: '',
      payrollNumber: '',
      nationalId: '',
      department: '',
      position: '',
      employmentDate: '',
    }]);
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const updateEmployee = (index: number, field: keyof Employee, value: string) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    setEmployees(updated);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
    }
  };

  // Navigation
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Submit
  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!companyName.trim()) {
        setError('Company name is required');
        setLoading(false);
        return;
      }

      if (hrUsers.length === 0 || !hrUsers[0].name?.trim() || !hrUsers[0].email?.trim() || !hrUsers[0].password || !hrUsers[0].payrollNumber?.trim()) {
        setError('At least one HR user with name, email, password, and payroll number is required');
        setLoading(false);
        return;
      }

      const managerMissingPayroll = managers.some(m => (m.name || m.email || m.password || m.departments.length) && !m.payrollNumber?.trim());
      if (managerMissingPayroll) {
        setError('Payroll number is required for each manager');
        setLoading(false);
        return;
      }

      // Prepare employee data (filter out empty entries)
      const validEmployees = employees.filter(emp => 
        emp.name && emp.name.trim() && 
        emp.payrollNumber && emp.payrollNumber.trim() && 
        emp.nationalId && emp.nationalId.trim()
      );

      const validHrUsers = hrUsers
        .filter(hr => hr.name?.trim() && hr.email?.trim() && hr.password && hr.payrollNumber?.trim())
        .map(hr => ({
          ...hr,
          name: hr.name.trim(),
          email: hr.email.trim(),
          payrollNumber: hr.payrollNumber.trim(),
        }));

      const validManagers = managers
        .filter(m => m.name?.trim() && m.email?.trim() && m.password && m.payrollNumber?.trim())
        .map(m => ({
          ...m,
          name: m.name.trim(),
          email: m.email.trim(),
          payrollNumber: m.payrollNumber.trim(),
          departments: m.departments.filter(d => d.trim()),
        }));

      // Prepare data
      const onboardingData: OnboardingFormData = {
        companyName: companyName.trim(),
        companyDomain: companyDomain.trim(),
        departments: departments.filter(d => d.trim()),
        hrUsers: validHrUsers,
        managers: validManagers,
        employees: validEmployees,
      };

      // First create company
      const createResponse = await companyOnboardingService.onboardCompany(onboardingData);
      const companyId = createResponse.companyId;

      let successMessage = 'Company onboarded successfully!';
      
      // If Excel file is provided, upload it separately after company creation
      if (excelFile) {
        const uploadResponse = await companyOnboardingService.uploadEmployeesExcel(companyId, excelFile);

        const excelCount = uploadResponse.imported || 0;
        const manualCount = validEmployees.length;
        successMessage = `Company onboarded successfully! ${manualCount} employee(s) added manually${excelCount > 0 ? ` and ${excelCount} employee(s) imported from Excel` : ''}.`;
      } else if (validEmployees.length > 0) {
        successMessage = `Company onboarded successfully with ${validEmployees.length} employee(s)!`;
      }

      toast.success(successMessage);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to onboard company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    loading,
    error,
    companyName,
    setCompanyName,
    companyDomain,
    setCompanyDomain,
    departments,
    hrUsers,
    managers,
    employees,
    excelFile,
    showHRPasswords,
    showManagerPasswords,
    addDepartment,
    removeDepartment,
    updateDepartment,
    addHRUser,
    removeHRUser,
    updateHRUser,
    toggleHRPasswordVisibility,
    addManager,
    removeManager,
    updateManager,
    toggleManagerDepartment,
    toggleManagerPasswordVisibility,
    addEmployee,
    removeEmployee,
    updateEmployee,
    handleExcelUpload,
    nextStep,
    prevStep,
    handleSubmit,
  };
};