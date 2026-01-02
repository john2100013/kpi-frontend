import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiStar, FiCheckCircle, FiClock, FiFileText, FiUser } from 'react-icons/fi';

const HRKPIDetails: React.FC = () => {
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

      {/* Employee & Manager Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee & Manager Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FiUser className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                <p className="text-sm text-gray-500">{kpi.employee_department}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUser className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Manager</p>
                <p className="font-semibold text-gray-900">{kpi.manager_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive KPI Review Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">KPI Review & Rating</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Period: {kpi.quarter} {kpi.year} ({kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'})</span>
            <span>Total Items: {kpi.items?.length || kpi.item_count || 1}</span>
          </div>
        </div>
        
        {/* Parse employee and manager ratings/comments */}
        {(() => {
          let employeeItemRatings: { [key: number]: number } = {};
          let employeeItemComments: { [key: number]: string } = {};
          let managerItemRatings: { [key: number]: number } = {};
          let managerItemComments: { [key: number]: string } = {};

          if (review) {
            // Parse employee ratings/comments
            try {
              const empData = JSON.parse(review.employee_comment || '{}');
              if (empData.items && Array.isArray(empData.items)) {
                empData.items.forEach((item: any) => {
                  if (item.item_id) {
                    employeeItemRatings[item.item_id] = item.rating || 0;
                    employeeItemComments[item.item_id] = item.comment || '';
                  }
                });
              }
            } catch {
              // Not JSON, use legacy format
            }

            // Parse manager ratings/comments
            try {
              const mgrData = JSON.parse(review.manager_comment || '{}');
              if (mgrData.items && Array.isArray(mgrData.items)) {
                mgrData.items.forEach((item: any) => {
                  if (item.item_id) {
                    managerItemRatings[item.item_id] = item.rating || 0;
                    managerItemComments[item.item_id] = item.comment || '';
                  }
                });
              }
            } catch {
              // Not JSON, use legacy format
            }
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">KPI TITLE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[250px]">DESCRIPTION</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[120px]">TARGET VALUE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[120px]">MEASURE UNIT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[150px]">MEASURE CRITERIA</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[180px]">EMPLOYEE SELF RATING</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">EMPLOYEE COMMENT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[180px]">MANAGER RATING</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">MANAGER COMMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kpi.items && kpi.items.length > 0 ? (
                    kpi.items.map((item, index) => {
                      const empRating = employeeItemRatings[item.id] || 0;
                      const empComment = employeeItemComments[item.id] || '';
                      const mgrRating = managerItemRatings[item.id] || 0;
                      const mgrComment = managerItemComments[item.id] || '';
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 sticky left-0 bg-white z-10">
                            <span className="font-semibold text-gray-900">{index + 1}</span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500">KPI-{kpi.quarter}-{String(index + 1).padStart(3, '0')}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-700">{item.description || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">{item.target_value || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                              {item.measure_unit || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-700">{item.measure_criteria || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            {review && review.employee_rating ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <FiStar
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= empRating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {empRating > 0 ? `${empRating}/5` : 'N/A'}
                                  </span>
                                </div>
                                {review.employee_signed_at && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(review.employee_signed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not submitted</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {empComment ? (
                              <p className="text-sm text-gray-700">{empComment}</p>
                            ) : (
                              <span className="text-sm text-gray-400">No comment</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {review && review.manager_rating ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <FiStar
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= mgrRating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {mgrRating > 0 ? `${mgrRating}/5` : 'N/A'}
                                  </span>
                                </div>
                                {review.manager_signed_at && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(review.manager_signed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not reviewed</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {mgrComment ? (
                              <p className="text-sm text-gray-700">{mgrComment}</p>
                            ) : (
                              <span className="text-sm text-gray-400">No comment</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Fallback for legacy single KPI format
                    <tr>
                      <td className="px-4 py-4 sticky left-0 bg-white z-10">
                        <span className="font-semibold text-gray-900">1</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">{kpi.title}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{kpi.description || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{kpi.target_value || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                          {kpi.measure_unit || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{kpi.measure_criteria || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        {review && review.employee_rating ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const rating = typeof review.employee_rating === 'number' 
                                  ? review.employee_rating 
                                  : parseFloat(review.employee_rating || '0');
                                return (
                                  <FiStar
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= Math.round(rating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {(() => {
                                const rating = typeof review.employee_rating === 'number' 
                                  ? review.employee_rating 
                                  : parseFloat(review.employee_rating || '0');
                                return isNaN(rating) ? '0.0' : rating.toFixed(1);
                              })()}/5
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not submitted</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {review?.employee_comment ? (
                          <p className="text-sm text-gray-700">{review.employee_comment}</p>
                        ) : (
                          <span className="text-sm text-gray-400">No comment</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {review && review.manager_rating ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const rating = typeof review.manager_rating === 'number' 
                                  ? review.manager_rating 
                                  : parseFloat(review.manager_rating || '0');
                                return (
                                  <FiStar
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= Math.round(rating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {(() => {
                                const rating = typeof review.manager_rating === 'number' 
                                  ? review.manager_rating 
                                  : parseFloat(review.manager_rating || '0');
                                return isNaN(rating) ? '0.0' : rating.toFixed(1);
                              })()}/5
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not reviewed</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {review?.manager_comment ? (
                          <p className="text-sm text-gray-700">{review.manager_comment}</p>
                        ) : (
                          <span className="text-sm text-gray-400">No comment</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
        
        {/* Overall Manager Comments */}
        {review && review.overall_manager_comment && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-gray-900 mb-2">Overall Manager Comments:</p>
            <p className="text-sm text-gray-700">{review.overall_manager_comment}</p>
            {review.manager_signed_at && (
              <p className="text-xs text-gray-500 mt-2">
                Reviewed on {new Date(review.manager_signed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Employee Acknowledgement */}
      {kpi.employee_signature && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <FiCheckCircle className="text-green-600 text-2xl" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Employee Acknowledgement</h2>
              {kpi.employee_signed_at && (
                <p className="text-sm text-gray-600 mt-1">
                  Acknowledged on {new Date(kpi.employee_signed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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


      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/hr/kpi-list')}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          <FiArrowLeft className="text-lg" />
          <span>Back to KPI List</span>
        </button>
      </div>
    </div>
  );
};

export default HRKPIDetails;

