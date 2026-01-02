import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiStar, FiCheckCircle, FiClock, FiFileText, FiUser, FiEdit } from 'react-icons/fi';

const ManagerKPIDetails: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [review, setReview] = useState<KPIReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kpiId) {
      fetchKPI();
    }
  }, [kpiId]);

  const fetchKPI = async () => {
    try {
      const [kpiRes, reviewsRes] = await Promise.all([
        api.get(`/kpis/${kpiId}`),
        api.get('/kpi-review'),
      ]);

      setKpi(kpiRes.data.kpi);
      
      // Find review for this KPI
      const kpiReview = reviewsRes.data.reviews?.find((r: KPIReview) => r.kpi_id === parseInt(kpiId!));
      if (kpiReview) {
        setReview(kpiReview);
      }
    } catch (error) {
      console.error('Error fetching KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageInfo = () => {
    if (!kpi) return { stage: '', color: '', icon: null };

    if (kpi.status === 'pending') {
      return {
        stage: 'KPI Setting - Awaiting Acknowledgement',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <FiClock className="text-xl" />
      };
    }

    if (kpi.status === 'acknowledged' && !review) {
      return {
        stage: 'KPI Acknowledged - Review Pending',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <FiFileText className="text-xl" />
      };
    }

    if (review) {
      if (review.review_status === 'employee_submitted') {
        return {
          stage: 'Self-Rating Submitted - Awaiting Manager Review',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: <FiClock className="text-xl" />
        };
      }

      if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
        return {
          stage: 'KPI Review Completed',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: <FiCheckCircle className="text-xl" />
        };
      }

      if (review.review_status === 'pending') {
        return {
          stage: 'KPI Review - Self-Rating Required',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: <FiFileText className="text-xl" />
        };
      }
    }

    return {
      stage: 'In Progress',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: <FiClock className="text-xl" />
    };
  };

  if (loading || !kpi) {
    return <div className="p-6">Loading...</div>;
  }

  const stageInfo = getStageInfo();

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
          <h1 className="text-2xl font-bold text-gray-900">{kpi.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {kpi.quarter} {kpi.year} • {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'} KPI
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${stageInfo.color}`}>
          {stageInfo.icon}
          <span className="font-medium">{stageInfo.stage}</span>
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <FiUser className="text-purple-600 text-2xl" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            <div>
              <p className="text-sm text-gray-600 mb-1">Employee Name</p>
              <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Department</p>
              <p className="font-semibold text-gray-900">{kpi.employee_department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Position</p>
              <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Items</h2>
        <div className="mb-4 text-sm text-gray-600">
          <p>Period: {kpi.quarter} {kpi.year} ({kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'})</p>
          <p>Total Items: {kpi.items?.length || kpi.item_count || 1}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TARGET VALUE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MEASURE UNIT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MEASURE CRITERIA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi.items && kpi.items.length > 0 ? (
                kpi.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{item.description || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{item.target_value || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{item.measure_unit || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{item.measure_criteria || 'N/A'}</p>
                    </td>
                  </tr>
                ))
              ) : (
                // Fallback for legacy single KPI format
                <tr>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">1</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{kpi.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.description || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{kpi.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.measure_unit || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.measure_criteria || 'N/A'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Setting Stage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Setting Stage</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {kpi.manager_signature ? (
                <FiCheckCircle className="text-green-600 text-xl" />
              ) : (
                <FiClock className="text-gray-400 text-xl" />
              )}
              <div>
                <p className="font-medium text-gray-900">Manager Signature</p>
                <p className="text-sm text-gray-600">
                  {kpi.manager_signature ? 'Signed' : 'Pending'}
                  {kpi.manager_signed_at && ` on ${new Date(kpi.manager_signed_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {kpi.employee_signature ? (
                <FiCheckCircle className="text-green-600 text-xl" />
              ) : (
                <FiClock className="text-gray-400 text-xl" />
              )}
              <div>
                <p className="font-medium text-gray-900">Employee Acknowledgement</p>
                <p className="text-sm text-gray-600">
                  {kpi.employee_signature ? 'Acknowledged' : 'Pending'}
                  {kpi.employee_signed_at && ` on ${new Date(kpi.employee_signed_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Review Stage */}
      {kpi.status === 'acknowledged' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review Stage</h2>
          
          {review ? (
            <div className="space-y-4">
              {/* Employee Self-Rating */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Employee Self-Rating</h3>
                  {review.employee_rating ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  )}
                </div>
                {review.employee_rating ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (review.employee_rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {review.employee_rating}/5
                      </span>
                    </div>
                    {review.employee_comment && (
                      <p className="text-sm text-gray-700 mt-2">{review.employee_comment}</p>
                    )}
                    {review.employee_signed_at && (
                      <p className="text-xs text-gray-500">
                        Submitted on {new Date(review.employee_signed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Waiting for employee to submit self-rating...
                  </p>
                )}
              </div>

              {/* Manager Rating */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Manager Rating</h3>
                  {review.manager_rating ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {review.employee_rating ? 'Review Required' : 'Awaiting Employee Rating'}
                    </span>
                  )}
                </div>
                {review.manager_rating ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (review.manager_rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {review.manager_rating}/5
                      </span>
                    </div>
                    {review.manager_comment && (
                      <p className="text-sm text-gray-700 mt-2">{review.manager_comment}</p>
                    )}
                    {review.overall_manager_comment && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Overall Manager Comments:</p>
                        <p className="text-sm text-gray-700">{review.overall_manager_comment}</p>
                      </div>
                    )}
                    {review.manager_signed_at && (
                      <p className="text-xs text-gray-500">
                        Reviewed on {new Date(review.manager_signed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : review.employee_rating ? (
                  <button
                    onClick={() => navigate(`/manager/kpi-review/${review.id}`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Review Now
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">
                    Waiting for employee to submit self-rating...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                KPI has been acknowledged. Waiting for employee to submit self-rating.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            <FiArrowLeft className="text-lg" />
            <span>Back</span>
          </button>
          <button
            onClick={() => navigate(`/manager/employee-kpis/${kpi.employee_id}`)}
            className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700"
          >
            <FiUser className="text-lg" />
            <span>View All {kpi.employee_name}'s KPIs</span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          {review && review.employee_rating && !review.manager_rating && (
            <button
              onClick={() => navigate(`/manager/kpi-review/${review.id}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FiEdit className="inline mr-2" />
              Review KPI
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerKPIDetails;

