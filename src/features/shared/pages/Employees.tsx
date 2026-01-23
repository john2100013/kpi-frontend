import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';
import { FiUsers, FiPlus, FiUpload, FiEdit, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Modal } from '../../../components/common';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchEmployees as fetchEmployeesThunk,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeesExcel
} from '../../../store/slices/employeeSlice';
import { fetchDepartments } from '../../../store/slices/departmentSlice';

interface Employee {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  payroll_number: string;
  national_id?: string;
  department?: string;
  position?: string;
  manager_id?: number;
  manager_name?: string;
  created_at: string;
  hire_date?: string;
}

interface EmployeeFormData {
  name: string;
  email: string;
  phoneNumber: string;
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
  const toast = useToast();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { 
    employees, 
    loading, 
    error: reduxError,
    pagination 
  } = useAppSelector(state => state.employees);
  const { departments: departmentsList } = useAppSelector(state => state.departments);
  
  // Local state
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  
  const [managers, setManagers] = useState<Array<{ id: number; name: string }>>([]);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phoneNumber: '',
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
    const params: any = { page, limit: 20 };
    if (search) params.search = search;
    if (companyId) params.companyId = companyId;
    
    // If manager, filter by manager_id
    if (user?.role === 'manager' && user?.id) {
      params.managerId = user.id;
    }
    
