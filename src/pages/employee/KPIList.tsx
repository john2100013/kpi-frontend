import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiEye } from 'react-icons/fi';

const KPIList: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<KPIReview[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getKPIStage = (kpi: KPI): { stage: string; color: string; icon: React.ReactNode } => {
    // Find review for this KPI
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
      if (review.review_status === 'awaiting_employee_confirmation') {
        return {
          stage: 'Awaiting Your Confirmation',
          color: 'bg-indigo-100 text-indigo-700',
          icon: <FiClock className="inline" />
        };
      }

      if (review.review_status === 'employee_submitted') {
        return {
          stage: 'Self-Rating Submitted - Awaiting Manager Review',
          color: 'bg-yellow-100 text-yellow-700',
          icon: <FiClock className="inline" />
        };
      }

      if (review.review_status === 'completed') {
        return {
          stage: 'KPI Review Completed',
          color: 'bg-green-100 text-green-700',
          icon: <FiCheckCircle className="inline" />
        };
      }

      if (review.review_status === 'rejected') {
        return {
          stage: 'Review Rejected',
          color: 'bg-red-100 text-red-700',
          icon: <FiFileText className="inline" />
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My KPIs</h1>
          <p className="text-sm text-gray-600 mt-1">View all your KPIs and their current status</p>
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All KPIs ({kpis.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpis.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No KPIs assigned yet
                  </td>
                </tr>
              ) : (
                kpis.map((kpi) => {
                  const stageInfo = getKPIStage(kpi);
                  const review = reviews.find(r => r.kpi_id === kpi.id);

                  let primaryActionLabel: string | null = null;
                  let primaryActionOnClick: (() => void) | null = null;

                  if (kpi.status === 'pending') {
                    primaryActionLabel = 'Acknowledge KPI';
                    primaryActionOnClick = () => navigate(`/employee/kpi-acknowledgement/${kpi.id}`);
                  } else if (review && review.review_status === 'awaiting_employee_confirmation') {
                    primaryActionLabel = 'Confirm';
                    primaryActionOnClick = () => navigate(`/employee/kpi-confirmation/${review.id}`);
                  } else if (
                    kpi.status === 'acknowledged' &&
                    (!review || review.review_status === 'pending')
                  ) {
                    primaryActionLabel = 'Review KPI';
                    primaryActionOnClick = () => navigate(`/employee/self-rating/${kpi.id}`);
                  }

                  return (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{kpi.title}</p>
                          {kpi.items && kpi.items.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              KPI Form with {kpi.items.length} item{kpi.items.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <p>{kpi.quarter} {kpi.year}</p>
                          {kpi.meeting_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Meeting: {new Date(kpi.meeting_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${stageInfo.color}`}>
                          {stageInfo.icon}
                          <span>{stageInfo.stage}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/employee/kpi-details/${kpi.id}`)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <FiEye className="text-lg" />
                            <span>View</span>
                          </button>
                          {primaryActionLabel && primaryActionOnClick && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={primaryActionOnClick}
                                className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"
                              >
                                {primaryActionLabel}
                              </button>
                            </>
                          )}
                          {/* Show Edit button after review is submitted */}
                          {review && (review.review_status === 'employee_submitted' || review.review_status === 'manager_submitted' || review.review_status === 'completed') && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => navigate(`/employee/self-rating/${kpi.id}`)}
                                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                              >
                                Edit
                              </button>
                            </>
                          )}
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

export default KPIList;

