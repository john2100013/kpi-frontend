import React from 'react';
import { FiArrowLeft, FiCheckCircle, FiClock } from 'react-icons/fi';
import { Button } from '../../../components/common';
import TextModal from '../../../components/TextModal';
import AccomplishmentsTable from '../../../components/AccomplishmentsTable';
import { useEmployeeKPIDetails } from '../hooks';
import {
  formatRating,
  getRatingLabel,
  getQualitativeRatingDisplay,
  extractCommentFromJSON,
} from '../hooks/employeeKPIDetailsUtils';

const KPIDetails: React.FC = () => {
  const {
    kpi,
    review,
    loading,
    error,
    textModal,
    stageInfo,
    parsedReviewData,
    handleBack,
    handleAcknowledgeKPI,
    handleStartSelfRating,
    handleBackToList,
    openTextModal,
    closeTextModal,
  } = useEmployeeKPIDetails();

  const { employeeItemRatings, employeeItemComments, managerItemRatings, managerItemComments } =
    parsedReviewData;

  if (loading || !kpi) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} size="md" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{kpi.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {kpi.quarter} {kpi.year} •{' '}
            {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'} KPI •{' '}
            {kpi.items?.length || kpi.item_count || 1} Items
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${stageInfo.color}`}
        >
          {stageInfo.icon}
          <span className="font-medium">{stageInfo.stage}</span>
        </div>
      </div>

      {/* KPI Items Table with Ratings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review & Rating</h2>
        <div className="mb-4 text-sm text-gray-600">
          <p>
            Period: {kpi.quarter} {kpi.year} (
            {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'})
          </p>
          <p>Total Items: {kpi.items?.length || kpi.item_count || 1}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '2000px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '50px' }}
                >
                  #
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '200px' }}
                >
                  KPI TITLE
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '250px' }}
                >
                  DESCRIPTION
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '180px' }}
                >
                  CURRENT PERFORMANCE STATUS
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '150px' }}
                >
                  TARGET VALUE
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '120px' }}
                >
                  MEASURE UNIT
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '150px' }}
                >
                  EXPECTED COMPLETION DATE
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '120px' }}
                >
                  GOAL WEIGHT
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '150px' }}
                >
                  EMPLOYEE SELF RATING
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '200px' }}
                >
                  EMPLOYEE COMMENT
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '150px' }}
                >
                  MANAGER RATING
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '200px' }}
                >
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
                        <Button
                          onClick={() =>
                            openTextModal('KPI Title', item.title || 'N/A')
                          }
                          variant="link"
                          className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[200px]" title={item.title}>
                            {item.title}
                          </p>
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() =>
                            openTextModal('KPI Description', item.description || 'N/A')
                          }
                          variant="link"
                          className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                        >
                          <p
                            className="truncate max-w-[250px]"
                            title={item.description || 'N/A'}
                          >
                            {item.description || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() =>
                            openTextModal(
                              'Current Performance Status',
                              item.current_performance_status || 'N/A'
                            )
                          }
                          variant="link"
                          className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p
                            className="truncate max-w-[180px]"
                            title={item.current_performance_status || 'N/A'}
                          >
                            {item.current_performance_status || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() =>
                            openTextModal('Target Value', item.target_value || 'N/A')
                          }
                          variant="link"
                          className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          <p
                            className="truncate max-w-[150px]"
                            title={item.target_value || 'N/A'}
                          >
                            {item.target_value || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.measure_unit || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.expected_completion_date
                            ? new Date(item.expected_completion_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.goal_weight || item.measure_criteria || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {isQualitative ? (
                          <span className="text-sm text-purple-600 font-medium">
                            N/A (Manager Rates)
                          </span>
                        ) : review && review.employee_rating ? (
                          <div>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatRating(empRating)}
                            </span>
                            {empRating > 0 && (
                              <span className="text-xs text-gray-500 ml-1 block">
                                ({getRatingLabel(empRating)} Expectation)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {empComment ? (
                          <Button
                            onClick={() => openTextModal('Employee Comment', empComment)}
                            variant="link"
                            className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={empComment}>
                              {empComment.length > 50
                                ? empComment.substring(0, 50) + '...'
                                : empComment}
                            </p>
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">No comment</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isQualitative ? (
                          item.qualitative_rating ? (
                            <div>
                              <span className="text-sm font-semibold text-purple-700">
                                {getQualitativeRatingDisplay(item.qualitative_rating)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not reviewed</span>
                          )
                        ) : review && review.manager_rating ? (
                          <div>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatRating(mgrRating)}
                            </span>
                            {mgrRating > 0 && (
                              <span className="text-xs text-gray-500 ml-1 block">
                                ({getRatingLabel(mgrRating)} Expectation)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not reviewed</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {mgrComment ? (
                          <Button
                            onClick={() => openTextModal('Manager Comment', mgrComment)}
                            variant="link"
                            className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={mgrComment}>
                              {mgrComment.length > 50
                                ? mgrComment.substring(0, 50) + '...'
                                : mgrComment}
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
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">1</span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => openTextModal('KPI Title', kpi.title || 'N/A')}
                      variant="link"
                      className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                    >
                      <p className="truncate max-w-[200px]" title={kpi.title}>
                        {kpi.title}
                      </p>
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() =>
                        openTextModal('KPI Description', kpi.description || 'N/A')
                      }
                      variant="link"
                      className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                    >
                      <p
                        className="truncate max-w-[250px]"
                        title={kpi.description || 'N/A'}
                      >
                        {kpi.description || 'N/A'}
                      </p>
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() =>
                        openTextModal('Target Value', kpi.target_value || 'N/A')
                      }
                      variant="link"
                      className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                    >
                      <p
                        className="truncate max-w-[150px]"
                        title={kpi.target_value || 'N/A'}
                      >
                        {kpi.target_value || 'N/A'}
                      </p>
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 whitespace-nowrap">
                      {kpi.measure_unit || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 whitespace-nowrap">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 whitespace-nowrap">
                      {kpi.measure_criteria || 'N/A'}
                    </p>
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
                      <Button
                        onClick={() =>
                          openTextModal(
                            'Employee Comment',
                            extractCommentFromJSON(review.employee_comment || '')
                          )
                        }
                        variant="link"
                        className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                      >
                        <p
                          className="truncate max-w-[200px]"
                          title={review.employee_comment || ''}
                        >
                          {(review.employee_comment || '').length > 50
                            ? (review.employee_comment || '').substring(0, 50) + '...'
                            : review.employee_comment || ''}
                        </p>
                      </Button>
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
                      <Button
                        onClick={() =>
                          openTextModal(
                            'Manager Comment',
                            extractCommentFromJSON(review.manager_comment || '')
                          )
                        }
                        variant="link"
                        className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                      >
                        <p
                          className="truncate max-w-[200px]"
                          title={review.manager_comment || ''}
                        >
                          {(review.manager_comment || '').length > 50
                            ? (review.manager_comment || '').substring(0, 50) + '...'
                            : review.manager_comment || ''}
                        </p>
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-400">No comment</span>
                    )}
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
                  {kpi.manager_signed_at &&
                    ` on ${new Date(kpi.manager_signed_at).toLocaleDateString()}`}
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
                  {kpi.employee_signed_at &&
                    ` on ${new Date(kpi.employee_signed_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            {!kpi.employee_signature && (
              <Button onClick={handleAcknowledgeKPI} variant="primary" size="sm">
                Acknowledge Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Employee Accomplishments & Disappointments */}
      {review && (review.accomplishments || review.major_accomplishments || review.disappointments || review.future_plan) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Reflection
          </h2>

          <div className="space-y-6">
            {/* Accomplishments Table */}
            {review.accomplishments && review.accomplishments.length > 0 && (
              <div>
                <AccomplishmentsTable
                  accomplishments={review.accomplishments}
                  mode="view"
                  readonly={true}
                />
              </div>
            )}

            {/* Legacy Major Accomplishments (for old reviews) */}
            {review.major_accomplishments && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Your Major Accomplishments (Legacy)
                </h3>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {review.major_accomplishments}
                  </p>
                </div>

                {review.major_accomplishments_manager_comment && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Manager's Feedback
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {review.major_accomplishments_manager_comment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Disappointments */}
            {review.disappointments && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Challenges & Disappointments
                </h3>
                <div className="bg-orange-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {review.disappointments}
                  </p>
                </div>

                {review.disappointments_manager_comment && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Manager's Guidance
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {review.disappointments_manager_comment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Future Plan */}
            {review.future_plan && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Future Plans & Goals
                </h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {review.future_plan}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Manager Comments */}
      {review && review.overall_manager_comment && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Overall Manager Comments
          </h2>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Button
              onClick={() =>
                openTextModal(
                  'Overall Manager Comments',
                  review.overall_manager_comment || ''
                )
              }
              variant="link"
              className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors w-full"
            >
              <p className="whitespace-pre-wrap">{review.overall_manager_comment}</p>
            </Button>
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
                Rejected on{' '}
                {new Date(review.employee_confirmation_signed_at).toLocaleDateString()}
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
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Resolution Note from HR:
                    </p>
                    <p className="text-sm text-gray-900">{review.rejection_resolved_note}</p>
                  </div>
                )}
                {review.rejection_resolved_at && (
                  <p className="text-xs text-gray-600">
                    Resolved on {new Date(review.rejection_resolved_at).toLocaleDateString()}
                    {review.rejection_resolved_by_name &&
                      ` by ${review.rejection_resolved_by_name}`}
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
                {review
                  ? 'Complete your self-rating to proceed with the review process.'
                  : 'KPI has been acknowledged. You can now submit your self-rating.'}
              </p>
            </div>
            <Button onClick={handleStartSelfRating} variant="primary" size="sm">
              {review ? 'Continue Self-Rating' : 'Start Self-Rating'}
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button onClick={handleBackToList} variant="link" icon={FiArrowLeft}>
          Back to KPI List
        </Button>
        <div className="flex items-center space-x-3">
          {kpi.status === 'pending' && (
            <Button onClick={handleAcknowledgeKPI} variant="primary">
              Acknowledge KPI
            </Button>
          )}
          {kpi.status === 'acknowledged' && (!review || !review.employee_rating) && (
            <Button onClick={handleStartSelfRating} variant="primary">
              Submit Self-Rating
            </Button>
          )}
        </div>
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

export default KPIDetails;

