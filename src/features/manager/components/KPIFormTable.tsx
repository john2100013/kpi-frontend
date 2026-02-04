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
  exclude_from_calculation?: number;  // 0 = included, 1 = excluded from calculation
  measure_criteria?: string;
}

// Template title interface
export interface TemplateTitle {
  id: number;
  title: string;
  description: string;
  is_active: number;
  created_at: string;
  updated_at: string;
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

  // Handlers - Accept string, boolean, and number (for exclude_from_calculation)
  handleKpiChange: (index: number, field: string, value: string | boolean | number) => void;
  handleQualitativeToggle?: (index: number, isQualitative: boolean) => void;
  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;

  // Signature (optional - only for KPI Setting)
  managerSignature?: string;
  onSignatureChange?: (signature: string) => void;

  // Physical Meeting Confirmation - Manager (optional - only for KPI Setting)
  managerMeetingConfirmed?: boolean;
  onManagerMeetingConfirmedChange?: (confirmed: boolean) => void;
  managerMeetingLocation?: string;
  onManagerMeetingLocationChange?: (location: string) => void;
  managerMeetingDate?: string;
  onManagerMeetingDateChange?: (date: string) => void;
  managerMeetingTime?: string;
  onManagerMeetingTimeChange?: (time: string) => void;

  // Text Modal
  textModal: TextModalState;
  setTextModal: (modal: TextModalState) => void;

  // Mode
  mode?: 'setting' | 'template';

