import React from 'react';
import { FiHome, FiUpload, FiX, FiPlus, FiEye, FiEyeOff } from 'react-icons/fi';
import { useCompanyOnboarding } from '../hooks';

const CompanyOnboarding: React.FC = () => {
  const {
    step,
    loading,
    error,
    companyName,
    setCompanyName,
    companyDomain,
    setCompanyDomain,
    departments,
    hrUsers,
    managers,
    employees,
    excelFile,
    showHRPasswords,
    showManagerPasswords,
    addDepartment,
    removeDepartment,
    updateDepartment,
    addHRUser,
    removeHRUser,
    updateHRUser,
    toggleHRPasswordVisibility,
    addManager,
    removeManager,
    updateManager,
    toggleManagerDepartment,
    toggleManagerPasswordVisibility,
    addEmployee,
    removeEmployee,
    updateEmployee,
    handleExcelUpload,
    nextStep,
    prevStep,
    handleSubmit,
  } = useCompanyOnboarding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <FiHome className="mx-auto text-5xl text-purple-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Company Onboarding</h1>
          <p className="text-gray-600">Set up your company, departments, and users</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Company & Departments */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Domain
              </label>
              <input
                type="text"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Departments *
                </label>
                <button
                  type="button"
                  onClick={addDepartment}
                  className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                >
                  <FiPlus /> <span>Add Department</span>
                </button>
              </div>
              {departments.map((dept, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={dept}
                    onChange={(e) => updateDepartment(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Department name"
                  />
                  {departments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDepartment(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextStep}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Next: HR Users
              </button>
            </div>
          </div>
        )}

        {/* Step 2: HR Users */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">HR Users</h2>
              <button
                type="button"
                onClick={addHRUser}
                className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
              >
                <FiPlus /> <span>Add HR User</span>
              </button>
            </div>

            {hrUsers.map((hr, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">HR User {index + 1}</h3>
                  {hrUsers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHRUser(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Name *"
                  value={hr.name}
                  onChange={(e) => updateHRUser(index, 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={hr.email}
                  onChange={(e) => updateHRUser(index, 'email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Payroll Number *"
                  value={hr.payrollNumber}
                  onChange={(e) => updateHRUser(index, 'payrollNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <div className="relative">
                  <input
                    type={showHRPasswords[index] ? "text" : "password"}
                    placeholder="Password *"
                    value={hr.password}
                    onChange={(e) => updateHRUser(index, 'password', e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => toggleHRPasswordVisibility(index)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showHRPasswords[index] ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Next: Managers
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Managers */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Managers</h2>
              <button
                type="button"
                onClick={addManager}
                className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
              >
                <FiPlus /> <span>Add Manager</span>
              </button>
            </div>

            {managers.map((manager, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Manager {index + 1}</h3>
                  {managers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeManager(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Name *"
                  value={manager.name}
                  onChange={(e) => updateManager(index, 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={manager.email}
                  onChange={(e) => updateManager(index, 'email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Payroll Number *"
                  value={manager.payrollNumber}
                  onChange={(e) => updateManager(index, 'payrollNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <div className="relative">
                  <input
                    type={showManagerPasswords[index] ? "text" : "password"}
                    placeholder="Password *"
                    value={manager.password}
                    onChange={(e) => updateManager(index, 'password', e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => toggleManagerPasswordVisibility(index)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showManagerPasswords[index] ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Departments
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.filter(d => d.trim()).map((dept) => (
                      <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={manager.departments.includes(dept)}
                          onChange={() => toggleManagerDepartment(index, dept)}
                          className="rounded"
                        />
                        <span>{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Next: Employees
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Employees */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Employees</h2>
              <button
                type="button"
                onClick={addEmployee}
                className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
              >
                <FiPlus /> <span>Add Employee</span>
              </button>
            </div>

            {/* Add Employees One by One */}
            {employees.length > 0 && (
              <div className="space-y-4 mb-6">
                {employees.map((employee, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Employee {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeEmployee(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiX />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Name *"
                        value={employee.name}
                        onChange={(e) => updateEmployee(index, 'name', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={employee.email}
                        onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Payroll Number *"
                        value={employee.payrollNumber}
                        onChange={(e) => updateEmployee(index, 'payrollNumber', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="National ID *"
                        value={employee.nationalId}
                        onChange={(e) => updateEmployee(index, 'nationalId', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <select
                        value={employee.department}
                        onChange={(e) => updateEmployee(index, 'department', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select Department</option>
                        {departments.filter(d => d.trim()).map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Position"
                        value={employee.position}
                        onChange={(e) => updateEmployee(index, 'position', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="date"
                        placeholder="Employment Date"
                        value={employee.employmentDate}
                        onChange={(e) => updateEmployee(index, 'employmentDate', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Excel Upload Option */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Or Upload via Excel</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FiUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Upload Excel file with employee data</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 cursor-pointer"
                >
                  Choose Excel File
                </label>
                {excelFile && (
                  <p className="mt-4 text-sm text-gray-600">Selected: {excelFile.name}</p>
                )}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                  <p className="text-sm font-semibold mb-2">Excel File Structure:</p>
                  <p className="text-xs text-gray-600 mb-2">Required columns (in this order):</p>
                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                    <li><strong>Name</strong> - Employee full name (required)</li>
                    <li><strong>Payroll Number</strong> - Unique payroll identifier (required)</li>
                    <li><strong>National ID</strong> - National identification number (required)</li>
                    <li><strong>Department</strong> - Department name (optional, must match departments from Step 1)</li>
                    <li><strong>Position</strong> - Job position/title (optional)</li>
                    <li><strong>Employment Date</strong> - Date format: YYYY-MM-DD or MM/DD/YYYY (optional)</li>
                    <li><strong>Manager Email</strong> - Email of assigned manager (optional, must match manager emails from Step 3)</li>
                  </ol>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Note:</strong> The first row should contain column headers. Rows with missing required fields will be skipped.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Complete Onboarding'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyOnboarding;

