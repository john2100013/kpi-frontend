/**
 * useTemplateApplication Hook
 * 
 * Manages employee selection modal and template application logic
 */

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import type { Employee, Department } from '../components/EmployeeSelectionModal';

interface UseTemplateApplicationReturn {
  isModalOpen: boolean;
  employees: Employee[];
  departments: Department[];
  loading: boolean;
  applying: boolean;
  openModal: (templateId: number) => void;
  closeModal: () => void;
  handleApplyTemplate: (selectedEmployeeIds: number[]) => Promise<void>;
}

export const useTemplateApplication = (): UseTemplateApplicationReturn => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);

  const fetchEmployeesAndDepartments = async () => {

    setLoading(true);
    try {
      const response = await api.get('/users/managers/employees-for-template');
      
      setEmployees(response.data.employees || []);
      setDepartments(response.data.departments || []);
    
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load employees');
      setEmployees([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (templateId: number) => {
    setCurrentTemplateId(templateId);
    setIsModalOpen(true);
    await fetchEmployeesAndDepartments();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTemplateId(null);
    setEmployees([]);
    setDepartments([]);
  };

  const handleApplyTemplate = async (selectedEmployeeIds: number[]) => {
    if (!currentTemplateId) {
      toast.error('No template selected. Please select a template to continue.');
      return;
    }

   

    setApplying(true);
    try {
      const response = await api.post(`/templates/${currentTemplateId}/apply`, {
        employee_ids: selectedEmployeeIds,
      });


      const successCount = response.data.results?.success || selectedEmployeeIds.length;
      toast.success(`Template applied to ${successCount} employee${successCount !== 1 ? 's' : ''} successfully!`);
      
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  return {
    isModalOpen,
    employees,
    departments,
    loading,
    applying,
    openModal,
    closeModal,
    handleApplyTemplate,
  };
};