  // Template Titles (for departments with enable_template_titles = 1)
  templateTitles?: TemplateTitle[];
  isDepartmentTemplateEnabled?: boolean;
  employeeDepartmentId?: number;
  // Control for showing dropdown
  useTemplateDropdown?: boolean;
  onUseTemplateDropdownChange?: (use: boolean) => void;
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
  // Physical Meeting Fields
  managerMeetingConfirmed,
  onManagerMeetingConfirmedChange,
  managerMeetingLocation,
  onManagerMeetingLocationChange,
  managerMeetingDate,
  onManagerMeetingDateChange,
  managerMeetingTime,
  onManagerMeetingTimeChange,
  textModal,
  setTextModal,
  mode = 'setting',
  templateTitles = [],
  isDepartmentTemplateEnabled = false,
  employeeDepartmentId,
  useTemplateDropdown = false,
  onUseTemplateDropdownChange,
}) => {
  const canRemoveRow = (_index: number) => kpiRows.length > minRows;

  // Debug logging

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

                  const selectedId = parseInt(e.target.value);
                  const selected = availablePeriods.find((p: any) => p.id === selectedId);

                  if (selected) {
                    onQuarterChange(selected.quarter);
                    onYearChange(selected.year);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                <option value="">Select Quarter</option>
                {(() => {
                  const filtered = availablePeriods.filter((p: any) => p.period_type === 'quarterly' && p.is_active);

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

                  const selectedId = parseInt(e.target.value);
                  const selected = availablePeriods.find((p: any) => p.id === selectedId);

                  if (selected) {
                    onYearChange(selected.year);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                <option value="">Select Year</option>
                {(() => {
                  const filtered = availablePeriods.filter((p: any) => p.period_type === 'yearly' && p.is_active);

                  return filtered
                    .sort((a: any, b: any) => b.year - a.year)
                    .map((ps: any) => {
                      const startDate = ps.start_date ? new Date(ps.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                      const endDate = ps.end_date ? new Date(ps.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

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

        {/* Use Template Dropdown Checkbox - Only in template mode */}
        {(() => {
          return null;
        })()}
        {mode === 'template' && employeeDepartmentId && onUseTemplateDropdownChange && (
          <div className="border-t border-gray-200 pt-4 pb-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useTemplateDropdown}
                onChange={(e) => {

                  onUseTemplateDropdownChange(e.target.checked);
                }}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mt-0.5"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Use Template Title Dropdown</span>
                <p className="text-xs text-gray-600 mt-1">
                  When enabled, you can select from predefined KPI titles for this department
                </p>
                {useTemplateDropdown && (
                  <div className="mt-2 p-2 rounded" style={{ backgroundColor: isDepartmentTemplateEnabled && templateTitles.length > 0 ? '#EFF6FF' : '#FFF7ED' }}>
                    {isDepartmentTemplateEnabled && templateTitles.length > 0 ? (
                      <p className="text-xs text-blue-700">
                        ✓ {templateTitles.length} template {templateTitles.length === 1 ? 'title' : 'titles'} available. Dropdown will appear below in KPI Title field.
                      </p>
                    ) : (
                      <p className="text-xs text-orange-700">
                        ⚠ Template titles not enabled for this department
                      </p>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

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

          <div className="overflow-x-auto max-w-full">
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
                        
                        {/* Exclude from Calculation Checkbox - Only show for qualitative items */}
                        {kpi.is_qualitative && (
                          <label className="flex items-center space-x-2 cursor-pointer mt-2 pt-2 border-t border-gray-200">
                            <input
                              type="checkbox"
                              checked={kpi.exclude_from_calculation === 1}
                              onChange={(e) => handleKpiChange(index, 'exclude_from_calculation', e.target.checked ? 1 : 0)}
                              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <span className="text-xs text-orange-600 font-medium" title="This item will be rated but not included in final score calculations">
                              Exclude from calculation
                            </span>
                          </label>
                        )}
                      </td>
                    )}

                    <td className="border border-gray-200 p-2">
                      {/* Template Dropdown - Only show if department has feature enabled */}
                      {isDepartmentTemplateEnabled && templateTitles.length > 0 && (
                        <select
                          onChange={(e) => {
                            const selectedId = parseInt(e.target.value);
                            if (selectedId) {
                              const template = templateTitles.find(t => t.id === selectedId);
                              if (template) {
                                handleKpiChange(index, 'title', template.title);
                                handleKpiChange(index, 'description', template.description);
                              }
                            }
                          }}
                          className="w-full px-3 py-2 mb-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 bg-purple-50"
                        >
                          <option value="">Select from template or enter custom...</option>
                          {templateTitles.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.title}
                            </option>
                          ))}
                        </select>
                      )}
                      {/* Custom Text Input - Always available */}
                      <input
                        type="text"
                        value={kpi.title}
                        onChange={(e) => handleKpiChange(index, 'title', e.target.value)}
                        placeholder={isDepartmentTemplateEnabled ? "Or enter custom KPI title..." : "e.g., Increase Monthly Sales Revenue"}
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
                        <option value="Behavioural">Behavioural</option>
                      </select>
                    </td>

                    <td className="border border-gray-200 p-2">
                      <input
                        type="date"
                        value={kpi.expected_completion_date ? new Date(kpi.expected_completion_date).toISOString().split('T')[0] : ''}
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

        {/* Physical Meeting Confirmation - Manager */}
        {mode === 'setting' && onManagerMeetingConfirmedChange && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={managerMeetingConfirmed || false}
                  onChange={(e) => onManagerMeetingConfirmedChange(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">
                    I confirm that a physical meeting will be held for this KPI setting
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Please confirm that you had or will have a physical meeting with the employee to discuss these KPIs
                  </p>
                </div>
              </label>

              {/* Conditional Meeting Details Fields */}
              {managerMeetingConfirmed && (
                <div className="mt-4 pl-8 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Location *
                    </label>
                    <input
                      type="text"
                      value={managerMeetingLocation || ''}
                      onChange={(e) => onManagerMeetingLocationChange?.(e.target.value)}
                      placeholder="e.g., Conference Room A, Manager's Office"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Date *
                      </label>
                      <input
                        type="date"
                        value={managerMeetingDate || ''}
                        onChange={(e) => onManagerMeetingDateChange?.(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Time *
                      </label>
                      <input
                        type="time"
                        value={managerMeetingTime || ''}
                        onChange={(e) => onManagerMeetingTimeChange?.(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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