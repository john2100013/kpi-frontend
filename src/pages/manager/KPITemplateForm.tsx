import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2, FiAlignLeft } from 'react-icons/fi';
import TextModal from '../../components/TextModal';
import DatePicker from '../../components/DatePicker';

interface KPIItem {
  title: string;
  description: string;
  current_performance_status: string;
  target_value: string;
  expected_completion_date: string;
  measure_unit: string;
  goal_weight: string;
}

const KPITemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<'quarterly' | 'annual'>('quarterly');
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [selectedPeriodSetting, setSelectedPeriodSetting] = useState<any>(null);
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [kpiItems, setKpiItems] = useState<KPIItem[]>([
    {
      title: '',
      description: '',
      current_performance_status: '',
      target_value: '',
      expected_completion_date: '',
      measure_unit: '',
      goal_weight: '',
    },
    {
      title: '',
      description: '',
      current_performance_status: '',
      target_value: '',
      expected_completion_date: '',
      measure_unit: '',
      goal_weight: '',
    },
    {
      title: '',
      description: '',
      current_performance_status: '',
      target_value: '',
      expected_completion_date: '',
      measure_unit: '',
      goal_weight: '',
    },
  ]);

  const [textModal, setTextModal] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    field?: string;
    rowIndex?: number;
    onChange?: (value: string) => void;
  }>({
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
      const response = await api.get(`/kpi-templates/${id}`);
      const template = response.data.template;
      
      setTemplateName(template.template_name);
      setDescription(template.description || '');
      setPeriod(template.period);
      
      if (template.items && template.items.length > 0) {
        setKpiItems(template.items.map((item: any) => ({
          title: item.title || '',
          description: item.description || '',
          current_performance_status: item.current_performance_status || '',
          target_value: item.target_value || '',
          expected_completion_date: item.expected_completion_date || '',
          measure_unit: item.measure_unit || '',
          goal_weight: item.goal_weight || '',
        })));
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Failed to load template');
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
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (kpiItems.length <= 1) {
      alert('You must have at least one KPI item');
      return;
    }
    setKpiItems(kpiItems.filter((_, i) => i !== index));
  };

  const updateKPIItem = (index: number, field: keyof KPIItem, value: string) => {
    const updated = [...kpiItems];
    updated[index][field] = value;
    setKpiItems(updated);
  };

  const calculateTotalGoalWeight = (): number => {
    return kpiItems.reduce((total, item) => {
      const weight = parseFloat(item.goal_weight) || 0;
      return total + weight;
    }, 0);
  };

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

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Filter out empty items
    const validItems = kpiItems.filter(item => item.title.trim());

    // Validate total goal weight equals 100%
    const totalWeight = calculateTotalGoalWeight();
    if (totalWeight !== 100) {
      alert(`Total Goal Weight must equal 100%. Current total is ${totalWeight}%`);
      return;
    }
    
    if (validItems.length === 0) {
      alert('Please add at least one KPI item with a title');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        template_name: templateName,
        description,
        period,
        items: validItems,
      };

      if (isEditMode) {
        await api.put(`/kpi-templates/${id}`, payload);
        alert('Template updated successfully!');
      } else {
        await api.post('/kpi-templates', payload);
        alert('Template created successfully!');
      }

      navigate('/manager/kpi-templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading template...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/manager/kpi-templates')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Template' : 'Create KPI Template'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update your KPI template' : 'Create a reusable KPI template'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <FiSave className="text-lg" />
          <span>{saving ? 'Saving...' : isEditMode ? 'Update Template' : 'Create Template'}</span>
        </button>
      </div>

      {/* Template Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Sales Team Q1 Template"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KPI Type *
            </label>
            <select
              value={period}
              onChange={(e) => {
                const newPeriod = e.target.value as 'quarterly' | 'annual';
                setPeriod(newPeriod);
                
                // Find first available period of selected type
                const periodsOfType = availablePeriods.filter((p: any) => p.period_type === newPeriod && p.is_active);
                if (periodsOfType.length > 0) {
                  const firstPeriod = periodsOfType[0];
                  if (newPeriod === 'quarterly') {
                    setQuarter(firstPeriod.quarter || 'Q1');
                  }
                  setYear(firstPeriod.year);
                  setSelectedPeriodSetting(firstPeriod);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the evaluation period for this KPI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {period === 'quarterly' ? 'Review Quarter *' : 'Review Year *'}
            </label>
            {period === 'quarterly' ? (
              <select
                value={quarter}
                onChange={(e) => {
                  const selectedQuarter = e.target.value;
                  setQuarter(selectedQuarter);
                  
                  // Find the period setting for this quarter and year
                  const periodSetting = availablePeriods.find(
                    (p: any) => p.period_type === 'quarterly' && 
                                p.quarter === selectedQuarter && 
                                p.year === year &&
                                p.is_active
                  );
                  
                  if (periodSetting) {
                    setSelectedPeriodSetting(periodSetting);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Quarter</option>
                {availablePeriods
                  .filter((p: any) => p.period_type === 'quarterly' && p.year === year && p.is_active)
                  .sort((a: any, b: any) => {
                    const qOrder: { [key: string]: number } = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
                    return (qOrder[a.quarter] || 0) - (qOrder[b.quarter] || 0);
                  })
                  .map((periodSetting: any) => {
                    const startDate = periodSetting.start_date ? new Date(periodSetting.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    const endDate = periodSetting.end_date ? new Date(periodSetting.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    return (
                      <option key={`${periodSetting.quarter}-${periodSetting.year}`} value={periodSetting.quarter}>
                        {periodSetting.quarter} {periodSetting.year} {startDate && endDate ? `(${startDate} - ${endDate})` : ''}
                      </option>
                    );
                  })}
              </select>
            ) : (
              <select
                value={year}
                onChange={(e) => {
                  const selectedYear = parseInt(e.target.value);
                  setYear(selectedYear);
                  
                  // Find the period setting for this year
                  const periodSetting = availablePeriods.find(
                    (p: any) => p.period_type === 'annual' && 
                                p.year === selectedYear &&
                                p.is_active
                  );
                  
                  if (periodSetting) {
                    setSelectedPeriodSetting(periodSetting);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                {Array.from(new Set(availablePeriods
                  .filter((p: any) => p.period_type === 'annual' && p.is_active)
                  .map((p: any) => p.year)))
                  .sort((a: number, b: number) => b - a)
                  .map((y: number) => {
                    const periodSetting = availablePeriods.find(
                      (p: any) => p.period_type === 'annual' && p.year === y && p.is_active
                    );
                    const startDate = periodSetting?.start_date ? new Date(periodSetting.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    const endDate = periodSetting?.end_date ? new Date(periodSetting.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    return (
                      <option key={y} value={y}>
                        {y} {startDate && endDate ? `(${startDate} - ${endDate})` : ''}
                      </option>
                    );
                  })}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {selectedPeriodSetting 
                ? `Period: ${selectedPeriodSetting.start_date ? new Date(selectedPeriodSetting.start_date).toLocaleDateString() : 'N/A'} - ${selectedPeriodSetting.end_date ? new Date(selectedPeriodSetting.end_date).toLocaleDateString() : 'N/A'}`
                : 'Choose the review period configured by HR'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Brief description of what this template is for..."
          />
        </div>
      </div>

      {/* KPI Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">KPI Items</h2>
          <button
            onClick={handleAddRow}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            <FiPlus className="text-sm" />
            <span>Add KPI Item</span>
          </button>
        </div>

        <div className="space-y-6">
          {kpiItems.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  KPI Item {index + 1}
                </h3>
                {kpiItems.length > 1 && (
                  <button
                    onClick={() => handleRemoveRow(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 className="text-lg" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateKPIItem(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="KPI Title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={item.description}
                      onChange={(e) => updateKPIItem(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg resize-none"
                      placeholder="Brief description"
                    />
                    <button
                      onClick={() => openTextModal('Description', item.description, 'description', index)}
                      className="absolute right-3 top-3 text-purple-600 hover:text-purple-700"
                      title="Open in full editor"
                    >
                      <FiAlignLeft />
                    </button>
                  </div>
                </div>

                {/* Grid for smaller fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Performance Status *
                    </label>
                    <input
                      type="text"
                      value={item.current_performance_status}
                      onChange={(e) => updateKPIItem(index, 'current_performance_status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., On Track, At Risk"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Value *
                    </label>
                    <input
                      type="text"
                      value={item.target_value}
                      onChange={(e) => updateKPIItem(index, 'target_value', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 150,000 or 95%"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Measure Unit *
                    </label>
                    <select
                      value={item.measure_unit}
                      onChange={(e) => updateKPIItem(index, 'measure_unit', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select unit</option>
                      <option value="Percentage">Percentage</option>
                      <option value="Number">Number</option>
                      <option value="Currency">Currency</option>
                      <option value="Days">Days</option>
                    </select>
                  </div>

                  <div>
                    <DatePicker
                      label="Expected Completion Date *"
                      value={item.expected_completion_date}
                      onChange={(date: Date | null) => updateKPIItem(index, 'expected_completion_date', date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Select date"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Weight (%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={item.goal_weight}
                      onChange={(e) => updateKPIItem(index, 'goal_weight', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 20"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Goal Weight Total Display */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Goal Weight:</span>
            <span className={`text-lg font-bold ${
              calculateTotalGoalWeight() === 100
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {calculateTotalGoalWeight()}%
            </span>
          </div>
          {calculateTotalGoalWeight() !== 100 && (
            <p className="text-sm text-red-600 mt-2">
              ⚠ The total goal weight must equal 100%. Currently {calculateTotalGoalWeight() > 100 ? 'over' : 'under'} by {Math.abs(100 - calculateTotalGoalWeight())}%
            </p>
          )}
        </div>
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={closeTextModal}
        title={textModal.title}
        value={textModal.value}
        onChange={(value) => {
          if (textModal.onChange) {
            textModal.onChange(value);
          }
        }}
      />
    </div>
  );
};

export default KPITemplateForm;
