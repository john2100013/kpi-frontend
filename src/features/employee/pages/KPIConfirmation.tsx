import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';
import { Button } from '../../../components/common';
import SignatureField from '../../../components/SignatureField';
import TextModal from '../../../components/TextModal';
import { useEmployeeKPIConfirmation } from '../hooks';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';
import api from '../../../services/api';
import {
  getRatingPercentage,
  getRatingDescription,
  getItemRatingDescription,
} from '../hooks/kpiConfirmationUtils';

const KPIConfirmation: React.FC = () => {
  const {
    reviewId,
    review,
    kpi,
    loading,
    submitting,
    action,
    rejectionNote,
    signature,
    error,
    textModal,
    parsedRatings,
    ratingSummary,
    setAction,
    setRejectionNote,
    setSignature,
    handleSubmit,
    openTextModal,
    closeTextModal,
    navigate,
  } = useEmployeeKPIConfirmation();

  // Department features for conditional display
  // Pass kpi.id to fetch features for the KPI's employee department
  const { getCalculationMethodName, isEmployeeSelfRatingEnabled } = useCompanyFeatures(kpi?.id);
  
  // State for Actual vs Target data
  const [actualValues, setActualValues] = useState<Record<number, string>>({});
  const [, setTargetValues] = useState<Record<number, string>>({});
  const [, setGoalWeights] = useState<Record<number, string>>({});
  const [currentPerformanceStatuses, setCurrentPerformanceStatuses] = useState<Record<number, string>>({});
  const [percentageValuesObtained, setPercentageValuesObtained] = useState<Record<number, number>>({});
  const [managerRatingPercentages, setManagerRatingPercentages] = useState<Record<number, number>>({});
  const [finalRatingPercentage, setFinalRatingPercentage] = useState<number>(0);
  
  // Calculation settings - get period from KPI (quarterly or yearly)
  const kpiPeriod = kpi?.period || 'quarterly';
  const calculationMethodName = getCalculationMethodName(kpiPeriod);
  const isSelfRatingDisabled = !isEmployeeSelfRatingEnabled();
  const isActualValueMethod = calculationMethodName.includes('Actual vs Target');

  console.log('📊 [KPIConfirmation] Feature settings:', {
    kpiId: kpi?.id,
    kpiPeriod,
    calculationMethodName,
    isSelfRatingDisabled,
    isActualValueMethod
  });

  // Fetch ratings data with actual values and percentages
  useEffect(() => {
    const fetchRatingsData = async () => {
      if (!reviewId || !review) return;
      
      try {
        console.log('📊 [KPIConfirmation] Fetching ratings for reviewId:', reviewId);
        const response = await api.get(`/kpi-review/${reviewId}/ratings`);
        
        // Backend returns { review, ratings } from kpi_item_ratings table
        const ratings = response.data.ratings;
        
        console.log('📊 [KPIConfirmation] Full response from API:', JSON.stringify(response.data, null, 2));
        console.log('📊 [KPIConfirmation] Ratings from kpi_item_ratings table:', ratings);
        
        if (!ratings || !Array.isArray(ratings)) {
          console.warn('⚠️ [KPIConfirmation] No ratings array found in response');
          return;
        }
        
        // Extract actual values and percentages from kpi_item_ratings table
        const actualVals: Record<number, string> = {};
        const targetVals: Record<number, string> = {};
        const goalWeightsMap: Record<number, string> = {};
        const statusMap: Record<number, string> = {};
        const percentages: Record<number, number> = {};
        const managerPercentages: Record<number, number> = {};
        let totalPercentage = 0;
        
        ratings.forEach((rating: any) => {
          console.log('📊 [KPIConfirmation] Processing rating from kpi_item_ratings:', {
            item_id: rating.kpi_item_id,
            rater_role: rating.rater_role,
            actual_value: rating.actual_value,
            target_value: rating.target_value,
            goal_weight: rating.goal_weight,
            current_performance_status: rating.current_performance_status,
            percentage_value_obtained: rating.percentage_value_obtained,
            manager_rating_percentage: rating.manager_rating_percentage
          });
          
          // Only extract data from manager ratings
          if (rating.kpi_item_id && rating.rater_role === 'manager') {
            if (rating.actual_value) {
              actualVals[rating.kpi_item_id] = rating.actual_value;
              console.log(`✅ [KPIConfirmation] Set actual value for item ${rating.kpi_item_id}:`, rating.actual_value);
            }
            if (rating.target_value) {
              targetVals[rating.kpi_item_id] = rating.target_value;
              console.log(`✅ [KPIConfirmation] Set target value for item ${rating.kpi_item_id}:`, rating.target_value);
            }
            if (rating.goal_weight) {
              goalWeightsMap[rating.kpi_item_id] = rating.goal_weight;
              console.log(`✅ [KPIConfirmation] Set goal weight for item ${rating.kpi_item_id}:`, rating.goal_weight);
            }
            if (rating.current_performance_status) {
              statusMap[rating.kpi_item_id] = rating.current_performance_status;
              console.log(`✅ [KPIConfirmation] Set status for item ${rating.kpi_item_id}:`, rating.current_performance_status);
            }
            if (rating.percentage_value_obtained !== null && rating.percentage_value_obtained !== undefined) {
              percentages[rating.kpi_item_id] = parseFloat(rating.percentage_value_obtained);
              console.log(`✅ [KPIConfirmation] Set percentage obtained for item ${rating.kpi_item_id}:`, rating.percentage_value_obtained);
            }
            if (rating.manager_rating_percentage !== null && rating.manager_rating_percentage !== undefined) {
              managerPercentages[rating.kpi_item_id] = parseFloat(rating.manager_rating_percentage);
              totalPercentage += parseFloat(rating.manager_rating_percentage);
              console.log(`✅ [KPIConfirmation] Set manager rating % for item ${rating.kpi_item_id}:`, rating.manager_rating_percentage);
            }
          }
        });
        
        setActualValues(actualVals);
        setTargetValues(targetVals);
        setGoalWeights(goalWeightsMap);
        setCurrentPerformanceStatuses(statusMap);
        setPercentageValuesObtained(percentages);
        setManagerRatingPercentages(managerPercentages);
        setFinalRatingPercentage(totalPercentage);
        
        console.log('📊 [KPIConfirmation] Final extracted data:', {
          actualVals,
          targetVals,
          goalWeightsMap,
          statusMap,
          percentages,
          managerPercentages,
          totalPercentage,
          ratingsCount: ratings.length
        });
      } catch (err) {
        console.error('❌ [KPIConfirmation] Error fetching ratings data:', err);
      }
    };
    
    fetchRatingsData();
  }, [reviewId, review]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-red-600">Review not found</p>
      </div>
    );
  }

  // Backend may send either 'status' or 'review_status' field
  const reviewStatus = (review as any)?.status || review?.review_status;
  
  // DEBUGGING: Log the actual status values
  console.log('🔍 [KPIConfirmation] Review status validation:', {
    review_id: review.id,
    status_field: (review as any)?.status,
    review_status_field: review?.review_status,
    resolved_reviewStatus: reviewStatus,
    status_type: typeof reviewStatus,
    status_value_json: JSON.stringify(reviewStatus),
    full_review_object: review
  });
  
  if (reviewStatus !== 'manager_submitted' && reviewStatus !== 'awaiting_employee_confirmation') {
    console.error('❌ [KPIConfirmation] Status validation FAILED:', {
      reviewStatus,
      expected: ['manager_submitted', 'awaiting_employee_confirmation'],
      comparison_manager_submitted: reviewStatus === 'manager_submitted',
      comparison_awaiting: reviewStatus === 'awaiting_employee_confirmation'
    });
    
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-orange-600">This review is not awaiting confirmation</p>
        <p className="text-sm text-gray-600 mt-2">Current status: {String(reviewStatus)}</p>
        <Button onClick={() => navigate('/employee/dashboard')} variant="primary" className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  console.log('✅ [KPIConfirmation] Status validation PASSED - showing KPI form');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Confirm KPI Review</h1>
        <Button onClick={() => navigate('/employee/dashboard')} variant="secondary">
          Back to Dashboard
        </Button>
      </div>

      {/* Action Required Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FiAlertCircle className="text-blue-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Action Required</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your manager <span className="font-semibold">{review.manager_name}</span> has
              completed your KPI review. Please review the rating and comments below and confirm
              whether you agree with the assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Review Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Review Details</h2>
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <p>
            <span className="font-medium text-gray-900">KPI Title:</span> {review.kpi_title}
          </p>
          <p>
            <span className="font-medium text-gray-900">Manager:</span> {review.manager_name}
          </p>
          {kpi && (
            <>
              <p>
                <span className="font-medium text-gray-900">Period:</span> {kpi.quarter}{' '}
                {kpi.year}
              </p>
              <p>
                <span className="font-medium text-gray-900">Total Items:</span>{' '}
                {kpi.items?.length || 1}
              </p>
            </>
          )}
        </div>

        {/* Calculation Method Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-blue-600 text-xl mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Calculation Method</h3>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{calculationMethodName || 'Normal Calculation'}</span>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Self-Rating: {isSelfRatingDisabled ? '❌ Disabled' : '✅ Enabled'}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: isActualValueMethod ? '2200px' : '1800px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10"
                  style={{ minWidth: '50px' }}
                >
                  #
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  style={{ minWidth: '200px' }}
                >
                  KPI TITLE
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  style={{ minWidth: '250px' }}
                >
                  DESCRIPTION
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  style={{ minWidth: '150px' }}
                >
                  TARGET VALUE
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  style={{ minWidth: '120px' }}
                >
                  MEASURE UNIT
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  style={{ minWidth: '120px' }}
                >
                  GOAL WEIGHT
                </th>
                {/* Show Actual Value columns only for Actual vs Target method */}
                {isActualValueMethod && (
                  <>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      style={{ minWidth: '150px' }}
                    >
                      ACTUAL VALUE
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      style={{ minWidth: '180px' }}
                    >
                      CURRENT PERFORMANCE STATUS
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      style={{ minWidth: '150px' }}
                    >
                      PERCENTAGE OBTAINED
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      style={{ minWidth: '150px' }}
                    >
                      MANAGER RATING %
                    </th>
                  </>
                )}
                {/* Show Employee columns ONLY if self-rating is enabled */}
                {!isSelfRatingDisabled && (
                  <>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      style={{ minWidth: '150px' }}
                    >
                      EMPLOYEE RATING
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      style={{ minWidth: '200px' }}
                    >
                      EMPLOYEE COMMENT
                    </th>
                  </>
                )}
                {/* Manager Rating - shown for all methods except Actual vs Target */}
                {!isActualValueMethod && (
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
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
              {kpi && kpi.items && kpi.items.length > 0 ? (
                kpi.items.map((item, index) => {
                  const empRating = parsedRatings?.employeeItemRatings[item.id] || 0;
                  const empComment = parsedRatings?.employeeItemComments[item.id] || '';
                  const mgrRating = parsedRatings?.managerItemRatings[item.id] || 0;
                  const mgrComment = parsedRatings?.managerItemComments[item.id] || '';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 sticky left-0 bg-white z-10">
                        <span className="font-semibold text-gray-900">{index + 1}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          onClick={() => openTextModal('KPI Title', item.title || 'N/A')}
                          variant="link"
                          className="text-left font-semibold"
                        >
                          <p className="truncate max-w-[200px]" title={item.title}>
                            {item.title}
                          </p>
                        </Button>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          onClick={() =>
                            openTextModal('Description', item.description || 'N/A')
                          }
                          variant="link"
                          className="text-left"
                        >
                          <p
                            className="truncate max-w-[250px]"
                            title={item.description || 'N/A'}
                          >
                            {item.description || 'N/A'}
                          </p>
                        </Button>
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
                        <p className="text-sm text-gray-700">{item.goal_weight || 'N/A'}</p>
                      </td>
                      {/* Actual vs Target columns */}
                      {isActualValueMethod && (
                        <>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-blue-600">
                              {actualValues[item.id] || 'N/A'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
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
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-green-600">
                              {typeof percentageValuesObtained[item.id] === 'number' 
                                ? percentageValuesObtained[item.id].toFixed(2) 
                                : '0.00'}%
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-yellow-600">
                              {typeof managerRatingPercentages[item.id] === 'number'
                                ? managerRatingPercentages[item.id].toFixed(2)
                                : '0.00'}%
                            </span>
                          </td>
                        </>
                      )}
                      {/* Employee Rating columns - only if enabled */}
                      {!isSelfRatingDisabled && (
                        <>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-purple-600">
                                  {empRating.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({getRatingPercentage(empRating)}%)
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {getItemRatingDescription(empRating)}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
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
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-yellow-600">
                                {mgrRating.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({getRatingPercentage(mgrRating)}%)
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {getItemRatingDescription(mgrRating)}
                            </p>
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
                    <p className="font-semibold text-gray-900">{review.kpi_title}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{review.kpi_description || 'N/A'}</p>
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
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-purple-600">
                          {typeof review.employee_rating === 'number'
                            ? review.employee_rating.toFixed(2)
                            : '0.00'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({getRatingPercentage(review.employee_rating || 0)}%)
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{review.employee_comment || 'No comment'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-yellow-600">
                          {typeof review.manager_rating === 'number'
                            ? review.manager_rating.toFixed(2)
                            : '0.00'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({getRatingPercentage(review.manager_rating || 0)}%)
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{review.manager_comment || 'No comment'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rating Summary */}
        {isActualValueMethod ? (
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
        ) : ratingSummary ? (
          /* For Normal/Goal Weight: Show traditional rating cards */
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Rating Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isSelfRatingDisabled && (
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">Total Employee Rating</p>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-bold text-purple-600">
                      {ratingSummary.avgEmployeeRating.toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-500">
                      ({getRatingPercentage(ratingSummary.avgEmployeeRating)}%)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getRatingDescription(ratingSummary.avgEmployeeRating)}
                  </p>
                </div>
              )}
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-gray-600 mb-2">Total Manager Rating</p>
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-bold text-yellow-600">
                    {ratingSummary.avgManagerRating.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500">
                    ({getRatingPercentage(ratingSummary.avgManagerRating)}%)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getRatingDescription(ratingSummary.avgManagerRating)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Overall Manager Comments */}
        {review.overall_manager_comment && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">Overall Manager Comments:</p>
            <p className="text-sm text-yellow-700">{review.overall_manager_comment}</p>
          </div>
        )}
      </div>

      {/* Decision Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Decision</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setAction('approve')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                action === 'approve'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiCheckCircle
                  className={action === 'approve' ? 'text-green-600' : 'text-gray-400'}
                />
                <span
                  className={`font-medium ${
                    action === 'approve' ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  Approve Rating
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                I agree with my manager's assessment
              </p>
            </button>

            <button
              onClick={() => setAction('reject')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                action === 'reject'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiX className={action === 'reject' ? 'text-red-600' : 'text-gray-400'} />
                <span
                  className={`font-medium ${
                    action === 'reject' ? 'text-red-700' : 'text-gray-600'
                  }`}
                >
                  Reject Rating
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">I disagree with this assessment</p>
            </button>
          </div>

          {/* Rejection Note */}
          {action === 'reject' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-medium text-red-900 mb-2">
                Reason for Rejection <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Please explain why you disagree with this rating..."
                rows={4}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <p className="text-xs text-red-600 mt-1">
                Your manager and HR will be notified of your rejection and the reason provided.
              </p>
            </div>
          )}

          {/* Signature Field */}
          {action === 'approve' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="block text-sm font-medium text-green-900 mb-2">
                Your Signature <span className="text-green-600">*</span>
              </label>
              <SignatureField
                value={signature}
                onChange={setSignature}
                placeholder="Sign here to approve..."
              />
              <p className="text-xs text-green-600 mt-2">
                By signing, you confirm that you agree with your manager's rating and assessment.
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={() => navigate('/employee/dashboard')} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!action || submitting}
              variant={
                action === 'approve' ? 'success' : action === 'reject' ? 'danger' : 'secondary'
              }
              loading={submitting}
            >
              {action === 'approve'
                ? 'Approve & Sign'
                : action === 'reject'
                ? 'Submit Rejection'
                : 'Select an Option'}
            </Button>
          </div>
        </div>
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={closeTextModal}
        title={textModal.title}
        value={textModal.value}
      />
    </div>
  );
};

export default KPIConfirmation;
