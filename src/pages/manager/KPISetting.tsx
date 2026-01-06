import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { User } from '../../types';
import SignatureField from '../../components/SignatureField';
import DatePicker from '../../components/DatePicker';
import TextModal from '../../components/TextModal';
import { FiArrowLeft, FiSave, FiSend, FiEye, FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';

const KPISetting: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const getInitialRows = (periodType: 'quarterly' | 'yearly') => {
    const defaultRow = { title: '', description: '', current_performance_status: '', target_value: '', expected_completion_date: '', measure_unit: '', goal_weight: '' };
    const rowCount = periodType === 'yearly' ? 5 : 3;
    return Array(rowCount).fill(null).map(() => ({ ...defaultRow }));
  };

  const [kpiRows, setKpiRows] = useState(getInitialRows('quarterly'));
  const [period, setPeriod] = useState<'quarterly' | 'yearly'>('quarterly');
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [meetingDate, setMeetingDate] = useState<Date | null>(new Date());
  const [managerSignature, setManagerSignature] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [selectedPeriodSetting, setSelectedPeriodSetting] = useState<any>(null);
  const [textModal, setTextModal] = useState<{ isOpen: boolean; title: string; value: string; field?: string; rowIndex?: number; onChange?: (value: string) => void }>({
    isOpen: false,
    title: '',
    value: '',
  });

  useEffect(() => {
    if (employeeId) {
      // Load draft FIRST before fetching periods to prevent overwriting
      loadDraft();
      fetchEmployee();
      fetchAvailablePeriods();
    }
  }, [employeeId]);

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    if (employeeId) {
      const draftKey = `kpi-setting-draft-${employeeId}`;
      const draftData = {
        kpiRows,
        period,
        quarter,
        year,
        meetingDate: meetingDate?.toISOString(),
        managerSignature,
        selectedPeriodSetting,
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [kpiRows, period, quarter, year, meetingDate, managerSignature, selectedPeriodSetting, employeeId]);

  const loadDraft = () => {
    if (!employeeId) return;
    try {
      const draftKey = `kpi-setting-draft-${employeeId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        console.log('Loading draft for employee:', employeeId, draftData);
        
        // Load period settings from draft first
        if (draftData.period) {
          setPeriod(draftData.period);
        }
        
        // Always load draft data if it exists (don't check hasData - draft should override empty state)
        if (draftData.kpiRows && Array.isArray(draftData.kpiRows) && draftData.kpiRows.length > 0) {
          // Check if draft has any actual data (not just empty strings)
          const hasDraftData = draftData.kpiRows.some((row: any) => 
            (row.title && row.title.trim()) || (row.description && row.description.trim())
          );
          if (hasDraftData) {
            setKpiRows(draftData.kpiRows);
            console.log('Loaded KPI rows from draft:', draftData.kpiRows);
          } else {
            // If no draft data but period exists, set default rows for that period
            setKpiRows(getInitialRows(draftData.period || 'quarterly'));
          }
        } else {
          // If no draft rows but period exists, set default rows for that period
          if (draftData.period) {
            setKpiRows(getInitialRows(draftData.period));
          }
        }
        
        if (draftData.quarter) {
          setQuarter(draftData.quarter);
        }
        if (draftData.year) {
          setYear(draftData.year);
        }
        if (draftData.meetingDate) {
          setMeetingDate(new Date(draftData.meetingDate));
        }
        if (draftData.managerSignature) {
          setManagerSignature(draftData.managerSignature);
        }
        if (draftData.selectedPeriodSetting) {
          setSelectedPeriodSetting(draftData.selectedPeriodSetting);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const response = await api.get('/settings/available-periods');
      setAvailablePeriods(response.data.periods || []);
      
      // Check if draft exists before setting defaults
      if (employeeId) {
        const draftKey = `kpi-setting-draft-${employeeId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          // Draft exists, don't overwrite with defaults
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
        // Set meeting date to start_date if available
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
    try {
      const response = await api.get(`/employees/${employeeId}`);
      setEmployee(response.data.employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiChange = (index: number, field: string, value: string) => {
    const updated = [...kpiRows];
    updated[index] = { ...updated[index], [field]: value };
    setKpiRows(updated);
  };

  const handleAddRow = () => {
    const newRow = { title: '', description: '', current_performance_status: '', target_value: '', expected_completion_date: '', measure_unit: '', goal_weight: '' };
    setKpiRows([...kpiRows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    // Don't allow removing rows if we're at minimum (3 for quarterly, 5 for yearly)
    const minRows = period === 'yearly' ? 5 : 3;
    if (kpiRows.length <= minRows) {
      alert(`You must have at least ${minRows} KPI items for ${period} KPIs`);
      return;
    }
    const updated = kpiRows.filter((_, i) => i !== index);
    setKpiRows(updated);
  };

  const handleSaveDraft = () => {
    if (!employeeId) return;
    const draftKey = `kpi-setting-draft-${employeeId}`;
    const draftData = {
      kpiRows,
      period,
      quarter,
      year,
      meetingDate: meetingDate?.toISOString(),
      managerSignature,
      selectedPeriodSetting,
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    alert('Draft saved successfully! Your progress has been saved.');
  };

  const handleSubmit = async () => {
    if (!managerSignature) {
      alert('Please provide your digital signature');
      return;
    }

    // Filter out empty rows
    const validKpiRows = kpiRows.filter(
      kpi => kpi.title && kpi.title.trim() !== '' && kpi.description && kpi.description.trim() !== ''
    );

    // Validate minimum rows based on period type
    const minRows = period === 'yearly' ? 5 : 3;
    if (validKpiRows.length < minRows) {
      alert(`Please fill in at least ${minRows} KPI items for ${period} KPIs`);
      return;
    }

    if (validKpiRows.length === 0) {
      alert('Please fill in at least one KPI row');
      return;
    }

    // Validate that total goal weight equals 100% (dynamic based on number of questions)
    const rawWeights = validKpiRows
      .map(row => {
        const value = (row.goal_weight || '').toString().trim();
        if (!value) return NaN;
        const numeric = parseFloat(value.replace('%', ''));
        return isNaN(numeric) ? NaN : numeric;
      })
      .filter(w => !isNaN(w));

    if (rawWeights.length !== validKpiRows.length) {
      alert('Please enter a valid goal weight (e.g., 30 or 30%) for each KPI item.');
      return;
    }

    let totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);
    // Support fractional weights (e.g., 0.3 instead of 30)
    if (rawWeights.every(w => w > 0 && w <= 1)) {
      totalWeight = totalWeight * 100;
    }

    const roundedTotal = Math.round(totalWeight * 100) / 100;
    if (roundedTotal !== 100) {
      alert(`Total Goal Weight must be exactly 100%. Current total is ${roundedTotal.toFixed(2)}%.`);
      return;
    }

    setSaving(true);
    try {
      // Submit as a single KPI form with multiple items
      await api.post('/kpis', {
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
        })),
      });

      // Clear draft after successful submission
      if (employeeId) {
        const draftKey = `kpi-setting-draft-${employeeId}`;
        localStorage.removeItem(draftKey);
      }

      navigate('/manager/dashboard');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit KPI form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Set KPI for Employee</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create new performance objective • {quarter} {year}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiSave className="text-lg" />
            <span>Save as Draft</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <FiSend className="text-lg" />
            <span>Submit KPI</span>
          </button>
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/manager/employee-kpis/${employeeId}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              <FiEye className="text-lg" />
              <span>View KPIs</span>
            </button>
            <button className="text-sm text-purple-600 hover:text-purple-700">
              Change Employee
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-purple-600">
              {employee?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-semibold text-gray-900">{employee?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-semibold text-gray-900">{employee?.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payroll Number</p>
                <p className="font-semibold text-gray-900">{employee?.payroll_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Employment Date</p>
                <p className="font-semibold text-gray-900">
                  {employee?.employment_date
                    ? new Date(employee.employment_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-semibold text-gray-900">{employee?.department}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">KPI Details</h2>
          <span className="text-sm text-gray-500">Required fields *</span>
        </div>

        <div className="space-y-6">
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KPI Type *
              </label>
              <select
                value={period}
                onChange={(e) => {
                  const newPeriod = e.target.value as 'quarterly' | 'yearly';
                  setPeriod(newPeriod);
                  
                  // Find first available period of selected type
                  const periodsOfType = availablePeriods.filter((p: any) => p.period_type === newPeriod && p.is_active);
                  if (periodsOfType.length > 0) {
                    const firstPeriod = periodsOfType[0];
                    if (newPeriod === 'quarterly') {
                      setQuarter(firstPeriod.quarter || 'Q1');
                      setKpiRows(getInitialRows('quarterly'));
                    } else {
                      setKpiRows(getInitialRows('yearly'));
                    }
                    setYear(firstPeriod.year);
                    if (firstPeriod.start_date) {
                      setMeetingDate(new Date(firstPeriod.start_date));
                    }
                    setSelectedPeriodSetting(firstPeriod);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Select the evaluation period for this KPI</p>
            </div>
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
                      if (periodSetting.start_date) {
                        setMeetingDate(new Date(periodSetting.start_date));
                      }
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
                      (p: any) => p.period_type === 'yearly' && 
                                  p.year === selectedYear &&
                                  p.is_active
                    );
                    
                    if (periodSetting) {
                      setSelectedPeriodSetting(periodSetting);
                      if (periodSetting.start_date) {
                        setMeetingDate(new Date(periodSetting.start_date));
                      }
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Year</option>
                  {Array.from(new Set(availablePeriods
                    .filter((p: any) => p.period_type === 'yearly' && p.is_active)
                    .map((p: any) => p.year)))
                    .sort((a: number, b: number) => b - a)
                    .map((y: number) => {
                      const periodSetting = availablePeriods.find(
                        (p: any) => p.period_type === 'yearly' && p.year === y && p.is_active
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
            <div>
              <DatePicker
                label="Meeting Date *"
                value={meetingDate || undefined}
                onChange={setMeetingDate}
                required
              />
            </div>
          </div>

          {/* KPI Table */}
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                KPI Items ({kpiRows.length} {kpiRows.length === 1 ? 'item' : 'items'})
              </h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <FiPlus className="text-lg" />
                <span>Add Row</span>
              </button>
            </div>
            <table className="w-full border-collapse" style={{ minWidth: '1600px' }}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '50px' }}>
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '200px' }}>
                    KPI Title / Name *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '250px' }}>
                    KPI Description *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '180px' }}>
                    Current Performance Status *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '150px' }}>
                    Target Value *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '120px' }}>
                    Measure Unit *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '150px' }}>
                    Expected Completion Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '120px' }}>
                    Goal Weight *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '80px' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {kpiRows.map((kpi, index) => {
                  const minRows = period === 'yearly' ? 5 : 3;
                  const canRemove = kpiRows.length > minRows;
                  return (
                  <tr key={index}>
                    <td className="border border-gray-200 p-2 text-center">
                      <span className="font-semibold text-gray-700">{index + 1}</span>
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={kpi.title}
                        onChange={(e) => handleKpiChange(index, 'title', e.target.value)}
                        placeholder="e.g., Increase Monthly Sales Revenue"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <div className="flex items-start space-x-2">
                        <textarea
                          value={kpi.description}
                          onChange={(e) => handleKpiChange(index, 'description', e.target.value)}
                          placeholder="Provide detailed description..."
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setTextModal({ 
                            isOpen: true, 
                            title: 'KPI Description', 
                            value: kpi.description,
                            field: 'description',
                            rowIndex: index,
                            onChange: (value) => handleKpiChange(index, 'description', value)
                          })}
                          className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 border border-purple-300 rounded"
                          title="Edit in modal"
                        >
                          <FiExternalLink />
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-2">
                      <div className="flex items-start space-x-2">
                        <input
                          type="text"
                          value={kpi.current_performance_status}
                          onChange={(e) => handleKpiChange(index, 'current_performance_status', e.target.value)}
                          placeholder="e.g., On Track, At Risk, Delayed"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setTextModal({ 
                            isOpen: true, 
                            title: 'Current Performance Status', 
                            value: kpi.current_performance_status,
                            field: 'current_performance_status',
                            rowIndex: index,
                            onChange: (value) => handleKpiChange(index, 'current_performance_status', value)
                          })}
                          className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 border border-purple-300 rounded"
                          title="Edit in modal"
                        >
                          <FiExternalLink />
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-2">
                      <div className="flex items-start space-x-2">
                        <input
                          type="text"
                          value={kpi.target_value}
                          onChange={(e) => handleKpiChange(index, 'target_value', e.target.value)}
                          placeholder="e.g., 150,000 or 95%"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setTextModal({ 
                            isOpen: true, 
                            title: 'Target Value', 
                            value: kpi.target_value,
                            field: 'target_value',
                            rowIndex: index,
                            onChange: (value) => handleKpiChange(index, 'target_value', value)
                          })}
                          className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 border border-purple-300 rounded"
                          title="Edit in modal"
                        >
                          <FiExternalLink />
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-2">
                      <select
                        value={kpi.measure_unit}
                        onChange={(e) => handleKpiChange(index, 'measure_unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select unit</option>
                        <option value="Percentage">Percentage</option>
                        <option value="Number">Number</option>
                        <option value="Currency">Currency</option>
                        <option value="Days">Days</option>
                      </select>
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="date"
                        value={kpi.expected_completion_date}
                        onChange={(e) => handleKpiChange(index, 'expected_completion_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={kpi.goal_weight}
                        onChange={(e) => handleKpiChange(index, 'goal_weight', e.target.value)}
                        placeholder="e.g., 30% or 0.3"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="border border-gray-200 p-2 text-center">
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove this row"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          {/* Manager Signature */}
          <div className="mt-6">
            <SignatureField
              label="Manager Digital Signature *"
              value={managerSignature}
              onChange={setManagerSignature}
              required
              placeholder="Click and drag to sign"
            />
            <p className="text-sm text-gray-600 mt-2">
              By signing below, you confirm that the KPI details are accurate and agree to submit this to the employee.
            </p>
          </div>
        </div>
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => {
          if (textModal.onChange && textModal.rowIndex !== undefined) {
            textModal.onChange(textModal.value);
          }
          setTextModal({ isOpen: false, title: '', value: '' });
        }}
        title={textModal.title}
        value={textModal.value}
        onChange={textModal.onChange}
        readOnly={!textModal.onChange}
      />
    </div>
  );
};

export default KPISetting;

