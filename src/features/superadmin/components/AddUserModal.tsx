import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiLock } from 'react-icons/fi';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';


interface Department {
  id: number;
  name: string;
}

interface Manager {
  id: number;
  name: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: number;
  companyName: string;
  preSelectedRoleId: string;
}

interface FormData {
  name: string;
  email: string;
  phone_number: string;
  payroll_number: string;
  national_id: string;
  position: string;
  employment_date: string;
  role_id: string;
  department_id: string;
  manager_id: string;
  password: string;
  confirmPassword: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSuccess, companyId, companyName, preSelectedRoleId }) => {
  const toast = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone_number: '',
    payroll_number: '',
    national_id: '',
    position: '',
    employment_date: '',
    role_id: preSelectedRoleId || '4',
    department_id: '',
    manager_id: '',
    password: '',
    confirmPassword: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch departments when modal opens
  useEffect(() => {
    if (isOpen && companyId) {
      fetchDepartments();
      // Set role from pre-selected filter
      setFormData(prev => ({ ...prev, role_id: preSelectedRoleId || '4' }));
    }
  }, [isOpen, companyId, preSelectedRoleId]);

  // Fetch managers when department changes
  useEffect(() => {
    if (formData.department_id && companyId) {
      fetchManagersByDepartment(formData.department_id);
    } else {
      setManagers([]);
      setFormData(prev => ({ ...prev, manager_id: '' }));
    }
  }, [formData.department_id, companyId]);

  const fetchDepartments = async () => {
    try {
      console.log('[AddUserModal] 📡 Fetching departments for company:', companyId);
      const response = await api.get(`/departments/list?companyId=${companyId}`);
      const depts = response.data.data?.departments || response.data.departments || [];
      console.log('[AddUserModal] ✅ Departments loaded:', { count: depts.length, depts });
      setDepartments(depts);
    } catch (err: any) {
      console.error('[AddUserModal] ❌ Failed to fetch departments:', err);
      setError('Failed to load departments');
    }
  };

  const fetchManagersByDepartment = async (departmentId: string) => {
    try {
      console.log('[AddUserModal] 📡 Fetching managers for department:', departmentId);
      const response = await api.get(`/departments/${departmentId}/managers?companyId=${companyId}`);
      const mgrs = response.data.data?.managers || response.data.managers || [];
      console.log('[AddUserModal] ✅ Department managers loaded:', { count: mgrs.length, mgrs });
      setManagers(mgrs);
      
      // Auto-assign manager if only one exists
      if (mgrs.length === 1) {
        console.log('[AddUserModal] 🎯 Auto-assigning single manager:', mgrs[0]);
        setFormData(prev => ({ ...prev, manager_id: mgrs[0].id.toString() }));
      } else if (mgrs.length === 0) {
        console.log('[AddUserModal] ⚠️ No managers found for this department');
        setFormData(prev => ({ ...prev, manager_id: '' }));
      } else {
        console.log('[AddUserModal] 📋 Multiple managers found, user must select');
        // Don't auto-assign if multiple managers, let user choose
        setFormData(prev => ({ ...prev, manager_id: '' }));
      }
    } catch (err: any) {
      console.error('[AddUserModal] ❌ Failed to fetch department managers:', err);
      setManagers([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.payroll_number.trim()) {
      setError('Payroll number is required');
      return false;
    }
    if (!formData.role_id) {
      setError('Role is required');
      return false;
    }
    
    // Password validation for Manager (role_id: 2) and HR (role_id: 3)
    const isManagerOrHR = formData.role_id === '2' || formData.role_id === '3';
    if (isManagerOrHR) {
      if (!formData.password) {
        setError('Password is required for Managers and HR');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log('[AddUserModal] 📤 Submitting user data:', {
      ...formData,
      companyId,
      companyName
    });

    try {
      const isManagerOrHR = formData.role_id === '2' || formData.role_id === '3';
      
      const payload = {
        company_id: companyId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim() || null,
        payroll_number: formData.payroll_number.trim(),
        national_id: formData.national_id.trim() || null,
        position: formData.position.trim() || null,
        employment_date: formData.employment_date || null,
        role_id: parseInt(formData.role_id),
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
        // Include password only for managers and HR, employees get default 'Africa.1'
        ...(isManagerOrHR && formData.password ? { password: formData.password } : {}),
      };

      console.log('[AddUserModal] 📦 Payload:', { ...payload, password: payload.password ? '***' : undefined });

      const response = await api.post('/users/create', payload);
      
      console.log('[AddUserModal] ✅ User created successfully:', response.data);
      
      toast.success('User created successfully');
      
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        payroll_number: '',
        national_id: '',
        position: '',
        employment_date: '',
        role_id: preSelectedRoleId || '4',
        department_id: '',
        manager_id: '',
        password: '',
        confirmPassword: '',
      });

      onSuccess();
    } catch (err: any) {
      console.error('[AddUserModal] ❌ Failed to create user:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create user';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        payroll_number: '',
        national_id: '',
        position: '',
        employment_date: '',
        role_id: preSelectedRoleId || '4',
        department_id: '',
        manager_id: '',
        password: '',
        confirmPassword: '',
      });
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

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
                  Add New {preSelectedRoleId === '4' ? 'Employee' : preSelectedRoleId === '2' ? 'Manager' : preSelectedRoleId === '3' ? 'HR' : 'User'}
                </h3>
                <p className="text-sm text-purple-100">Create a new user for {companyName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-white hover:text-purple-100 disabled:opacity-50"
            >
              <FiX className="text-2xl" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="John Doe"
                      disabled={loading}
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
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="john.doe@example.com"
                      disabled={loading}
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
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0712345678 or +254712345678"
                      disabled={loading}
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
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="EMP001"
                      disabled={loading}
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
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="12345678"
                      disabled={loading}
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
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Software Engineer"
                      disabled={loading}
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
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Role & Assignment</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={preSelectedRoleId === '4' ? 'Employee' : preSelectedRoleId === '2' ? 'Manager' : preSelectedRoleId === '3' ? 'HR' : 'User'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Role is set based on your current filter</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Company is set based on your current filter</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department {formData.role_id === '4' && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={loading}
                      required={formData.role_id === '4'}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {departments.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No departments available</p>
                    )}
                    {formData.role_id === '4' && formData.department_id && (
                      <p className="text-xs text-blue-600 mt-1">Manager will be assigned from this department</p>
                    )}
                  </div>

                  {formData.role_id === '4' && formData.department_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manager {managers.length > 1 && <span className="text-red-500">*</span>}
                      </label>
                      {managers.length === 0 ? (
                        <div className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-700">⚠️ No managers found in this department</p>
                        </div>
                      ) : managers.length === 1 ? (
                        <div className="w-full px-3 py-2 border border-green-300 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">✓ Auto-assigned: <strong>{managers[0].name}</strong></p>
                        </div>
                      ) : (
                        <select
                          name="manager_id"
                          value={formData.manager_id}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={loading}
                          required
                        >
                          <option value="">-- Select Manager --</option>
                          {managers.map(mgr => (
                            <option key={mgr.id} value={mgr.id}>
                              {mgr.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {managers.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">Multiple managers in this department - please select one</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Section - Only for Managers and HR */}
              {(() => {
                const isManagerOrHR = formData.role_id === '2' || formData.role_id === '3';
                console.log('[AddUserModal] Password section check:', { 
                  role_id: formData.role_id, 
                  isManagerOrHR,
                  preSelectedRoleId 
                });
                return isManagerOrHR;
              })() && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">Password Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter password (min. 6 characters)"
                        disabled={loading}
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Confirm password"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-start space-x-2">
                    <FiLock className="text-purple-600 text-sm mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-700">
                      For security, managers and HR must set their own secure password (minimum 6 characters).
                    </p>
                  </div>
                </div>
              )}

              {/* Default Password Info - Only for Employees */}
              {(() => {
                const isEmployee = formData.role_id === '4';
                console.log('[AddUserModal] Default password section check:', { 
                  role_id: formData.role_id, 
                  isEmployee 
                });
                return isEmployee;
              })() && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <FiLock className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Default Password</h4>
                      <p className="text-sm text-blue-700">
                        Employee will be created with default password <strong>"Africa.1"</strong> and will be required to change it on first login.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiUser />
                    <span>Create User</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
