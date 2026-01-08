import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiUsers, FiPlus, FiUpload, FiEdit, FiTrash2, FiSearch, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Employee {
  id: number;
  name: string;
  email?: string;
  payroll_number: string;
  national_id?: string;
  department?: string;
  department_name?: string;
  position?: string;
  employment_date?: string;
  manager_id?: number;
  manager_name?: string;
  created_at: string;
}

interface EmployeeFormData {
  name: string;
  email: string;
  payrollNumber: string;
  nationalId: string;
  department: string;
  departmentId: string;
  position: string;
  employmentDate: string;
  managerId: string;
}

const Employees: React.FC = () => {
  // const navigate = useNavigate(); // Unused - keeping for potential future use
  const [searchParams] = useSearchParams();
  const { user, selectedCompany } = useAuth();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [managers, setManagers] = useState<Array<{ id: number; name: string }>>([]);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    payrollNumber: '',
    nationalId: '',
    department: '',
    departmentId: '',
    position: '',
    employmentDate: '',
    managerId: '',
  });

  const companyId = searchParams.get('companyId') || (user?.role === 'super_admin' ? selectedCompany?.id : user?.company_id);

  useEffect(() => {
    fetchEmployees();
  }, [page, search, companyId]);

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, [companyId, user?.company_id]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (companyId) params.companyId = companyId;
      
      // If manager, filter by manager_id
      if (user?.role === 'manager' && user?.id) {
        params.managerId = user.id;
      }
      
      const response = await api.get('/employees', { params });
      setEmployees(response.data.employees || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(response.data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      if (companyId) {
        const response = await api.get(`/companies/${companyId}/departments`);
        setDepartments(response.data.departments || []);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchManagers = async () => {
    try {
      const targetCompanyId = companyId || user?.company_id;
      if (targetCompanyId) {
        const response = await api.get('/employees/managers', { 
          params: { companyId: targetCompanyId } 
        });
        setManagers((response.data.managers || []).map((m: any) => ({ id: m.id, name: m.name })));
      }
    } catch (err) {
      console.error('Failed to fetch managers:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params: any = {};
      if (companyId) params.companyId = companyId;
      
      await api.post('/employees', formData, { params });
      setShowAddModal(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    try {
      const params: any = {};
      if (companyId) params.companyId = companyId;
      
      await api.put(`/employees/${selectedEmployee.id}`, formData, { params });
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      setDeleting(true);
      const params: any = {};
      if (companyId) params.companyId = companyId;
      
      await api.delete(`/employees/${selectedEmployee.id}`, { params });
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', excelFile);
      
      const params: any = {};
      if (companyId) params.companyId = companyId;
      
      const response = await api.post('/employees/upload', formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(`Successfully imported ${response.data.imported} employees${response.data.skipped > 0 ? `, ${response.data.skipped} skipped` : ''}`);
      setShowUploadModal(false);
      setExcelFile(null);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload employees');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      payrollNumber: '',
      nationalId: '',
      department: '',
      departmentId: '',
      position: '',
      employmentDate: '',
      managerId: '',
    });
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    // Find department ID from department name
    const dept = departments.find(d => d.name === employee.department || d.name === employee.department_name);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      payrollNumber: employee.payroll_number,
      nationalId: employee.national_id || '',
      department: employee.department_name || employee.department || '',
      departmentId: dept?.id?.toString() || '',
      position: employee.position || '',
      employmentDate: employee.employment_date ? employee.employment_date.split('T')[0] : '',
      managerId: employee.manager_id?.toString() || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  if (user?.role === 'super_admin' && !companyId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please select a company to view employees.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employees</h1>
          <p className="text-gray-600">
            {user?.role === 'manager' ? 'View and manage your team members' : 'Manage employees in your organization'}
          </p>
        </div>
        {user?.role === 'hr' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiUpload />
              <span>Upload Excel</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FiPlus />
              <span>Add Employee</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, payroll number, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Employees Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiUsers className="mx-auto text-5xl text-gray-400 mb-4" />
          <p className="text-gray-600">No employees found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payroll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employment Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        {employee.email && (
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.payroll_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department_name || employee.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.manager_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.employment_date ? new Date(employee.employment_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(employee)}
                            className="text-blue-600 hover:text-blue-900 p-2"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          {user?.role === 'hr' && (
                            <button
                              onClick={() => openDeleteModal(employee)}
                              className="text-red-600 hover:text-red-900 p-2"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} employees
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft />
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Add Employee</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="employee@company.com"
                />
                <p className="text-xs text-gray-500 mt-1">Employee will use this for login. Default password: Africa.1</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payroll Number *</label>
                <input
                  type="text"
                  required
                  value={formData.payrollNumber}
                  onChange={(e) => setFormData({ ...formData, payrollNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">National ID</label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const dept = departments.find(d => d.id === parseInt(deptId));
                    setFormData({
                      ...formData,
                      departmentId: deptId,
                      department: dept?.name || ''
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manager</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Manager</option>
                  {managers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employment Date</label>
                <input
                  type="date"
                  value={formData.employmentDate}
                  onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal - Similar structure to Add Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Edit Employee</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedEmployee(null); resetForm(); }}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditEmployee} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto px-6 py-4 space-y-4">
              {/* Same form fields as Add Modal */}
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payroll Number *</label>
                <input
                  type="text"
                  required
                  value={formData.payrollNumber}
                  onChange={(e) => setFormData({ ...formData, payrollNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">National ID</label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const dept = departments.find(d => d.id === parseInt(deptId));
                    setFormData({
                      ...formData,
                      departmentId: deptId,
                      department: dept?.name || ''
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manager</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Manager</option>
                  {managers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employment Date</label>
                <input
                  type="date"
                  value={formData.employmentDate}
                  onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedEmployee(null); resetForm(); }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Employee</h2>
            <p className="mb-6">
              Are you sure you want to delete <strong>{selectedEmployee.name}</strong>? 
              This will also delete all their KPIs and related data. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedEmployee(null); }}
                className="px-4 py-2 border rounded-lg"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Excel Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Employees from Excel</h2>
              <button onClick={() => { setShowUploadModal(false); setExcelFile(null); }}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleUploadExcel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                  <p className="text-sm font-semibold mb-2">Excel File Structure:</p>
                  <p className="text-xs text-gray-600 mb-2">Required columns:</p>
                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1 mb-3">
                    <li><strong>Name</strong> - Employee full name (required)</li>
                    <li><strong>Payroll Number</strong> - Unique payroll identifier (required)</li>
                    <li><strong>National ID</strong> - National identification number (required)</li>
                  </ol>
                  <p className="text-xs text-gray-600 mb-2">Optional columns:</p>
                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1" start={4}>
                    <li><strong>Department</strong> - Department name (must match existing departments)</li>
                    <li><strong>Position</strong> - Job position/title</li>
                    <li><strong>Employment Date</strong> - Format: YYYY-MM-DD or MM/DD/YYYY</li>
                    <li><strong>Manager Email</strong> - Email of assigned manager (must match existing manager)</li>
                  </ol>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Note:</strong> See EXCEL_TEMPLATE_GUIDE.md for detailed format and examples.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowUploadModal(false); setExcelFile(null); }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !excelFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

