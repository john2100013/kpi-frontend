import React from 'react';
import { FiPlus, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { Button } from '../../../components/common';
import DatePicker from '../../../components/DatePicker';
import SignatureField from '../../../components/SignatureField';
import TextModal from '../../../components/TextModal';

// Shared KPI Row interface that works for both Setting and Template
export interface KPIRowData {
  title: string;
  description: string;
  current_performance_status: string;
  target_value: string;
  measure_unit: string;
  expected_completion_date: string;
  goal_weight: string;
  is_qualitative: boolean;  // Required, not optional
  measure_criteria?: string;
}

interface TextModalState {
  isOpen: boolean;
  title: string;
  value: string;
  field?: string;
  rowIndex?: number;
  onChange?: (value: string) => void;
}

interface KPIFormTableProps {
  // Period Settings
  period: 'quarterly' | 'yearly';
  quarter: string;
  year: number;
  availablePeriods: any[];
  selectedPeriodSetting: any;
  onPeriodChange: (period: 'quarterly' | 'yearly') => void;
  onQuarterChange: (quarter: string) => void;
  onYearChange: (year: number) => void;

  // Meeting Date (optional - only for KPI Setting)
  meetingDate?: Date | null;
  onMeetingDateChange?: (date: Date | null) => void;

  // KPI Rows
  kpiRows: KPIRowData[];
  onKpiRowsChange?: (rows: KPIRowData[]) => void;
  minRows?: number;

  // Handlers - Accept both string and boolean
  handleKpiChange: (index: number, field: string, value: string | boolean) => void;
  handleQualitativeToggle?: (index: number, isQualitative: boolean) => void;
  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;

  // Signature (optional - only for KPI Setting)
  managerSignature?: string;
  onSignatureChange?: (signature: string) => void;

  // Text Modal
  textModal: TextModalState;
  setTextModal: (modal: TextModalState) => void;

  // Mode
  mode?: 'setting' | 'template';
}

export const KPIFormTable: React.FC<KPIFormTableProps> = ({
  period,
  // quarter and year are kept for backward compatibility but not used in component
  availablePeriods,
  selectedPeriodSetting,
  onPeriodChange,
  onQuarterChange,
  onYearChange,
  meetingDate,
  onMeetingDateChange,
  kpiRows,
  minRows = 0,
  handleKpiChange,
  handleQualitativeToggle,
  handleAddRow,
  handleRemoveRow,
  managerSignature,
  onSignatureChange,
  textModal,
  setTextModal,
  mode = 'setting',
}) => {
  const canRemoveRow = (_index: number) => kpiRows.length > minRows;

  // Debug logging
  console.log('🔍 [KPIFormTable] Render:', {
    period,
    selectedPeriodSetting,
    availablePeriodsCount: availablePeriods?.length || 0,
    availablePeriods: availablePeriods,
    selectedId: selectedPeriodSetting?.id,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {mode === 'template' ? 'Template Details' : 'KPI Details'}
        </h2>
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
              onChange={(e) => onPeriodChange(e.target.value as 'quarterly' | 'yearly')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {period === 'quarterly' ? 'Review Quarter *' : 'Review Year *'}
            </label>
            {period === 'quarterly' ? (
              <select
                value={selectedPeriodSetting?.id || ''}
                onChange={(e) => {
                  console.log('📝 [Quarterly Dropdown] onChange triggered:', e.target.value);
                  const selectedId = parseInt(e.target.value);
                  const selected = availablePeriods.find((p: any) => p.id === selectedId);
                  console.log('📝 [Quarterly Dropdown] Found period:', selected);
                  if (selected) {
                    onQuarterChange(selected.quarter);
                    onYearChange(selected.year);
                  }
                }}
                onFocus={() => console.log('🎯 [Quarterly Dropdown] Focused')}
                onClick={() => console.log('🖱️ [Quarterly Dropdown] Clicked')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                <option value="">Select Quarter</option>
                {(() => {
                  const filtered = availablePeriods.filter((p: any) => p.period_type === 'quarterly' && p.is_active);
                  console.log('📊 [Quarterly Dropdown] Filtered periods:', filtered);
                  return filtered
                    .sort((a: any, b: any) => {
                      // Sort by year first, then by quarter
                      if (a.year !== b.year) return b.year - a.year;
                      const qOrder: { [key: string]: number } = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
                      return (qOrder[a.quarter] || 0) - (qOrder[b.quarter] || 0);
                    })
                    .map((ps: any) => {
                      const startDate = ps.start_date ? new Date(ps.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                      const endDate = ps.end_date ? new Date(ps.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                      console.log('🔖 [Quarterly Dropdown] Option:', ps.id, ps.quarter, ps.year);
                      return (
                        <option key={ps.id} value={ps.id}>
                          {ps.quarter} {ps.year} {startDate && endDate ? `(${startDate} - ${endDate})` : ''}
                        </option>
                      );
                    });
                })()}
              </select>
            ) : (
              <select
                value={selectedPeriodSetting?.id || ''}
                onChange={(e) => {
                  console.log('📝 [Yearly Dropdown] onChange triggered:', e.target.value);
                  const selectedId = parseInt(e.target.value);
                  const selected = availablePeriods.find((p: any) => p.id === selectedId);
                  console.log('📝 [Yearly Dropdown] Found period:', selected);
                  if (selected) {
                    onYearChange(selected.year);
                  }
                }}
                onFocus={() => console.log('🎯 [Yearly Dropdown] Focused')}
                onClick={() => console.log('🖱️ [Yearly Dropdown] Clicked')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                <option value="">Select Year</option>
                {(() => {
                  const filtered = availablePeriods.filter((p: any) => p.period_type === 'yearly' && p.is_active);
                  console.log('📊 [Yearly Dropdown] Filtered periods:', filtered);
                  return filtered
                    .sort((a: any, b: any) => b.year - a.year)
                    .map((ps: any) => {
                      const startDate = ps.start_date ? new Date(ps.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                      const endDate = ps.end_date ? new Date(ps.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                      console.log('🔖 [Yearly Dropdown] Option:', ps.id, ps.year);
                      return (
                        <option key={ps.id} value={ps.id}>
                          {ps.year} {startDate && endDate ? `(${startDate} - ${endDate})` : ''}
                        </option>
                      );
                    });
                })()}
              </select>
            )}
          </div>

          {/* Meeting Date - Only show in KPI Setting mode */}
          {mode === 'setting' && meetingDate !== undefined && onMeetingDateChange && (
            <div>
              <DatePicker
                label="Meeting Date *"
                value={meetingDate || undefined}
                onChange={onMeetingDateChange}
                required
              />
            </div>
          )}
        </div>

        {/* KPI Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              KPI Items ({kpiRows.length} {kpiRows.length === 1 ? 'item' : 'items'})
            </h3>
            <Button
              type="button"
              onClick={handleAddRow}
              variant="success"
              icon={FiPlus}
              size="sm"
            >
              Add Row
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: '1600px' }}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '50px' }}>#</th>
                  
                  {/* SHOW CHECKBOX IN BOTH MODES - Remove the mode condition */}
                  {handleQualitativeToggle && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '120px' }}>Type</th>
                  )}
                  
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '200px' }}>KPI Title / Name *</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '250px' }}>KPI Description *</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '180px' }}>Current Performance Status *</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '150px' }}>Target Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '120px' }}>Measure Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '150px' }}>Expected Completion Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '120px' }}>Goal Weight *</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap" style={{ minWidth: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {kpiRows.map((kpi, index) => (
                  <tr key={index}>
                    <td className="border border-gray-200 p-2 text-center">
                      <span className="font-semibold text-gray-700">{index + 1}</span>
                    </td>
                    
                    {/* SHOW CHECKBOX IN BOTH MODES - Remove the mode condition */}
                    {handleQualitativeToggle && (
                      <td className="border border-gray-200 p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={kpi.is_qualitative}
                            onChange={(e) => handleQualitativeToggle(index, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-xs text-gray-700">
                            {kpi.is_qualitative ? 'Qualitative' : 'Quantitative'}
                          </span>
                        </label>
                      </td>
                    )}

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
                        <Button
                          type="button"
                          onClick={() => setTextModal({ 
                            isOpen: true, 
                            title: 'KPI Description', 
                            value: kpi.description,
                            field: 'description',
                            rowIndex: index,
                            onChange: (value) => handleKpiChange(index, 'description', value)
                          })}
                          variant="outline"
                          size="xs"
                          icon={FiExternalLink}
                          title="Edit in modal"
                        />
                      </div>
                    </td>

                    <td className="border border-gray-200 p-2">
                      <div className="flex items-start space-x-2">
                        <input
                          type="text"
                          value={kpi.current_performance_status}
                          onChange={(e) => handleKpiChange(index, 'current_performance_status', e.target.value)}
                          placeholder="e.g., On Track, At Risk"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <Button
                          type="button"
                          onClick={() => setTextModal({ 
                            isOpen: true, 
                            title: 'Current Performance Status', 
                            value: kpi.current_performance_status,
                            field: 'current_performance_status',
                            rowIndex: index,
                            onChange: (value) => handleKpiChange(index, 'current_performance_status', value)
                          })}
                          variant="outline"
                          size="xs"
                          icon={FiExternalLink}
                          title="Edit in modal"
                        />
                      </div>
                    </td>

                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={kpi.target_value}
                        onChange={(e) => handleKpiChange(index, 'target_value', e.target.value)}
                        placeholder={kpi.is_qualitative ? "Optional" : "e.g., 150,000"}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>

                    <td className="border border-gray-200 p-2">
                      <select
                        value={kpi.measure_unit}
                        onChange={(e) => handleKpiChange(index, 'measure_unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">{kpi.is_qualitative ? 'Optional' : 'Select unit'}</option>
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
                        placeholder="e.g., 30%"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </td>

                    <td className="border border-gray-200 p-2 text-center">
                      {canRemoveRow(index) && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          variant="ghost"
                          icon={FiTrash2}
                          className="text-red-600 hover:text-red-700"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manager Signature - Only in Setting mode */}
        {mode === 'setting' && managerSignature !== undefined && onSignatureChange && (
          <div className="mt-6">
            <SignatureField
              label="Manager Digital Signature *"
              value={managerSignature}
              onChange={onSignatureChange}
              required
              placeholder="Click and drag to sign"
            />
            <p className="text-sm text-gray-600 mt-2">
              By signing below, you confirm that the KPI details are accurate.
            </p>
          </div>
        )}
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => {
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