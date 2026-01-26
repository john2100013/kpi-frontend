import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { departmentService, Department } from '../services/departmentService';
import { userManagementService } from '../services/userManagementService';

export const useDepartmentManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddEmployeesModal, setShowAddEmployeesModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchDepartments();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await userManagementService.fetchCompanies();
      setCompanies(data);

      if (data.length > 0) {
        setSelectedCompany(data[0].id.toString());
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!selectedCompany) return;

    try {

      const data = await departmentService.fetchDepartments(parseInt(selectedCompany));

      setDepartments(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch departments');
    }
  };

  const handleAddDepartment = async (name: string) => {
    try {
      const companyId = parseInt(selectedCompany);

      await departmentService.createDepartment(name, companyId);

      toast.success('Department created successfully');
      setShowAddModal(false);
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create department');
      throw error;
    }
  };

  const handleAddEmployees = async (employeeIds: number[]) => {
    if (!selectedDepartment) return;

    try {
      await departmentService.addEmployeesToDepartment(employeeIds, selectedDepartment.id);
      toast.success(`${employeeIds.length} employee(s) added to department successfully`);
      setShowAddEmployeesModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add employees to department');
      throw error;
    }
  };

  const handleDeleteDepartment = async (departmentId: number, departmentName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await departmentService.deleteDepartment(departmentId);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete department');
    }
  };

  const handleBack = () => {
    navigate('/super-admin/dashboard');
  };

  return {
    companies,
    departments,
    selectedCompany,
    setSelectedCompany,
    loading,
    showAddModal,
    setShowAddModal,
    showAddEmployeesModal,
    setShowAddEmployeesModal,
    selectedDepartment,
    setSelectedDepartment,
    handleAddDepartment,
    handleAddEmployees,
    handleDeleteDepartment,
    handleBack,
  };
};
