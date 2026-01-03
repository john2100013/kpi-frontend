import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiUsers, FiClock, FiCheckCircle, FiFileText, FiEye } from 'react-icons/fi';

interface DepartmentStatistic {
  department: string;
  total_employees: number;
  categories: {
    pending: number;
    acknowledged_review_pending: number;
    self_rating_submitted: number;
    review_completed: number;
    review_pending: number;
    no_kpi: number;
  };
}

interface Employee {
  id: number;
  name: string;
  email: string;
  payroll_number: string;
  department: string;
  position: string;
  manager_name?: string;
}

const DepartmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<DepartmentStatistic[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (selectedDepartment && selectedCategory) {
      fetchEmployees(selectedDepartment, selectedCategory);
    } else {
      setEmployees([]);
    }
  }, [selectedDepartment, selectedCategory]);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/departments/statistics');
      setStatistics(response.data.statistics || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (department: string, category: string) => {
    try {
      const response = await api.get(`/departments/statistics/${department}/${category}`);
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const handleCategoryClick = (department: string, category: string, count: number) => {
    if (count === 0) return;
    setSelectedDepartment(department);
    setSelectedCategory(category);
  };

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      pending: 'KPI Setting - Awaiting Acknowledgement',
      acknowledged_review_pending: 'KPI Acknowledged - Review Pending',
      self_rating_submitted: 'Self-Rating Submitted - Awaiting Manager Review',
      review_completed: 'KPI Review Completed',
      review_pending: 'KPI Review - Self-Rating Required',
      no_kpi: 'No KPI Assigned',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      pending: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      acknowledged_review_pending: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      self_rating_submitted: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      review_completed: 'bg-green-100 text-green-700 hover:bg-green-200',
      review_pending: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      no_kpi: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pending':
      case 'review_pending':
        return <FiClock className="inline mr-2" />;
      case 'acknowledged_review_pending':
      case 'self_rating_submitted':
        return <FiFileText className="inline mr-2" />;
      case 'review_completed':
        return <FiCheckCircle className="inline mr-2" />;
      case 'no_kpi':
        return <FiUsers className="inline mr-2" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
        <button
          onClick={() => {
            setSelectedDepartment(null);
            setSelectedCategory(null);
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to Overview
        </button>
      </div>

      {!selectedDepartment || !selectedCategory ? (
        // Department Statistics View
        <div className="space-y-6">
          {statistics.map((stat) => (
            <div key={stat.department} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{stat.department}</h2>
                <span className="text-sm text-gray-500">
                  Total Employees: <span className="font-semibold">{stat.total_employees}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stat.categories).map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(stat.department, category, count)}
                    disabled={count === 0}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      count === 0
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        : `${getCategoryColor(category)} border-current cursor-pointer`
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
          ))}

          {statistics.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No department statistics available</p>
            </div>
          )}
        </div>
      ) : (
        // Employee List View
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDepartment} - {getCategoryLabel(selectedCategory)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payroll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No employees found in this category
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.payroll_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.manager_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/hr/kpi-list?employeeId=${employee.id}`)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View KPIs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;

