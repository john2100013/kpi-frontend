/**
 * EmployeeSelectionModal Component
 * 
 * Modal for selecting multiple employees to apply a KPI template to.
 * Supports filtering by department and select all functionality.
 */

import React, { useState, useEffect } from 'react';
import { FiUsers, FiFilter, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { Modal, Button } from '../../../components/common';

export interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department_id: number;
  department_name: string;
}

export interface Department {
  id: number;
  name: string;
  employee_count: number;
}

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  departments: Department[];
  onConfirm: (selectedEmployeeIds: number[]) => void;
  loading?: boolean;
  inline?: boolean; // New prop for inline mode (side panel)
}

export const EmployeeSelectionModal: React.FC<EmployeeSelectionModalProps> = ({
  isOpen,
  onClose,
  employees,
  departments,
  onConfirm,
  loading = false,
  inline = false, // Default to modal mode
}) => {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | 'all'>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  console.log('🔵 [EmployeeSelectionModal] Rendered with:', {
    isOpen,
    employeesCount: employees.length,
    departmentsCount: departments.length,
    selectedDepartmentId,
    selectedEmployeeIdsCount: selectedEmployeeIds.size,
  });

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔵 [EmployeeSelectionModal] Modal opened - resetting selections');
      setSelectedEmployeeIds(new Set());
      setSelectedDepartmentId('all');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter employees by selected department and search query
  const filteredEmployees = employees.filter((emp) => {
    const matchesDepartment =
      selectedDepartmentId === 'all' || emp.department_id === selectedDepartmentId;
    const matchesSearch =
      searchQuery === '' ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDepartment && matchesSearch;
  });

  console.log('🔍 [EmployeeSelectionModal] Filtered employees:', {
    totalEmployees: employees.length,
    filteredCount: filteredEmployees.length,
    selectedDepartmentId,
    searchQuery,
  });

  // Check if all filtered employees are selected
  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployeeIds.has(emp.id));

  const handleToggleEmployee = (employeeId: number) => {
    console.log('🔘 [EmployeeSelectionModal] Toggle employee:', employeeId);
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
        console.log('  ❌ Removed employee:', employeeId);
      } else {
        newSet.add(employeeId);
        console.log('  ✅ Added employee:', employeeId);
      }
      console.log('  📊 Total selected:', newSet.size);
      
      // In inline mode, update parent immediately
      if (inline) {
        console.log('  🔄 [Inline mode] Calling onConfirm with:', Array.from(newSet));
        onConfirm(Array.from(newSet));
      }
      
      return newSet;
    });
  };

  const handleSelectAll = () => {
    console.log('📋 [EmployeeSelectionModal] Select All clicked');
    if (allFilteredSelected) {
      // Deselect all filtered employees
      console.log('  ❌ Deselecting all filtered employees');
      setSelectedEmployeeIds((prev) => {
        const newSet = new Set(prev);
        filteredEmployees.forEach((emp) => newSet.delete(emp.id));
        console.log('  📊 Remaining selected:', newSet.size);
        
        // In inline mode, update parent immediately
        if (inline) {
          console.log('  🔄 [Inline mode] Calling onConfirm with:', Array.from(newSet));
          onConfirm(Array.from(newSet));
        }
        
        return newSet;
      });
    } else {
      // Select all filtered employees
      console.log('  ✅ Selecting all filtered employees:', filteredEmployees.length);
      setSelectedEmployeeIds((prev) => {
        const newSet = new Set(prev);
        filteredEmployees.forEach((emp) => newSet.add(emp.id));
        console.log('  📊 Total selected:', newSet.size);
        
        // In inline mode, update parent immediately
        if (inline) {
          console.log('  🔄 [Inline mode] Calling onConfirm with:', Array.from(newSet));
          onConfirm(Array.from(newSet));
        }
        
        return newSet;
      });
    }
  };

  const handleDepartmentChange = (departmentId: number | 'all') => {
    console.log('🏢 [EmployeeSelectionModal] Department filter changed:', departmentId);
    setSelectedDepartmentId(departmentId);
  };

  const handleConfirm = () => {
    console.log('✅ [EmployeeSelectionModal] Confirm clicked with:', {
      selectedCount: selectedEmployeeIds.size,
      selectedIds: Array.from(selectedEmployeeIds),
    });
    if (selectedEmployeeIds.size === 0) {
      console.warn('⚠️ [EmployeeSelectionModal] No employees selected');
      return;
    }
    onConfirm(Array.from(selectedEmployeeIds));
  };

  // Inline mode - render as side panel
  if (inline) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit sticky top-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Select Employees</h3>
            <FiUsers className="text-xl text-purple-600" />
          </div>

          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartmentId}
              onChange={(e) =>
                handleDepartmentChange(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.employee_count})
                </option>
              ))}
            </select>
          </div>

          {/* Select All Button */}
          <div className="flex items-center justify-between py-2 border-y border-gray-200">
            <span className="text-xs text-gray-600">
              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
            </span>
            <Button
              onClick={handleSelectAll}
              variant="ghost"
              size="sm"
              icon={allFilteredSelected ? FiCheckSquare : FiSquare}
              disabled={filteredEmployees.length === 0}
              className="text-xs"
            >
              {allFilteredSelected ? 'Deselect' : 'Select All'}
            </Button>
          </div>

          {/* Employee List - Scrollable */}
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiUsers className="mx-auto text-3xl mb-2" />
                <p className="text-sm">No employees found</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const isSelected = selectedEmployeeIds.has(employee.id);
                return (
                  <div
                    key={employee.id}
                    onClick={() => handleToggleEmployee(employee.id)}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <FiCheckSquare className="text-lg text-purple-600" />
                      ) : (
                        <FiSquare className="text-lg text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {employee.name}
                      </h4>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{employee.position}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                        {employee.department_name}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selection Summary */}
          {selectedEmployeeIds.size > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-900">
                {selectedEmployeeIds.size} Selected
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Ready to send KPIs to selected employees
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modal mode - original rendering
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Employees"
      size="xl"
      footer={
        <>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            disabled={selectedEmployeeIds.size === 0 || loading}
            loading={loading}
          >
            Apply to {selectedEmployeeIds.size} Employee{selectedEmployeeIds.size !== 1 ? 's' : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div className="w-64">
            <select
              value={selectedDepartmentId}
              onChange={(e) =>
                handleDepartmentChange(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.employee_count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Select All Button */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
            {selectedDepartmentId !== 'all' && (
              <span className="ml-2 text-purple-600 font-medium">
                in {departments.find((d) => d.id === selectedDepartmentId)?.name}
              </span>
            )}
          </span>
          <Button
            onClick={handleSelectAll}
            variant="ghost"
            size="sm"
            icon={allFilteredSelected ? FiCheckSquare : FiSquare}
            disabled={filteredEmployees.length === 0}
          >
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {/* Employee List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiUsers className="mx-auto text-4xl mb-2" />
              <p>No employees found</p>
            </div>
          ) : (
            filteredEmployees.map((employee) => {
              const isSelected = selectedEmployeeIds.has(employee.id);
              return (
                <div
                  key={employee.id}
                  onClick={() => handleToggleEmployee(employee.id)}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <FiCheckSquare className="text-xl text-purple-600" />
                    ) : (
                      <FiSquare className="text-xl text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {employee.name}
                      </h4>
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                        {employee.department_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="truncate">{employee.email}</span>
                      <span className="text-gray-400">•</span>
                      <span className="truncate">{employee.position}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selection Summary */}
        {selectedEmployeeIds.size > 0 && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-medium text-purple-900">
              {selectedEmployeeIds.size} employee{selectedEmployeeIds.size !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-purple-700 mt-1">
              The KPI template will be applied to all selected employees
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
