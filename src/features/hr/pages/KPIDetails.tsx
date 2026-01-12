/**
 * KPI Details Page - Refactored
 * View comprehensive KPI details, reviews, and ratings
 * 
 * Note: Due to the complex nature of the comprehensive KPI review table with 12 columns,
 * multiple data sources, and intricate rating calculations, the table rendering remains
 * in the page component for maintainability. Business logic has been extracted to hooks and utilities.
 */

import React from 'react';
import { FiArrowLeft, FiCheckCircle, FiClock } from 'react-icons/fi';
import { Button } from '../../../components/common';
import TextModal from '../../../components/TextModal';
import { useKPIDetails } from '../hooks/useKPIDetails';
import {
  parseItemRatings,
  parseItemComments,
  formatRating,
  getRatingLabel,
  getOverallRatingLabel,
  parseGoalWeight,
} from '../hooks/kpiDetailsUtils';
import { KPIInformationCard, KPIRejectionCard } from '../components';
import AccomplishmentsTable from '../../../components/AccomplishmentsTable';

const HRKPIDetails: React.FC = () => {
  const {
    kpi,
    review,
    loading,
    resolveNote,
    setResolveNote,
    textModal,
    stageInfo,
    openTextModal,
    closeTextModal,
    handleResolveRejection,
    navigate,
  } = useKPIDetails();

  if (loading || !kpi) {
    return <div className="p-6">Loading...</div>;
  }

  // Parse employee and manager ratings/comments with structured data support
  const employeeItemRatings = parseItemRatings(review?.employee_comment || null, review?.item_ratings, 'employee');
  const employeeItemComments = parseItemComments(review?.employee_comment || null, review?.item_ratings, 'employee');
  const managerItemRatings = parseItemRatings(review?.manager_comment || null, review?.item_ratings, 'manager');
  const managerItemComments = parseItemComments(review?.manager_comment || null, review?.item_ratings, 'manager');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button onClick={() => navigate(-1)} variant="ghost" icon={FiArrowLeft} size="md" />
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
      <KPIInformationCard kpi={kpi} />

      {/* Comprehensive KPI Review Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">KPI Review & Rating</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Period: {kpi.quarter} {kpi.year} ({kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'})
            </span>
            <span>Total Items: {kpi.items?.length || kpi.item_count || 1}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '2000px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10 whitespace-nowrap" style={{ minWidth: '50px' }}>
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>
                  KPI TITLE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '250px' }}>
                  DESCRIPTION
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '180px' }}>
                  CURRENT PERFORMANCE STATUS
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>
                  TARGET VALUE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>
                  ACTUAL VALUE ACHIEVED
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>
                  MEASURE UNIT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>
                  EXPECTED COMPLETION DATE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>
                  GOAL WEIGHT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>
                  EMPLOYEE SELF RATING
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>
                  EMPLOYEE COMMENT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>
                  MANAGER RATING
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>
                  MANAGER COMMENT
                </th>
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
                          <Button
                            onClick={() => openTextModal('KPI Title', item.title || 'N/A')}
                            variant="link"
                            className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={item.title}>
                              {item.title}
                            </p>
                          </Button>
                          <p className="text-xs text-gray-500">
                            KPI-{kpi.quarter}-{String(index + 1).padStart(3, '0')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          onClick={() => openTextModal('KPI Description', item.description || 'N/A')}
                          variant="link"
                          className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>
                            {item.description || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          onClick={() =>
                            openTextModal('Current Performance Status', item.current_performance_status || 'N/A')
                          }
                          variant="link"
                          className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[180px]" title={item.current_performance_status || 'N/A'}>
                            {item.current_performance_status || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-4 py-4">
                        {item.is_qualitative ? (
                          <span className="text-sm text-purple-600 font-medium">Qualitative</span>
                        ) : (
                          <Button
                            onClick={() => openTextModal('Target Value', item.target_value || 'N/A')}
                            variant="link"
                            className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[150px]" title={item.target_value || 'N/A'}>
                              {item.target_value || 'N/A'}
                            </p>
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {item.is_qualitative ? (
                          <span className="text-sm text-purple-600 font-medium">N/A (Qualitative)</span>
                        ) : (
                          <p className="text-sm text-gray-700">{item.actual_value || 'N/A'}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-sm whitespace-nowrap ${
                            item.is_qualitative ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.is_qualitative ? 'Qualitative' : item.measure_unit || 'N/A'}
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
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.goal_weight || item.measure_criteria || 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {item.is_qualitative ? (
                          <span className="text-sm text-purple-600 font-medium">N/A (Qualitative)</span>
                        ) : review && review.employee_rating ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-900">{formatRating(empRating)}</span>
                              {empRating > 0 && (
                                <span className="text-xs text-gray-500 ml-1">({getRatingLabel(empRating)} Expectation)</span>
                              )}
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
                            onClick={() => openTextModal('Employee Comment', empComment)}
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
                                  {item.qualitative_rating === 'exceeds'
                                    ? '⭐ Exceeds Expectations'
                                    : item.qualitative_rating === 'meets'
                                    ? '✓ Meets Expectations'
                                    : item.qualitative_rating === 'needs_improvement'
                                    ? '⚠ Needs Improvement'
                                    : 'N/A'}
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
                              <span className="text-sm font-semibold text-gray-900">{formatRating(mgrRating)}</span>
                              {mgrRating > 0 && (
                                <span className="text-xs text-gray-500 ml-1">({getRatingLabel(mgrRating)} Expectation)</span>
                              )}
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
                          <Button
                            onClick={() => openTextModal('Qualitative Assessment', item.qualitative_comment || '')}
                            variant="link"
                            className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={item.qualitative_comment}>
                              {item.qualitative_comment.length > 50
                                ? item.qualitative_comment.substring(0, 50) + '...'
                                : item.qualitative_comment}
                            </p>
                          </Button>
                        ) : mgrComment ? (
                          <Button
                            onClick={() => openTextModal('Manager Comment', mgrComment)}
                            variant="link"
                            className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={mgrComment}>
                              {mgrComment.length > 50 ? mgrComment.substring(0, 50) + '...' : mgrComment}
                            </p>
                          </Button>
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
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Avg:</span>
                          <span className="text-sm font-semibold text-gray-700">{formatRating(review.employee_rating)}</span>
                        </div>
                        {review.employee_final_rating && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">Final:</span>
                            <span className="text-sm font-bold text-blue-700">{formatRating(review.employee_final_rating)}</span>
                            <span className="text-xs text-gray-500">
                              ({getRatingLabel(review.employee_final_rating)})
                            </span>
                          </div>
                        )}
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
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Avg:</span>
                          <span className="text-sm font-semibold text-gray-700">{formatRating(review.manager_rating)}</span>
                        </div>
                        {review.manager_final_rating && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">Final:</span>
                            <span className="text-sm font-bold text-purple-700">{formatRating(review.manager_final_rating)}</span>
                            <span className="text-xs text-gray-500">
                              ({getRatingLabel(review.manager_final_rating)})
                            </span>
                          </div>
                        )}
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

        {/* Final Rating Calculation */}
        {review &&
          review.manager_rating &&
          kpi.items &&
          kpi.items.length > 0 &&
          (() => {
            // Use backend-calculated ratings if available
            const averageRating = review.manager_rating || 0;
            const finalRating = review.manager_final_rating || averageRating;
            
            // Calculate for display breakdown
            let calculatedRating = 0;
            let totalWeight = 0;
            const itemCalculations = kpi.items.map((item: any) => {
              const mgrRating = managerItemRatings[item.id] || 0;
              const weight = parseGoalWeight(item.goal_weight);
              const contribution = mgrRating * weight;
              calculatedRating += contribution;
              totalWeight += weight;
              return {
                item_id: item.id,
                title: item.title,
                manager_rating: mgrRating,
                goal_weight: weight,
                contribution: contribution,
              };
            });

            const totalManagerRating =
              itemCalculations.length > 0
                ? itemCalculations.reduce((sum: number, calc: any) => sum + calc.manager_rating, 0) /
                  itemCalculations.length
                : 0;

            return (
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Performance Rating</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                    <p className="text-2xl font-semibold text-gray-700">{averageRating.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-2 mb-1">Final Rating</p>
                    <p className="text-3xl font-bold text-purple-600">{finalRating.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">{getOverallRatingLabel(finalRating)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Manager Rating Total</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalManagerRating.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Contribution</p>
                    <p className="text-2xl font-semibold text-gray-900">{averageRating.toFixed(2)}</p>
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
                            <td className="py-2 px-2 text-right font-semibold text-purple-600">
                              {calc.contribution.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td className="py-2 px-2">Total</td>
                          <td className="py-2 px-2 text-right">-</td>
                          <td className="py-2 px-2 text-right">{(totalWeight * 100).toFixed(0)}%</td>
                          <td className="py-2 px-2 text-right">
                            <div className="text-gray-600 text-xs">Avg: {averageRating.toFixed(2)}</div>
                            <div className="text-purple-600 font-bold">Final: {finalRating.toFixed(2)}</div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Employee Accomplishments & Disappointments */}
        {review && (review.accomplishments || review.major_accomplishments || review.disappointments || review.future_plan) && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Employee Performance Reflection</h3>

            {/* Structured Accomplishments Table */}
            {review.accomplishments && review.accomplishments.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-900 mb-2">Major Accomplishments:</p>
                <AccomplishmentsTable
                  accomplishments={review.accomplishments}
                  mode="view"
                  readonly={true}
                />
              </div>
            )}

            {/* Legacy Major Accomplishments */}
            {review.major_accomplishments && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-900 mb-2">Major Accomplishments (Legacy):</p>
                <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.major_accomplishments}</p>
                </div>
                {review.major_accomplishments_manager_comment && (
                  <>
                    <p className="text-xs font-semibold text-gray-900 mb-2">Manager's Feedback:</p>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {review.major_accomplishments_manager_comment}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Future Plan */}
            {review.future_plan && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-900 mb-2">Employee's Future Plans & Goals:</p>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.future_plan}</p>
                </div>
              </div>
            )}

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
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {review.disappointments_manager_comment}
                      </p>
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
        {review && (
          <KPIRejectionCard
            review={review}
            resolveNote={resolveNote}
            onResolveNoteChange={setResolveNote}
            onResolve={handleResolveRejection}
          />
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
        <Button onClick={() => navigate('/hr/kpi-list')} variant="link" icon={FiArrowLeft}>
          Back to KPI List
        </Button>
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={closeTextModal}
        title={textModal.title}
        value={textModal.value}
        readOnly={true}
      />
    </div>
  );
};

export default HRKPIDetails;
