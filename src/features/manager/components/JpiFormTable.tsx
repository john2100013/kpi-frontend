import React from 'react';
import { FiPlus, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { Button } from '../../../components/common';
import DatePicker from '../../../components/DatePicker';
import SignatureField from '../../../components/SignatureField';
import TextModal from '../../../components/TextModal';

interface KPIRow {
  title: string;
  description: string;
  current_performance_status: string;
  target_value: string;
  measure_unit: string;
  expected_completion_date: string;
  goal_weight: string;
  is_qualitative?: boolean;
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
  kpiRows: KPIRow[];
  onKpiRowsChange: (rows: KPIRow[]) => void;
  minRows?: number;

  // Handlers
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
  quarter,
  year,
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
  const canRemoveRow = (index: number) => kpiRows.length > minRows;

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
            <p className="text-xs text-gray-500 mt-1">Select the evaluation period</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {period === 'quarterly' ? 'Review Quarter *' : 'Review Year *'}
            </label>
            {period === 'quarterly' ? (
              <select
                value={quarter}
                onChange={(e) => onQuarterChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Quarter</option>
                {availablePeriods
                  .filter((p: any) => p.period_type === 'quarterly' && p.year === year && p.is_active)
                  .sort((a: any, b: any) => {
                    const qOrder: { [key: string]: number } = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
                    return (qOrder[a.quarter] || 0) - (qOrder[b.quarter] || 0);
                  })
                  .map((ps: any) => {
                    const startDate = ps.start_date ? new Date(ps.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    const endDate = ps.end_date ? new Date(ps.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    return (
                      <option key={`${ps.quarter}-${ps.year}`} value={ps.quarter}>
                        {ps.quarter} {ps.year} {startDate && endDate ? `(${startDate} - ${endDate})` : ''}
                      </option>
                    );
                  })}
              </select>
            ) : (
              <select
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                {Array.from(new Set(availablePeriods
                  .filter((p: any) => p.period_type === 'yearly' && p.is_active)
                  .map((p: any) => p.year)))
                  .sort((a: number, b: number) => b - a)
                  .map((y: number) => {
                    const ps = availablePeriods.find((p: any) => p.period_type === 'yearly' && p.year === y && p.is_active);
                    const startDate = ps?.start_date ? new Date(ps.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    const endDate = ps?.end_date ? new Date(ps.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
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
                : 'Choose the review period'}
            </p>
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
                    
                    {/* Qualitative Toggle - Only in Setting mode */}
                    {handleQualitativeToggle && (
                      <td className="border border-gray-200 p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={kpi.is_qualitative || false}
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