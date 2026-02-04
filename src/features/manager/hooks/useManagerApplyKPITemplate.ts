/**
 * useManagerApplyKPITemplate
 * 
 * Custom hook for applying KPI templates to employees.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface TemplateData {
  id: number;
  template_name: string;
  description: string;
  period: 'quarterly' | 'annual';
  review_year: string;
  quarter?: number | null;
  item_count: number;
  items: any[];
}

interface Employee {
  id: number;
  name: string;
  email: string;
  employee_number: string;
  department: string;
  position: string;
}

interface UseApplyKPITemplateReturn {
  template: TemplateData | null;
  employees: Employee[];
  filteredEmployees: Employee[];
  selectedEmployees: number[];
  meetingDate: Date | null;
  managerSignature: string;
  loading: boolean;
  submitting: boolean;
  searchQuery: string;
  selectedDepartment: string;
  departments: string[];
  handleEmployeeSelect: (employeeId: number) => void;
  handleSelectAll: () => void;
  handleMeetingDateChange: (date: Date | null) => void;
  handleSignatureChange: (signature: string) => void;
  handleSubmit: () => Promise<void>;
  handleBack: () => void;
  handleSearchChange: (query: string) => void;
  handleDepartmentChange: (department: string) => void;
}

export const useManagerApplyKPITemplate = (): UseApplyKPITemplateReturn => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [meetingDate, setMeetingDate] = useState<Date | null>(new Date());
  const [managerSignature, setManagerSignature] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    if (templateId) {
      fetchTemplateAndEmployees();
    } else {
      setLoading(false);
    }
  }, [templateId]);

  const fetchTemplateAndEmployees = async () => {
    try {
      setLoading(true);
      
      const templateResponse = await api.get(`/kpi-templates/${templateId}`);
      const fetchedTemplate = templateResponse.data.template;
     
      
      setTemplate(fetchedTemplate);

      const employeesResponse = await api.get('/users/list');
      const users = employeesResponse.data.data || employeesResponse.data.users || [];
      const fetchedEmployees = users.filter((u: any) => u.role_id !== 1 && u.role_id !== 2 && u.role_id !== 3);
      setEmployees(fetchedEmployees);
      
    } catch (error: any) {
    
      toast.error(error.response?.data?.error || 'Failed to load template');
      navigate('/manager/kpi-templates');
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const depts = Array.from(new Set(employees.map(emp => emp.department))).filter(Boolean);
    return depts.sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.employee_number.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [employees, selectedDepartment, searchQuery]);

  const handleEmployeeSelect = (employeeId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredEmployees.map(emp => emp.id);
    const allFilteredSelected = filteredIds.every(id => selectedEmployees.includes(id));

    if (allFilteredSelected) {
      setSelectedEmployees(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedEmployees(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };

  const handleMeetingDateChange = (date: Date | null) => {
    setMeetingDate(date);
  };

  const handleSignatureChange = (signature: string) => {
    setManagerSignature(signature);
  };

  const handleSubmit = async () => {
    
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    if (!meetingDate) {
      toast.error('Please select a meeting date');
      return;
    }

    if (!managerSignature || managerSignature.trim() === '') {
      toast.error('Manager signature is required');
      return;
    }

    setSubmitting(true);

    try {
      // Extract year from review_year string
      const yearMatch = template?.review_year?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      const payload = {
        template_id: parseInt(templateId!),
        employee_ids: selectedEmployees,
        meeting_date: meetingDate.toISOString().split('T')[0],
        manager_signature: managerSignature,
        period: template?.period,
        year: year,
        quarter: template?.quarter || null,
      };
      
      
      const response = await api.post(`/kpi-templates/${templateId}/apply`, payload);

      toast.success(`KPIs assigned successfully to ${selectedEmployees.length} employee(s)!`);
      navigate('/manager/kpi-templates');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to apply template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/manager/kpi-templates');
  };

  return {
    template,
    employees,
    filteredEmployees,
    selectedEmployees,
    meetingDate,
    managerSignature,
    loading,
    submitting,
    searchQuery,
    selectedDepartment,
    departments,
    handleEmployeeSelect,
    handleSelectAll,
    handleMeetingDateChange,
    handleSignatureChange,
    handleSubmit,
    handleBack,
    handleSearchChange,
    handleDepartmentChange,
  };
};
