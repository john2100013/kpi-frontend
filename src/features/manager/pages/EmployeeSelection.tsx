import React from 'react';
import { FiArrowLeft, FiUser, FiSearch, FiEye, FiEdit, FiFileText, FiCalendar, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';
import { Button } from '../../../components/common';
import { useManagerEmployeeSelection } from '../hooks';

const EmployeeSelection: React.FC = () => {
  const {
    loading,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    currentEmployees,
    filteredEmployees,
    employeesPerPage,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    pendingReviewsCount,
    managerDepartments,
    handlePreviousPage,
    handleNextPage,
    handleScrollToEmployees,
    handleNavigateToTemplates,
    handleNavigateToReviews,
    handleNavigateToScheduleMeeting,
    handleViewKPIs,
    handleSetKPI,
    handleBack,
  } = useManagerEmployeeSelection();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Separate departments by type
  const primaryDepartments = managerDepartments.filter(dept => dept.is_primary === 1);
  const oversightDepartments = managerDepartments.filter(dept => dept.is_primary === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleBack}
          variant="ghost"
          icon={FiArrowLeft}
          className="p-2"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Select Employee</h1>
          <p className="text-sm text-gray-600 mt-1">Choose an employee to set KPIs for</p>
          
          {/* Department Assignments */}
          {managerDepartments.length > 0 && (
            <div className="mt-3 space-y-2">
              {primaryDepartments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Primary:</span>
                  {primaryDepartments.map(dept => (
                    <span
                      key={dept.department_id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                      {dept.name} ({dept.employee_count})
                    </span>
                  ))}
                </div>
              )}
              {oversightDepartments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Oversight:</span>
                  {oversightDepartments.map(dept => (
                    <span
                      key={dept.department_id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                    >
                      {dept.name} ({dept.employee_count})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleScrollToEmployees}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiEdit className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Set New KPI</p>
                <p className="text-sm text-gray-500">Create KPI for employee</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleNavigateToTemplates}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FiFileText className="text-indigo-600 text-xl" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">KPI Templates</p>
                <p className="text-sm text-gray-500">Create & use templates</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleNavigateToReviews}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiFileText className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Review KPIs</p>
                <p className="text-sm text-gray-500">
                  {pendingReviewsCount} pending reviews
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleNavigateToScheduleMeeting}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCalendar className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Schedule Meeting</p>
                <p className="text-sm text-gray-500">KPI review meetings</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, payroll number, or department..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as 'all' | 'primary')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Departments</option>
              <option value="primary">Primary Departments Only</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 employee-list-section">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Employees ({filteredEmployees.length})
            </h2>
            <p className="text-sm text-gray-500">
              Showing {filteredEmployees.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payroll Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                currentEmployees.map((employee) => {
                  // Check if this is an oversight-only employee (manager is not primary)
                  const isOversightOnly = employee.is_primary === 0;
                  
                  return (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiUser className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{employee.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{employee.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{employee.payroll_number || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-900">{employee.department || '-'}</p>
                        {isOversightOnly && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1 w-fit">
                            Oversight Only
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{employee.position || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewKPIs(employee.id);
                          }}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm whitespace-nowrap"
                          style={{minWidth: '110px', width: '110px'}}
                        >
                          <FiEye className="mr-2" size={16} />
                          View KPIs
                        </button>
                        {isOversightOnly ? (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-xs text-gray-700 text-center" style={{minWidth: '180px', width: '180px', height: '36px'}}>
                            <p className="line-clamp-2 w-full">
                              {employee.assigned_manager_name || 'Primary manager'} will set KPI for this employee
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSetKPI(employee.id)}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 whitespace-nowrap"
                            style={{minWidth: '180px', width: '180px'}}
                          >
                            <FiEdit className="mr-2" size={16} />
                            Set KPI
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredEmployees.length > employeesPerPage && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                icon={FiChevronLeft}
              >
                Previous
              </Button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                iconPosition="right"
                icon={FiChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSelection;
