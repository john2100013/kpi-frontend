import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface TemplateData {
  id: number;
  template_name: string;
  description: string;
  period: 'quarterly' | 'annual';
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
  selectedEmployees: number[];
  meetingDate: Date | null;
  managerSignature: string;
  loading: boolean;
  submitting: boolean;
  handleEmployeeSelect: (employeeId: number) => void;
  handleSelectAll: () => void;
  handleMeetingDateChange: (date: Date | null) => void;
  handleSignatureChange: (signature: string) => void;
  handleSubmit: () => Promise<void>;
  handleBack: () => void;
}

export const useApplyKPITemplate = (): UseApplyKPITemplateReturn => {
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

  useEffect(() => {
    if (templateId) {
      fetchTemplateAndEmployees();
    }
  }, [templateId]);

  const fetchTemplateAndEmployees = async () => {
    try {
      setLoading(true);
      
      // Fetch template details
      const templateResponse = await api.get(`/kpi-templates/${templateId}`);
      setTemplate(templateResponse.data.template);

      // Fetch employees
      const employeesResponse = await api.get('/users/list');
      const users = employeesResponse.data.data || employeesResponse.data.users || [];
      const employees = users.filter((u: any) => u.role_id !== 1 && u.role_id !== 2 && u.role_id !== 3);
      setEmployees(employees);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.error || 'Failed to load template');
      navigate('/manager/kpi-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((emp) => emp.id));
    }
  };

  const handleMeetingDateChange = (date: Date | null) => {
    setMeetingDate(date);
  };

  const handleSignatureChange = (signature: string) => {
    setManagerSignature(signature);
  };

  const handleSubmit = async () => {
    // Validation
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
      await api.post('/kpis/apply-template', {
        template_id: parseInt(templateId!),
        employee_ids: selectedEmployees,
        meeting_date: meetingDate.toISOString().split('T')[0],
        manager_signature: managerSignature,
      });

      toast.success(`KPIs assigned successfully to ${selectedEmployees.length} employee(s)!`);
      navigate('/manager/kpi-templates');
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast.error(error.response?.data?.error || 'Failed to apply template');
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
    selectedEmployees,
    meetingDate,
    managerSignature,
    loading,
    submitting,
    handleEmployeeSelect,
    handleSelectAll,
    handleMeetingDateChange,
    handleSignatureChange,
    handleSubmit,
    handleBack,
  };
};