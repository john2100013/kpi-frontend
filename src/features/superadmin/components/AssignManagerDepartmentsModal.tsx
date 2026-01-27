import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { useToast } from '../../../context/ToastContext';
import { Modal } from '../../../components/common';
import api from '../../../services/api';

interface AssignManagerDepartmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager | null;
  departments: Department[];
  onSave: (managerId: number, departmentIds: number[]) => Promise<void>;
}

interface Manager {
  id: number;
  name: string;
  email: string;
  company_id?: number;
}

interface Department {
  id: number;
  name: string;
}

export const AssignManagerDepartmentsModal: React.FC<AssignManagerDepartmentsModalProps> = ({
  isOpen,
  onClose,
  manager,
  departments,
  onSave,
}) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);

  useEffect(() => {
    if (manager) {
      // Fetch current departments for this manager
      fetchManagerDepartments();
    }
  }, [manager]);

  const fetchManagerDepartments = async () => {
    if (!manager) return;
    
    try {
      const response = await api.get(`/users/${manager.id}/departments`);
      setSelectedDepartments(response.data.department_ids || []);
    } catch (error) {
      toast.error('Unable to load manager departments. Please try again.');
      setSelectedDepartments([]);
    }
  };

  const toggleDepartment = (deptId: number) => {
    setSelectedDepartments(prev => {
      if (prev.includes(deptId)) {
        return prev.filter(id => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manager) return;

    setSaving(true);
    try {
      await onSave(manager.id, selectedDepartments);
      onClose();
    } catch (error) {
      toast.error('Failed to assign departments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!manager) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Departments - ${manager.name}`} size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the departments that this manager will oversee:
          </p>

          {departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No departments available for this company
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {departments.map(dept => (
                <label
                  key={dept.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(dept.id)}
                    onChange={() => toggleDepartment(dept.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || departments.length === 0}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <FiSave className="text-lg" />
            <span>{saving ? 'Saving...' : 'Assign Departments'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
