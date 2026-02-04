import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { KPI, KPIReview } from '../../../types';
import { FiArrowLeft, FiEye, FiUser, FiSearch, FiFilter, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useToast } from '../../../context/ToastContext';

interface PeriodSetting {
  id: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  is_active: boolean;
}

const RejectedKPIManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpiType, setKpiType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<PeriodSetting[]>([]);
  const toast = useToast();

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
      toast.error('Failed to fetch available periods. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis', { params: { status: 'rejected' } }),
        api.get('/kpi-review'),
      ]);

      const allKpis = kpisRes.data.kpis || [];
      const allReviews = reviewsRes.data.reviews || [];
      setReviews(allReviews);

      // KPIs are already filtered by status=rejected in the backend
      setKpis(allKpis);
    } catch (error) {
      toast.error('Failed to fetch KPI data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getReviewForKPI = (kpiId: number): KPIReview | undefined => {
    return reviews.find(r => r.kpi_id === kpiId);
  };

  const rejectedKPIs = kpis.filter((kpi) => {
    const matchesType = kpi.period === kpiType;
    const matchesPeriod = kpiType === 'quarterly' && selectedPeriodId
      ? availablePeriods.find(p => p.id === selectedPeriodId && p.quarter === kpi.quarter && p.year === kpi.year)
      : true;
    
    const review = getReviewForKPI(kpi.id);
    const matchesSearch = 
      kpi.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.employee_department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.employee_payroll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review?.rejection_reason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesPeriod && matchesSearch;
  });

  const getStatus = (kpi: KPI): { status: string; color: string; icon: React.ReactNode } => {
    const review = getReviewForKPI(kpi.id);
    
    if (!review) {
      return {
        status: 'No Review',
        color: 'bg-gray-100 text-gray-700',
        icon: <FiAlertCircle className="text-sm" />
      };
    }

    if (review.rejection_resolved_status === 'resolved') {
      return {
        status: 'Rejected (Resolved)',
        color: 'bg-teal-100 text-teal-700',
        icon: <FiCheckCircle className="text-sm" />
      };
    }

    if (review.review_status === 'rejected') {
      return {
        status: 'Rejected',
        color: 'bg-red-100 text-red-700',
        icon: <FiAlertCircle className="text-sm" />
      };
    }
    
    return {
      status: 'Unknown',
      color: 'bg-gray-100 text-gray-700',
      icon: <FiAlertCircle className="text-sm" />
    };
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Rejected KPI Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            View all KPIs that have been rejected (including resolved rejections)
          </p>
        </div>
      </div>

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
                placeholder="Search by employee name, payroll, KPI title, or rejection reason..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Rejected KPIs ({rejectedKPIs.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE NAME</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PAYROLL NUMBER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">REJECTION REASON</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rejectedKPIs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No rejected KPIs found
                  </td>
                </tr>
              ) : (
                rejectedKPIs.map((kpi) => {
                  const review = getReviewForKPI(kpi.id);
                  const statusInfo = getStatus(kpi);
                  return (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-red-600" />
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
                        <p className="text-sm font-medium text-gray-900">{kpi.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{kpi.quarter} {kpi.year}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 max-w-xs truncate" title={review?.rejection_reason}>
                          {review?.rejection_reason || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span>{statusInfo.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            let path: string;
                            if (user?.role === 'hr') {
                              path = `/hr/kpi-details/${kpi.id}`;
                            } else if (user?.role === 'manager') {
                              path = `/manager/kpi-details/${kpi.id}`;
                            } else {
                              path = `/employee/kpi-details/${kpi.id}`;
                            }
                            navigate(path);
                          }}
                          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          <FiEye className="text-sm" />
                          <span>View</span>
                        </button>
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

export default RejectedKPIManagement;