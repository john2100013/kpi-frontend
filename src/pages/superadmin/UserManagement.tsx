import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiSave, FiX, FiCheckCircle, FiPlus, FiUpload, FiUser, FiUsers, FiBriefcase } from 'react-icons/fi';

interface Company {
  id: number;
  name: string;
}

interface Manager {
  id: number;
  name: string;
  email: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'employee' | 'manager' | 'hr'>('employee');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'employee' | 'manager' | 'hr',
    company_id: '',
    payroll_number: '',
    national_id: '',
    department: '',
    position: '',
    employment_date: '',
    manager_id: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (formData.company_id && formData.role === 'employee') {
      fetchManagers(formData.company_id);
    }
  }, [formData.company_id, formData.role]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data.companies || []);
      setLoading(false);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to fetch companies');
      setLoading(false);
    }
  };

  const fetchManagers = async (companyId: string) => {
    try {
      const response = await api.get(`/employees/managers?companyId=${companyId}`);
      setManagers(response.data.managers || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleRoleChange = (role: 'employee' | 'manager' | 'hr') => {
    setSelectedRole(role);
    setFormData(prev => ({
      ...prev,
      role,
      manager_id: role === 'employee' ? prev.manager_id : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Prepare data for submission
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        company_id: parseInt(formData.company_id),
      };

      if (formData.payroll_number) submitData.payroll_number = formData.payroll_number;
      if (formData.national_id) submitData.national_id = formData.national_id;
      if (formData.department) submitData.department = formData.department;
      if (formData.position) submitData.position = formData.position;
      if (formData.employment_date) submitData.employment_date = formData.employment_date;
      if (formData.manager_id) submitData.manager_id = parseInt(formData.manager_id);

      await api.post('/companies/users', submitData);
      
      setSuccessMessage(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        company_id: '',
        payroll_number: '',
        national_id: '',
        department: '',
        position: '',
        employment_date: '',
        manager_id: '',
      });
      setShowForm(false);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.company_id) {
      setErrorMessage('Please select a company first');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.post(`/companies/${formData.company_id}/employees/upload`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSuccessMessage('Employees uploaded successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to upload employees');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Add employees, managers, and HR users
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <FiPlus className="text-lg" />
          <span>Add User</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
          <FiCheckCircle className="text-lg" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2">
          <FiX className="text-lg" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Role Selection */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => handleRoleChange('employee')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedRole === 'employee'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiUsers className="text-lg" />
              <span>Employee</span>
            </button>
            <button
              onClick={() => handleRoleChange('manager')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedRole === 'manager'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiBriefcase className="text-lg" />
              <span>Manager</span>
            </button>
            <button
              onClick={() => handleRoleChange('hr')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedRole === 'hr'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiUser className="text-lg" />
              <span>HR</span>
            </button>
          </div>

          {/* Bulk Upload for Employees */}
          {selectedRole === 'employee' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Bulk Upload Employees</h3>
                  <p className="text-sm text-blue-700">
                    Upload an Excel file (.xlsx) with employee data. Required columns: Name, Payroll Number, National ID, Department, Position, Employment Date, Manager Email
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={!formData.company_id || saving}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      formData.company_id && !saving
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiUpload className="text-lg" />
                    <span>Upload Excel</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Add User Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <select
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payroll Number
                </label>
                <input
                  type="text"
                  name="payroll_number"
                  value={formData.payroll_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {selectedRole === 'employee' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      National ID
                    </label>
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manager
                    </label>
                    <select
                      name="manager_id"
                      value={formData.manager_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!formData.company_id}
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>{manager.name} ({manager.email})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Date
                </label>
                <input
                  type="date"
                  name="employment_date"
                  value={formData.employment_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'employee',
                    company_id: '',
                    payroll_number: '',
                    national_id: '',
                    department: '',
                    position: '',
                    employment_date: '',
                    manager_id: '',
                  });
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <FiSave className="text-lg" />
                <span>{saving ? 'Creating...' : `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

