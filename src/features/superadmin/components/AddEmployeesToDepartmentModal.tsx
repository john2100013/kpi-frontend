import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { Modal } from '../../../components/common';
import { userManagementService, User } from '../services/userManagementService';

interface AddEmployeesToDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: { id: number; name: string } | null;
  companyId: string;
  onSave: (employeeIds: number[]) => Promise<void>;
}

export const AddEmployeesToDepartmentModal: React.FC<AddEmployeesToDepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
  companyId,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchEmployees();
    }
  }, [isOpen, companyId]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await userManagementService.fetchAllUsers({
        role: 'employee',
        company: companyId,
      });
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to fetch employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId: number) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmployees.length === 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave(selectedEmployees);
      setSelectedEmployees([]);
      onClose();
    } catch (error) {
      toast.error('Failed to save employees. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployees([]);
    onClose();
  };

  if (!department) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Add Employees to ${department.name}`} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select employees to add to this department:
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees available for this company
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {employees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.email}</p>
                    {employee.department && (
                      <p className="text-xs text-blue-600">Current: {employee.department}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || selectedEmployees.length === 0 || loading}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <FiSave className="text-lg" />
            <span>{saving ? 'Adding...' : 'Add to Department'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
