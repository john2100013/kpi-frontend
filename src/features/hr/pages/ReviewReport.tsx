import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext';
import { FiFilter, FiDownload, FiFileText, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../../services/api';
import { Button } from '../../../components/common';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchDepartments } from '../../../store/slices/departmentSlice';

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
  // Physical Meeting Confirmation
  manager_meeting_confirmed: boolean;
  employee_meeting_confirmed: boolean;
  manager_review_meeting_confirmed: boolean;
  employee_confirmation_meeting_confirmed: boolean;
}

const ReviewReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [reportData, setReportData] = useState<ReviewReportData[]>([]);
  
  // Redux state for departments
  const { departments: departmentsList } = useAppSelector((state) => state.departments);
  
  // Filters
  const [selectedPeriodType, setSelectedPeriodType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Available options
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<PeriodSetting[]>([]);
  const [yearlyPeriods, setYearlyPeriods] = useState<PeriodSetting[]>([]);

  useEffect(() => {
    dispatch(fetchDepartments());
    fetchAvailablePeriods();
  }, [dispatch]);

  useEffect(() => {
    fetchAvailablePeriods();
  }, [selectedPeriodType]);

  useEffect(() => {
    fetchReportData();
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedPeriodType, selectedPeriodId, selectedDepartment]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search term changes
  }, [searchTerm]);

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

  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (!searchTerm) return reportData;
    
    const lowerSearch = searchTerm.toLowerCase();
    return reportData.filter(record => 
      record.employee_name.toLowerCase().includes(lowerSearch) ||
      record.payroll.toLowerCase().includes(lowerSearch) ||
      record.department.toLowerCase().includes(lowerSearch) ||
      record.email.toLowerCase().includes(lowerSearch)
    );
  }, [reportData, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

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
              {Array.isArray(departmentsList) && departmentsList.map((dept) => (
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FiFileText className="text-purple-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-900">
              Report Results ({filteredData.length} {filteredData.length !== reportData.length ? `of ${reportData.length}` : ''} records)
            </h2>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
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
            <table className="w-full min-w-[1400px]">
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
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Manager Meeting
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Employee Meeting
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((record, index) => {
                  const periodDisplay = record.period === 'quarterly' 
                    ? `${record.quarter} ${record.year}`
                    : `${record.year} (Yearly)`;
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr key={`${record.kpi_id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {globalIndex}
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
                      <td className="px-4 py-4 text-sm text-center">
                        {record.manager_meeting_confirmed || record.manager_review_meeting_confirmed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✗ No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-center">
                        {record.employee_meeting_confirmed || record.employee_confirmation_meeting_confirmed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✗ No
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredData.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                icon={FiChevronLeft}
                className="px-3 py-1"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                icon={FiChevronRight}
                className="px-3 py-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {reportData.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Total Records</p>
              <p className="text-2xl font-bold text-purple-600">{reportData.length}</p>
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
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Manager Meetings Held</p>
              <p className="text-2xl font-bold text-green-600">
                {reportData.filter(r => r.manager_meeting_confirmed || r.manager_review_meeting_confirmed).length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Employee Meetings Held</p>
              <p className="text-2xl font-bold text-green-600">
                {reportData.filter(r => r.employee_meeting_confirmed || r.employee_confirmation_meeting_confirmed).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewReport;
