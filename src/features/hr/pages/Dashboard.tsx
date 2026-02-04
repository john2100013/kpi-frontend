import React from 'react';
import NotificationItem from '../../../components/NotificationItem';
import { StatsCard, Button } from '../../../components/common';
import { useToast } from '../../../context/ToastContext';
import { FiFilter, FiEye, FiCheckCircle, FiFileText, FiBell, FiUsers, FiSave, FiSearch } from 'react-icons/fi';
import { useHRDashboard, getKPIStage, getCategoryLabel, getCategoryColor, getCategoryIcon, getPeriodLabel, getPeriodValue } from '../hooks';

const HRDashboard: React.FC = () => {
  const toast = useToast();
  const {
    kpis,
    reviews,
    departmentStatistics,
    departmentsList,
    periodSettings,
    notifications,
    recentActivity,
    selectedEmployeeId,
    employeeKPIs,
    loadingEmployeeKPIs,
    employeeSearch,
    setEmployeeSearch,
    filteredEmployees,
    filters,
    selectedDepartment,
    selectedCategory,
    kpisByCategory,
    defaultPeriod,
    savingDefault,
    managers,
    loading,
    kpiType,
    selectedPeriodId,
    quarterlyPeriods,
    yearlyPeriods,
    setFilters,
    saveDefaultPeriod,
    handleCategoryClick,
    handleNotificationClick,
    handleMarkNotificationRead,
    handleEmployeeSelect,
    clearCategorySelection,
    navigate,
    handleKpiTypeChange,
    handlePeriodChange,
  } = useHRDashboard();

  // Debug logging
  React.useEffect(() => {
  
  }, [periodSettings, departmentsList]);

  const handleSaveDefaultPeriod = async () => {
    const success = await saveDefaultPeriod(filters.period);
    if (success) {
      toast.success('Default period filter saved successfully!');
    } else {
      toast.error('Failed to save default period');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">HR Compliance Dashboard</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Button
              variant="ghost"
              icon={FiBell}
              rounded
              onClick={() => {
                navigate('/hr/notifications');
              }}
              aria-label="Notifications"
            />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            icon={FiEye}
            onClick={() => navigate('/hr/kpi-list')}
          >
            View All KPIs
          </Button>
          <Button
            variant="primary"
            icon={FiCheckCircle}
            onClick={() => navigate('/hr/acknowledged-kpis')}
          >
            Acknowledged KPIs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Departments</option>
              {Array.isArray(departmentsList) && departmentsList.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KPI Type</label>
            <select
              value={kpiType}
              onChange={(e) => handleKpiTypeChange(e.target.value as 'quarterly' | 'yearly')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {kpiType === 'quarterly' ? 'Select Quarter' : 'Select Year'}
            </label>
            <select
              value={selectedPeriodId || ''}
              onChange={(e) => handlePeriodChange(e.target.value ? parseInt(e.target.value) : 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              disabled={(kpiType === 'quarterly' ? quarterlyPeriods : yearlyPeriods).length === 0}
            >
              {kpiType === 'quarterly' ? (
                quarterlyPeriods.length > 0 ? (
                  quarterlyPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.quarter} {period.year}
                    </option>
                  ))
                ) : (
                  <option value="">No quarterly periods available</option>
                )
              ) : (
                yearlyPeriods.length > 0 ? (
                  yearlyPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.year}
                    </option>
                  ))
                ) : (
                  <option value="">No yearly periods available</option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
            <select
              value={filters.manager}
              onChange={(e) => setFilters({ ...filters, manager: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Managers</option>
              {Array.isArray(managers) && managers.map(manager => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
            <Button
              variant="success"
              icon={FiSave}
              onClick={handleSaveDefaultPeriod}
              disabled={savingDefault || !filters.period}
              loading={savingDefault}
              fullWidth
            >
              Set Default Period
            </Button>
          </div>
        </div>
        {defaultPeriod && (
          <div className="mt-3 text-sm text-green-600">
            Default period: {periodSettings.find(s => getPeriodValue(s) === defaultPeriod) ? 
              getPeriodLabel(periodSettings.find(s => getPeriodValue(s) === defaultPeriod)!) : 
              defaultPeriod}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatsCard
          title="Total Employees"
          value={departmentStatistics.reduce((sum, stat) => sum + stat.total_employees, 0)}
          icon={<FiUsers />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        
        <StatsCard
          title="Total KPIs"
          value={departmentStatistics.reduce((sum, stat) => {
            if (!stat.categories) return sum;
            return sum + stat.categories.pending + stat.categories.acknowledged_review_pending + 
              stat.categories.self_rating_submitted + stat.categories.awaiting_employee_confirmation +
              stat.categories.review_completed + stat.categories.review_rejected +
              stat.categories.review_pending;
          }, 0)}
          icon={<FiFileText />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatsCard
          title="KPI Review Completed"
          value={departmentStatistics.reduce((sum, stat) => {
            if (!stat.categories) return sum;
            return sum + stat.categories.review_completed;
          }, 0)}
          icon={<FiCheckCircle />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          titleColor="text-green-600 font-medium"
          valueColor="text-green-600"
        />
        
        <StatsCard
          title="KPI Setting Completed"
          value={departmentStatistics.reduce((sum, stat) => {
            if (!stat.categories) return sum;
            return sum + stat.categories.acknowledged_review_pending + 
              stat.categories.self_rating_submitted + stat.categories.awaiting_employee_confirmation +
              stat.categories.review_completed + stat.categories.review_rejected +
              stat.categories.review_pending;
          }, 0)}
          icon={<FiCheckCircle />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatsCard
          title="Employees without KPI"
          value={departmentStatistics.reduce((sum, stat) => {
            if (!stat.categories) return sum;
            return sum + stat.categories.no_kpi;
          }, 0)}
          icon={<FiUsers />}
          iconBgColor="bg-gray-100"
          iconColor="text-gray-600"
        />
      </div>

      {/* Department Statistics */}
      {!selectedDepartment || !selectedCategory ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Department Overview</h2>
          </div>
          {departmentStatistics.map((stat) => {
            const totalKPIs = stat.categories.pending + stat.categories.acknowledged_review_pending + 
                             stat.categories.self_rating_submitted + stat.categories.awaiting_employee_confirmation +
                             stat.categories.review_completed + stat.categories.review_rejected +
                             stat.categories.review_pending;
            const kpiSettingCompleted = stat.categories.acknowledged_review_pending + 
                                       stat.categories.self_rating_submitted + 
                                       stat.categories.awaiting_employee_confirmation +
                                       stat.categories.review_completed + 
                                       stat.categories.review_rejected +
                                       stat.categories.review_pending;
            
            return (
            <div key={stat.department} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{stat.department}</h3>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/hr/departments/${stat.department_id}/analytics`)}
                  >
                    View Analytics
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-gray-600">Total Employees: </span>
                    <span className="font-semibold text-gray-900">{stat.total_employees}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-gray-600">Total KPIs: </span>
                    <span className="font-semibold text-gray-900">{totalKPIs}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-gray-600">Setting Completed: </span>
                    <span className="font-semibold text-gray-900">{kpiSettingCompleted}</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="text-gray-600">Reviews Completed: </span>
                    <span className="font-semibold text-green-600">{stat.categories.review_completed}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">No KPI: </span>
                    <span className="font-semibold text-gray-900">{stat.categories.no_kpi}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stat.categories).map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(stat.department, category, count)}
                    disabled={count === 0}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${getCategoryColor(category)} border-current ${
                      count === 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">
                          {getCategoryIcon(category)}
                          {getCategoryLabel(category)}
                        </div>
                        <div className="text-2xl font-bold">{count}</div>
                      </div>
                      {count > 0 && <FiEye className="text-lg ml-2" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            );
          })}

          {departmentStatistics.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No department statistics available</p>
            </div>
          )}
        </div>
      ) : (
        // KPI List View (instead of Employee List)
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDepartment} - {getCategoryLabel(selectedCategory)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {kpisByCategory.length} KPI{kpisByCategory.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={clearCategorySelection}
            >
              Back to Overview
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payroll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kpisByCategory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {selectedCategory === 'no_kpi' 
                        ? 'No employees without KPIs found in this department'
                        : 'No KPIs found in this category'}
                    </td>
                  </tr>
                ) : selectedCategory === 'no_kpi' ? (
                  // For 'no_kpi' category, show employee info
                  kpisByCategory.map((employee) => (
                    <tr key={employee.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                        <div className="text-sm text-gray-500">{employee.employee_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.employee_payroll_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        No KPI Assigned
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          No KPI
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-gray-400">N/A</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  // For other categories, show KPI info
                  kpisByCategory.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{kpi.employee_name}</div>
                        <div className="text-sm text-gray-500">{kpi.employee_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kpi.employee_payroll_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{kpi.title || 'Untitled KPI'}</div>
                        <div className="text-sm text-gray-500">{kpi.employee_department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kpi.period === 'quarterly' 
                          ? `${kpi.quarter} ${kpi.year}` 
                          : kpi.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const stageInfo = getKPIStage(kpi, reviews);
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${stageInfo.color}`}>
                              {stageInfo.stage}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={FiEye}
                          onClick={() => navigate(`/hr/kpi-details/${kpi.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Employee KPI Status & KPI Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee KPI Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Employee KPI Status</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select an employee to view all their KPIs
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or payroll number..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => handleEmployeeSelect(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[250px]"
                >
                  <option value="">Select Employee</option>
                  {filteredEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.payroll_number || 'No Payroll'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingEmployeeKPIs ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-2">Loading KPIs...</p>
                </div>
              ) : !selectedEmployeeId ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <FiUsers className="mx-auto text-4xl text-gray-400 mb-2" />
                  <p>Select an employee to view their KPIs</p>
                </div>
              ) : employeeKPIs.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <FiFileText className="mx-auto text-4xl text-gray-400 mb-2" />
                  <p>No KPIs found for this employee</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CREATED</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeeKPIs.map((kpi) => (
                      <tr key={kpi.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{kpi.title}</p>
                          <p className="text-xs text-gray-500">{kpi.items_count || 0} item(s)</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {kpi.period === 'quarterly' 
                              ? `${kpi.quarter} ${kpi.year}` 
                              : kpi.year}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const stageInfo = getKPIStage(kpi, reviews);
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${stageInfo.color}`}>
                                {stageInfo.stage}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {new Date(kpi.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="link"
                            size="sm"
                            icon={FiEye}
                            onClick={() => navigate(`/hr/kpi-details/${kpi.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* KPI Overview Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">KPI Overview</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MANAGER</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">REVIEW DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(kpis) && kpis.slice(0, 10).map((kpi) => (
                    <tr key={kpi.id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                        <p className="text-sm text-gray-500">{kpi.employee_department}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{kpi.manager_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const stageInfo = getKPIStage(kpi, reviews);
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${stageInfo.color}`}>
                              {stageInfo.icon}
                              <span>{stageInfo.stage}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(kpi.updated_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => navigate(`/hr/kpi-details/${kpi.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {kpis.length > 10 && (
              <div className="p-4 border-t border-gray-200 text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/hr/kpi-list')}
                >
                  View More ({kpis.length - 10} more KPIs)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Notifications and Recent Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  navigate('/hr/notifications');
                }}
              >
                Mark all read
              </Button>
            </div>
            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No new notifications</p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={(id) => {
                        handleMarkNotificationRead(id);
                      }}
                      onClick={() => {
                        handleNotificationClick(notification);
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/hr/notifications')}
                  fullWidth
                >
                  View All Notifications
                </Button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.type === 'self_rating_submitted' ? (
                          <FiCheckCircle className="text-green-600 text-sm" />
                        ) : activity.type === 'kpi_acknowledged' ? (
                          <FiFileText className="text-blue-600 text-sm" />
                        ) : activity.type === 'kpi_set' ? (
                          <FiCheckCircle className="text-purple-600 text-sm" />
                        ) : activity.type === 'review_completed' ? (
                          <FiCheckCircle className="text-green-600 text-sm" />
                        ) : (
                          <FiFileText className="text-gray-600 text-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;

