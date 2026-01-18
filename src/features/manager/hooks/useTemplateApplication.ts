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
    console.log('🔵 [useTemplateApplication] Fetching employees and departments');
    setLoading(true);
    try {
      const response = await api.get('/users/managers/employees-for-template');
      console.log('✅ [useTemplateApplication] Received data:', response.data);
      
      setEmployees(response.data.employees || []);
      setDepartments(response.data.departments || []);
      
      console.log('📊 [useTemplateApplication] State updated:', {
        employeesCount: response.data.employees?.length || 0,
        departmentsCount: response.data.departments?.length || 0,
      });
    } catch (error: any) {
      console.error('❌ [useTemplateApplication] Error fetching data:', error);
      toast.error(error.response?.data?.error || 'Failed to load employees');
      setEmployees([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (templateId: number) => {
    console.log('🚀 [useTemplateApplication] Opening modal for template:', templateId);
    setCurrentTemplateId(templateId);
    setIsModalOpen(true);
    await fetchEmployeesAndDepartments();
  };

  const closeModal = () => {
    console.log('🔴 [useTemplateApplication] Closing modal');
    setIsModalOpen(false);
    setCurrentTemplateId(null);
    setEmployees([]);
    setDepartments([]);
  };

  const handleApplyTemplate = async (selectedEmployeeIds: number[]) => {
    if (!currentTemplateId) {
      console.error('❌ [useTemplateApplication] No template selected');
      return;
    }

    console.log('📤 [useTemplateApplication] Applying template:', {
      templateId: currentTemplateId,
      employeeCount: selectedEmployeeIds.length,
      employeeIds: selectedEmployeeIds,
    });

    setApplying(true);
    try {
      const response = await api.post(`/templates/${currentTemplateId}/apply`, {
        employee_ids: selectedEmployeeIds,
      });

      console.log('✅ [useTemplateApplication] Template applied successfully:', response.data);

      const successCount = response.data.results?.success || selectedEmployeeIds.length;
      toast.success(`Template applied to ${successCount} employee${successCount !== 1 ? 's' : ''} successfully!`);
      
      closeModal();
    } catch (error: any) {
      console.error('❌ [useTemplateApplication] Error applying template:', error);
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
