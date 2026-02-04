/**
 * useManagerKPITemplateForm
 * 
 * Custom hook for managing KPI Template Form state and logic.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../hooks/useConfirm';
import { KPIItem, getInitialKPIItems, calculateTotalGoalWeight, getValidKPIItems, validateTemplateForm } from '../utils/kpiTemplateFormUtils';

export type { KPIItem } from '../utils/kpiTemplateFormUtils';

interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
  field?: string;
  rowIndex?: number;
  onChange?: (value: string) => void;
}

interface Department {
  id: number;
  name: string;
  enable_template_titles: number;
}

interface TemplateTitle {
  id: number;
  title: string;
  description: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface UseManagerKPITemplateFormReturn {
  isEditMode: boolean;
  loading: boolean;
  saving: boolean;
  templateName: string;
  setTemplateName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  period: 'quarterly' | 'yearly';
  setPeriod: (period: 'quarterly' | 'yearly') => void;
  availablePeriods: any[];
  selectedPeriodSetting: any;
  quarter: string;
  setQuarter: (quarter: string) => void;
  year: number;
  setYear: (year: number) => void;
  // NEW: Department and Template Titles
  departments: Department[];
  selectedDepartmentId: number | null;
  setSelectedDepartmentId: (id: number | null) => void;
  useTemplateDropdown: boolean;
  setUseTemplateDropdown: (use: boolean) => void;
  templateTitles: TemplateTitle[];
  isDepartmentTemplateEnabled: boolean;
  // END NEW
  kpiItems: KPIItem[];
  setKpiItems: (items: KPIItem[]) => void;
  textModal: TextModalState;
  setTextModal: (modal: TextModalState) => void;
  confirmState: any;
  totalGoalWeight: number;
  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;
  updateKPIItem: (index: number, field: string, value: string | boolean | number) => void;
  handleQualitativeToggle: (index: number, isQualitative: boolean) => void;
  openTextModal: (title: string, value: string, field: keyof KPIItem, rowIndex: number) => void;
  closeTextModal: () => void;
  handlePeriodChange: (newPeriod: 'quarterly' | 'yearly') => void;
  handleQuarterChange: (selectedQuarter: string) => void;
  handleYearChange: (selectedYear: number) => void;
  handleSubmit: () => Promise<void>;
  handleBack: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useManagerKPITemplateForm = (): UseManagerKPITemplateFormReturn => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const isEditMode = !!id;

 

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<'quarterly' | 'yearly'>('quarterly');
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [selectedPeriodSetting, setSelectedPeriodSetting] = useState<any>(null);
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(new Date().getFullYear());
  
  // NEW: Department and Template Titles
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [useTemplateDropdown, setUseTemplateDropdown] = useState(false);
  const [templateTitles, setTemplateTitles] = useState<TemplateTitle[]>([]);
  const [isDepartmentTemplateEnabled, setIsDepartmentTemplateEnabled] = useState(false);
  // END NEW
  
  const [kpiItems, setKpiItems] = useState<KPIItem[]>(getInitialKPIItems());

  const [textModal, setTextModal] = useState<TextModalState>({
    isOpen: false,
    title: '',
    value: '',
  });

 

  useEffect(() => {

    if (isEditMode) {

      fetchTemplate();
    }
    fetchAvailablePeriods();
    fetchDepartments();
  }, [id]);

  // Fetch template titles when department changes or useTemplateDropdown toggles
  useEffect(() => {
   
    
    if (selectedDepartmentId && useTemplateDropdown) {
      fetchTemplateTitles(selectedDepartmentId);
    } else {
      setTemplateTitles([]);
      setIsDepartmentTemplateEnabled(false);
    }
  }, [selectedDepartmentId, useTemplateDropdown]);

  const fetchAvailablePeriods = async () => {
    try {
      const response = await api.get('/settings/period-settings');
      setAvailablePeriods(response.data.settings || []);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch periods.');
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const depts = response.data?.data?.departments || response.data?.departments || [];
     
      setDepartments(depts);
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch departments.');
      }
    }
  };

  const fetchTemplateTitles = async (departmentId: number) => {
    try {
      const response = await api.get(`/kpi-template-titles/department/${departmentId}`);
      const titles = response.data.titles || [];
      const enabled = response.data.enabled || false;
      
   
      
      setTemplateTitles(titles);
      setIsDepartmentTemplateEnabled(enabled);
      
      if (!enabled) {
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error('Template titles are not enabled for this department.');
        }
        toast.warning('Template titles are not enabled for this department');
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Could not fetch template titles.');
      }
      setTemplateTitles([]);
      setIsDepartmentTemplateEnabled(false);
    }
  };

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/templates/${id}`);
      
      const template = response.data.template;
      const items = response.data.items; // FIX: Items are at response.data.items, not template.items
      
      
      setTemplateName(template.template_name);
      setDescription(template.description || '');
      setPeriod(template.period === 'annual' ? 'yearly' : template.period);
      
      
      // NEW: Load department_id and use_template_titles
      if (template.department_id) {

        setSelectedDepartmentId(template.department_id);
      }
      
      if (template.use_template_titles === 1) {

        setUseTemplateDropdown(true);
      }
      
      // Load template titles from response if available
      if (response.data.templateTitles) {

        setTemplateTitles(response.data.templateTitles);
        setIsDepartmentTemplateEnabled(response.data.isDepartmentTemplateEnabled || false);
      }
      // END NEW
      
      if (items && items.length > 0) {
        const mappedItems = items.map((item: any, index: number) => {
        
          return {
            title: item.title || '',
            description: item.description || '',
            current_performance_status: item.current_performance_status || '',
            target_value: item.target_value || '',
            expected_completion_date: item.expected_completion_date || '',
            measure_unit: item.measure_unit || '',
            goal_weight: item.goal_weight || '',
            is_qualitative: item.is_qualitative || false,
            exclude_from_calculation: item.exclude_from_calculation || 0,
          };
        });
        setKpiItems(mappedItems);
      } else {
      }
    } catch (error) {
      toast.error('Failed to load template');
      navigate('/manager/kpi-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setKpiItems([
      ...kpiItems,
      {
        title: '',
        description: '',
        current_performance_status: '',
        target_value: '',
        expected_completion_date: '',
        measure_unit: '',
        goal_weight: '',
        is_qualitative: false,
        exclude_from_calculation: 0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (kpiItems.length <= 1) {
      toast.warning('You must have at least one KPI item');
      return;
    }
    setKpiItems(kpiItems.filter((_, i) => i !== index));
  };

  // Handle string, boolean, and number values
  const updateKPIItem = (index: number, field: string, value: string | boolean | number) => {
    const updated = [...kpiItems];
    if (field === 'is_qualitative' && typeof value === 'boolean') {
      updated[index] = { 
        ...updated[index], 
        is_qualitative: value,
        // Clear quantitative fields when switching to qualitative
        ...(value ? {
          target_value: '',
          measure_unit: '',
          expected_completion_date: '',
          goal_weight: ''
        } : {})
      };
    } else if (field === 'exclude_from_calculation' && typeof value === 'number') {
      updated[index] = { ...updated[index], exclude_from_calculation: value };
    } else if (typeof value === 'string') {
      updated[index] = { ...updated[index], [field]: value };
    }
    setKpiItems(updated);
  };

  // Separate toggle handler for clarity
  const handleQualitativeToggle = (index: number, isQualitative: boolean) => {
    updateKPIItem(index, 'is_qualitative', isQualitative);
  };

  const totalGoalWeight = calculateTotalGoalWeight(kpiItems);

  const openTextModal = (
    title: string,
    value: string,
    field: keyof KPIItem,
    rowIndex: number
  ) => {
    setTextModal({
      isOpen: true,
      title,
      value,
      field,
      rowIndex,
      onChange: (newValue: string) => {
        updateKPIItem(rowIndex, field, newValue);
      },
    });
  };

  const closeTextModal = () => {
    setTextModal({
      isOpen: false,
      title: '',
      value: '',
    });
  };

  const handlePeriodChange = (newPeriod: 'quarterly' | 'yearly') => {
    setPeriod(newPeriod);
    
    const backendPeriodType = newPeriod; // Use the same value - no mapping needed
    const periodsOfType = availablePeriods.filter((p: any) => p.period_type === backendPeriodType && p.is_active);
    if (periodsOfType.length > 0) {
      const firstPeriod = periodsOfType[0];
      if (newPeriod === 'quarterly') {
        setQuarter(firstPeriod.quarter || 'Q1');
      }
      setYear(firstPeriod.year);
      setSelectedPeriodSetting(firstPeriod);
    }
  };

  const handleQuarterChange = (selectedQuarter: string) => {
    setQuarter(selectedQuarter);
    
    const periodSetting = availablePeriods.find(
      (p: any) => p.period_type === 'quarterly' && 
                  p.quarter === selectedQuarter && 
                  p.year === year &&
                  p.is_active
    );
    
    if (periodSetting) {
      setSelectedPeriodSetting(periodSetting);
    }
  };

  const handleYearChange = (selectedYear: number) => {
    setYear(selectedYear);
    
    const periodSetting = availablePeriods.find(
      (p: any) => p.period_type === 'yearly' && 
                  p.year === selectedYear &&
                  p.is_active
    );
    
    if (periodSetting) {
      setSelectedPeriodSetting(periodSetting);
    }
  };

const handleSubmit = async () => {
  const validItems = getValidKPIItems(kpiItems);
  const validation = validateTemplateForm(templateName, validItems, totalGoalWeight);
  
  if (!validation.valid) {
    toast.error(validation.error || 'Validation failed');
    return;
  }

    // Ask for confirmation if no goal weights (same as KPI Setting)
  if (validation.needsConfirmation) {
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
    const payload = {
      template_name: templateName,
      description,
      period: period === 'yearly' ? 'annual' : period,
      period_setting_id: selectedPeriodSetting?.id,
      department_id: selectedDepartmentId,
      use_template_titles: useTemplateDropdown ? 1 : 0,
      items: validItems.map(item => ({
        title: item.title,
        description: item.description,
        current_performance_status: item.current_performance_status,
        target_value: item.target_value,
        expected_completion_date: item.expected_completion_date || null,
        measure_unit: item.measure_unit,
        goal_weight: item.goal_weight,
        is_qualitative: item.is_qualitative || false,
        exclude_from_calculation: item.exclude_from_calculation || 0,
      })),
    };

    if (isEditMode) {
      await api.put(`/templates/${id}`, payload);
      toast.success('Template updated successfully!');
    } else {
      await api.post('/templates', payload);
      toast.success('Template created successfully!');
    }

    navigate('/manager/kpi-templates');
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to save template');
  } finally {
    setSaving(false);
  }
};

  const handleBack = () => {
    navigate('/manager/kpi-templates');
  };

  return {
    isEditMode,
    loading,
    saving,
    templateName,
    setTemplateName,
    description,
    setDescription,
    period,
    setPeriod,
    availablePeriods,
    selectedPeriodSetting,
    quarter,
    setQuarter,
    year,
    setYear,
    // NEW: Department and Template Titles
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    useTemplateDropdown,
    setUseTemplateDropdown,
    templateTitles,
    isDepartmentTemplateEnabled,
    // END NEW
    kpiItems,
    setKpiItems,
    textModal,
    setTextModal,
    confirmState,
    totalGoalWeight,
    handleAddRow,
    handleRemoveRow,
    updateKPIItem,
    handleQualitativeToggle,
    openTextModal,
    closeTextModal,
    handlePeriodChange,
    handleQuarterChange,
    handleYearChange,
    handleSubmit,
    handleBack,
    handleConfirm,
    handleCancel,
  };
};