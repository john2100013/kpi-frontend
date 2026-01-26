
import React from 'react';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiGrid,
  FiPlusCircle,
  FiSettings,
  FiUserPlus,
  FiCalendar,
} from 'react-icons/fi';
import { useSuperAdminDashboard } from '../hooks';

const SuperAdminDashboard: React.FC = () => {
  const {
    user,
    stats,
    recentCompanies,
    loading,
    error,
    navigateTo,
  } = useSuperAdminDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.name}! Manage all companies, users, and system settings.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiHome className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total HR Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHRUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUserCheck className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Managers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalManagers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-2xl text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDepartments}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FiGrid className="text-2xl text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <button
            onClick={() => navigateTo('/super-admin/onboard-company')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiPlusCircle className="text-xl text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Onboard Company</p>
              <p className="text-xs text-gray-500">Add new company</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('/super-admin/company-management')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiSettings className="text-xl text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Manage Companies</p>
              <p className="text-xs text-gray-500">Edit company info</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('/super-admin/assign-hr')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiUserPlus className="text-xl text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Assign HR</p>
              <p className="text-xs text-gray-500">Link HR to company</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('/super-admin/user-management')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-xl text-yellow-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-xs text-gray-500">View all users</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('/super-admin/assign-manager-departments')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="text-xl text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Assign Managers</p>
              <p className="text-xs text-gray-500">Link to departments</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('/super-admin/department-management')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <FiGrid className="text-xl text-teal-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Departments</p>
              <p className="text-xs text-gray-500">Manage departments</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Companies */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Companies</h2>
            <button
              onClick={() => navigateTo('/super-admin/company-management')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Managers</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HR</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No companies found
                  </td>
                </tr>
              ) : (
                recentCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FiHome className="text-gray-400" />
                        <span className="font-medium text-gray-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.domain || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.total_employees || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.total_managers || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.total_hr || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FiCalendar className="text-gray-400" />
                        <span>{new Date(company.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

