import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';
import TextModal from '../../components/TextModal';

const KPIDetails: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [review, setReview] = useState<KPIReview | null>(null);
  const [loading, setLoading] = useState(true);
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
            {kpi.quarter} {kpi.year} • {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'} KPI • {kpi.items?.length || kpi.item_count || 1} Items
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${stageInfo.color}`}>
          {stageInfo.icon}
          <span className="font-medium">{stageInfo.stage}</span>
        </div>
      </div>

      {/* KPI Items Table with Ratings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review & Rating</h2>
        <div className="mb-4 text-sm text-gray-600">
          <p>Period: {kpi.quarter} {kpi.year} ({kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'})</p>
          <p>Total Items: {kpi.items?.length || kpi.item_count || 1}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '50px' }}>#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>KPI TITLE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '250px' }}>DESCRIPTION</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '180px' }}>CURRENT PERFORMANCE STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>TARGET VALUE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>MEASURE UNIT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EXPECTED COMPLETION DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>GOAL WEIGHT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EMPLOYEE SELF RATING</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>EMPLOYEE COMMENT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>MANAGER RATING</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>MANAGER COMMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kpi.items && kpi.items.length > 0 ? (
                    kpi.items.map((item, index) => {
                      const empRating = employeeItemRatings[item.id] || 0;
                      const empComment = employeeItemComments[item.id] || '';
                      const mgrRating = managerItemRatings[item.id] || 0;
                      const mgrComment = managerItemComments[item.id] || '';
                      const isQualitative = item.is_qualitative;
                      
                      return (
                        <tr key={item.id} className={isQualitative ? 'bg-purple-50' : ''}>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">{index + 1}</span>
                            {isQualitative && (
                              <span className="block text-xs text-purple-600 mt-1">Qualitative</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: item.title || 'N/A' })}
                              className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[200px]" title={item.title}>{item.title}</p>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'KPI Description', value: item.description || 'N/A' })}
                              className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>{item.description || 'N/A'}</p>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'Current Performance Status', value: item.current_performance_status || 'N/A' })}
                              className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[180px]" title={item.current_performance_status || 'N/A'}>{item.current_performance_status || 'N/A'}</p>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'Target Value', value: item.target_value || 'N/A' })}
                              className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[150px]" title={item.target_value || 'N/A'}>{item.target_value || 'N/A'}</p>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700 whitespace-nowrap">{item.measure_unit || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700 whitespace-nowrap">
                              {item.expected_completion_date 
                                ? new Date(item.expected_completion_date).toLocaleDateString() 
                                : 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700 whitespace-nowrap">{item.goal_weight || item.measure_criteria || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            {isQualitative ? (
                              <span className="text-sm text-purple-600 font-medium">N/A (Manager Rates)</span>
                            ) : review && review.employee_rating ? (
                              <div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {(() => {
                                    const rating = typeof empRating === 'number' ? empRating : parseFloat(String(empRating || '0'));
                                    return isNaN(rating) ? '0.00' : rating.toFixed(2);
                                  })()}
                                </span>
                                {(() => {
                                  const rating = typeof empRating === 'number' ? empRating : parseFloat(String(empRating || '0'));
                                  return !isNaN(rating) && rating > 0 ? (
                                    <span className="text-xs text-gray-500 ml-1 block">
                                      ({rating === 1.00 ? 'Below' : rating === 1.25 ? 'Meets' : rating === 1.50 ? 'Exceeds' : ''} Expectation)
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not submitted</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
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
                          <td className="px-6 py-4">
                            {isQualitative ? (
                              item.qualitative_rating ? (
                                <div>
                                  <span className="text-sm font-semibold text-purple-700">
                                    {item.qualitative_rating === 'exceeds' ? '⭐ Exceeds' :
                                     item.qualitative_rating === 'meets' ? '✓ Meets' :
                                     item.qualitative_rating === 'needs_improvement' ? '⚠ Needs Improvement' : 'N/A'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Not reviewed</span>
                              )
                            ) : review && review.manager_rating ? (
                              <div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {(() => {
                                    const rating = typeof mgrRating === 'number' ? mgrRating : parseFloat(String(mgrRating || '0'));
                                    return isNaN(rating) ? '0.00' : rating.toFixed(2);
                                  })()}
                                </span>
                                {(() => {
                                  const rating = typeof mgrRating === 'number' ? mgrRating : parseFloat(String(mgrRating || '0'));
                                  return !isNaN(rating) && rating > 0 ? (
                                    <span className="text-xs text-gray-500 ml-1 block">
                                      ({rating === 1.00 ? 'Below' : rating === 1.25 ? 'Meets' : rating === 1.50 ? 'Exceeds' : ''} Expectation)
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not reviewed</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {mgrComment ? (
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
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">1</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: kpi.title || 'N/A' })}
                          className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[200px]" title={kpi.title}>{kpi.title}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTextModal({ isOpen: true, title: 'KPI Description', value: kpi.description || 'N/A' })}
                          className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[250px]" title={kpi.description || 'N/A'}>{kpi.description || 'N/A'}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">N/A</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTextModal({ isOpen: true, title: 'Target Value', value: kpi.target_value || 'N/A' })}
                          className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[150px]" title={kpi.target_value || 'N/A'}>{kpi.target_value || 'N/A'}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">{kpi.measure_unit || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">N/A</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">{kpi.measure_criteria || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {review && review.employee_rating ? (
                          <span className="text-sm font-semibold text-gray-900">
                            {parseFloat(String(review.employee_rating)).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {review?.employee_comment ? (
                          <button
                            onClick={() => {
                              const comment = review.employee_comment || '';
                              try {
                                const parsed = JSON.parse(comment);
                                const commentText = parsed.items ? parsed.items.map((i: any) => i.comment).filter(Boolean).join('\n\n') : comment;
                                setTextModal({ isOpen: true, title: 'Employee Comment', value: commentText });
                              } catch {
                                setTextModal({ isOpen: true, title: 'Employee Comment', value: comment });
                              }
                            }}
                            className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={review.employee_comment || ''}>
                              {(review.employee_comment || '').length > 50 ? (review.employee_comment || '').substring(0, 50) + '...' : (review.employee_comment || '')}
                            </p>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">No comment</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {review && review.manager_rating ? (
                          <span className="text-sm font-semibold text-gray-900">
                            {parseFloat(String(review.manager_rating)).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Not reviewed</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {review?.manager_comment ? (
                          <button
                            onClick={() => {
                              const comment = review.manager_comment || '';
                              try {
                                const parsed = JSON.parse(comment);
                                const commentText = parsed.items ? parsed.items.map((i: any) => i.comment).filter(Boolean).join('\n\n') : comment;
                                setTextModal({ isOpen: true, title: 'Manager Comment', value: commentText });
                              } catch {
                                setTextModal({ isOpen: true, title: 'Manager Comment', value: comment });
                              }
                            }}
                            className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={review.manager_comment || ''}>
                              {(review.manager_comment || '').length > 50 ? (review.manager_comment || '').substring(0, 50) + '...' : (review.manager_comment || '')}
                            </p>
                          </button>
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
            {!kpi.employee_signature && (
              <button
                onClick={() => navigate(`/employee/kpi-acknowledgement/${kpi.id}`)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Acknowledge Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employee Accomplishments & Disappointments */}
      {review && (review.major_accomplishments || review.disappointments) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Reflection</h2>
          
          <div className="space-y-6">
            {/* Major Accomplishments */}
            {review.major_accomplishments && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Major Accomplishments</h3>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.major_accomplishments}</p>
                </div>
                
                {review.major_accomplishments_manager_comment && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Manager's Feedback</h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.major_accomplishments_manager_comment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Disappointments */}
            {review.disappointments && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Challenges & Disappointments</h3>
                <div className="bg-orange-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.disappointments}</p>
                </div>
                
                {review.disappointments_manager_comment && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Manager's Guidance</h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.disappointments_manager_comment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Manager Comments */}
      {review && review.overall_manager_comment && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Manager Comments</h2>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <button
              onClick={() => setTextModal({ isOpen: true, title: 'Overall Manager Comments', value: review.overall_manager_comment || '' })}
              className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors w-full"
            >
              <p className="whitespace-pre-wrap">{review.overall_manager_comment}</p>
            </button>
            {review.manager_signed_at && (
              <p className="text-xs text-gray-500 mt-2">
                Reviewed on {new Date(review.manager_signed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Employee Rejection Note */}
      {review && review.review_status === 'rejected' && review.employee_rejection_note && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-red-900">⚠️ Your Rejection Reason:</p>
              <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-semibold">
                REJECTED
              </span>
            </div>
            <p className="text-sm text-red-700 font-medium bg-white p-3 rounded border border-red-200">
              {review.employee_rejection_note}
            </p>
            {review.employee_confirmation_signed_at && (
              <p className="text-xs text-red-600 mt-2">
                Rejected on {new Date(review.employee_confirmation_signed_at).toLocaleDateString()}
              </p>
            )}
            {review.rejection_resolved_status === 'resolved' && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex items-center space-x-2 text-green-700 mb-2">
                  <FiCheckCircle className="text-lg" />
                  <span className="font-semibold">Issue Resolved by HR</span>
                </div>
                {review.rejection_resolved_note && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Resolution Note from HR:</p>
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
        </div>
      )}

      {/* Action Buttons for Self-Rating */}
      {kpi.status === 'acknowledged' && (!review || !review.employee_rating) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Submit Your Self-Rating</h3>
              <p className="text-sm text-gray-600 mt-1">
                {review ? 'Complete your self-rating to proceed with the review process.' : 'KPI has been acknowledged. You can now submit your self-rating.'}
              </p>
            </div>
            <button
              onClick={() => navigate(`/employee/self-rating/${kpi.id}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              {review ? 'Continue Self-Rating' : 'Start Self-Rating'}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employee/kpi-list')}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          <FiArrowLeft className="text-lg" />
          <span>Back to KPI List</span>
        </button>
        <div className="flex items-center space-x-3">
          {kpi.status === 'pending' && (
            <button
              onClick={() => navigate(`/employee/kpi-acknowledgement/${kpi.id}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Acknowledge KPI
            </button>
          )}
          {kpi.status === 'acknowledged' && (!review || !review.employee_rating) && (
            <button
              onClick={() => navigate(`/employee/self-rating/${kpi.id}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Submit Self-Rating
            </button>
          )}
        </div>
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

export default KPIDetails;

