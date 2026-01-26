import React from 'react';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiUser, FiEdit, FiAlertCircle } from 'react-icons/fi';
import TextModal from '../../../components/TextModal';
import { Button } from '../../../components/common';
import { useManagerKPIDetails } from '../../manager/hooks';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';
import {
  getRatingPercentage,
  getRatingDescription,
  getItemRatingDescription,
} from '../../employee/hooks/kpiConfirmationUtils';

const ManagerKPIDetails: React.FC = () => {
  const {
    kpi,
    review,
    loading,
    textModal,
    parsedReviewData,
    stageInfo,
    actualValues,
    currentPerformanceStatuses,
    percentageValuesObtained,
    managerRatingPercentages,
    finalRatingPercentage,
    openTextModal,
    closeTextModal,
    handleReviewKPI,
    handleViewEmployeeKPIs,
    handleBack,
  } = useManagerKPIDetails();
  
  // Department features for conditional display
  const { getCalculationMethodName, isEmployeeSelfRatingEnabled, features } = useCompanyFeatures(review?.kpi_id);
  
  // Get review period
  const reviewPeriod = (review as any)?.period || kpi?.period || 'quarterly';
  
  // Get calculation method name based on KPI period
  const calculationMethodName = reviewPeriod ? getCalculationMethodName(reviewPeriod) : 'Normal Calculation';
  const isActualValueMethod = calculationMethodName.includes('Actual vs Target');
  
  // Determine if self-rating is disabled
  const isSelfRatingDisabled = reviewPeriod ? !isEmployeeSelfRatingEnabled(reviewPeriod) : true;
  
  // Show employee columns ONLY if self-rating is enabled AND NOT using Actual vs Target
  const shouldShowEmployeeColumns = !isSelfRatingDisabled && !isActualValueMethod;
  
  // NEW LOGIC: Hide Performance Reflection when Quarterly + Goal Weight + Self Rating Enabled
  const reviewPeriodNormalized = reviewPeriod?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
  const shouldHidePerformanceReflection = 
    reviewPeriodNormalized === 'quarterly' && 
    calculationMethodName.includes('Goal Weight') && 
    !isSelfRatingDisabled;
  
  

  if (loading || !kpi) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleBack}
          variant="ghost"
          icon={FiArrowLeft}
          className="p-2"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">KPI Form Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            {kpi.quarter} {kpi.year} • {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'} • {kpi.items?.length || kpi.item_count || 0} KPI Item{(kpi.items?.length || kpi.item_count || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${stageInfo.color}`}>
          {stageInfo.icon === 'clock' && <FiClock className="text-xl" />}
          {stageInfo.icon === 'file' && <FiFileText className="text-xl" />}
          {stageInfo.icon === 'check' && <FiCheckCircle className="text-xl" />}
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

      {/* KPI Items Table with Ratings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review & Rating</h2>
        
        {/* Calculation Method Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-blue-600 text-xl mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Review Configuration</h3>
              <p className="text-sm text-blue-800 mb-1">
                <span className="font-medium">Calculation Method:</span>{' '}
                <span className="font-semibold">{calculationMethodName || 'Normal Calculation'}</span>
              </p>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Employee Self-Rating:</span> {isSelfRatingDisabled ? '❌ Disabled' : '✅ Enabled'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          <p>Period: {kpi.quarter} {kpi.year} ({kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'})</p>
          <p>Total Items: {kpi.items?.length || kpi.item_count || 1}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: isActualValueMethod ? '2200px' : '1800px' }}>
            <thead className="bg-gray-50">
              <tr className="border-b-2 border-gray-400">
                <th
                  className="pl-6 pr-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10 border-r border-gray-300"
                  style={{ minWidth: '50px' }}
                >
                  #
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                  style={{ minWidth: '200px' }}
                >
                  KPI TITLE
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                  style={{ minWidth: '250px' }}
                >
                  DESCRIPTION
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                  style={{ minWidth: '150px' }}
                >
                  TARGET VALUE
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                  style={{ minWidth: '120px' }}
                >
                  MEASURE UNIT
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                  style={{ minWidth: '120px' }}
                >
                  GOAL WEIGHT
                </th>
                {/* Show Actual Value columns ONLY for Actual vs Target method */}
                {isActualValueMethod && (
                  <>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                      style={{ minWidth: '150px' }}
                    >
                      ACTUAL VALUE ACHIEVED
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                      style={{ minWidth: '180px' }}
                    >
                      CURRENT PERFORMANCE STATUS
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                      style={{ minWidth: '150px' }}
                    >
                      PERCENTAGE OBTAINED
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                      style={{ minWidth: '150px' }}
                    >
                      MANAGER RATING %
                    </th>
                  </>
                )}
                {/* Show Employee columns ONLY if self-rating is enabled AND NOT using Actual vs Target */}
                {shouldShowEmployeeColumns && (
                  <>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                      style={{ minWidth: '150px' }}
                    >
                      EMPLOYEE SELF RATING
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                      style={{ minWidth: '200px' }}
                    >
                      EMPLOYEE COMMENT
                    </th>
                  </>
                )}
                {/* Manager Rating - shown for all methods except Actual vs Target */}
                {!isActualValueMethod && (
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300"
                    style={{ minWidth: '150px' }}
                  >
                    MANAGER RATING
                  </th>
                )}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  style={{ minWidth: '200px' }}
                >
                  MANAGER COMMENT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi.items && kpi.items.length > 0 ? (
                kpi.items.map((item, index) => {
                  const empRating = parsedReviewData.employeeItemRatings[item.id] || 0;
                  const empComment = parsedReviewData.employeeItemComments[item.id] || '';
                  const mgrRating = parsedReviewData.managerItemRatings[item.id] || 0;
                  const mgrComment = parsedReviewData.managerItemComments[item.id] || '';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="pl-6 pr-4 py-4 sticky left-0 bg-white z-10 border-r border-gray-200">
                        <span className="font-semibold text-gray-900">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <Button
                          onClick={() => openTextModal('KPI Title', item.title || 'N/A', 'title', item.id)}
                          variant="link"
                          className="text-left font-semibold"
                        >
                          <p 
                            className="max-w-[200px] line-clamp-2" 
                            style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '2.5rem'
                            }}
                            title={item.title}
                          >
                            {item.title}
                          </p>
                        </Button>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <Button
                          onClick={() =>
                            openTextModal('Description', item.description || 'N/A', 'description', item.id)
                          }
                          variant="link"
                          className="text-left"
                        >
                          <p
                            className="max-w-[250px] line-clamp-2"
                            style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '2.5rem'
                            }}
                            title={item.description || 'N/A'}
                          >
                            {item.description || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-4 py-4 border-r border-gray-200">
                        <p className="text-sm text-gray-900">{item.target_value || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4 border-r border-gray-200">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                          {item.measure_unit || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 border-r border-gray-200">
                        <p className="text-sm text-gray-700">{item.goal_weight || 'N/A'}</p>
                      </td>
                      {/* Actual vs Target columns */}
                      {isActualValueMethod && (
                        <>
                          <td className="px-4 py-4 border-r border-gray-200">
                            <p className="text-sm font-semibold text-blue-600">
                              {actualValues[item.id] || 'N/A'}
                            </p>
                          </td>
                          <td className="px-4 py-4 border-r border-gray-200">
                            <Button
                              onClick={() =>
                                openTextModal(
                                  'Current Performance Status',
                                  currentPerformanceStatuses[item.id] || 'N/A'
                                )
                              }
                              variant="link"
                              className="text-left"
                            >
                              <p
                                className="truncate max-w-[180px] text-sm text-gray-700"
                                title={currentPerformanceStatuses[item.id] || 'N/A'}
                              >
                                {currentPerformanceStatuses[item.id] || 'N/A'}
                              </p>
                            </Button>
                          </td>
                          <td className="px-4 py-4 border-r border-gray-200">
                            <span className="text-sm font-semibold text-green-600">
                              {typeof percentageValuesObtained[item.id] === 'number' 
                                ? percentageValuesObtained[item.id].toFixed(2) 
                                : '0.00'}%
                            </span>
                          </td>
                          <td className="px-4 py-4 border-r border-gray-200">
                            <span className="text-sm font-semibold text-yellow-600">
                              {typeof managerRatingPercentages[item.id] === 'number'
                                ? managerRatingPercentages[item.id].toFixed(2)
                                : '0.00'}%
                            </span>
                          </td>
                        </>
                      )}
                      {/* Employee Rating columns - only if enabled AND NOT using Actual vs Target */}
                      {shouldShowEmployeeColumns && (
                        <>
                          <td className="px-4 py-4 border-r border-gray-200">
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-purple-600">
                                {empRating.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 border-r border-gray-200">
                            {empComment ? (
                              <Button
                                onClick={() => openTextModal('Employee Comment', empComment)}
                                variant="link"
                                className="text-left"
                              >
                                <p className="truncate max-w-[200px]" title={empComment}>
                                  {empComment.length > 40
                                    ? empComment.substring(0, 40) + '...'
                                    : empComment}
                                </p>
                              </Button>
                            ) : (
                              <span className="text-sm text-gray-400">No comment</span>
                            )}
                          </td>
                        </>
                      )}
                      {/* Manager Rating - for Normal/Goal Weight methods */}
                      {!isActualValueMethod && (
                        <td className="px-4 py-4 border-r border-gray-200">
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-yellow-600">
                              {mgrRating.toFixed(2)}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-4">
                        {mgrComment ? (
                          <Button
                            onClick={() => openTextModal('Manager Comment', mgrComment)}
                            variant="link"
                            className="text-left"
                          >
                            <p className="truncate max-w-[200px]" title={mgrComment}>
                              {mgrComment.length > 40
                                ? mgrComment.substring(0, 40) + '...'
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
                  <td className="px-4 py-4 sticky left-0 bg-white z-10">
                    <span className="font-semibold text-gray-900">1</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-900">{review?.kpi_title || kpi.title}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{review?.kpi_description || kpi.description || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">N/A</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                      N/A
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">N/A</p>
                  </td>
                  {shouldShowEmployeeColumns && (
                    <>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-purple-600">
                              {typeof review?.employee_rating === 'number'
                                ? review.employee_rating.toFixed(2)
                                : '0.00'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({getRatingPercentage(review?.employee_rating || 0)}%)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{review?.employee_comment || 'No comment'}</p>
                      </td>
                    </>
                  )}
                  {!isActualValueMethod && (
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-yellow-600">
                            {typeof review?.manager_rating === 'number'
                              ? review.manager_rating.toFixed(2)
                              : '0.00'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({getRatingPercentage(review?.manager_rating || 0)}%)
                          </span>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{review?.manager_comment || 'No comment'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Overall Manager Comments */}
        {review?.overall_manager_comment && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">Overall Manager Comments:</p>
            <p className="text-sm text-yellow-700">{review.overall_manager_comment}</p>
          </div>
        )}
      </div>

      
      {shouldShowEmployeeColumns && !shouldHidePerformanceReflection && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance Reflection</h2>
          
          {(review as any).accomplishments && Array.isArray((review as any).accomplishments) && (review as any).accomplishments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Major Accomplishments</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr className="border-b-2 border-gray-400">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300">Employee Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300">Employee Comment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-300">Manager Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Manager Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(review as any).accomplishments.map((acc: any, index: number) => (
                      <tr key={acc.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">{acc.title || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{acc.description || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-purple-600 border-r border-gray-200">
                          {acc.employee_rating ? parseFloat(acc.employee_rating).toFixed(2) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{acc.employee_comment || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-yellow-600 border-r border-gray-200">
                          {acc.manager_rating ? parseFloat(acc.manager_rating).toFixed(2) : 'Not rated'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{acc.manager_comment || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(review as any).major_accomplishments_comment && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900">Manager's Overall Comment:</p>
                  <p className="text-sm text-yellow-700 mt-1">{(review as any).major_accomplishments_comment}</p>
                </div>
              )}
            </div>
          )}

          {/* Performance Feedback Grid - Structured Layout */}
          <div className="grid grid-cols-1 gap-6">
            {/* Disappointments */}
            {(review as any).disappointments && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-5 py-3 border-b border-gray-300">
                  <h3 className="text-md font-semibold text-gray-900">Challenges & Disappointments</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Employee's Response</p>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{(review as any).disappointments}</p>
                      </div>
                    </div>
                    {(review as any).disappointments_comment && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Manager's Guidance</p>
                        <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{(review as any).disappointments_comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Improvement Needed */}
            {(review as any).improvement_needed && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-5 py-3 border-b border-gray-300">
                  <h3 className="text-md font-semibold text-gray-900">Suggestions for Organizational Improvement</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Employee's Suggestions</p>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{(review as any).improvement_needed}</p>
                      </div>
                    </div>
                    {(review as any).improvement_needed_manager_comment && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Manager's Response</p>
                        <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{(review as any).improvement_needed_manager_comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Future Plan */}
            {(review as any).future_plan && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-5 py-3 border-b border-gray-300">
                  <h3 className="text-md font-semibold text-gray-900">Future Plans & Goals</h3>
                </div>
                <div className="p-5">
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{(review as any).future_plan}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Items Table with Ratings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review & Rating</h2>
        
        {/* Rating Summary - same as KPIConfirmation */}
        {review && (
          isActualValueMethod ? (
            /* For Actual vs Target: Show Final Rating % */
            <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Rating Summary</h3>
              <div className="bg-white rounded-lg p-6 border border-green-300 text-center">
                <p className="text-sm text-gray-600 mb-2">Final Rating Percentage</p>
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-5xl font-bold text-green-600">
                    {finalRatingPercentage.toFixed(2)}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Sum of all Manager Rating Percentages
                </p>
              </div>
            </div>
          ) : (
            /* For Normal/Goal Weight: Show traditional rating cards */
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Rating Summary</h3>
              {false && review && (() => {
                const validReview = review!; // Non-null assertion for hidden code
                return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isSelfRatingDisabled && validReview.employee_rating && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-2">Total Employee Rating</p>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-3xl font-bold text-purple-600">
                        {typeof validReview.employee_rating === 'number' 
                          ? validReview.employee_rating.toFixed(2)
                          : '0.00'}
                      </span>
                      <span className="text-lg text-gray-500">
                        ({getRatingPercentage(validReview.employee_rating || 0)}%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRatingDescription(validReview.employee_rating || 0)}
                    </p>
                  </div>
                )}
                {validReview.manager_rating && (
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600 mb-2">Total Manager Rating</p>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-3xl font-bold text-yellow-600">
                        {typeof validReview.manager_rating === 'number'
                          ? validReview.manager_rating.toFixed(2)
                          : '0.00'}
                      </span>
                      <span className="text-lg text-gray-500">
                        ({getRatingPercentage(validReview.manager_rating || 0)}%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRatingDescription(validReview.manager_rating || 0)}
                    </p>
                  </div>
                )}
              </div>
                );
              })()}
              
              {/* Detailed Rating Breakdown for Normal Calculation */}
              {calculationMethodName === 'Normal Calculation' && (
                <div className="mt-6 border-t border-purple-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Detailed Rating Breakdown</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT SIDE - Employee Ratings */}
                    {!isSelfRatingDisabled && review.employee_rating && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-1 h-8 bg-indigo-500 rounded"></div>
                          <h4 className="text-md font-bold text-indigo-900">Employee Ratings</h4>
                        </div>
                        
                        {/* Employee Average Rating */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border-2 border-indigo-300 shadow-sm">
                          <p className="text-sm font-semibold text-indigo-900 mb-2">Employee Average Rating</p>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-4xl font-bold text-indigo-600">
                              {review.employee_rating 
                                ? parseFloat(review.employee_rating.toString()).toFixed(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-600 mt-2">
                            Calculated from employee self-ratings
                          </p>
                        </div>
                        
                        {/* Employee Final Rating */}
                        {review.employee_final_rating && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-300 shadow-sm">
                            <p className="text-sm font-semibold text-purple-900 mb-2">Employee Final Rating</p>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-4xl font-bold text-purple-600">
                                {review.employee_final_rating
                                  ? parseFloat(review.employee_final_rating.toString()).toFixed(2)
                                  : 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-purple-600 mt-2">
                              Rounded to nearest rating option
                            </p>
                          </div>
                        )}
                        
                        {/* Employee Rating Percentage */}
                        {(review as any).employee_rating_percentage && (
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                            <p className="text-sm font-semibold text-blue-900 mb-2">Employee Rating %</p>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-4xl font-bold text-blue-600">
                                {(review as any).employee_rating_percentage
                                  ? parseFloat((review as any).employee_rating_percentage.toString()).toFixed(2)
                                  : 'N/A'}%
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                              (employee_rating / max_rating) × 100
                            </p>
                          </div>
                        )}
                        
                        {/* Employee Final Rating Percentage */}
                        {false && (review as any).employee_final_rating_percentage && (
                          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-4 border-2 border-cyan-300 shadow-sm">
                            <p className="text-sm font-semibold text-cyan-900 mb-2">Employee Final Rating %</p>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-4xl font-bold text-cyan-600">
                                {(review as any).employee_final_rating_percentage
                                  ? parseFloat((review as any).employee_final_rating_percentage.toString()).toFixed(2)
                                  : 'N/A'}%
                              </span>
                            </div>
                            <p className="text-xs text-cyan-600 mt-2">
                              (employee_final_rating / max_rating) × 100
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* RIGHT SIDE - Manager Ratings */}
                    {review.manager_rating && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-1 h-8 bg-amber-500 rounded"></div>
                          <h4 className="text-md font-bold text-amber-900">Manager Ratings</h4>
                        </div>
                        
                        {/* Manager Average Rating */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-300 shadow-sm">
                          <p className="text-sm font-semibold text-amber-900 mb-2">Manager Average Rating</p>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-4xl font-bold text-amber-600">
                              {review.manager_rating
                                ? parseFloat(review.manager_rating.toString()).toFixed(2)
                                : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-amber-600 mt-2">
                            Calculated from manager ratings
                          </p>
                        </div>
                        
                        {/* Manager Final Rating */}
                        {review.manager_final_rating && (
                          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border-2 border-yellow-300 shadow-sm">
                            <p className="text-sm font-semibold text-yellow-900 mb-2">Manager Final Rating</p>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-4xl font-bold text-yellow-600">
                                {review.manager_final_rating
                                  ? parseFloat(review.manager_final_rating.toString()).toFixed(2)
                                  : 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-yellow-600 mt-2">
                              Rounded to nearest rating option
                            </p>
                          </div>
                        )}
                        
                        {/* Manager Final Rating Percentage */}
                        {(review as any).manager_final_rating_percentage && (
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-300 shadow-sm">
                            <p className="text-sm font-semibold text-orange-900 mb-2">Manager Final Rating %</p>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-4xl font-bold text-orange-600">
                                {(review as any).manager_final_rating_percentage
                                  ? parseFloat((review as any).manager_final_rating_percentage.toString()).toFixed(2)
                                  : 'N/A'}%
                              </span>
                            </div>
                            <p className="text-xs text-orange-600 mt-2">
                              (manager_final_rating / max_rating) × 100
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}
        
        {/* Overall Manager Comments */}
        {review?.overall_manager_comment && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">Overall Manager Comments:</p>
            <p className="text-sm text-yellow-700">{review.overall_manager_comment}</p>
          </div>
        )}
      </div>

      {/* KPI Setting Stage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Setting Stage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manager Signature */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {kpi.manager_signature ? (
                  <FiCheckCircle className="text-green-600 text-lg" />
                ) : (
                  <FiClock className="text-gray-400 text-lg" />
                )}
                <p className="font-semibold text-gray-900 text-sm">Manager Signature</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                kpi.manager_signature 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {kpi.manager_signature ? 'Signed' : 'Pending'}
              </span>
            </div>
            <div className="p-4">
              {kpi.manager_signature ? (
                <div className="space-y-2">
                  <div className="bg-white border border-gray-300 rounded p-2 h-24 flex items-center justify-center overflow-hidden">
                    <img 
                      src={kpi.manager_signature} 
                      alt="Manager Signature" 
                      className="max-h-20 max-w-full object-contain"
                      style={{ filter: 'contrast(1.1)' }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    <p className="font-medium">{kpi.employee_name || 'Manager'}</p>
                    {kpi.manager_signed_at && (
                      <p className="text-gray-500">
                        Signed on {new Date(kpi.manager_signed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-4 h-24 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Awaiting signature</p>
                </div>
              )}
            </div>
          </div>

          {/* Employee Acknowledgement */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {kpi.employee_signature ? (
                  <FiCheckCircle className="text-green-600 text-lg" />
                ) : (
                  <FiClock className="text-gray-400 text-lg" />
                )}
                <p className="font-semibold text-gray-900 text-sm">Employee Acknowledgement</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                kpi.employee_signature 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {kpi.employee_signature ? 'Acknowledged' : 'Pending'}
              </span>
            </div>
            <div className="p-4">
              {kpi.employee_signature ? (
                <div className="space-y-2">
                  <div className="bg-white border border-gray-300 rounded p-2 h-24 flex items-center justify-center overflow-hidden">
                    <img 
                      src={kpi.employee_signature} 
                      alt="Employee Signature" 
                      className="max-h-20 max-w-full object-contain"
                      style={{ filter: 'contrast(1.1)' }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    <p className="font-medium">{kpi.employee_name || 'Employee'}</p>
                    {kpi.employee_signed_at && (
                      <p className="text-gray-500">
                        Acknowledged on {new Date(kpi.employee_signed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-4 h-24 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Awaiting acknowledgement</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Manager Comments */}
      {review && review.overall_manager_comment && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Manager Comments</h2>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 whitespace-pre-wrap">{review.overall_manager_comment}</p>
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
        </div>
      )}

      {/* Action Button for Manager Review */}
      {kpi.status === 'acknowledged' && review && review.employee_rating && !review.manager_rating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Review Required</h3>
              <p className="text-sm text-gray-600 mt-1">
                Employee has submitted their self-rating. Please provide your review and rating.
              </p>
            </div>
            <Button
              onClick={handleReviewKPI}
              variant="primary"
              size="sm"
            >
              Review Now
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleBack}
            variant="ghost"
            icon={FiArrowLeft}
          >
            Back
          </Button>
          <Button
            onClick={handleViewEmployeeKPIs}
            variant="link"
            icon={FiUser}
          >
            View All {kpi.employee_name}'s KPIs
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          {review && review.employee_rating && !review.manager_rating && (
            <Button
              onClick={handleReviewKPI}
              variant="primary"
              icon={FiEdit}
            >
              Review KPI
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

export default ManagerKPIDetails;
