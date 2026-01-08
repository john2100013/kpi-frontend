import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiAlertTriangle, FiCheckCircle, FiEye, FiClock } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, color, icon, onClick, isSelected }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${
      isSelected ? `${color} border-current` : 'border-gray-200'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
      </div>
      <div className={`text-4xl ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
        {icon}
      </div>
    </div>
  </div>
);

const RejectedKPIManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'rejected' | 'resolved' | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [selectedFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);

      const allKpis = kpisRes.data.kpis || [];
      const allReviews = reviewsRes.data.reviews || [];
      setReviews(allReviews);

      // Filter KPIs based on rejection status
      const rejectedKpis = allKpis.filter((kpi: KPI) => {
        const review = allReviews.find((r: KPIReview) => r.kpi_id === kpi.id);
        return review && review.review_status === 'rejected' && review.rejection_resolved_status !== 'resolved';
      });

      const resolvedKpis = allKpis.filter((kpi: KPI) => {
        const review = allReviews.find((r: KPIReview) => r.kpi_id === kpi.id);
        return review && review.review_status === 'rejected' && review.rejection_resolved_status === 'resolved';
      });

      setRejectedCount(rejectedKpis.length);
      setResolvedCount(resolvedKpis.length);

      // Filter displayed KPIs based on selection
      if (selectedFilter === 'rejected') {
        setKpis(rejectedKpis);
      } else if (selectedFilter === 'resolved') {
        setKpis(resolvedKpis);
      } else {
        setKpis([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (filter: 'rejected' | 'resolved') => {
    setSelectedFilter(selectedFilter === filter ? null : filter);
  };

  const getReviewForKPI = (kpiId: number): KPIReview | undefined => {
    return reviews.find(r => r.kpi_id === kpiId);
  };

  const getKPIStatusBadge = (kpi: KPI) => {
    const review = getReviewForKPI(kpi.id);
    if (!review) return null;

    if (review.rejection_resolved_status === 'resolved') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
          <FiCheckCircle className="mr-1" />
          Resolved
        </span>
      );
    }

    if (review.review_status === 'rejected') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <FiAlertTriangle className="mr-1" />
          Rejected
        </span>
      );
    }

    return null;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rejected KPI Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage rejected KPIs and track resolution status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Active Rejections"
          count={rejectedCount}
          color="bg-red-50"
          icon={<FiAlertTriangle className="text-red-600" />}
          onClick={() => handleCardClick('rejected')}
          isSelected={selectedFilter === 'rejected'}
        />
        <StatCard
          title="Resolved Issues"
          count={resolvedCount}
          color="bg-teal-50"
          icon={<FiCheckCircle className="text-teal-600" />}
          onClick={() => handleCardClick('resolved')}
          isSelected={selectedFilter === 'resolved'}
        />
      </div>

      {/* KPI List */}
      {selectedFilter && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedFilter === 'rejected' ? 'Active Rejections' : 'Resolved Issues'} ({kpis.length})
            </h2>
          </div>

          {kpis.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">
                <FiCheckCircle className="mx-auto" />
              </div>
              <p className="text-gray-500">
                {selectedFilter === 'rejected'
                  ? 'No active rejections found'
                  : 'No resolved issues found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      KPI Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Rejection Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kpis.map((kpi) => {
                    const review = getReviewForKPI(kpi.id);
                    return (
                      <tr key={kpi.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                            <p className="text-sm text-gray-500">{kpi.employee_payroll_number || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{kpi.employee_department}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{kpi.title}</p>
                          <p className="text-xs text-gray-500">{kpi.description?.substring(0, 50)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {kpi.quarter} {kpi.year}
                          </p>
                          <p className="text-xs text-gray-500">{kpi.period === 'quarterly' ? 'Quarterly' : 'Annual'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{kpi.manager_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          {getKPIStatusBadge(kpi)}
                        </td>
                        <td className="px-6 py-4">
                          {review?.employee_confirmation_signed_at ? (
                            <div>
                              <p className="text-sm text-gray-900">
                                {new Date(review.employee_confirmation_signed_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                <FiClock className="inline mr-1" />
                                {new Date(review.employee_confirmation_signed_at).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/hr/kpi-details/${kpi.id}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <FiEye />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no filter selected */}
      {!selectedFilter && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">
            <FiAlertTriangle className="mx-auto" />
          </div>
          <p className="text-gray-600 text-lg font-medium mb-2">Select a Category</p>
          <p className="text-gray-500">
            Click on one of the cards above to view rejected or resolved KPIs
          </p>
        </div>
      )}
    </div>
  );
};

export default RejectedKPIManagement;
