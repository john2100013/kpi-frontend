import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { Modal } from '../../../components/common';

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSave: (name: string) => Promise<void>;
}

export const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (error) {
      console.error('Error saving department:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Department" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering, Sales, Marketing"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              The department will be created for the selected company.
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
            disabled={saving || !name.trim()}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <FiSave className="text-lg" />
            <span>{saving ? 'Adding...' : 'Add Department'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
