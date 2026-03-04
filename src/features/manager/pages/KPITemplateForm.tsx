import React, { useEffect } from 'react';
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
    handleQualitativeToggle,  // Added
    handlePeriodChange,
    handleQuarterChange,
    handleYearChange,
    handleSubmit,
    handleBack,
    handleConfirm,
    handleCancel,
  } = useManagerKPITemplateForm();


  useEffect(() => {
  
  }, [kpiItems]);

  useEffect(() => {

  }, [templateName]);

  useEffect(() => {

  }, [description]);

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
        <Button 
          onClick={handleSubmit} 
          disabled={saving} 
          variant="primary" 
          icon={FiSave} 
          loading={saving}
          className={!selectedPeriodSetting ? 'ring-2 ring-orange-400' : ''} 
        >
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
              onChange={(e) => {
                setTemplateName(e.target.value);
              }}
              placeholder="e.g., Software Developer Quarterly KPIs"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          {/* NEW: Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department (Optional)
              <span className="text-xs text-gray-500 ml-2">- Assign to specific department</span>
            </label>
            <select
              value={selectedDepartmentId || ''}
              onChange={(e) => {
                const deptId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedDepartmentId(deptId);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">No Department (Generic Template)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.enable_template_titles === 1 ? '✓ (Has Template Titles)' : ''}
                </option>
              ))}
            </select>
            {selectedDepartmentId && (
              <p className="text-xs text-gray-600 mt-1">
                This template will be associated with the selected department
              </p>
            )}
          </div>
          
          {/* NEW: Use Template Dropdown Checkbox */}
          {selectedDepartmentId && (
            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTemplateDropdown}
                  onChange={(e) => {
                    setUseTemplateDropdown(e.target.checked);
                  }}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Use Template Title Dropdown</span>
                  <p className="text-xs text-gray-600">
                    When enabled, users can select from predefined KPI titles for this department
                  </p>
                </div>
              </label>
              
              {useTemplateDropdown && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  {isDepartmentTemplateEnabled && templateTitles.length > 0 ? (
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        ✓ Template titles available: {templateTitles.length} titles
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Users will see a dropdown with these titles when creating KPI items
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-orange-800 font-medium">
                        ⚠ Template titles not available for this department
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Make sure the department has "Enable Template Titles" feature activated
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* END NEW */}
          
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
      {(() => {
       
        return null;
      })()}
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
        handleQualitativeToggle={handleQualitativeToggle}
        handleAddRow={handleAddRow}
        handleRemoveRow={handleRemoveRow}
        textModal={textModal}
        setTextModal={setTextModal}
        // Pass template titles props and dropdown control
        templateTitles={useTemplateDropdown ? templateTitles : []}
        isDepartmentTemplateEnabled={useTemplateDropdown && isDepartmentTemplateEnabled}
        employeeDepartmentId={selectedDepartmentId || undefined}
        useTemplateDropdown={useTemplateDropdown}
        onUseTemplateDropdownChange={setUseTemplateDropdown}
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
