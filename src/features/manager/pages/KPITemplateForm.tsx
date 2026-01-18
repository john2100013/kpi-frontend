import React from 'react';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { Button, ConfirmDialog } from '../../../components/common';
import { KPIFormTable } from '../components/KPIFormTable';
import { useManagerKPITemplateForm } from '../hooks';

const KPITemplateForm: React.FC = () => {
  const {
    isEditMode,
    loading,
    saving,
    templateName,
    setTemplateName,
    description,
    setDescription,
    period,
    availablePeriods,
    selectedPeriodSetting,
    quarter,
    year,
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
    handlePeriodChange,
    handleQuarterChange,
    handleYearChange,
    handleSubmit,
    handleBack,
    handleConfirm,
    handleCancel,
  } = useManagerKPITemplateForm();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} className="p-2" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit KPI Template' : 'Create KPI Template'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update template details' : 'Create a reusable KPI template'}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving} variant="primary" icon={FiSave} loading={saving}>
          {isEditMode ? 'Update Template' : 'Create Template'}
        </Button>
      </div>

      {/* Template Basic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Software Developer Quarterly KPIs"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this template..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Form Table - Exactly like KPI Setting */}
      <KPIFormTable
        mode="template"
        period={period}
        quarter={quarter}
        year={year}
        availablePeriods={availablePeriods}
        selectedPeriodSetting={selectedPeriodSetting}
        onPeriodChange={handlePeriodChange}
        onQuarterChange={handleQuarterChange}
        onYearChange={handleYearChange}
        kpiRows={kpiItems}
        onKpiRowsChange={setKpiItems}
        minRows={1}
        handleKpiChange={updateKPIItem}
        handleQualitativeToggle={handleQualitativeToggle}  // Added - now works!
        handleAddRow={handleAddRow}
        handleRemoveRow={handleRemoveRow}
        textModal={textModal}
        setTextModal={setTextModal}
      />

      {/* Goal Weight Summary - For All Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Total Goal Weight (All Items)</h3>
            <p className="text-xs text-gray-500 mt-1">
              {kpiItems.filter(item => !item.is_qualitative && item.title && item.description).length} quantitative + {kpiItems.filter(item => item.is_qualitative && item.title && item.description).length} qualitative items
            </p>
          </div>
          <div className={`text-2xl font-bold ${totalGoalWeight === 100 ? 'text-green-600' : totalGoalWeight === 0 ? 'text-gray-400' : 'text-orange-600'}`}>
            {totalGoalWeight.toFixed(2)}%
          </div>
        </div>
        {totalGoalWeight > 0 && totalGoalWeight !== 100 && (
          <p className="text-sm text-orange-600 mt-2">
            ⚠️ Goal weights should total 100% for all items. Currently: {totalGoalWeight.toFixed(2)}%
          </p>
        )}
        {totalGoalWeight === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            💡 You can leave goal weights empty, or ensure they add up to 100% for all items.
          </p>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
};

export default KPITemplateForm;
