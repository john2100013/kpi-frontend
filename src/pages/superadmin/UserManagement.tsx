import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiEdit, FiChevronLeft, FiChevronRight, FiX, FiPlus, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi';

interface Company {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  payroll_number?: string;
  national_id?: string;
  department?: string;
  department_name?: string;
  position?: string;
  employment_date?: string;
  manager_id?: number;
  manager_name?: string;
  company_id: number;
  company_name?: string;
  assigned_departments?: Array<{ id: number; name: string }>;
}

interface UserCounts {
  employee: number;
  manager: number;
  hr: number;
}

interface EditFormData {
  name: string;
  email: string;
  payroll_number: string;
  national_id: string;
  department: string;
  position: string;
  employment_date: string;
  manager_id: string;
}

interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'hr';
  payroll_number: string;
  national_id: string;
  department: string;
  position: string;
  employment_date: string;
  manager_id: string;
}

interface AddHRToCompanyFormData {
  hr_id: string;
  company_ids: number[];
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'employee' | 'manager' | 'hr' | 'add-hr-to-company' | 'assign-manager-to-dept'>('employee');
  const [users, setUsers] = useState<User[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts>({ employee: 0, manager: 0, hr: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [managers, setManagers] = useState<Array<{ id: number; name: string }>>([]);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    email: '',
    payroll_number: '',
    national_id: '',
    department: '',
    position: '',
    employment_date: '',
    manager_id: '',
  });

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateUserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    payroll_number: '',
    national_id: '',
    department: '',
    position: '',
    employment_date: '',
    manager_id: '',
  });

  // Add HR to Company Modal State
  const [showAddHRModal, setShowAddHRModal] = useState(false);
  const [allHRUsers, setAllHRUsers] = useState<User[]>([]);
  const [addHRFormData, setAddHRFormData] = useState<AddHRToCompanyFormData>({
    hr_id: '',
    company_ids: [],
  });

  // Assign Manager to Departments Modal State
  const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);
  const [allManagers, setAllManagers] = useState<User[]>([]);
  const [selectedManagerForDept, setSelectedManagerForDept] = useState<string>('');
  const [managerDepartments, setManagerDepartments] = useState<number[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Array<{ id: number; name: string; company_name: string }>>([]);

  const LIMIT = 25;

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== 'all') {
      fetchUserCounts();
      fetchUsers();
    } else if (selectedCompanyId === 'all') {
      fetchAllCompaniesUserCounts();
      setUsers([]);
    } else {
      setUsers([]);
      setUserCounts({ employee: 0, manager: 0, hr: 0 });
    }
  }, [selectedCompanyId, activeTab, page]);

  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== 'all') {
      fetchDepartments();
      fetchManagers();
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data.companies || []);
    } catch (err: any) {
      setError('Failed to fetch companies');
    }
  };

  const fetchUserCounts = async () => {
    try {
      const response = await api.get('/users/counts', {
        params: { companyId: selectedCompanyId }
      });
      setUserCounts(response.data.counts);
    } catch (err: any) {
      console.error('Failed to fetch user counts:', err);
    }
  };

  const fetchAllCompaniesUserCounts = async () => {
    try {
      const response = await api.get('/users/counts');
      setUserCounts(response.data.counts);
    } catch (err: any) {
      console.error('Failed to fetch user counts:', err);
    }
  };

  const fetchUsers = async () => {
    // Skip fetching for special tabs
    if (activeTab === 'add-hr-to-company' || activeTab === 'assign-manager-to-dept') return;
    
    if (!selectedCompanyId || selectedCompanyId === 'all') return;
    
    try {
      setLoading(true);
      console.log('Fetching users with params:', { companyId: selectedCompanyId, role: activeTab, page, limit: LIMIT });
      const response = await api.get('/users', {
        params: {
          companyId: selectedCompanyId,
          role: activeTab,
          page,
          limit: LIMIT
        }
      });
      
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(response.data.pagination?.total || 0);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!selectedCompanyId || selectedCompanyId === 'all') return;
    
    try {
      const response = await api.get(`/companies/${selectedCompanyId}/departments`);
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchManagers = async () => {
    if (!selectedCompanyId || selectedCompanyId === 'all') return;
    
    try {
      const response = await api.get('/employees/managers', {
        params: { companyId: selectedCompanyId }
      });
      setManagers((response.data.managers || []).map((m: any) => ({ id: m.id, name: m.name })));
    } catch (err) {
      console.error('Failed to fetch managers:', err);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompanyId(e.target.value);
    setPage(1);
    setError('');
  };

  const handleTabChange = (tab: 'employee' | 'manager' | 'hr' | 'add-hr-to-company' | 'assign-manager-to-dept') => {
    console.log('Tab changed to:', tab);
    setActiveTab(tab);
    setPage(1);
    if (tab === 'add-hr-to-company') {
      fetchAllHRUsers();
    }
  };

  const fetchAllManagers = async () => {
    try {
      console.log('Fetching all managers across all companies...');
      const response = await api.get('/users', {
        params: { role: 'manager', limit: 1000 }
      });
      console.log('Managers fetched:', response.data.users?.length || 0);
      setAllManagers(response.data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch managers:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const fetchManagerDepartments = async (managerId: string) => {
    try {
      const manager = allManagers.find(m => m.id === parseInt(managerId));
      if (!manager) return;

      // Fetch all departments for the manager's company
      const response = await api.get(`/companies/${manager.company_id}/departments`);
      setAvailableDepartments(response.data.departments?.map((d: any) => ({
        ...d,
        company_name: companies.find(c => c.id === manager.company_id)?.name || ''
      })) || []);

      // Fetch manager's current department assignments
      const assignmentResponse = await api.get(`/users/${managerId}/departments`);
      setManagerDepartments(assignmentResponse.data.department_ids || []);
    } catch (err) {
      console.error('Failed to fetch manager departments:', err);
    }
  };

  const handleAssignManagerToDepartments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManagerForDept) {
      setError('Please select a manager');
      return;
    }
    if (managerDepartments.length === 0) {
      setError('Please select at least one department');
      return;
    }

    try {
      await api.post('/users/assign-manager-departments', {
        manager_id: parseInt(selectedManagerForDept),
        department_ids: managerDepartments,
      });
      
      setShowAssignManagerModal(false);
      setSelectedManagerForDept('');
      setManagerDepartments([]);
      setAvailableDepartments([]);
      setError('');
      alert('Manager successfully assigned to selected departments');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign manager to departments');
    }
  };

  const toggleDepartmentSelection = (deptId: number) => {
    setManagerDepartments(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const fetchAllHRUsers = async () => {
    try {
      console.log('Fetching all HR users across all companies...');
      const response = await api.get('/users', {
        params: { role: 'hr', limit: 1000 }
      });
      console.log('HR users fetched:', response.data.users?.length || 0);
      setAllHRUsers(response.data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch HR users:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const openCreateModal = (role: 'employee' | 'manager' | 'hr') => {
    setCreateFormData({
      name: '',
      email: '',
      password: '',
      role: role,
      payroll_number: '',
      national_id: '',
      department: '',
      position: '',
      employment_date: '',
      manager_id: '',
    });
    setShowCreateModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || selectedCompanyId === 'all') {
      setError('Please select a specific company');
      return;
    }

    try {
      const createData: any = {
        name: createFormData.name,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role,
        company_id: parseInt(selectedCompanyId),
      };

      // Add optional fields based on role
      if (createFormData.role === 'employee') {
        if (createFormData.payroll_number) createData.payroll_number = createFormData.payroll_number;
        if (createFormData.national_id) createData.national_id = createFormData.national_id;
        if (createFormData.department) createData.department = createFormData.department;
        if (createFormData.position) createData.position = createFormData.position;
        if (createFormData.employment_date) createData.employment_date = createFormData.employment_date;
        if (createFormData.manager_id) createData.manager_id = parseInt(createFormData.manager_id);
      } else {
        if (createFormData.department) createData.department = createFormData.department;
        if (createFormData.position) createData.position = createFormData.position;
      }

      await api.post('/auth/register', createData);
      
      setShowCreateModal(false);
      fetchUsers();
      fetchUserCounts();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleAddHRToCompanies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addHRFormData.hr_id) {
      setError('Please select an HR user');
      return;
    }
    if (addHRFormData.company_ids.length === 0) {
      setError('Please select at least one company');
      return;
    }

    try {
      await api.post('/users/add-hr-to-companies', {
        hr_id: parseInt(addHRFormData.hr_id),
        company_ids: addHRFormData.company_ids,
      });
      
      setShowAddHRModal(false);
      setAddHRFormData({ hr_id: '', company_ids: [] });
      setError('');
      alert('HR user successfully added to selected companies');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add HR to companies');
    }
  };

  const toggleCompanySelection = (companyId: number) => {
    setAddHRFormData(prev => ({
      ...prev,
      company_ids: prev.company_ids.includes(companyId)
        ? prev.company_ids.filter(id => id !== companyId)
        : [...prev.company_ids, companyId]
    }));
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    
    // Find department ID from department name
    
    setEditFormData({
      name: user.name,
      email: user.email,
      payroll_number: user.payroll_number || '',
      national_id: user.national_id || '',
      department: user.department_name || user.department || '',
      position: user.position || '',
      employment_date: user.employment_date ? user.employment_date.split('T')[0] : '',
      manager_id: user.manager_id?.toString() || '',
    });
    
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const updateData: any = {
        name: editFormData.name,
        email: editFormData.email,
      };
      
      // Add optional fields based on role
      if (activeTab === 'employee') {
        if (editFormData.payroll_number) updateData.payroll_number = editFormData.payroll_number;
        if (editFormData.national_id) updateData.national_id = editFormData.national_id;
        if (editFormData.department) updateData.department = editFormData.department;
        if (editFormData.position) updateData.position = editFormData.position;
        if (editFormData.employment_date) updateData.employment_date = editFormData.employment_date;
        if (editFormData.manager_id) updateData.manager_id = parseInt(editFormData.manager_id);
      } else {
        // For managers and HR, allow updating department and position
        if (editFormData.department) updateData.department = editFormData.department;
        if (editFormData.position) updateData.position = editFormData.position;
      }
      
      await api.put(`/users/${selectedUser.id}`, updateData, {
        params: { companyId: selectedCompanyId }
      });
      
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
      fetchUserCounts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      email: '',
      payroll_number: '',
      national_id: '',
      department: '',
      position: '',
      employment_date: '',
      manager_id: '',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">View and manage users across all companies</p>
          </div>
        </div>
      </div>

      {/* Company Selector */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Company
        </label>
        <select
          value={selectedCompanyId}
          onChange={handleCompanyChange}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">-- Select a Company --</option>
          <option value="all">All Companies (Counts Only)</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        {selectedCompanyId === 'all' && (
          <p className="mt-2 text-sm text-amber-600">
            Viewing totals only. Select a specific company to see user lists.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {selectedCompanyId && (
        <>
          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange('employee')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'employee'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Employees
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                    {userCounts.employee}
                  </span>
                </button>
                <button
                  onClick={() => handleTabChange('manager')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'manager'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Managers
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                    {userCounts.manager}
                  </span>
                </button>
                <button
                  onClick={() => handleTabChange('hr')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'hr'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  HR
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                    {userCounts.hr}
                  </span>
                </button>
                <button
                  onClick={() => handleTabChange('add-hr-to-company')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'add-hr-to-company'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Add HR to Companies
                </button>
                <button
                  onClick={() => {
                    fetchAllManagers();
                    setShowAssignManagerModal(true);
                  }}
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors"
                >
                  Assign Managers to Departments
                </button>
              </nav>
            </div>
          </div>

          {/* Add User Button */}
          {selectedCompanyId !== 'all' && activeTab !== 'add-hr-to-company' && activeTab !== 'assign-manager-to-dept' && (
            <div className="mb-4">
              <button
                onClick={() => openCreateModal(activeTab as 'employee' | 'manager' | 'hr')}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <FiPlus />
                <span>Add {activeTab === 'employee' ? 'Employee' : activeTab === 'manager' ? 'Manager' : 'HR'}</span>
              </button>
            </div>
          )}

          {/* Add HR to Company Section */}
          {activeTab === 'add-hr-to-company' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add HR to Multiple Companies</h2>
                  <p className="text-sm text-gray-600 mt-1">Select an HR user and assign them to multiple companies</p>
                </div>
                <button
                  onClick={() => setShowAddHRModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FiUserPlus />
                  <span>Add HR to Companies</span>
                </button>
              </div>
              <div className="text-gray-600">
                <p className="mb-4">This feature allows you to assign an HR user to multiple companies, enabling them to manage HR tasks across different organizations.</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Select an existing HR user from the dropdown</li>
                  <li>Choose one or more companies to assign them to</li>
                  <li>The HR user will gain access to all selected companies</li>
                </ul>
              </div>
            </div>
          )}

          {/* User List or Totals Message */}
          {activeTab !== 'add-hr-to-company' && selectedCompanyId === 'all' ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Viewing All Companies</h3>
              <p className="text-gray-600">
                Showing total counts only. Select a specific company to view and manage individual users.
              </p>
            </div>
          ) : activeTab !== 'add-hr-to-company' && loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-600">Loading users...</div>
            </div>
          ) : activeTab !== 'add-hr-to-company' && users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab}s found</h3>
              <p className="text-gray-600">
                There are no {activeTab}s in this company yet.
              </p>
            </div>
          ) : activeTab !== 'add-hr-to-company' ? (
            <>
              {/* Users Table */}
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                      {activeTab === 'employee' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Payroll Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Position</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Manager</th>
                        </>
                      )}
                      {(activeTab === 'manager' || activeTab === 'hr') && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                            {activeTab === 'manager' ? 'Assigned Departments' : 'Department'}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Position</th>
                        </>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        {activeTab === 'employee' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.payroll_number || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.department_name || user.department || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.position || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.manager_name || '-'}
                            </td>
                          </>
                        )}
                        {(activeTab === 'manager' || activeTab === 'hr') && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {activeTab === 'manager' && user.assigned_departments && user.assigned_departments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.assigned_departments.map((dept, idx) => (
                                    <span 
                                      key={dept.id}
                                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800"
                                    >
                                      {dept.name}
                                    </span>
                                  ))}
                                </div>
                              ) : activeTab === 'manager' ? (
                                <span className="text-gray-400 italic">No departments assigned</span>
                              ) : (
                                <span>{user.department_name || user.department || '-'}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.position || '-'}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit user"
                          >
                            <FiEdit className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow">
                  <div className="text-sm text-gray-700">
                    Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, total)} of {total} users
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <FiChevronLeft />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Add {createFormData.role === 'employee' ? 'Employee' : createFormData.role === 'manager' ? 'Manager' : 'HR'}</h2>
              <button onClick={() => { setShowCreateModal(false); }}>
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showCreatePassword ? "text" : "password"}
                      required
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCreatePassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>

                {createFormData.role === 'employee' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Payroll Number</label>
                      <input
                        type="text"
                        value={createFormData.payroll_number}
                        onChange={(e) => setCreateFormData({ ...createFormData, payroll_number: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">National ID</label>
                      <input
                        type="text"
                        value={createFormData.national_id}
                        onChange={(e) => setCreateFormData({ ...createFormData, national_id: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={createFormData.department}
                    onChange={(e) => setCreateFormData({ ...createFormData, department: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  <input
                    type="text"
                    value={createFormData.position}
                    onChange={(e) => setCreateFormData({ ...createFormData, position: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {createFormData.role === 'employee' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Employment Date</label>
                      <input
                        type="date"
                        value={createFormData.employment_date}
                        onChange={(e) => setCreateFormData({ ...createFormData, employment_date: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Manager</label>
                      <select
                        value={createFormData.manager_id}
                        onChange={(e) => setCreateFormData({ ...createFormData, manager_id: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Manager</option>
                        {managers.map(mgr => (
                          <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add HR to Company Modal */}
      {showAddHRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Add HR User to Companies</h2>
              <button onClick={() => { setShowAddHRModal(false); setAddHRFormData({ hr_id: '', company_ids: [] }); }}>
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleAddHRToCompanies} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select HR User *</label>
                  <select
                    required
                    value={addHRFormData.hr_id}
                    onChange={(e) => setAddHRFormData({ ...addHRFormData, hr_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Select HR User --</option>
                    {allHRUsers.map(hr => (
                      <option key={hr.id} value={hr.id}>
                        {hr.name} ({hr.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Companies *</label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {companies.filter(c => c.id).map(company => (
                      <label key={company.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={addHRFormData.company_ids.includes(company.id)}
                          onChange={() => toggleCompanySelection(company.id)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>{company.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {addHRFormData.company_ids.length} {addHRFormData.company_ids.length === 1 ? 'company' : 'companies'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowAddHRModal(false); setAddHRFormData({ hr_id: '', company_ids: [] }); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add to Companies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Edit {activeTab === 'employee' ? 'Employee' : activeTab === 'manager' ? 'Manager' : 'HR'}</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedUser(null); resetEditForm(); }}>
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {activeTab === 'employee' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Payroll Number</label>
                      <input
                        type="text"
                        value={editFormData.payroll_number}
                        onChange={(e) => setEditFormData({ ...editFormData, payroll_number: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">National ID</label>
                      <input
                        type="text"
                        value={editFormData.national_id}
                        onChange={(e) => setEditFormData({ ...editFormData, national_id: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  <input
                    type="text"
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {activeTab === 'employee' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Employment Date</label>
                      <input
                        type="date"
                        value={editFormData.employment_date}
                        onChange={(e) => setEditFormData({ ...editFormData, employment_date: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Manager</label>
                      <select
                        value={editFormData.manager_id}
                        onChange={(e) => setEditFormData({ ...editFormData, manager_id: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Manager</option>
                        {managers.map(mgr => (
                          <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedUser(null); resetEditForm(); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Assign Manager to Departments Modal */}
      {showAssignManagerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Assign Manager to Departments</h2>
              <button onClick={() => { setShowAssignManagerModal(false); setSelectedManagerForDept(''); setManagerDepartments([]); }}>
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleAssignManagerToDepartments} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Manager *
                  </label>
                  <select
                    value={selectedManagerForDept}
                    onChange={(e) => {
                      setSelectedManagerForDept(e.target.value);
                      if (e.target.value) {
                        fetchManagerDepartments(e.target.value);
                      } else {
                        setAvailableDepartments([]);
                        setManagerDepartments([]);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select a manager...</option>
                    {allManagers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email}) - {manager.company_name || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedManagerForDept && availableDepartments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Departments * (Manager will see employees from these departments)
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {availableDepartments.map(dept => (
                        <label
                          key={dept.id}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={managerDepartments.includes(dept.id)}
                            onChange={() => toggleDepartmentSelection(dept.id)}
                            className="mr-3 h-4 w-4 text-purple-600"
                          />
                          <span className="text-sm">{dept.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {managerDepartments.length} department(s) selected
                    </p>
                  </div>
                )}

                {selectedManagerForDept && availableDepartments.length === 0 && (
                  <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                    No departments found for this manager's company
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowAssignManagerModal(false); setSelectedManagerForDept(''); setManagerDepartments([]); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedManagerForDept || managerDepartments.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  Assign Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

