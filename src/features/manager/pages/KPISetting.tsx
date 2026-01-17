import React from 'react';
import { FiArrowLeft, FiSave, FiSend, FiEye } from 'react-icons/fi';
import { Button, ConfirmDialog } from '../../../components/common';
import { KPIFormTable } from '../components/KPIFormTable';
import { useManagerKPISetting } from '../hooks';

const ManagerKPISetting: React.FC = () => {
  const {
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
    setKpiRows,
    setPeriod,
    setQuarter,
    setYear,
    setMeetingDate,
    setManagerSignature,
    setSelectedPeriodSetting,
    setTextModal,
    handleKpiChange,
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
  } = useManagerKPISetting();

  // Debug logging
  console.log('🏗️ [KPISetting] Component state:', {
    period,
    quarter,
    year,
    selectedPeriodSetting,
    availablePeriodsCount: availablePeriods?.length || 0,
    availablePeriods,
  });

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
            <h1 className="text-2xl font-bold text-gray-900">Set KPI for Employee</h1>
            <p className="text-sm text-gray-600 mt-1">Create new performance objective</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleSaveDraft} variant="outline" icon={FiSave}>Save as Draft</Button>
          <Button onClick={handleSubmit} disabled={saving} variant="primary" icon={FiSend} loading={saving}>Submit KPI</Button>
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
          <Button onClick={handleViewEmployeeKPIs} variant="primary" icon={FiEye} size="sm">View KPIs</Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-purple-600">{employee?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-semibold text-gray-900">{employee?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Position</p>
              <p className="font-semibold text-gray-900">{employee?.position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-semibold text-gray-900">{employee?.department}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shared KPI Form */}
      <KPIFormTable
        mode="setting"
        period={period}
        quarter={quarter}
        year={year}
        availablePeriods={availablePeriods}
        selectedPeriodSetting={selectedPeriodSetting}
        onPeriodChange={(newPeriod) => {
          setPeriod(newPeriod);
          setQuarter('Q1');
          // Clear selected period when switching period type
          setSelectedPeriodSetting(null);
        }}
        onQuarterChange={(newQuarter) => {
          setQuarter(newQuarter);
          // Find and set the selected period setting
          const matchingPeriod = availablePeriods.find(
            (p: any) => p.period_type === 'quarterly' && p.quarter === newQuarter && p.is_active
          );
          if (matchingPeriod) {
            setSelectedPeriodSetting(matchingPeriod);
            setYear(matchingPeriod.year);
            if (matchingPeriod.start_date) {
              setMeetingDate(new Date(matchingPeriod.start_date));
            }
          }
        }}
        onYearChange={(newYear) => {
          setYear(newYear);
          // For yearly periods, find and set the selected period setting
          if (period === 'yearly') {
            const matchingPeriod = availablePeriods.find(
              (p: any) => p.period_type === 'yearly' && p.year === newYear && p.is_active
            );
            if (matchingPeriod) {
              setSelectedPeriodSetting(matchingPeriod);
              if (matchingPeriod.start_date) {
                setMeetingDate(new Date(matchingPeriod.start_date));
              }
            }
          }
        }}
        meetingDate={meetingDate}
        onMeetingDateChange={setMeetingDate}
        kpiRows={kpiRows}
        onKpiRowsChange={setKpiRows}
        minRows={getMinRowsForPeriod()}
        handleKpiChange={handleKpiChange}
        handleQualitativeToggle={handleQualitativeToggle}
        handleAddRow={handleAddRow}
        handleRemoveRow={handleRemoveRow}
        managerSignature={managerSignature}
        onSignatureChange={setManagerSignature}
        textModal={textModal}
        setTextModal={setTextModal}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
      />
    </div>
  );
};

export default ManagerKPISetting;
