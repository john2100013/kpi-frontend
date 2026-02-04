import React from 'react';
import { FiArrowLeft, FiPlus, FiTrash2, FiUsers, FiFolder } from 'react-icons/fi';
import { useDepartmentManagement } from '../hooks/useDepartmentManagement';
import { AddDepartmentModal, AddEmployeesToDepartmentModal } from '../components';

const DepartmentManagement: React.FC = () => {
  const {
    companies,
    departments,
    selectedCompany,
    setSelectedCompany,
    loading,
    showAddModal,
    setShowAddModal,
    showAddEmployeesModal,
    setShowAddEmployeesModal,
    selectedDepartment,
    setSelectedDepartment,
    handleAddDepartment,
    handleAddEmployees,
    handleDeleteDepartment,
    handleBack,
  } = useDepartmentManagement();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage departments and assign employees
          </p>
        </div>
      </div>

      {/* Company Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Company *
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            >
              {companies.length === 0 && <option value="">No companies available</option>}
              {companies.map((company: { id: number; name: string }) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedCompany && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FiPlus className="text-lg" />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Departments Table */}
      {selectedCompany && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Departments ({departments.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                    Department Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No departments found for this company
                    </td>
                  </tr>
                ) : (
                  departments.map((dept: any) => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FiFolder className="text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-900">{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {dept.company_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {dept.employee_count || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(dept.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDepartment(dept);
                              setShowAddEmployeesModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Add Employees"
                          >
                            <FiUsers className="text-lg" />
                          </button>

                          <button
                            onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Department"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      <AddDepartmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        companyId={selectedCompany}
        onSave={handleAddDepartment}
      />

      {/* Add Employees Modal */}
      <AddEmployeesToDepartmentModal
        isOpen={showAddEmployeesModal}
        onClose={() => {
          setShowAddEmployeesModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        companyId={selectedCompany}
        onSave={handleAddEmployees}
      />
    </div>
  );
};

export default DepartmentManagement;
