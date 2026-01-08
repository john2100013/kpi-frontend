import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiEye, FiSearch, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';

interface PeriodSetting {
  id: number;
  period_type: string;
  quarter: string | null;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const HRKPIList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string>('');
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    period: '',
    manager: '',
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [managers, setManagers] = useState<Array<{ id: number; name: string }>>([]);
  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const itemsPerPage = 25;

  useEffect(() => {
    // Initialize filters from URL params
    const statusParam = searchParams.get('status');
    const employeeIdParam = searchParams.get('employeeId');
    
    if (statusParam === 'rejected') {
      setFilters(prev => ({ ...prev, status: 'rejected' }));
    }
    if (employeeIdParam) {
      setEmployeeIdFilter(employeeIdParam);
    }
    
    fetchPeriodSettings();
    fetchManagers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, filters, searchQuery, employeeIdFilter]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;
      if (filters.period) params.period = filters.period;
      if (filters.manager) params.manager = filters.manager;
      if (searchQuery) params.search = searchQuery;
      if (employeeIdFilter) params.employee_id = employeeIdFilter;

      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis/paginated', { params }),
        api.get('/kpi-review'),
      ]);

      setKpis(kpisRes.data.kpis || []);
      setTotalCount(kpisRes.data.total || 0);
      setTotalPages(Math.ceil((kpisRes.data.total || 0) / itemsPerPage));
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodSettings = async () => {
    try {
      const response = await api.get('/settings/period-settings');
      setPeriodSettings(response.data.settings || []);
    } catch (error) {
      console.error('Error fetching period settings:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get('/departments/managers');
      setManagers(response.data.managers || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/statistics');
      const stats = response.data.statistics || [];
      const uniqueDepts = stats.map((stat: any) => stat.department);
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const getKPIStage = (kpi: KPI): { stage: string; color: string; icon: React.ReactNode } => {
    const review = reviews.find(r => r.kpi_id === kpi.id);

    if (kpi.status === 'pending') {
      return {
        stage: 'KPI Setting - Awaiting Acknowledgement',
        color: 'bg-orange-100 text-orange-700',
        icon: <FiClock className="inline" />
      };
    }

    if (kpi.status === 'acknowledged' && !review) {
      return {
        stage: 'KPI Acknowledged - Review Pending',
        color: 'bg-blue-100 text-blue-700',
        icon: <FiFileText className="inline" />
      };
    }

    if (review) {
      if (review.review_status === 'rejected') {
        return {
          stage: 'Review Rejected by Employee',
          color: 'bg-red-100 text-red-700',
          icon: <FiEye className="inline" />
        };
      }

      if (review.review_status === 'employee_submitted') {
        return {
          stage: 'Self-Rating Submitted - Awaiting Manager Review',
          color: 'bg-yellow-100 text-yellow-700',
          icon: <FiClock className="inline" />
        };
      }

      if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
        return {
          stage: 'KPI Review Completed',
          color: 'bg-green-100 text-green-700',
          icon: <FiCheckCircle className="inline" />
        };
      }

      if (review.review_status === 'pending') {
        return {
          stage: 'KPI Review - Self-Rating Required',
          color: 'bg-purple-100 text-purple-700',
          icon: <FiFileText className="inline" />
        };
      }
    }

    return {
      stage: 'In Progress',
      color: 'bg-gray-100 text-gray-700',
      icon: <FiClock className="inline" />
    };
  };

  const getPeriodLabel = (kpi: KPI): string => {
    if (kpi.period === 'quarterly' && kpi.quarter) {
      return `${kpi.quarter} ${kpi.year} • Quarterly KPI`;
    }
    return `${kpi.year} • Annual KPI`;
  };

  const getPeriodValue = (setting: PeriodSetting): string => {
    return `${setting.period_type}|${setting.quarter || ''}|${setting.year}`;
  };

  const getPeriodLabelFromSetting = (setting: PeriodSetting): string => {
    if (setting.period_type === 'quarterly') {
      return `${setting.quarter} ${setting.year}`;
    }
    return `${setting.year}`;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Department', 'Payroll Number', 'Manager', 'Period', 'KPI Status', 'Review Date'];
    const csvData = kpis.map(kpi => {
      const stageInfo = getKPIStage(kpi);
      return [
        kpi.employee_name,
        kpi.employee_department,
        kpi.employee_payroll_number || 'N/A',
        kpi.manager_name,
        getPeriodLabel(kpi),
        stageInfo.stage,
        new Date(kpi.updated_at).toLocaleDateString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kpi_overview_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const headers = ['Employee Name', 'Department', 'Payroll Number', 'Manager', 'Period', 'KPI Status', 'Review Date'];
    const excelData = kpis.map(kpi => {
      const stageInfo = getKPIStage(kpi);
      return [
        kpi.employee_name,
        kpi.employee_department,
        kpi.employee_payroll_number || 'N/A',
        kpi.manager_name,
        getPeriodLabel(kpi),
        stageInfo.stage,
        new Date(kpi.updated_at).toLocaleDateString()
      ];
    });

    // Create Excel-compatible HTML with inline styles
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>KPI Overview</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
    html += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
    html += '<table border="1" style="border-collapse:collapse;">';
    
    // Headers with styling
    html += '<thead><tr>';
    headers.forEach(header => {
      html += `<th style="background-color:#4472C4;color:#FFFFFF;font-weight:bold;padding:8px;border:1px solid #000;">${header}</th>`;
    });
    html += '</tr></thead>';
    
    // Data rows
    html += '<tbody>';
    excelData.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        const cellValue = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<td style="padding:6px;border:1px solid #000;">${cellValue}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kpi_overview_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    setShowExportMenu(false);
  };

  if (loading && kpis.length === 0) {
    return <div className="p-6">Loading...</div>;
  }

  // Get title based on filter context
  const getPageTitle = () => {
    if (filters.status === 'rejected' && employeeIdFilter) {
      const kpi = kpis[0];
      return kpi ? `Rejected KPI - ${kpi.employee_name}` : 'Rejected KPIs';
    }
    if (filters.status === 'rejected') {
      return 'Rejected KPIs';
    }
    return 'KPI Overview';
  };

  const getPageSubtitle = () => {
    if (filters.status === 'rejected' && employeeIdFilter) {
      return `View rejected KPIs for this employee (${totalCount} total)`;
    }
    return `View all KPIs across the organization (${totalCount} total)`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-600 mt-1">{getPageSubtitle()}</p>
          </div>
        </div>
        <div className="relative export-menu-container">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiDownload className="text-lg" />
            <span>Export</span>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={exportToExcel}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg"
              >
                Export to Excel
              </button>
              <button
                onClick={exportToCSV}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg"
              >
                Export to CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KPI Period</label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Periods</option>
              {periodSettings.map(setting => (
                <option key={setting.id} value={getPeriodValue(setting)}>
                  {getPeriodLabelFromSetting(setting)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
            <select
              value={filters.manager}
              onChange={(e) => handleFilterChange('manager', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Managers</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KPI Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="pending">KPI Setting - Awaiting Acknowledgement</option>
              <option value="acknowledged">KPI Acknowledged - Review Pending</option>
              <option value="employee_submitted">Self-Rating Submitted</option>
              <option value="completed">KPI Review Completed</option>
              <option value="rejected">Review Rejected by Employee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search KPIs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} KPIs
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE NAME</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PAYROLL NUMBER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MANAGER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">REVIEW DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No KPIs found
                  </td>
                </tr>
              ) : (
                kpis.map((kpi) => {
                  const stageInfo = getKPIStage(kpi);
                  return (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                        <p className="text-sm text-gray-500">{kpi.employee_department}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{kpi.employee_payroll_number || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{kpi.manager_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{getPeriodLabel(kpi)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${stageInfo.color}`}>
                          {stageInfo.icon}
                          <span>{stageInfo.stage}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(kpi.updated_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/hr/kpi-details/${kpi.id}`)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <FiEye className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
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
                    key={i}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRKPIList;
