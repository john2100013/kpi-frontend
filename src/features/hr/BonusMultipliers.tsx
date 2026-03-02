import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchBonusMultipliers,
  createBonusMultiplier,
  updateBonusMultiplier,
  deleteBonusMultiplier,
  bulkUploadMultipliers,
} from '../../store/slices/bonusSlice';
import { Button, Card, Modal, Table, LoadingSpinner } from '../../components/common';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiDownload } from 'react-icons/fi';
import type { BonusMultiplier } from '../../services/bonusApi';
import { useToast } from '../../context/ToastContext';

interface MultiplierFormData {
  achievementPercentage: string;
  multiplier: string;
  displayOrder: string;
}

export const BonusMultipliers: React.FC = () => {
  const dispatch = useAppDispatch();
  const { multipliers, multipliersLoading } = useAppSelector((state) => state.bonus);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMultiplier, setEditingMultiplier] = useState<BonusMultiplier | null>(null);
  const [formData, setFormData] = useState<MultiplierFormData>({
    achievementPercentage: '',
    multiplier: '',
    displayOrder: '1',
  });

  useEffect(() => {
    dispatch(fetchBonusMultipliers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  
  }, [multipliers, multipliersLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const achievement = parseFloat(formData.achievementPercentage);
    const mult = parseFloat(formData.multiplier);


    if (isNaN(achievement) || isNaN(mult)) {
      toast.error('Please enter valid numbers');
      return;
    }

    if (achievement < 0 || achievement > 200) {
      toast.error('Achievement percentage must be between 0 and 200');
      return;
    }

    // Check for duplicate achievement percentage (client-side validation)
    const isDuplicate = multipliers.some(m => {
      // If editing, exclude current multiplier from duplicate check
      if (editingMultiplier && m.id === editingMultiplier.id) {
        return false;
      }
      return Number(m.achievement_percentage) === achievement;
    });

    if (isDuplicate) {
      toast.error('This achievement percentage already exists. Please use a different value.');
      return;
    }

    const multiplierData = {
      achievementPercentage: achievement,
      multiplier: mult,
      displayOrder: parseInt(formData.displayOrder) || 1,
    };


    try {
      if (editingMultiplier) {
        await dispatch(updateBonusMultiplier({
          multiplierId: editingMultiplier.id,
          multiplierData,
        })).unwrap();
        toast.success('Bonus multiplier updated successfully');
      } else {
        await dispatch(createBonusMultiplier(multiplierData)).unwrap();
        toast.success('Bonus multiplier created successfully');
      }
      handleCloseModal();
    } catch (error: any) {
      toast.error(error || 'Failed to save bonus multiplier');
    }
  };

  const handleEdit = (multiplier: BonusMultiplier) => {
    setEditingMultiplier(multiplier);
    setFormData({
      achievementPercentage: multiplier.achievement_percentage.toString(),
      multiplier: multiplier.multiplier.toString(),
      displayOrder: multiplier.display_order.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (multiplierId: number) => {
    if (!window.confirm('Are you sure you want to delete this bonus multiplier?')) {
      return;
    }

    try {
      await dispatch(deleteBonusMultiplier(multiplierId)).unwrap();
      toast.success('Bonus multiplier deleted successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to delete bonus multiplier');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMultiplier(null);
    setFormData({
      achievementPercentage: '',
      multiplier: '',
      displayOrder: '1',
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }


    try {
      const result = await dispatch(bulkUploadMultipliers(file)).unwrap();
      
      
      toast.success(
        `Successfully uploaded! Created: ${result.created}, Updated: ${result.updated}${
          result.errors?.length ? `, Errors: ${result.errors.length}` : ''
        }`
      );

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the list
      await dispatch(fetchBonusMultipliers());
    } catch (error: any) {
      toast.error(error || 'Failed to upload multipliers file. Please check the file format and try again.');
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = [
      ['Achievement %', 'Multiplier', 'Display Order'],
      ['0', '0', '1'],
      ['50', '0.8', '2'],
      ['70', '1.0', '3'],
      ['90', '1.2', '4'],
      ['110', '1.5', '5']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bonus_multipliers_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Template downloaded successfully');
  };

  const columns = [
    {
      header: 'Order',
      accessor: (multiplier: BonusMultiplier) => multiplier.display_order,
      width: '100px',
    },
    {
      header: 'Achievement %',
      accessor: (multiplier: BonusMultiplier) => `${multiplier.achievement_percentage}%`,
      width: '150px',
    },
    {
      header: 'Multiplier',
      accessor: (multiplier: BonusMultiplier) => Number(multiplier.multiplier).toFixed(4),
      width: '150px',
    },
    {
      header: 'Actions',
      accessor: (multiplier: BonusMultiplier) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(multiplier)}
            icon={FiEdit2}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(multiplier.id)}
            icon={FiTrash2}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (multipliersLoading && multipliers.length === 0) {
    return <LoadingSpinner />;
  }

 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonus Multipliers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure achievement percentage to multiplier mappings for bonus calculations
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={downloadTemplate}
            icon={FiDownload}
            variant="outline"
          >
            Download Template
          </Button>
          <Button
            onClick={handleUploadClick}
            icon={FiUpload}
            variant="outline"
          >
            Upload Excel
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            icon={FiPlus}
          >
            Add Multiplier
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Card>
        <Table
          data={multipliers}
          columns={columns}
          loading={multipliersLoading}
          pagination={true}
          rowsPerPage={20}
          emptyMessage="No bonus multipliers configured. Click 'Add Multiplier' to create one."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMultiplier ? 'Edit Bonus Multiplier' : 'Add Bonus Multiplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="w-full">
            <label htmlFor="achievementPercentage" className="block text-sm font-medium text-gray-700 mb-1">
              Achievement % <span className="text-red-500">*</span>
            </label>
            <input
              id="achievementPercentage"
              type="number"
              step="0.01"
              name="achievementPercentage"
              value={formData.achievementPercentage}
              onChange={handleInputChange}
              required
              placeholder="e.g., 80"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the achievement percentage value (0-200)</p>
          </div>

          <div className="w-full">
            <label htmlFor="multiplier" className="block text-sm font-medium text-gray-700 mb-1">
              Multiplier <span className="text-red-500">*</span>
            </label>
            <input
              id="multiplier"
              type="number"
              step="0.0001"
              name="multiplier"
              value={formData.multiplier}
              onChange={handleInputChange}
              required
              placeholder="e.g., 0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Multiplier value to apply for this achievement level</p>
          </div>

          <div className="w-full">
            <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              id="displayOrder"
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleInputChange}
              placeholder="e.g., 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={multipliersLoading}>
              {editingMultiplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BonusMultipliers;
