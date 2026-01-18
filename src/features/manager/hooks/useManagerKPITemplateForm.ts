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
  kpiItems: KPIItem[];
  setKpiItems: (items: KPIItem[]) => void;
  textModal: TextModalState;
  setTextModal: (modal: TextModalState) => void;
  confirmState: any;
  totalGoalWeight: number;
  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;
  updateKPIItem: (index: number, field: string, value: string | boolean) => void;
  handleQualitativeToggle: (index: number, isQualitative: boolean) => void;  // Added
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
  }, [id]);

  const fetchAvailablePeriods = async () => {
    try {
      const response = await api.get('/settings/period-settings');
      setAvailablePeriods(response.data.settings || []);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchTemplate = async () => {
    try {
      console.log('📥 [useManagerKPITemplateForm] Fetching template:', id);
      const response = await api.get(`/templates/${id}`);
      console.log('✅ [useManagerKPITemplateForm] Template fetched:', response.data);
      const template = response.data.template;
      
      setTemplateName(template.template_name);
      setDescription(template.description || '');
      setPeriod(template.period === 'annual' ? 'yearly' : template.period);
      
      if (template.items && template.items.length > 0) {
        setKpiItems(template.items.map((item: any) => ({
          title: item.title || '',
          description: item.description || '',
          current_performance_status: item.current_performance_status || '',
          target_value: item.target_value || '',
          expected_completion_date: item.expected_completion_date || '',
          measure_unit: item.measure_unit || '',
          goal_weight: item.goal_weight || '',
          is_qualitative: item.is_qualitative || false,  // Load from backend
        })));
      }
    } catch (error) {
      console.error('Error fetching template:', error);
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

  // Handle both string and boolean values
  const updateKPIItem = (index: number, field: string, value: string | boolean) => {
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
        items: validItems.map(item => ({
          title: item.title,
          description: item.description,
          current_performance_status: item.current_performance_status,
          target_value: item.target_value,
          expected_completion_date: item.expected_completion_date || null,
          measure_unit: item.measure_unit,
          goal_weight: item.goal_weight,
          is_qualitative: item.is_qualitative || false,  // Send to backend
        })),
      };

      console.log('📤 [Template Submit] Payload:', payload);
      console.log('📤 [Template Submit] IsEditMode:', isEditMode);
      console.log('📤 [Template Submit] Template ID:', id);

      if (isEditMode) {
        console.log('📤 [Template Submit] PUT /templates/' + id);
        await api.put(`/templates/${id}`, payload);
        toast.success('Template updated successfully!');
      } else {
        console.log('📤 [Template Submit] POST /templates');
        await api.post('/templates', payload);
        toast.success('Template created successfully!');
      }

      navigate('/manager/kpi-templates');
    } catch (error: any) {
      console.error('❌ [Template Submit] Error saving template:', error);
      console.error('❌ [Template Submit] Error response:', error.response);
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
    kpiItems,
    setKpiItems,
    textModal,
    setTextModal,
    confirmState,
    totalGoalWeight,
    handleAddRow,
    handleRemoveRow,
    updateKPIItem,
    handleQualitativeToggle,  // Added
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