import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { adjustBonusAmount } from '../../../store/slices/bonusSlice';
import type { EmployeeBonus } from '../../../services/bonusApi';
import { useToast } from '../../../context/ToastContext';

interface BonusAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonus: EmployeeBonus;
  onSuccess?: () => void;
  isBulk?: boolean;
  selectedBonusIds?: number[];
}

const BonusAdjustmentModal: React.FC<BonusAdjustmentModalProps> = ({
  isOpen,
  onClose,
  bonus,
  onSuccess,
  isBulk = false,
  selectedBonusIds = [],
}) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { loading } = useAppSelector((state) => state.bonus);

  const [formData, setFormData] = useState({
    amount: bonus.final_bonus_amount || bonus.calculated_bonus_amount,
    reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount < 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isBulk && selectedBonusIds.length > 0) {
        // Bulk adjustment
        await Promise.all(
          selectedBonusIds.map(bonusId =>
            dispatch(
              adjustBonusAmount({
                bonusId,
                amount: Number(formData.amount),
                reason: formData.reason.trim(),
              })
            ).unwrap()
          )
        );
        toast.success(`${selectedBonusIds.length} bonus(es) adjusted successfully`);
      } else {
        // Single adjustment
        await dispatch(
          adjustBonusAmount({
            bonusId: bonus.id,
            amount: Number(formData.amount),
            reason: formData.reason.trim(),
          })
        ).unwrap();
        toast.success('Bonus amount adjusted successfully');
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error || 'Failed to adjust bonus amount');
    }
  };

  const handleClose = () => {
    setFormData({
      amount: bonus.final_bonus_amount || bonus.calculated_bonus_amount,
      reason: '',
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const originalAmount = parseFloat(String(bonus.final_bonus_amount || bonus.calculated_bonus_amount)) || 0;
  const difference = Number(formData.amount) - originalAmount;
  const differencePercent = originalAmount > 0 ? ((difference / originalAmount) * 100).toFixed(2) : '0.00';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isBulk ? `Bulk Adjust Bonus Amount (${selectedBonusIds.length} selected)` : "Adjust Bonus Amount"}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adjusting...' : 'Adjust Bonus'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee Info */}
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">{isBulk ? 'Applying to' : 'Employee'}</p>
          <p className="text-base font-medium text-gray-900">
            {isBulk ? `${selectedBonusIds.length} employees` : (bonus.employee_name || 'N/A')}
          </p>
        </div>

        {/* Amount Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600">Original Amount</p>
            <p className="text-lg font-semibold text-blue-600">
              KES {originalAmount.toFixed(2)}
            </p>
          </div>

          <div className="p-3 bg-green-50 rounded-md">
            <p className="text-sm text-gray-600">New Amount</p>
            <p className="text-lg font-semibold text-green-600">
              KES {Number(formData.amount).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Difference Indicator */}
        {difference !== 0 && (
          <div
            className={`p-3 rounded-md ${
              difference > 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Difference:
              </span>
              <span
                className={`text-lg font-semibold ${
                  difference > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {difference > 0 ? '+' : ''}
                KES {difference.toFixed(2)} ({differencePercent}%)
              </span>
            </div>
          </div>
        )}

        {/* New Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adjusted Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">
              KES
            </span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className={`w-full pl-16 pr-3 py-2 border rounded-md ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              min={0}
              step={0.01}
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Adjustment <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.reason ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
            placeholder="Provide a detailed reason for this adjustment (minimum 10 characters)"
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.reason.trim().length} characters
          </p>
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This adjustment will be recorded in the audit
            log and cannot be undone. Please ensure the amount and reason are
            correct.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default BonusAdjustmentModal;
