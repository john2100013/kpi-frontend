import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Modal } from '../../../components/common/Modal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2,
  FiStar,
  FiAlertCircle
} from 'react-icons/fi';
import { ManagerRatingNav } from '../components';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchRatingOptions, 
  createRatingScale,
  updateRatingScale,
  deleteRatingScale,
  selectRatingScales, 
  selectOptionsLoading, 
  selectOptionsError 
} from '../../../store/slices/managerRatingSlice';
import type { RatingOption } from '../../../store/slices/managerRatingSlice';

interface RatingScale {
  scaleName: string;
  options: RatingOption[];
}

/**
 * HR Manager Rating Options Page
 * Manage different rating scales (1-5 with different labels)
 */
export const ManagerRatingOptions: React.FC = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const groupedScales = useAppSelector(selectRatingScales);
  const loading = useAppSelector(selectOptionsLoading);
  const error = useAppSelector(selectOptionsError);
  
  // Local UI state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingScale, setEditingScale] = useState<string | null>(null);
  const [deletingScale, setDeletingScale] = useState<string | null>(null);
  
  // Form state
  const [scaleName, setScaleName] = useState('');
  const [options, setOptions] = useState<Array<{ rating_value: number; label: string; description: string }>>([
    { rating_value: 1, label: '', description: '' },
    { rating_value: 2, label: '', description: '' },
    { rating_value: 3, label: '', description: '' },
    { rating_value: 4, label: '', description: '' },
    { rating_value: 5, label: '', description: '' }
  ]);

  useEffect(() => {
    dispatch(fetchRatingOptions(false));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  const handleOpenModal = (scale?: RatingScale) => {
    if (scale) {
      // Edit existing scale
      setEditingScale(scale.scaleName);
      setScaleName(scale.scaleName);
      setOptions(scale.options.map(opt => ({
        rating_value: opt.rating_value,
        label: opt.label,
        description: opt.description || ''
      })));
    } else {
      // Create new scale
      setEditingScale(null);
      setScaleName('');
      setOptions([
        { rating_value: 1, label: '', description: '' },
        { rating_value: 2, label: '', description: '' },
        { rating_value: 3, label: '', description: '' },
        { rating_value: 4, label: '', description: '' },
        { rating_value: 5, label: '', description: '' }
      ]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingScale(null);
  };

  const handleOptionChange = (index: number, field: 'label' | 'description', value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index][field] = value;
    setOptions(updatedOptions);
  };

  const validateForm = (): boolean => {
    if (!scaleName.trim()) {
      toast.error('Please enter a rating scale name');
      return false;
    }

    for (let i = 0; i < options.length; i++) {
      if (!options[i].label.trim()) {
        toast.error(`Please enter a label for rating ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const data = {
        rating_scale_name: scaleName.trim(),
        options: options.map((opt, index) => ({
          rating_value: index + 1,
          label: opt.label.trim(),
          description: opt.description.trim() || null,
          display_order: index + 1
        }))
      };

      if (editingScale) {
        // Update existing scale
        await dispatch(updateRatingScale({ scaleName: editingScale, data })).unwrap();
        toast.success('Rating scale updated successfully');
      } else {
        // Create new scale
        await dispatch(createRatingScale(data)).unwrap();
        toast.success('Rating scale created successfully');
      }

      handleCloseModal();
    } catch (error: any) {
      toast.error(error || 'Failed to save rating scale');
    }
  };

  const handleDeleteScale = (scaleName: string) => {
    setDeletingScale(scaleName);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingScale) return;

    try {
      await dispatch(deleteRatingScale(deletingScale)).unwrap();
      toast.success('Rating scale deleted successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to delete rating scale');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingScale(null);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Manager Rating"
        subtitle="Manage rating scales for manager evaluations (1-5 scale with custom labels)"
        actions={
          <Button onClick={() => handleOpenModal()} variant="primary" icon={FiPlus}>
            Create Rating Scale
          </Button>
        }
      />
      <ManagerRatingNav />

      {groupedScales.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <FiStar className="mx-auto text-gray-400 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rating Scales</h3>
            <p className="text-gray-600 mb-6">
              Create rating scales to use in manager evaluation templates.
            </p>
            <Button onClick={() => handleOpenModal()} variant="primary" icon={FiPlus}>
              Create Your First Rating Scale
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Info Banner */}
          <Card className="mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">About Rating Scales</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    All rating scales use values 1-5, but you can customize the labels for different contexts. 
                    For example, use "Strongly Disagree" to "Strongly Agree" for opinion questions, 
                    or "Never" to "Always" for frequency questions.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Rating Scales List */}
          <div className="space-y-6">
            {groupedScales.map((scale) => (
              <Card key={scale.scaleName}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{scale.scaleName}</h3>
                      <p className="text-sm text-gray-600 mt-1">5-point rating scale</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleOpenModal(scale)}
                        variant="outline"
                        icon={FiEdit2}
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteScale(scale.scaleName)}
                        variant="outline"
                        icon={FiTrash2}
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Rating Options Display */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {scale.options.map((option) => (
                      <div
                        key={option.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center"
                      >
                        <div className="flex items-center justify-center mb-2">
                          {[...Array(option.rating_value)].map((_, i) => (
                            <FiStar key={i} className="text-yellow-500 fill-current text-sm" />
                          ))}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{option.rating_value}</div>
                        <div className="text-sm font-medium text-gray-700">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingScale ? 'Edit Rating Scale' : 'Create Rating Scale'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Define a 1-5 rating scale with custom labels for each value
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Scale Name *
            </label>
            <input
              type="text"
              value={scaleName}
              onChange={(e) => setScaleName(e.target.value)}
              placeholder="e.g., Agreement Scale, Frequency Scale, Performance Scale"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!!editingScale}
            />
            {editingScale && (
              <p className="text-xs text-gray-500 mt-1">
                Scale name cannot be changed when editing
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rating Options (1-5) *
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 w-20">
                      Rating {index + 1}:
                    </span>
                    <div className="flex">
                      {[...Array(index + 1)].map((_, i) => (
                        <FiStar key={i} className="text-yellow-500 fill-current text-xs" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                        placeholder={`Label for rating ${index + 1}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={option.description}
                        onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                        placeholder="Optional description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">Examples:</p>
            <p className="text-xs text-blue-700">
              <strong>Agreement Scale:</strong> Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree
            </p>
            <p className="text-xs text-blue-700 mt-1">
              <strong>Frequency Scale:</strong> Never, Rarely, Sometimes, Often, Always
            </p>
            <p className="text-xs text-blue-700 mt-1">
              <strong>Quality Scale:</strong> Poor, Fair, Good, Very Good, Excellent
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={handleCloseModal} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="primary">
              {editingScale ? 'Update Scale' : 'Create Scale'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Rating Scale"
        message={`Are you sure you want to delete the "${deletingScale}" rating scale? This action cannot be undone.`}
        confirmText="Delete"
      />
    </PageContainer>
  );
};

export default ManagerRatingOptions;
