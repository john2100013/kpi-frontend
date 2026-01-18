/**
 * useManagerKPISetting
 * 
 * Custom hook for managing KPI Setting form state and logic.
 * Handles complex form with draft management, period selection, and validation.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../hooks/useConfirm';
import type { User } from '../../../types';
import {
  getInitialRows,
  getMinRows,
  validateKPIForm,
  validateGoalWeights,
  getValidKPIRows,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage,
  type KPIRow,
} from './kpiSettingUtils';

interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
  field?: string;
  rowIndex?: number;
  onChange?: (value: string) => void;
}

interface UseManagerKPISettingReturn {
  // State
  employee: User | null;
  loading: boolean;
  saving: boolean;
  kpiRows: KPIRow[];
  period: 'quarterly' | 'yearly';
  quarter: string;
  year: number;
  meetingDate: Date | null;
  managerSignature: string;
  availablePeriods: any[];
  selectedPeriodSetting: any;
  textModal: TextModalState;
  confirmState: any;
  // Template mode state
  isTemplateMode: boolean;
  templateId: number | null;
  employees: any[];
  departments: any[];
  employeesLoading: boolean;
  selectedEmployeeIds: number[];
  
  // Actions
  setKpiRows: (rows: KPIRow[]) => void;
  setPeriod: (period: 'quarterly' | 'yearly') => void;
  setQuarter: (quarter: string) => void;
  setYear: (year: number) => void;
  setMeetingDate: (date: Date | null) => void;
  setManagerSignature: (signature: string) => void;
  setSelectedPeriodSetting: (setting: any) => void;
  setTextModal: (modal: TextModalState) => void;
  handleKpiChange: (index: number, field: string, value: string | boolean) => void; // Changed to accept boolean
  handleQualitativeToggle: (index: number, checked: boolean) => void;
  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;
  handleSaveDraft: () => void;
  handleSubmit: () => Promise<void>;
  handleBack: () => void;
  handleViewEmployeeKPIs: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
  getMinRowsForPeriod: () => number;
  // Template mode handlers
  handleSubmitToEmployees: (selectedEmployeeIds: number[]) => Promise<void>;
  handleEmployeeSelectionChange: (employeeIds: number[]) => void;
}

export const useManagerKPISetting = (): UseManagerKPISettingReturn => {
  console.log('🔵🔵🔵 [useManagerKPISetting] HOOK CALLED!');
  const { employeeId, templateId } = useParams<{ employeeId?: string; templateId?: string }>();
  console.log('🔵 [useManagerKPISetting] URL params:', { employeeId, templateId });
  console.log('🔵 [useManagerKPISetting] Current pathname:', window.location.pathname);
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  
  // Determine mode
  const isTemplateMode = !!templateId;
  console.log('🔵 [useManagerKPISetting] isTemplateMode:', isTemplateMode);
  console.log('🔵 [useManagerKPISetting] templateId raw:', templateId);
  console.log('🔵 [useManagerKPISetting] employeeId raw:', employeeId);
  
  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kpiRows, setKpiRows] = useState<KPIRow[]>(getInitialRows('quarterly'));
  const [period, setPeriod] = useState<'quarterly' | 'yearly'>('quarterly');
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [meetingDate, setMeetingDate] = useState<Date | null>(new Date());
  const [managerSignature, setManagerSignature] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [selectedPeriodSetting, setSelectedPeriodSetting] = useState<any>(null);
  const [textModal, setTextModal] = useState<TextModalState>({
    isOpen: false,
    title: '',
    value: '',
  });
  
  // Template mode state
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // Load template data or employee data based on mode
  useEffect(() => {
    console.log('🔵🔵 [useManagerKPISetting] useEffect triggered!');
    console.log('🔵 [useManagerKPISetting] isTemplateMode:', isTemplateMode);
    console.log('🔵 [useManagerKPISetting] templateId:', templateId);
    console.log('🔵 [useManagerKPISetting] employeeId:', employeeId);
    
    if (isTemplateMode && templateId) {
      console.log('✅ [useManagerKPISetting] TEMPLATE MODE - Loading template:', templateId);
      loadTemplate(parseInt(templateId));
      fetchEmployeesForTemplate();
      fetchAvailablePeriods();
    } else if (employeeId) {
      console.log('✅ [useManagerKPISetting] EMPLOYEE MODE - Loading employee:', employeeId);
      loadDraft();
      fetchEmployee();
      fetchAvailablePeriods();
    } else {
      console.warn('⚠️ [useManagerKPISetting] NO MODE DETECTED - no templateId or employeeId!');
      console.warn('⚠️ [useManagerKPISetting] This might cause redirect to homepage');
    }
  }, [employeeId, templateId, isTemplateMode]);

  // Auto-save draft whenever form data changes
  useEffect(() => {
    if (employeeId) {
      saveDraftToStorage(employeeId, {
        kpiRows,
        period,
        quarter,
        year,
        meetingDate,
        managerSignature,
        selectedPeriodSetting,
      });
    }
  }, [kpiRows, period, quarter, year, meetingDate, managerSignature, selectedPeriodSetting, employeeId]);

  const loadDraft = () => {
    if (!employeeId) return;
    
    const draftData = loadDraftFromStorage(employeeId);
    if (draftData) {
      console.log('Loading draft for employee:', employeeId, draftData);
      
      if (draftData.period) {
        setPeriod(draftData.period);
      }
      
      if (draftData.kpiRows && Array.isArray(draftData.kpiRows) && draftData.kpiRows.length > 0) {
        setKpiRows(draftData.kpiRows);
      } else if (draftData.period) {
        setKpiRows(getInitialRows(draftData.period));
      }
      
      if (draftData.quarter) {
        setQuarter(draftData.quarter);
      }
      if (draftData.year) {
        setYear(draftData.year);
      }
      if (draftData.meetingDate) {
        setMeetingDate(draftData.meetingDate);
      }
      if (draftData.managerSignature) {
        setManagerSignature(draftData.managerSignature);
      }
      if (draftData.selectedPeriodSetting) {
        setSelectedPeriodSetting(draftData.selectedPeriodSetting);
      }
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const response = await api.get('/settings/available-periods');
      setAvailablePeriods(response.data.periods || []);
      
      // Check if draft exists before setting defaults
      if (employeeId) {
        const draftData = loadDraftFromStorage(employeeId);
        if (draftData) {
          console.log('Draft exists, skipping default period settings');
          return;
        }
      }
      
      // Set default to first active quarterly period if available (only if no draft)
      const quarterlyPeriods = response.data.periods?.filter((p: any) => p.period_type === 'quarterly' && p.is_active) || [];
      if (quarterlyPeriods.length > 0) {
        const firstPeriod = quarterlyPeriods[0];
        setPeriod('quarterly');
        setQuarter(firstPeriod.quarter || 'Q1');
        setYear(firstPeriod.year);
        if (firstPeriod.start_date) {
          setMeetingDate(new Date(firstPeriod.start_date));
        }
        setSelectedPeriodSetting(firstPeriod);
      }
    } catch (error) {
      console.error('Error fetching available periods:', error);
    }
  };

  const fetchEmployee = async () => {
    if (!employeeId) return;
    
    try {
      const response = await api.get('/users/list');
      const users = response.data.data?.users || response.data.users || [];
      console.log('[fetchEmployee] Users response:', { users: Array.isArray(users), count: users.length });
      const employee = users.find((u: any) => u.id === parseInt(employeeId));
      if (employee) {
        setEmployee(employee);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiChange = (index: number, field: string, value: string | boolean) => {
    const updated = [...kpiRows];
    if (field === 'is_qualitative' && typeof value === 'boolean') {
      updated[index] = { ...updated[index], is_qualitative: value };
    } else if (typeof value === 'string') {
      updated[index] = { ...updated[index], [field]: value };
    }
    setKpiRows(updated);
  };

  const handleQualitativeToggle = (index: number, checked: boolean) => {
    const updated = [...kpiRows];
    updated[index] = { ...updated[index], is_qualitative: checked };
    setKpiRows(updated);
  };

  const handleAddRow = () => {
    const newRow: KPIRow = {
      title: '',
      description: '',
      current_performance_status: '',
      target_value: '',
      expected_completion_date: '',
      measure_unit: '',
      goal_weight: '',
      is_qualitative: false
    };
    setKpiRows([...kpiRows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    const minRows = getMinRows(period);
    if (kpiRows.length <= minRows) {
      toast.warning(`You must have at least ${minRows} KPI items for ${period} KPIs`);
      return;
    }
    const updated = kpiRows.filter((_, i) => i !== index);
    setKpiRows(updated);
  };

  const handleSaveDraft = () => {
    if (!employeeId) return;
    saveDraftToStorage(employeeId, {
      kpiRows,
      period,
      quarter,
      year,
      meetingDate,
      managerSignature,
      selectedPeriodSetting,
    });
    toast.success('Draft saved successfully! Your progress has been saved.');
  };

  const handleSubmit = async () => {
    // Basic validation
    const basicValidation = validateKPIForm(kpiRows, period, managerSignature);
    if (!basicValidation.isValid) {
      toast.error(basicValidation.error!);
      return;
    }

    // Goal weights validation
    const weightValidation = validateGoalWeights(kpiRows);
    if (!weightValidation.isValid) {
      toast.error(weightValidation.error!);
      return;
    }

    // Ask for confirmation if no goal weights
    if (weightValidation.needsConfirmation) {
      const confirmProceed = await confirm({
        title: 'Continue without goal weights?',
        message: 'Do you want to continue without entering goal weight?',
        variant: 'warning',
        confirmText: 'Continue',
        cancelText: 'Cancel'
      });
      if (!confirmProceed) {
        return;
      }
    }

    setSaving(true);
    try {
      const validKpiRows = getValidKPIRows(kpiRows);
      
      await api.post('/kpis/create', {
        employee_id: parseInt(employeeId!),
        period,
        quarter: period === 'quarterly' ? quarter : undefined,
        year,
        meeting_date: meetingDate?.toISOString().split('T')[0],
        manager_signature: managerSignature,
        kpi_items: validKpiRows.map(kpi => ({
          title: kpi.title,
          description: kpi.description,
          current_performance_status: kpi.current_performance_status,
          target_value: kpi.target_value,
          expected_completion_date: kpi.expected_completion_date || null,
          measure_unit: kpi.measure_unit,
          goal_weight: kpi.goal_weight,
          is_qualitative: kpi.is_qualitative || false,
        })),
      });

      // Clear draft after successful submission
      if (employeeId) {
        clearDraftFromStorage(employeeId);
      }

      toast.success('KPI form submitted successfully!');
      navigate('/manager/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit KPI form');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewEmployeeKPIs = () => {
    navigate(`/manager/employee-kpis/${employeeId}`);
  };

  const getMinRowsForPeriod = () => {
    return getMinRows(period);
  };

  // Template mode functions
  const loadTemplate = async (tid: number) => {
    console.log('🔵 [loadTemplate] Fetching template:', tid);
    try {
      const response = await api.get(`/templates/${tid}`);
      const template = response.data.data || response.data;
      
      console.log('✅ [loadTemplate] Template loaded:', template);
      
      // Auto-populate form with template data
      if (template.period) {
        setPeriod(template.period);
      }
      if (template.quarter) {
        setQuarter(template.quarter);
      }
      if (template.year) {
        setYear(template.year);
      }
      
      // Load template items into kpiRows
      if (template.items && Array.isArray(template.items)) {
        const templateRows: KPIRow[] = template.items.map((item: any) => ({
          title: item.title || '',
          description: item.description || '',
          current_performance_status: item.current_performance_status || '',
          target_value: item.target_value || '',
          expected_completion_date: item.expected_completion_date || '',
          measure_unit: item.measure_unit || '',
          goal_weight: item.goal_weight || '',
          is_qualitative: item.is_qualitative || false,
        }));
        setKpiRows(templateRows);
        console.log('✅ [loadTemplate] Loaded KPI items:', templateRows.length);
      }
    } catch (error) {
      console.error('❌ [loadTemplate] Error:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesForTemplate = async () => {
    console.log('🔵 [fetchEmployeesForTemplate] Fetching employees and departments');
    setEmployeesLoading(true);
    try {
      const response = await api.get('/users/managers/employees-for-template');
      console.log('✅ [fetchEmployeesForTemplate] Response:', response.data);
      
      setEmployees(response.data.employees || []);
      setDepartments(response.data.departments || []);
      
      console.log('✅ [fetchEmployeesForTemplate] Loaded employees:', response.data.employees?.length, 'departments:', response.data.departments?.length);
    } catch (error) {
      console.error('❌ [fetchEmployeesForTemplate] Error:', error);
      toast.error('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleSubmitToEmployees = async (selectedEmployeeIds: number[]) => {
    console.log('🔵 [handleSubmitToEmployees] Selected employees:', selectedEmployeeIds);
    
    if (selectedEmployeeIds.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    // Basic validation
    const basicValidation = validateKPIForm(kpiRows, period, managerSignature);
    if (!basicValidation.isValid) {
      toast.error(basicValidation.error!);
      return;
    }

    // Goal weights validation
    const weightValidation = validateGoalWeights(kpiRows);
    if (!weightValidation.isValid) {
      toast.error(weightValidation.error!);
      return;
    }

    // Ask for confirmation if no goal weights
    if (weightValidation.needsConfirmation) {
      const confirmProceed = await confirm({
        title: 'Continue without goal weights?',
        message: 'Do you want to continue without entering goal weight?',
        variant: 'warning',
        confirmText: 'Continue',
        cancelText: 'Cancel'
      });
      if (!confirmProceed) {
        return;
      }
    }

    setSaving(true);
    try {
      const validKpiRows = getValidKPIRows(kpiRows);
      
      // Send KPIs to all selected employees
      const promises = selectedEmployeeIds.map(empId =>
        api.post('/kpis/create', {
          employee_id: empId,
          period,
          quarter: period === 'quarterly' ? quarter : undefined,
          year,
          meeting_date: meetingDate?.toISOString().split('T')[0],
          manager_signature: managerSignature,
          kpi_items: validKpiRows.map(kpi => ({
            title: kpi.title,
            description: kpi.description,
            current_performance_status: kpi.current_performance_status,
            target_value: kpi.target_value,
            expected_completion_date: kpi.expected_completion_date || null,
            measure_unit: kpi.measure_unit,
            goal_weight: kpi.goal_weight,
            is_qualitative: kpi.is_qualitative || false,
          })),
        })
      );

      await Promise.all(promises);

      toast.success(`KPI successfully sent to ${selectedEmployeeIds.length} employee(s)!`);
      navigate('/manager/dashboard');
    } catch (error: any) {
      console.error('❌ [handleSubmitToEmployees] Error:', error);
      toast.error(error.response?.data?.error || 'Failed to send KPIs to employees');
    } finally {
      setSaving(false);
    }
  };

  const handleEmployeeSelectionChange = (employeeIds: number[]) => {
    console.log('🔵 [handleEmployeeSelectionChange] Employee selection changed:', employeeIds);
    setSelectedEmployeeIds(employeeIds);
  };

  return {
    // State
    employee,
    loading,
    saving,
    kpiRows,
    period,
    quarter,
    year,
    meetingDate,
    managerSignature,
    availablePeriods,
    selectedPeriodSetting,
    textModal,
    confirmState,
    // Template mode state
    isTemplateMode,
    templateId: templateId ? parseInt(templateId) : null,
    employees,
    departments,
    employeesLoading,
    selectedEmployeeIds,
    
    // Actions
    setKpiRows,
    setPeriod,
    setQuarter,
    setYear,
    setMeetingDate,
    setManagerSignature,
    setSelectedPeriodSetting,
    setTextModal,
    handleKpiChange, // Now accepts string | boolean
    handleQualitativeToggle,
    handleAddRow,
    handleRemoveRow,
    handleSaveDraft,
    handleSubmit,
    handleBack,
    handleViewEmployeeKPIs,
    handleConfirm,
    handleCancel,
    getMinRowsForPeriod,
    // Template mode handlers
    handleSubmitToEmployees,
    handleEmployeeSelectionChange,
  };
};
