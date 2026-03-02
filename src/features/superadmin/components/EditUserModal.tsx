import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser } from 'react-icons/fi';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: number, data: UserUpdateData) => Promise<void>;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'hr' | 'manager' | 'employee';
  role_id?: number;
  company_id?: number;
  company_name?: string;
  department?: string;
  department_id?: number;
  position?: string;
  payroll_number?: string;
  national_id?: string;
  phone_number?: string;
  employment_date?: string;
  has_sales_component?: number;
  sales_contribution_percentage?: number;
  kpi_contribution_percentage?: number;
  quarterly_variable_amount?: number;
  yearly_variable_amount?: number;
  permission_level?: number;
}

interface UserUpdateData {
  name: string;
  email: string;
  phone_number?: string;
  payroll_number?: string;
  national_id?: string;
  position?: string;
  employment_date?: string;
  has_sales_component?: boolean;
  sales_contribution_percentage?: number;
  kpi_contribution_percentage?: number;
  quarterly_variable_amount?: number;
  yearly_variable_amount?: number;
  permission_level?: number;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserUpdateData>({
    name: '',
    email: '',
    phone_number: '',
    payroll_number: '',
    national_id: '',
    position: '',
    employment_date: '',
    has_sales_component: false,
    sales_contribution_percentage: 0,
    kpi_contribution_percentage: 100,
    quarterly_variable_amount: 0,
    yearly_variable_amount: 0,
    permission_level: undefined,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        payroll_number: user.payroll_number || '',
        national_id: user.national_id || '',
        position: user.position || '',
        employment_date: user.employment_date || '',
        has_sales_component: user.has_sales_component === 1,
        sales_contribution_percentage: user.sales_contribution_percentage || 0,
        kpi_contribution_percentage: user.kpi_contribution_percentage || 100,
        quarterly_variable_amount: user.quarterly_variable_amount || 0,
        yearly_variable_amount: user.yearly_variable_amount || 0,
        permission_level: user.permission_level,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      // Reset percentages when toggling has_sales_component
      if (name === 'has_sales_component') {
        if (checked) {
          setFormData(prev => ({ ...prev, sales_contribution_percentage: 70, kpi_contribution_percentage: 30 }));
        } else {
          setFormData(prev => ({ ...prev, sales_contribution_percentage: 0, kpi_contribution_percentage: 100 }));
        }
      }
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await onSave(user.id, formData);
      onClose();
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiUser className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Edit User - {user.name}
                </h3>
                <p className="text-sm text-purple-100">
                  {user.company_name} • {user.role.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={saving}
              className="text-white hover:text-purple-100 disabled:opacity-50"
            >
              <FiX className="text-2xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0712345678 or +254712345678"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: 0712345678 or +254712345678 (for SMS notifications)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payroll Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="payroll_number"
                      value={formData.payroll_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      National ID
                    </label>
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Date
                    </label>
                    <input
                      type="date"
                      name="employment_date"
                      value={formData.employment_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Bonus Configuration Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">Bonus Configuration</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="has_sales_component"
                        checked={formData.has_sales_component}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        disabled={saving}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        This employee has a sales component
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Check this if the employee's bonus includes sales performance
                    </p>
                  </div>

                  {formData.has_sales_component && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sales Contribution (%)
                        </label>
                        <input
                          type="number"
                          name="sales_contribution_percentage"
                          value={formData.sales_contribution_percentage}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          disabled={saving}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Percentage from sales performance (common: 70% or 80%)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          KPI Contribution (%)
                        </label>
                        <input
                          type="number"
                          name="kpi_contribution_percentage"
                          value={formData.kpi_contribution_percentage}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          disabled={saving}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Percentage from KPI performance (common: 30% or 20%)
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quarterly Variable Amount
                      </label>
                      <input
                        type="number"
                        name="quarterly_variable_amount"
                        value={formData.quarterly_variable_amount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Base amount for quarterly bonus calculation
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yearly Variable Amount
                      </label>
                      <input
                        type="number"
                        name="yearly_variable_amount"
                        value={formData.yearly_variable_amount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Base amount for yearly bonus calculation
                      </p>
                    </div>
                  </div>

                  {formData.has_sales_component && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-xs text-blue-700">
                        <strong>Note:</strong> Sales and KPI percentages must add up to 100%. 
                        Common splits: 80/20, 70/30. For employees without sales component, use 0/100.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* HR Permission Level Section */}
              {(user.role === 'hr' || user.role_id === 3) && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">HR Access Control</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HR Access Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="permission_level"
                      value={formData.permission_level || ''}
                      onChange={(e) => setFormData({ ...formData, permission_level: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={saving}
                      required
                    >
                      <option value="">-- Select Access Level --</option>
                      <option value="5">Senior HR (Full Access)</option>
                      <option value="6">HR Assistant (Limited Access)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Determines bonus management access rights. Senior HR can manage bonuses, while HR Assistant has limited access.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Department assignments for managers can be changed using the "Assign Departments" button. 
                  Role and company cannot be changed after creation.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <FiSave className="text-lg" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
