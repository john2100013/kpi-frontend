import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { KPI } from '../../types';
import { FiArrowLeft, FiEye, FiUser, FiSearch, FiFilter, FiDownload, FiCheckCircle, FiFileText } from 'react-icons/fi';

interface PeriodSetting {
  id: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  is_active: boolean;
}

const CompletedReviews: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpiType, setKpiType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<PeriodSetting[]>([]);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
    fetchAvailablePeriods();
  }, []);

  const fetchAvailablePeriods = async () => {
    try {
      const response = await api.get('/settings/available-periods', {
        params: { period_type: 'quarterly' }
      });
      const periods = response.data.periods || [];
      setAvailablePeriods(periods);
      if (periods.length > 0) {
        setSelectedPeriodId(periods[0].id);
      }
    } catch (error) {
      console.error('Error fetching available periods:', error);
    }
  };

  const fetchData = async () => {
    try {
      // Use the dedicated endpoint for review-completed KPIs
      const kpisRes = await api.get('/kpis/review-completed').catch(err => {
        console.error('Error fetching review-completed KPIs:', err);
        return { data: { kpis: [] } };
      });

      setKpis(kpisRes.data.kpis || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter KPIs by type and search (they're already filtered to review-completed by the API)
  const completedKPIs = kpis.filter((kpi) => {
    const matchesType = kpi.period === kpiType;
    // If quarterly and a specific period is selected, match by quarter and year
    const matchesPeriod = kpiType === 'quarterly' && selectedPeriodId
      ? availablePeriods.find(p => p.id === selectedPeriodId && p.quarter === kpi.quarter && p.year === kpi.year)
      : true;
    const matchesSearch = 
      kpi.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.employee_department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.employee_payroll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesPeriod && matchesSearch;
  });

  const getReviewStatus = (): { status: string; color: string } => {
    // All KPIs on this page are review completed
    return {
      status: 'KPI Review Completed',
      color: 'bg-green-100 text-green-700'
    };
  };

  const buildFileName = (kpi: KPI): string => {
    const typeLabel = kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly';
    const payroll = (kpi as any).employee_payroll_number || 'N-A';
    const safePayroll = String(payroll).replace(/[^a-zA-Z0-9-_]/g, '_');
    return `KPI-${typeLabel}-${safePayroll}.pdf`;
  };

  const handleDownloadPDF = async (kpi: KPI) => {
    setDownloading(kpi.id);
    try {
      const response = await api.get(`/kpis/${kpi.id}/review-download-pdf`, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', buildFileName(kpi));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert(error.response?.data?.error || 'Failed to download PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportToCSV = () => {
    if (completedKPIs.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare CSV data
    const headers = [
      'Employee Name',
      'Payroll Number',
      'Department',
      'KPI Title',
      'KPI Type',
      'Period',
      'Quarter',
      'Year',
      'Employee Rating',
      'Manager Rating',
      'Status',
      'Manager Signed Date',
      'Manager Name',
      'Review ID',
      'Created Date',
      'Updated Date'
    ];

    const rows = completedKPIs.map((kpi) => {
      const statusInfo = getReviewStatus();
      const reviewId = (kpi as any).review_id;
      return [
        kpi.employee_name || '',
        kpi.employee_payroll_number || '',
        kpi.employee_department || '',
        kpi.title || '',
        kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly',
        `${kpi.quarter || ''} ${kpi.year || ''}`.trim(),
        kpi.quarter || '',
        kpi.year?.toString() || '',
        ((kpi as any).employee_rating || '').toString(),
        ((kpi as any).manager_rating || '').toString(),
        statusInfo.status,
        (kpi as any).manager_signed_at ? new Date((kpi as any).manager_signed_at).toLocaleDateString() : '',
        kpi.manager_name || '',
        reviewId?.toString() || '',
        kpi.created_at ? new Date(kpi.created_at).toLocaleDateString() : '',
        kpi.updated_at ? new Date(kpi.updated_at).toLocaleDateString() : ''
      ];
    });

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const periodLabel = kpiType === 'quarterly' && selectedPeriodId
      ? `${availablePeriods.find(p => p.id === selectedPeriodId)?.quarter || ''}_${availablePeriods.find(p => p.id === selectedPeriodId)?.year || ''}`
      : kpiType;
    link.setAttribute('download', `Completed_Reviews_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">KPI Review Completed</h1>
          <p className="text-sm text-gray-600 mt-1">
            View all KPIs with completed reviews
          </p>
        </div>
        {(user?.role === 'hr' || user?.role === 'manager') && (
          <button
            onClick={handleExportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Export to CSV/Excel"
          >
            <FiFileText className="text-lg" />
            <span>Export</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KPI Period</label>
            <select
              value={kpiType === 'quarterly' && selectedPeriodId ? selectedPeriodId.toString() : kpiType}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'yearly') {
                  setKpiType('yearly');
                  setSelectedPeriodId(null);
                } else {
                  setKpiType('quarterly');
                  setSelectedPeriodId(parseInt(value));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {availablePeriods.map((period) => (
                <option key={period.id} value={period.id.toString()}>
                  {period.quarter} {period.year} (Quarterly)
                </option>
              ))}
              <option value="yearly">Yearly KPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by employee name, payroll, or KPI title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Completed Reviews ({completedKPIs.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {kpiType === 'quarterly' && selectedPeriodId
              ? `${availablePeriods.find(p => p.id === selectedPeriodId)?.quarter || ''} ${availablePeriods.find(p => p.id === selectedPeriodId)?.year || ''}`
              : kpiType === 'quarterly' ? 'Quarterly' : 'Yearly'} KPIs with reviews completed by managers
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE NAME</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PAYROLL NUMBER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TYPE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">RATINGS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">COMPLETED DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {completedKPIs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No completed reviews found for {kpiType === 'quarterly' && selectedPeriodId
                      ? `${availablePeriods.find(p => p.id === selectedPeriodId)?.quarter || ''} ${availablePeriods.find(p => p.id === selectedPeriodId)?.year || ''}`
                      : kpiType === 'quarterly' ? 'Quarterly' : 'Yearly'} period
                  </td>
                </tr>
              ) : (
                completedKPIs.map((kpi) => {
                  const statusInfo = getReviewStatus();
                  const reviewId = (kpi as any).review_id;
                  return (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                            <p className="text-sm text-gray-500">{kpi.employee_department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{kpi.employee_payroll_number || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          kpi.period === 'quarterly' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {kpi.quarter} {kpi.year}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-700">
                            Employee: <span className="font-semibold">{(kpi as any).employee_rating || 'N/A'}</span>
                          </p>
                          <p className="text-gray-700">
                            Manager: <span className="font-semibold">{(kpi as any).manager_rating || 'N/A'}</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {(kpi as any).manager_signed_at 
                            ? new Date((kpi as any).manager_signed_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${statusInfo.color}`}>
                          <FiCheckCircle className="text-sm" />
                          <span>{statusInfo.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Navigate to review details
                              const path = user?.role === 'hr' 
                                ? `/hr/kpi-details/${kpi.id}`
                                : `/manager/kpi-review/${reviewId}`;
                              navigate(path);
                            }}
                            className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
                          >
                            <FiEye className="text-sm" />
                            <span>View</span>
                          </button>
                          {user?.role === 'hr' && (
                            <button
                              onClick={() => {
                                navigate(`/hr/employee-performance/${kpi.employee_id}`);
                              }}
                              className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium text-sm"
                              title="View Employee Performance"
                            >
                              <FiUser className="text-sm" />
                              <span>Performance</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(kpi)}
                            disabled={downloading === kpi.id}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
                            title="Download PDF"
                          >
                            <FiDownload className="text-sm" />
                            <span>{downloading === kpi.id ? 'Downloading...' : 'Download'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompletedReviews;

