import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiUser } from 'react-icons/fi';
import TextModal from '../../components/TextModal';

const HRKPIDetails: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [review, setReview] = useState<KPIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolveNote, setResolveNote] = useState('');
  const [textModal, setTextModal] = useState<{ isOpen: boolean; title: string; value: string }>({
    isOpen: false,
    title: '',
    value: '',
  });

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
              <table className="w-full" style={{ minWidth: '2000px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10 whitespace-nowrap" style={{ minWidth: '50px' }}>#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>KPI TITLE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '250px' }}>DESCRIPTION</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '180px' }}>CURRENT PERFORMANCE STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>TARGET VALUE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>MEASURE UNIT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EXPECTED COMPLETION DATE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>GOAL WEIGHT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EMPLOYEE SELF RATING</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>EMPLOYEE COMMENT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>MANAGER RATING</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>MANAGER COMMENT</th>
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
                            <div>
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: item.title || 'N/A' })}
                                className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                              >
                                <p className="truncate max-w-[200px]" title={item.title}>{item.title}</p>
                              </button>
                              <p className="text-xs text-gray-500">KPI-{kpi.quarter}-{String(index + 1).padStart(3, '0')}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'KPI Description', value: item.description || 'N/A' })}
                              className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>{item.description || 'N/A'}</p>
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'Current Performance Status', value: item.current_performance_status || 'N/A' })}
                              className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[180px]" title={item.current_performance_status || 'N/A'}>{item.current_performance_status || 'N/A'}</p>
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            {item.is_qualitative ? (
                              <span className="text-sm text-purple-600 font-medium">Qualitative</span>
                            ) : (
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'Target Value', value: item.target_value || 'N/A' })}
                                className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                              >
                                <p className="truncate max-w-[150px]" title={item.target_value || 'N/A'}>{item.target_value || 'N/A'}</p>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-sm whitespace-nowrap ${
                              item.is_qualitative ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.is_qualitative ? 'Qualitative' : (item.measure_unit || 'N/A')}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-700 whitespace-nowrap">
                              {item.expected_completion_date 
                                ? new Date(item.expected_completion_date).toLocaleDateString() 
                                : 'N/A'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-700 whitespace-nowrap">{item.goal_weight || item.measure_criteria || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            {item.is_qualitative ? (
                              <span className="text-sm text-purple-600 font-medium">N/A (Qualitative)</span>
                            ) : review && review.employee_rating ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {(() => {
                                      const rating = typeof empRating === 'number' 
                                        ? empRating 
                                        : parseFloat(String(empRating || '0'));
                                      return isNaN(rating) ? '0.00' : rating.toFixed(2);
                                    })()}
                                  </span>
                                  {(() => {
                                    const rating = typeof empRating === 'number' 
                                      ? empRating 
                                      : parseFloat(String(empRating || '0'));
                                    return !isNaN(rating) && rating > 0 ? (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({rating === 1.00 ? 'Below' : rating === 1.25 ? 'Meets' : rating === 1.50 ? 'Exceeds' : ''} Expectation)
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                {review.employee_self_rating_signed_at && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(review.employee_self_rating_signed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not submitted</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {empComment ? (
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'Employee Comment', value: empComment })}
                                className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                              >
                                <p className="truncate max-w-[200px]" title={empComment}>
                                  {empComment.length > 50 ? empComment.substring(0, 50) + '...' : empComment}
                                </p>
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">No comment</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {item.is_qualitative ? (
                              item.qualitative_rating ? (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold text-purple-700">
                                      {item.qualitative_rating === 'exceeds' ? '⭐ Exceeds Expectations' :
                                       item.qualitative_rating === 'meets' ? '✓ Meets Expectations' :
                                       item.qualitative_rating === 'needs_improvement' ? '⚠ Needs Improvement' : 'N/A'}
                                    </span>
                                  </div>
                                  {review && review.manager_review_signed_at && (
                                    <p className="text-xs text-gray-500">
                                      {new Date(review.manager_review_signed_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Not reviewed</span>
                              )
                            ) : review && review.manager_rating ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {(() => {
                                      const rating = typeof mgrRating === 'number' 
                                        ? mgrRating 
                                        : parseFloat(String(mgrRating || '0'));
                                      return isNaN(rating) ? '0.00' : parseFloat(String(rating)).toFixed(2);
                                    })()}
                                  </span>
                                  {(() => {
                                    const rating = typeof mgrRating === 'number' 
                                      ? mgrRating 
                                      : parseFloat(String(mgrRating || '0'));
                                    return !isNaN(rating) && rating > 0 ? (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({rating === 1.00 ? 'Below' : rating === 1.25 ? 'Meets' : rating === 1.50 ? 'Exceeds' : ''} Expectation)
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                {review.manager_review_signed_at && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(review.manager_review_signed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not reviewed</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {item.is_qualitative && item.qualitative_comment ? (
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'Qualitative Assessment', value: item.qualitative_comment || '' })}
                                className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                              >
                                <p className="truncate max-w-[200px]" title={item.qualitative_comment}>
                                  {item.qualitative_comment.length > 50 ? item.qualitative_comment.substring(0, 50) + '...' : item.qualitative_comment}
                                </p>
                              </button>
                            ) : mgrComment ? (
                              <button
                                onClick={() => setTextModal({ isOpen: true, title: 'Manager Comment', value: mgrComment })}
                                className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                              >
                                <p className="truncate max-w-[200px]" title={mgrComment}>
                                  {mgrComment.length > 50 ? mgrComment.substring(0, 50) + '...' : mgrComment}
                                </p>
                              </button>
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
                        <p className="text-sm text-gray-900">N/A</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{kpi.target_value || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">N/A</p>
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
                            <span className="text-sm font-semibold text-gray-900">
                              {(() => {
                                const rating = typeof review.employee_rating === 'number' 
                                  ? review.employee_rating 
                                  : parseFloat(String(review.employee_rating || '0'));
                                return isNaN(rating) ? '0.00' : parseFloat(String(rating)).toFixed(2);
                              })()}
                            </span>
                            {(() => {
                              const rating = typeof review.employee_rating === 'number' 
                                ? review.employee_rating 
                                : parseFloat(String(review.employee_rating || '0'));
                              return !isNaN(rating) && rating > 0 ? (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({rating === 1.00 ? 'Below' : rating === 1.25 ? 'Meets' : rating === 1.50 ? 'Exceeds' : ''} Expectation)
                                </span>
                              ) : null;
                            })()}
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
                            <span className="text-sm font-semibold text-gray-900">
                              {(() => {
                                const rating = typeof review.manager_rating === 'number' 
                                  ? review.manager_rating 
                                  : parseFloat(String(review.manager_rating || '0'));
                                return isNaN(rating) ? '0.00' : parseFloat(String(rating)).toFixed(2);
                              })()}
                            </span>
                            {(() => {
                              const rating = typeof review.manager_rating === 'number' 
                                ? review.manager_rating 
                                : parseFloat(String(review.manager_rating || '0'));
                              return !isNaN(rating) && rating > 0 ? (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({rating === 1.00 ? 'Below' : rating === 1.25 ? 'Meets' : rating === 1.50 ? 'Exceeds' : ''} Expectation)
                                </span>
                              ) : null;
                            })()}
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
        
        {/* Final Rating Calculation */}
        {review && review.manager_rating && kpi.items && kpi.items.length > 0 && (() => {
          // Parse manager ratings from JSON
          let managerItemRatings: { [key: number]: number } = {};
          try {
            const mgrData = JSON.parse(review.manager_comment || '{}');
            if (mgrData.items && Array.isArray(mgrData.items)) {
              mgrData.items.forEach((item: any) => {
                if (item.item_id) {
                  managerItemRatings[item.item_id] = parseFloat(item.rating) || 0;
                }
              });
            }
          } catch {
            // Not JSON, use legacy format
          }

          // Calculate final rating: Σ(manager_rating * goal_weight)
          let finalRating = 0;
          let totalWeight = 0;
          const itemCalculations = kpi.items.map((item: any) => {
            const mgrRating = managerItemRatings[item.id] || 0;
            // Parse goal_weight as percentage (e.g., "40%" or "0.4" or "40")
            let weight = 0;
            if (item.goal_weight) {
              const weightStr = String(item.goal_weight).trim();
              if (weightStr.endsWith('%')) {
                weight = parseFloat(weightStr.replace('%', '')) / 100;
              } else {
                weight = parseFloat(weightStr);
                // If weight > 1, assume it's a percentage (e.g., 40 means 40%)
                if (weight > 1) {
                  weight = weight / 100;
                }
              }
            }
            const contribution = mgrRating * weight;
            finalRating += contribution;
            totalWeight += weight;
            return {
              item_id: item.id,
              title: item.title,
              manager_rating: mgrRating,
              goal_weight: weight,
              contribution: contribution,
            };
          });

          const getRatingLabel = (rating: number): string => {
            if (rating >= 1.40) return 'Exceeds Expectation';
            if (rating >= 1.15) return 'Meets Expectation';
            return 'Below Expectation';
          };

          // Calculate total manager rating (average of all item ratings)
          const totalManagerRating = itemCalculations.length > 0
            ? itemCalculations.reduce((sum, calc) => sum + calc.manager_rating, 0) / itemCalculations.length
            : 0;

          return (
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Performance Rating</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Final Score</p>
                  <p className="text-3xl font-bold text-purple-600">{finalRating.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">{getRatingLabel(finalRating)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Manager Rating Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalManagerRating.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Total Contribution</p>
                  <p className="text-2xl font-semibold text-gray-900">{finalRating.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">KPI Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{kpi.items.length}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Calculation Breakdown:</p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2">KPI Item</th>
                        <th className="text-right py-2 px-2">Manager Rating</th>
                        <th className="text-right py-2 px-2">Goal Weight</th>
                        <th className="text-right py-2 px-2">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemCalculations.map((calc: any, idx: number) => (
                        <tr key={calc.item_id} className="border-b border-gray-100">
                          <td className="py-2 px-2 text-gray-700">{calc.title || `Item ${idx + 1}`}</td>
                          <td className="py-2 px-2 text-right font-semibold">{calc.manager_rating.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right">{(calc.goal_weight * 100).toFixed(0)}%</td>
                          <td className="py-2 px-2 text-right font-semibold text-purple-600">{calc.contribution.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 font-semibold">
                        <td className="py-2 px-2">Total</td>
                        <td className="py-2 px-2 text-right">-</td>
                        <td className="py-2 px-2 text-right">{(totalWeight * 100).toFixed(0)}%</td>
                        <td className="py-2 px-2 text-right text-purple-600">{finalRating.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Employee Accomplishments & Disappointments */}
        {review && (review.major_accomplishments || review.disappointments) && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Employee Performance Reflection</h3>
            
            {/* Major Accomplishments */}
            {review.major_accomplishments && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-900 mb-2">Major Accomplishments:</p>
                <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.major_accomplishments}</p>
                </div>
                {review.major_accomplishments_manager_comment && (
                  <>
                    <p className="text-xs font-semibold text-gray-900 mb-2">Manager's Feedback:</p>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.major_accomplishments_manager_comment}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Disappointments */}
            {review.disappointments && (
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Challenges & Disappointments:</p>
                <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.disappointments}</p>
                </div>
                {review.disappointments_manager_comment && (
                  <>
                    <p className="text-xs font-semibold text-gray-900 mb-2">Manager's Guidance:</p>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.disappointments_manager_comment}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

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

        {/* Employee Rejection Note */}
        {review && review.review_status === 'rejected' && review.employee_rejection_note && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border-2 border-red-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-red-900">⚠️ Employee Rejection Reason:</p>
              {review.employee_confirmation_status === 'rejected' && (
                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-semibold">
                  REJECTED
                </span>
              )}
            </div>
            <p className="text-sm text-red-700 font-medium bg-white p-3 rounded border border-red-200">
              {review.employee_rejection_note}
            </p>
            {review.employee_confirmation_signed_at && (
              <p className="text-xs text-red-600 mt-2">
                Rejected on {new Date(review.employee_confirmation_signed_at).toLocaleDateString()}
              </p>
            )}
            
            {/* Mark as Resolved Button for HR */}
            {review.rejection_resolved_status !== 'resolved' && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Note (Optional)
                </label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Enter a note about how this issue was resolved..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  rows={3}
                />
                <button
                  onClick={async () => {
                    if (confirm('Mark this rejection as resolved? This will move it to the Resolved Issues section.')) {
                      try {
                        await api.post(`/kpi-review/${review.id}/resolve-rejection`, {
                          note: resolveNote
                        });
                        alert('Rejection marked as resolved successfully!');
                        setResolveNote('');
                        fetchKPI(); // Refresh data
                      } catch (error) {
                        console.error('Error resolving rejection:', error);
                        alert('Failed to mark as resolved');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  ✓ Mark as Resolved
                </button>
              </div>
            )}

            {/* Resolved Status */}
            {review.rejection_resolved_status === 'resolved' && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex items-center space-x-2 text-green-700 mb-2">
                  <FiCheckCircle className="text-lg" />
                  <span className="font-semibold">Issue Resolved</span>
                </div>
                {review.rejection_resolved_note && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Resolution Note:</p>
                    <p className="text-sm text-gray-900">{review.rejection_resolved_note}</p>
                  </div>
                )}
                {review.rejection_resolved_at && (
                  <p className="text-xs text-gray-600">
                    Resolved on {new Date(review.rejection_resolved_at).toLocaleDateString()}
                    {review.rejection_resolved_by_name && ` by ${review.rejection_resolved_by_name}`}
                  </p>
                )}
              </div>
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

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => setTextModal({ isOpen: false, title: '', value: '' })}
        title={textModal.title}
        value={textModal.value}
        readOnly={true}
      />
    </div>
  );
};

export default HRKPIDetails;

