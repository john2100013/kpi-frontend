import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiSend, FiUsers, FiSearch, FiFilter } from 'react-icons/fi';
import { Button } from '../../../components/common';
import { useManagerApplyKPITemplate } from '../hooks';
import SignatureField from '../../../components/SignatureField';
import KPIItemDetailModal from '../components/KPIItemDetailModal';

// Add these type definitions
interface KPITemplateItem {
  title: string;
  description: string;
  target_value?: string;
  measure_unit?: string;
  current_performance_status?: string;
  expected_completion_date?: string;
  goal_weight?: string;
  is_qualitative?: boolean;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  employee_number: string;
  department: string;
  position: string;
}

const ApplyKPITemplate: React.FC = () => {
  const {
    template,
    filteredEmployees,
    selectedEmployees,
    meetingDate,
    managerSignature,
    loading,
    submitting,
    searchQuery,
    selectedDepartment,
    departments,
    handleEmployeeSelect,
    handleSelectAll,
    handleMeetingDateChange,
    handleSignatureChange,
    handleSubmit,
    handleBack,
    handleSearchChange,
    handleDepartmentChange,
  } = useManagerApplyKPITemplate();

  const [selectedKPIItem, setSelectedKPIItem] = useState<{ item: KPITemplateItem; index: number } | null>(null);

  useEffect(() => {
 
  }, [loading, template, filteredEmployees, selectedEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Template not found</div>
      </div>
    );
  }

  // Check if all filtered employees are selected
  const filteredIds = filteredEmployees.map(emp => emp.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedEmployees.includes(id));


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} className="p-2" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Apply KPI Template</h1>
            <p className="text-sm text-gray-600 mt-1">
              Select employees and assign KPIs from template: <span className="font-semibold">{template.template_name}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || selectedEmployees.length === 0 || !managerSignature}
          variant="primary"
          icon={FiSend}
          loading={submitting}
        >
          Send to {selectedEmployees.length} Employee(s)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Template Info */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6 space-y-6">
            {/* Template Header */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">📋 {template.template_name}</h2>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>

            {/* Template Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-700 font-medium">Period Type</p>
                <p className="text-lg font-bold text-purple-900 capitalize">
                  {template.period === 'annual' ? 'Yearly' : 'Quarterly'}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">KPI Items</p>
                <p className="text-lg font-bold text-blue-900">{template.item_count}</p>
              </div>
            </div>

            {/* KPI Items Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">KPI Items Preview</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {template.items?.map((item: KPITemplateItem, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedKPIItem({ item, index })}
                    className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200 hover:border-purple-300"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.target_value && (
                          <p className="text-xs text-purple-600 mt-1">
                            Target: {item.target_value} {item.measure_unit}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Click on any item to view full details
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Meeting Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Meeting Details</h3>
              
              {/* Meeting Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Date *
                </label>
                <input
                  type="date"
                  value={meetingDate ? meetingDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleMeetingDateChange(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Manager Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Signature *
                </label>
                <SignatureField
                  value={managerSignature}
                  onChange={handleSignatureChange}
                  label="Digital Signature"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Employee Selection */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FiUsers className="text-purple-600 text-xl" />
                <h2 className="text-lg font-semibold text-gray-900">Select Employees</h2>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Search - Reduced width */}
              <div className="relative w-72">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Department Filter - Reduced width */}
              <div className="relative w-56">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Spacer to push count to the right */}
              <div className="flex-1"></div>

              {/* Employee count */}
              <span className="text-sm text-gray-600">
                {filteredEmployees.length} employee(s)
              </span>
            </div>

            {/* Select All & Selected Count */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedEmployees.length > 0 && (
                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ {selectedEmployees.length} selected
                </div>
              )}
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <FiUsers className="mx-auto text-5xl text-gray-300 mb-3" />
                  <p className="text-gray-500">No employees found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filteredEmployees.map((employee: Employee) => (
                  <label
                    key={employee.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedEmployees.includes(employee.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeSelect(employee.id)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{employee.name}</p>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{employee.position}</p>
                          <p className="text-xs text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Item Detail Modal */}
      {selectedKPIItem && (
        <KPIItemDetailModal
          isOpen={!!selectedKPIItem}
          onClose={() => setSelectedKPIItem(null)}
          item={selectedKPIItem.item}
          index={selectedKPIItem.index}
        />
      )}
    </div>
  );
};

export default ApplyKPITemplate;
