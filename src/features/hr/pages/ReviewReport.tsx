import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { FiFilter, FiDownload, FiFileText } from 'react-icons/fi';
import api from '../../../services/api';
import { Button } from '../../../components/common';

interface Department {
  id: number;
  name: string;
}

interface PeriodSetting {
  id: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  is_active: boolean;
}

interface ReviewReportData {
  kpi_id: number;
  employee_id: number;
  employee_name: string;
  payroll: string;
  department: string;
  email: string;
  period: string;
  year: number;
  quarter: string | null;
  calculation_method: string;
  self_rating_enabled: boolean;
  manager_percentage_rating: number | null;
  manager_percentage_column_used: string;
}

const ReviewReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [reportData, setReportData] = useState<ReviewReportData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Filters
  const [selectedPeriodType, setSelectedPeriodType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  
  // Available options
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<PeriodSetting[]>([]);
  const [yearlyPeriods, setYearlyPeriods] = useState<PeriodSetting[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchAvailablePeriods();
  }, []);

  useEffect(() => {
    fetchAvailablePeriods();
  }, [selectedPeriodType]);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriodType, selectedPeriodId, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      toast.error('Could not fetch departments. Please try again.');
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const [quarterlyRes, yearlyRes] = await Promise.all([
        api.get('/settings/available-periods', { params: { period_type: 'quarterly' } }),
        api.get('/settings/available-periods', { params: { period_type: 'yearly' } })
      ]);

      const quarterly = Array.isArray(quarterlyRes.data?.periods) ? quarterlyRes.data.periods : [];
      const yearly = Array.isArray(yearlyRes.data?.periods) ? yearlyRes.data.periods : [];

      setQuarterlyPeriods(quarterly);
      setYearlyPeriods(yearly);

      // Set default selected period based on current type
      if (selectedPeriodType === 'quarterly' && quarterly.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(quarterly[0].id);
      } else if (selectedPeriodType === 'yearly' && yearly.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(yearly[0].id);
      }
    } catch (error) {
      toast.error('Could not fetch available periods. Please try again.');
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Get current periods based on selected type
      const currentPeriods = selectedPeriodType === 'quarterly' ? quarterlyPeriods : yearlyPeriods;
      const selectedPeriod = currentPeriods.find(p => p.id === selectedPeriodId);

      if (!selectedPeriod) {
        setReportData([]);
        setLoading(false);
        return;
      }

     

      const params: any = {
        period: selectedPeriodType,
        year: selectedPeriod.year,
      };

      // Add quarter for quarterly reports
      if (selectedPeriodType === 'quarterly' && selectedPeriod.quarter) {
        params.quarter = selectedPeriod.quarter;
      }

      // Add department filter if selected
      if (selectedDepartment) {
        params.department_id = selectedDepartment;
      }

      const response = await api.get('/kpis/review-report', { params });
      setReportData(response.data.report || []);
    } catch (error: any) {
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Report</h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive employee performance review report
          </p>
        </div>
        <Button
          onClick={handleExport}
          icon={FiDownload}
          variant="outline"
          disabled={reportData.length === 0}
        >
          Export Report
        </Button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-purple-600 text-xl" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Period Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KPI Period Type
            </label>
            <select
              value={selectedPeriodType}
              onChange={(e) => {
                const newType = e.target.value as 'quarterly' | 'yearly';
                setSelectedPeriodType(newType);
                setSelectedPeriodId(null); // Reset period selection
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Period Dropdown - Shows quarterly or yearly periods from HR settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedPeriodType === 'quarterly' ? 'Quarter & Year' : 'Year'}
            </label>
            <select
              value={selectedPeriodId || ''}
              onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Period</option>
              {(selectedPeriodType === 'quarterly' ? quarterlyPeriods : yearlyPeriods).map((period) => (
                <option key={period.id} value={period.id}>
                  {selectedPeriodType === 'quarterly' 
                    ? `${period.quarter} ${period.year}`
                    : `${period.year}`
                  }
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFileText className="text-purple-600 text-xl" />
          <h2 className="text-lg font-semibold text-gray-900">
            Report Results ({reportData.length} records)
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading report data...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-12">
            <FiFileText className="text-gray-400 text-5xl mx-auto mb-4" />
            <p className="text-gray-600">No data found for the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Employee Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Payroll
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Calculation Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Manager Rating %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.map((record, index) => {
                  const periodDisplay = record.period === 'quarterly' 
                    ? `${record.quarter} ${record.year}`
                    : `${record.year} (Yearly)`;

                  return (
                    <tr key={`${record.kpi_id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {record.employee_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {record.payroll}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {record.department}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {record.email}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {periodDisplay}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          record.calculation_method.includes('Actual vs Target')
                            ? 'bg-green-100 text-green-800'
                            : record.calculation_method.includes('Goal Weight')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.calculation_method}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="font-bold text-purple-600">
                          {record.manager_percentage_rating !== null 
                            ? `${record.manager_percentage_rating.toFixed(2)}%`
                            : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {reportData.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Total Records</p>
              <p className="text-2xl font-bold text-purple-600">{reportData.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Average Rating %</p>
              <p className="text-2xl font-bold text-purple-600">
                {(reportData.reduce((sum, r) => sum + (r.manager_percentage_rating || 0), 0) / reportData.length).toFixed(2)}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Self-Rating Enabled</p>
              <p className="text-2xl font-bold text-green-600">
                {reportData.filter(r => r.self_rating_enabled).length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Departments</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(reportData.map(r => r.department)).size}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewReport;