    dispatch(fetchEmployeesThunk(params));
  }, [dispatch, page, search, companyId, user?.role, user?.id]);

  useEffect(() => {
    if (companyId) {
      dispatch(fetchDepartments());
      fetchManagersLocal();
    }
  }, [dispatch, companyId]);
  
  // Update error state when Redux error changes
  useEffect(() => {
    if (reduxError) {
      setError(reduxError);
    }
  }, [reduxError]);

  const fetchManagersLocal = async () => {
    try {
      console.log('[Employees] 📡 Fetching managers...');
      const targetCompanyId = companyId || user?.company_id;
      console.log('[Employees] 🏢 Company ID:', targetCompanyId);
      if (targetCompanyId) {
        // Backend uses /users/managers/list endpoint
        const response = await api.get('/users/managers/list', { 
          params: { companyId: targetCompanyId } 
        });
        console.log('[Employees] ✅ Managers fetched:', {
          count: response.data.managers?.length || response.data.users?.length || 0,
          data: response.data
        });
        // Backend returns { users: [...] } or { managers: [...] }
        const managersData = response.data.managers || response.data.users || [];
        setManagers(managersData.map((m: any) => ({ id: m.id, name: m.name })));
      }
    } catch (err) {
      console.error('[Employees] ❌ Failed to fetch managers:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params: any = { page: 1, limit: 20 };
    if (search) params.search = search;
    if (companyId) params.companyId = companyId;
    if (user?.role === 'manager' && user?.id) {
      params.managerId = user.id;
    }
    dispatch(fetchEmployeesThunk(params));
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    if (companyId) params.companyId = companyId;
    
    // Transform formData to match expected API format
    const employeeData = {
      name: formData.name,
      email: formData.email,
      phone_number: formData.phoneNumber || undefined,
      payroll_number: formData.payrollNumber,
      department_id: formData.departmentId ? Number(formData.departmentId) : 0,
      position: formData.position,
      manager_id: formData.managerId ? Number(formData.managerId) : undefined,
      hire_date: formData.employmentDate || undefined,
    };
    
    const result = await dispatch(createEmployee(employeeData));
    if (createEmployee.fulfilled.match(result)) {
      toast.show('Employee added successfully', { type: 'success' });
      setShowAddModal(false);
      resetForm();
      // Refresh employee list
      dispatch(fetchEmployeesThunk({ page, limit: 20, search }));
    } else {
      toast.show(result.payload as string || 'Failed to add employee', { type: 'error' });
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    const params: any = {};
    if (companyId) params.companyId = companyId;
    
    // Transform formData to match expected API format
    const employeeData = {
      name: formData.name,
      email: formData.email,
      phone_number: formData.phoneNumber || undefined,
      payroll_number: formData.payrollNumber,
      department_id: formData.departmentId ? Number(formData.departmentId) : undefined,
      position: formData.position,
      manager_id: formData.managerId ? Number(formData.managerId) : undefined,
      hire_date: formData.employmentDate || undefined,
    };
    
    const result = await dispatch(updateEmployee({ 
      id: selectedEmployee.id, 
      data: employeeData
    }));
    if (updateEmployee.fulfilled.match(result)) {
      toast.show('Employee updated successfully', { type: 'success' });
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
      // Refresh employee list
      dispatch(fetchEmployeesThunk({ page, limit: 20, search }));
    } else {
      toast.show(result.payload as string || 'Failed to update employee', { type: 'error' });
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    setDeleting(true);
    const params: any = {};
    if (companyId) params.companyId = companyId;
    
    const result = await dispatch(deleteEmployee(selectedEmployee.id));
    if (deleteEmployee.fulfilled.match(result)) {
      toast.show('Employee deleted successfully', { type: 'success' });
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      // Refresh employee list
      dispatch(fetchEmployeesThunk({ page, limit: 20, search }));
    } else {
      toast.show(result.payload as string || 'Failed to delete employee', { type: 'error' });
    }
    setDeleting(false);
  };

  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;
    
    setUploading(true);
    const params: any = {};
    if (companyId) params.companyId = companyId;
    
    const result = await dispatch(uploadEmployeesExcel(excelFile));
    if (uploadEmployeesExcel.fulfilled.match(result)) {
      const { imported, skipped } = result.payload as any;
      toast.show(`Successfully imported ${imported} employees${skipped > 0 ? `, ${skipped} skipped` : ''}`, { type: 'success' });
      setShowUploadModal(false);
      setExcelFile(null);
      // Refresh employee list
      dispatch(fetchEmployeesThunk({ page, limit: 20, search }));
    } else {
      toast.show(result.payload as string || 'Failed to upload employees', { type: 'error' });
    }
    setUploading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      payrollNumber: '',
      nationalId: '',
      department: '',
      departmentId: '',
      position: '',
      employmentDate: '',
      managerId: '',
    });
  };

  const openEditModal = (employee: any) => {
    setSelectedEmployee(employee);
    // Find department ID from department name
    const dept = departmentsList.find(d => d.name === employee.department);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phoneNumber: employee.phone_number || '',
      payrollNumber: employee.payroll_number,
      nationalId: employee.national_id || '',
      department: employee.department || '',
      departmentId: dept?.id?.toString() || '',
      position: employee.position || '',
      employmentDate: employee.hire_date ? employee.hire_date.split('T')[0] : '',
      managerId: employee.manager_id?.toString() || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (employee: any) => {
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
                        {employee.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.manager_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}
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
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} employees
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
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
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
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Add Employee"
        size="md"
      >
        <form onSubmit={handleAddEmployee} className="flex flex-col">
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
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0712345678 or +254712345678"
                />
                <p className="text-xs text-gray-500 mt-1">For SMS notifications (e.g., password reset OTP)</p>
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
                    const dept = departmentsList.find(d => d.id === parseInt(deptId));
                    setFormData({
                      ...formData,
                      departmentId: deptId,
                      department: dept?.name || ''
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Department</option>
                  {departmentsList.map(dept => (
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
              <div className="flex justify-end space-x-3 mt-6">
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
      </Modal>

      {/* Edit Employee Modal - Similar structure to Add Modal */}
      <Modal
        isOpen={showEditModal && !!selectedEmployee}
        onClose={() => { setShowEditModal(false); setSelectedEmployee(null); resetForm(); }}
        title="Edit Employee"
        size="md"
      >
        {selectedEmployee && (
          <form onSubmit={handleEditEmployee} className="flex flex-col">
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
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0712345678 or +254712345678"
                />
                <p className="text-xs text-gray-500 mt-1">For SMS notifications (e.g., password reset OTP)</p>
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
                    const dept = departmentsList.find(d => d.id === parseInt(deptId));
                    setFormData({
                      ...formData,
                      departmentId: deptId,
                      department: dept?.name || ''
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Department</option>
                  {departmentsList.map(dept => (
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
              <div className="flex justify-end space-x-3 mt-6">
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
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal && !!selectedEmployee}
        onClose={() => { setShowDeleteModal(false); setSelectedEmployee(null); }}
        title="Delete Employee"
        size="md"
      >
        {selectedEmployee && (
          <>
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
          </>
        )}
      </Modal>

      {/* Upload Excel Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); setExcelFile(null); }}
        title="Upload Employees from Excel"
        size="md"
      >
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
      </Modal>
    </div>
  );
};

export default Employees;

