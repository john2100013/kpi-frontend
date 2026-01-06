import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiHome, FiUsers, FiUser, FiBriefcase, FiPlus, FiTrendingUp } from 'react-icons/fi';

interface Company {
  id: number;
  name: string;
  domain?: string;
  created_at: string;
  total_employees: number;
  total_managers: number;
  total_hr: number;
  total_departments: number;
}

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies');
      setCompanies(response.data.companies || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const totalStats = {
    companies: companies.length,
    employees: companies.reduce((sum, c) => sum + parseInt(String(c.total_employees || '0')), 0),
    managers: companies.reduce((sum, c) => sum + parseInt(String(c.total_managers || '0')), 0),
    hr: companies.reduce((sum, c) => sum + parseInt(String(c.total_hr || '0')), 0),
    departments: companies.reduce((sum, c) => sum + parseInt(String(c.total_departments || '0')), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
        <p className="text-gray-600">Manage all companies and system-wide analytics</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.companies}</p>
            </div>
            <FiHome className="text-4xl text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.employees}</p>
            </div>
            <FiUsers className="text-4xl text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Managers</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.managers}</p>
            </div>
            <FiBriefcase className="text-4xl text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total HR</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.hr}</p>
            </div>
            <FiUser className="text-4xl text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Departments</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.departments}</p>
            </div>
            <FiTrendingUp className="text-4xl text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">All Companies</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/super-admin/assign-hr')}
              className="flex items-center space-x-2 bg-white border border-purple-600 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition text-sm"
            >
              <FiUser />
              <span>Assign HR to Company</span>
            </button>
            <button
              onClick={() => navigate('/onboard')}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              <FiPlus />
              <span>Onboard New Company</span>
            </button>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiHome className="mx-auto text-5xl text-gray-400 mb-4" />
            <p className="text-lg mb-2">No companies found</p>
            <p className="text-sm mb-4">Get started by onboarding your first company</p>
            <button
              onClick={() => navigate('/onboard')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Onboard Company
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Managers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiHome className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.domain || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => navigate(`/employees?companyId=${company.id}`)}
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FiUsers className="text-blue-500 mr-2" />
                          <span className="text-sm font-medium">{company.total_employees || 0}</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiBriefcase className="text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">{company.total_managers || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUser className="text-orange-500 mr-2" />
                        <span className="text-sm text-gray-900">{company.total_hr || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.total_departments || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

