import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiEye, FiUser, FiSearch, FiFilter } from 'react-icons/fi';

const AcknowledgedKPIs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpiType, setKpiType] = useState<'quarterly' | 'yearly'>('quarterly');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);

      setKpis(kpisRes.data.kpis || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter KPIs that are acknowledged and waiting for review
  const acknowledgedKPIs = kpis.filter((kpi) => {
    const isAcknowledged = kpi.status === 'acknowledged';
    const matchesType = kpi.period === kpiType;
    const matchesSearch = 
      kpi.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.employee_department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.employee_payroll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return isAcknowledged && matchesType && matchesSearch;
  });

  const getKPIStatus = (kpi: KPI): { status: string; color: string } => {
    const review = reviews.find(r => r.kpi_id === kpi.id);
    
    if (!review) {
      return {
        status: 'Waiting for Employee Self-Rating',
        color: 'bg-blue-100 text-blue-700'
      };
    }
    
    if (review.review_status === 'employee_submitted') {
      return {
        status: 'Self-Rating Submitted - Awaiting Manager Review',
        color: 'bg-yellow-100 text-yellow-700'
      };
    }
    
    if (review.review_status === 'pending') {
      return {
        status: 'Self-Rating Pending',
        color: 'bg-purple-100 text-purple-700'
      };
    }
    
    return {
      status: 'In Review',
      color: 'bg-gray-100 text-gray-700'
    };
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
          <h1 className="text-2xl font-bold text-gray-900">ALREADY SET KPI WAITING REVIEW</h1>
          <p className="text-sm text-gray-600 mt-1">
            View all acknowledged KPIs waiting for review
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KPI Type</label>
            <select
              value={kpiType}
              onChange={(e) => setKpiType(e.target.value as 'quarterly' | 'yearly')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="quarterly">Quarterly KPI</option>
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
            Acknowledged KPIs ({acknowledgedKPIs.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {kpiType === 'quarterly' ? 'Quarterly' : 'Yearly'} KPIs that have been acknowledged and are waiting for review
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI ITEMS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {acknowledgedKPIs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No acknowledged KPIs found for {kpiType} type
                  </td>
                </tr>
              ) : (
                acknowledgedKPIs.map((kpi) => {
                  const statusInfo = getKPIStatus(kpi);
                  return (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-purple-600" />
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
                        <p className="text-sm text-gray-900">
                          {kpi.items?.length || kpi.item_count || 1} item{(kpi.items?.length || kpi.item_count || 1) > 1 ? 's' : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            // Navigate based on user role
                            const path = user?.role === 'hr' 
                              ? `/hr/kpi-details/${kpi.id}`
                              : `/manager/kpi-details/${kpi.id}`;
                            navigate(path);
                          }}
                          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          <FiEye className="text-sm" />
                          <span>View Details</span>
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

export default AcknowledgedKPIs;

