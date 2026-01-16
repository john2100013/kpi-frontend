import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiPlus, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { userManagementService } from '../services/userManagementService';

interface Manager {
  id: number;
  name: string;
  email: string;
  company_id: number;
  company_name?: string;
  payroll_number?: string;
}

interface Department {
  id: number;
  name: string;
  employee_count?: number;
}

interface ManagerDepartment {
  manager_id: number;
  department_id: number;
  assigned_date?: string;
}

const AssignManagerDepartments: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [selectedDepartments, setSelectedDepartments] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentAssignments, setCurrentAssignments] = useState<ManagerDepartment[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchManagersAndDepartments();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedManager && selectedCompany) {
      fetchManagerAssignments();
    }
  }, [selectedManager]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('[AssignManagerDepartments] Fetching companies...');
      const companiesData = await userManagementService.fetchCompanies();
      console.log('[AssignManagerDepartments] Companies fetched:', companiesData);
      setCompanies(companiesData);

      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id.toString());
      }
    } catch (error: any) {
      console.error('[AssignManagerDepartments] Error fetching companies:', error);
      toast.error(error.response?.data?.error || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagersAndDepartments = async () => {
    if (!selectedCompany) return;

    try {
      console.log('[AssignManagerDepartments] Fetching managers for company:', selectedCompany);
      // Fetch managers (role_id = 2) for the selected company
      const managersData = await userManagementService.fetchAllUsers({
        role: '2', // managers
        company: selectedCompany
      });
      console.log('[AssignManagerDepartments] Managers fetched:', managersData.length);
      // Cast User array to Manager array - User has all required Manager properties
      setManagers(managersData as Manager[]);

      // Fetch departments for the selected company
      console.log('[AssignManagerDepartments] Fetching departments for company:', selectedCompany);
      const departmentsData = await userManagementService.fetchDepartments(parseInt(selectedCompany));
      console.log('[AssignManagerDepartments] Departments fetched:', departmentsData.length);
      setDepartments(departmentsData);

      setSelectedManager('');
      setSelectedDepartments(new Set());
      setCurrentAssignments([]);
    } catch (error: any) {
      console.error('[AssignManagerDepartments] Error fetching data:', error);
      toast.error('Failed to load managers and departments');
      setManagers([]);
      setDepartments([]);
    }
  };

  const fetchManagerAssignments = async () => {
    if (!selectedManager) return;

    try {
      console.log('[AssignManagerDepartments] Fetching assignments for manager:', selectedManager);
      
      // Use userManagementService which has proper axios setup
      const response = await userManagementService.getManagerDepartments(parseInt(selectedManager));
      
      console.log('[AssignManagerDepartments] Manager assignments response:', response);
      
      const assignments = response.data?.assignments || response.data?.data?.assignments || response.assignments || [];
      setCurrentAssignments(assignments);
      
      // Set selected departments based on current assignments
      const departmentIds = new Set<number>(assignments.map((a: ManagerDepartment) => a.department_id));
      setSelectedDepartments(departmentIds);
      console.log('[AssignManagerDepartments] Selected departments set:', departmentIds);
    } catch (error: any) {
      console.error('[AssignManagerDepartments] Error fetching assignments:', error.message);
      console.error('[AssignManagerDepartments] Error details:', error.response?.data || error);
      
      // If no assignments found (404), just clear the selection
      if (error.response?.status === 404) {
        setCurrentAssignments([]);
        setSelectedDepartments(new Set());
        return;
      }
      
      // For other errors, still clear to allow continuing
      setCurrentAssignments([]);
      setSelectedDepartments(new Set<number>());
    }
  };

  const handleDepartmentToggle = (departmentId: number) => {
    setSelectedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(departmentId)) {
        newSet.delete(departmentId);
      } else {
        newSet.add(departmentId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedManager || !selectedCompany) {
      toast.error('Please select a manager');
      return;
    }

    try {
      setSaving(true);
      console.log('[AssignManagerDepartments] Saving assignments for manager:', selectedManager);
      console.log('[AssignManagerDepartments] Selected departments:', Array.from(selectedDepartments));

      await userManagementService.assignManagerDepartments(
        parseInt(selectedManager),
        Array.from(selectedDepartments)
      );

      toast.success('Manager departments assigned successfully');
      
      // Refresh assignments - wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchManagerAssignments();
    } catch (error: any) {
      console.error('[AssignManagerDepartments] Error saving assignments:', error);
      toast.error(error.response?.data?.error || 'Failed to assign departments');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/super-admin/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Assign Manager to Departments</h1>
          <p className="text-sm text-gray-600 mt-1">
            Select a manager and assign them to departments in their company
          </p>
        </div>
      </div>

      {/* Company Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Company *</label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          required
        >
          {companies.length === 0 && <option value="">No companies available</option>}
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCompany && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Managers List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Managers</h2>
            {managers.length === 0 ? (
              <p className="text-sm text-gray-500">No managers available in this company</p>
            ) : (
              <div className="space-y-2">
                {managers.map((manager) => (
                  <button
                    key={manager.id}
                    onClick={() => setSelectedManager(manager.id.toString())}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedManager === manager.id.toString()
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{manager.name}</div>
                    <div className="text-xs text-gray-500">{manager.email}</div>
                    {manager.payroll_number && (
                      <div className="text-xs text-gray-500">Payroll: {manager.payroll_number}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Departments Assignment */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {departments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-600 mb-4">No departments available for this company.</p>
                <p className="text-sm text-gray-500 mb-6">
                  Departments must be created first before assigning managers.
                </p>
                <button
                  onClick={() => navigate('/super-admin/department-management')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Department Management
                </button>
              </div>
            ) : selectedManager ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Assign Departments to {managers.find(m => m.id.toString() === selectedManager)?.name}
                </h2>

                <div className="space-y-3 mb-6">
                  {departments.map((dept) => {
                    const isAssigned = selectedDepartments.has(dept.id);
                    return (
                      <label
                        key={dept.id}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleDepartmentToggle(dept.id)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{dept.name}</div>
                          <div className="text-xs text-gray-500">
                            {dept.employee_count || 0} employees
                          </div>
                        </div>
                        {isAssigned && (
                          <FiCheckCircle className="text-lg text-green-600" />
                        )}
                      </label>
                    );
                  })}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <FiPlus className="text-lg" />
                    <span>{saving ? 'Saving...' : 'Save Assignments'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>Select a manager to assign departments</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignManagerDepartments;
