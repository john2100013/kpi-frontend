import React from 'react';
import SignatureField from '../../../components/SignatureField';
import DatePicker from '../../../components/DatePicker';
import TextModal from '../../../components/TextModal';
import AccomplishmentsTable from '../../../components/AccomplishmentsTable';
import { FiArrowLeft, FiSave, FiSend, FiExternalLink } from 'react-icons/fi';
import { Button } from '../../../components/common';
import { useManagerKPIReview } from '../hooks';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

const ManagerKPIReview: React.FC = () => {
  const {
    review,
    kpi,
    loading,
    saving,
    managerRatings,
    managerComments,
    qualitativeRatings,
    qualitativeComments,
    overallComment,
    managerSignature,
    reviewDate,
    employeeRatings,
    employeeComments,
    employeeQualitativeRatings,
    ratingOptions,
    qualitativeRatingOptions,
    disappointmentsManagerComment,
    improvementNeededManagerComment,
    accomplishments,
    actualValues,
    targetValues,
    goalWeights,
    currentPerformanceStatuses,
    textModal,
    employeeAvg,
    managerAvg,
    employeeFinalRating,
    managerFinalRating,
    setQualitativeRatings,
    setQualitativeComments,
    setOverallComment,
    setManagerSignature,
    setReviewDate,
    setDisappointmentsManagerComment,
    setImprovementNeededManagerComment,
    setAccomplishments,
    setActualValues,
    setTargetValues,
    setGoalWeights,
    setCurrentPerformanceStatuses,
    setTextModal,
    handleRatingChange,
    handleCommentChange,
    handleSaveDraft,
    handleSubmit,
    handleBack,
    getRatingLabel,
  } = useManagerKPIReview();

  // Department feature detection for conditional rendering
  // Pass kpi.id to fetch features for the KPI's employee department
  const { getCalculationMethodName, isEmployeeSelfRatingEnabled } = useCompanyFeatures(kpi?.id);

  // Determine if self-rating is disabled for this department based on KPI period
  const kpiPeriod = kpi?.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
  const isSelfRatingDisabled = !isEmployeeSelfRatingEnabled(kpiPeriod);
  
  // Get calculation method name based on KPI period
  const calculationMethodName = kpi?.period ? getCalculationMethodName(kpi.period) : 'Normal Calculation';

  console.log('📊 [KPIReview] Component render:', {
    loading,
    hasReview: !!review,
    reviewId: review?.id,
    hasKpi: !!kpi,
    kpiId: kpi?.id,
    kpiPeriod: kpi?.period,
    determinedPeriod: kpiPeriod
  });
  console.log('📊 [KPIReview] Self-rating settings:', {
    kpiId: kpi?.id,
    kpiPeriod,
    isSelfRatingDisabled,
    isEmployeeSelfRatingEnabled: isEmployeeSelfRatingEnabled(kpiPeriod)
  });
  console.log('📊 [KPIReview] Calculation method:', {
    period: kpi?.period,
    methodName: calculationMethodName,
    isActualValueMethod: calculationMethodName.includes('Actual vs Target')
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!review) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Review not found.</p>
        </div>
      </div>
    );
  }

  // If review doesn't have an ID AND self-rating is enabled, employee hasn't submitted self-rating yet
  // If self-rating is disabled, manager can proceed directly even without review ID
  if (!review.id && !isSelfRatingDisabled) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Waiting for Employee Self-Rating</h2>
          <p className="text-sm text-blue-800">
            The employee needs to complete their self-rating before you can review this KPI. 
            Once they submit their self-rating, you'll be able to provide your review and rating.
          </p>
        </div>
        <Button
          onClick={handleBack}
          variant="primary"
        >
          Back to Reviews
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            icon={FiArrowLeft}
            className="p-2"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager KPI Review & Rating</h1>
            <p className="text-sm text-gray-600 mt-1">
              {review.review_quarter} {review.review_year} Quarterly Performance Review
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            In Progress
          </span>
          <span className="text-sm text-gray-600">
            Due: {kpi?.meeting_date ? new Date(kpi.meeting_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-purple-600">
              {review.employee_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            <div>
              <p className="text-sm text-gray-600">EMPLOYEE NAME</p>
              <p className="font-semibold text-gray-900">{review.employee_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">POSITION</p>
              <p className="font-semibold text-gray-900">{review.employee_position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PAYROLL NUMBER</p>
              <p className="font-semibold text-gray-900">{review.employee_payroll}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">DEPARTMENT</p>
              <p className="font-semibold text-gray-900">{review.employee_department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">KPI PERIOD</p>
              <p className="font-semibold text-purple-600">
                {review.review_quarter} {review.review_year} - Quarterly
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">REVIEW STATUS</p>
              <p className="font-semibold text-orange-600">Pending Manager Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Review Instructions</h3>
              <p className="text-sm text-blue-800">
                Review the employee's self-ratings carefully, enter your ratings and detailed comments for each KPI, then sign and submit for HR review. Your ratings should be based on observed performance, achievement of targets, and overall contribution during the {kpi?.period || 'quarterly'} period.
              </p>
            </div>
          </div>
        </div>

        {/* Calculation Method Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Calculation Method</h3>
              <p className="text-sm text-purple-800">
                This KPI uses <span className="font-bold">{calculationMethodName}</span> for rating calculations.
              </p>
              {isSelfRatingDisabled && (
                <p className="text-xs text-purple-700 mt-2">
                  ⓘ Employee self-rating is disabled - you will rate all items directly.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Review Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">KPI Review & Rating Table</h2>
              <p className="text-sm text-gray-600 mt-1">
                {review.review_quarter} {review.review_year} {review.review_period === 'quarterly' ? 'Quarterly' : 'Yearly'} Performance Evaluation
              </p>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mr-3">
                KPI Period: {review.review_period === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </span>
              <span className="text-sm text-gray-600">Total KPIs: {kpi?.items?.length || kpi?.item_count || 1}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: isSelfRatingDisabled ? '2200px' : '2400px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '250px' }}>KPI DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '180px' }}>CURRENT PERFORMANCE STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>TARGET VALUE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>ACTUAL VALUE ACHIEVED</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>PERCENTAGE VALUE OBTAINED</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>MEASURE UNIT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EXPECTED COMPLETION DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>GOAL WEIGHT</th>
                {!isSelfRatingDisabled && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>EMPLOYEE SELF RATING</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>EMPLOYEE COMMENT</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>MANAGER RATING</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>MANAGER RATING %</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>MANAGER COMMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi?.items && kpi.items.length > 0 ? (
                kpi.items.map((item, index) => {
                  const empRating = employeeRatings[item.id] || 0;
                  const empComment = employeeComments[item.id] || '';
                  const mgrRating = managerRatings[item.id] || 0;
                  const mgrComment = managerComments[item.id] || '';
                  const actualValue = actualValues[item.id] || '';
                  const targetValue = targetValues[item.id] || item.target_value || '';
                  const goalWeight = goalWeights[item.id] || item.goal_weight || item.measure_criteria || '';
                  const currentStatus = currentPerformanceStatuses[item.id] || item.current_performance_status || '';
                  const targetValueNum = targetValue ? parseFloat(String(targetValue)) : 0;
                  
                  // Calculate percentage value obtained: (actual / target) * 100
                  const percentageValueObtainedNum = actualValue && targetValueNum > 0 
                    ? (parseFloat(actualValue) / targetValueNum) * 100
                    : 0;
                  const percentageValueObtained = percentageValueObtainedNum > 0
                    ? percentageValueObtainedNum.toFixed(2) + '%'
                    : 'N/A';
                  
                  // Calculate manager rating percentage
                  // For Actual vs Target method: Percentage Value Obtained * Goal Weight
                  // For other methods: (rating / max_rating) * 100
                  const goalWeightNum = goalWeight ? parseFloat(String(goalWeight).replace('%', '')) / 100 : 0;
                  const isActualValueMethod = calculationMethodName.includes('Actual vs Target');
                  
                  // Debug logging
                  if (item.id && actualValue) {
                    console.log(`📊 [KPI ${item.id}] Calculation Method: ${calculationMethodName}`);
                    console.log(`📊 [KPI ${item.id}] Is Actual Value Method: ${isActualValueMethod}`);
                    console.log(`📊 [KPI ${item.id}] Actual: ${actualValue}, Target: ${targetValue}, Goal Weight: ${goalWeight}`);
                    console.log(`📊 [KPI ${item.id}] Percentage Obtained: ${percentageValueObtainedNum.toFixed(2)}%, Goal Weight Num: ${goalWeightNum}`);
                  }
                  
                  const managerRatingPercentage = isActualValueMethod
                    ? (percentageValueObtainedNum > 0 && goalWeightNum > 0
                        ? (percentageValueObtainedNum * goalWeightNum).toFixed(2) + '%'
                        : 'N/A')
                    : (mgrRating > 0 
                        ? ((mgrRating / 1.5) * 100).toFixed(2) + '%'
                        : 'N/A');
                  
                  if (item.id && actualValue) {
                    console.log(`✅ [KPI ${item.id}] Manager Rating %: ${managerRatingPercentage}`);
                    if (isActualValueMethod) {
                      console.log(`✅ [KPI ${item.id}] Formula: ${percentageValueObtainedNum.toFixed(2)}% * ${goalWeightNum} = ${managerRatingPercentage}`);
                    }
                  }
                  
                  return (
                    <tr key={item.id}>
                      {/* KPI Title */}
                      <td className="px-6 py-4">
                        <div>
                          <button
                            onClick={() => setTextModal({ isOpen: true, title: 'KPI Title', value: item.title || 'N/A' })}
                            className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[200px]" title={item.title}>{item.title}</p>
                          </button>
                          <p className="text-xs text-gray-500">KPI-{review.review_quarter}-{String(index + 1).padStart(3, '0')}</p>
                        </div>
                      </td>
                      {/* KPI Description */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTextModal({ isOpen: true, title: 'KPI Description', value: item.description || 'N/A' })}
                          className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                        >
                          <p className="truncate max-w-[250px]" title={item.description || 'N/A'}>{item.description || 'N/A'}</p>
                        </button>
                      </td>
                      {/* Current Performance Status */}
                      <td className="px-6 py-4">
                        {isSelfRatingDisabled ? (
                          <textarea
                            value={currentStatus}
                            onChange={(e) => setCurrentPerformanceStatuses({ ...currentPerformanceStatuses, [item.id]: e.target.value })}
                            placeholder="Enter current status"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          />
                        ) : (
                          <button
                            onClick={() => setTextModal({ isOpen: true, title: 'Current Performance Status', value: currentStatus || 'N/A' })}
                            className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[180px]" title={currentStatus || 'N/A'}>{currentStatus || 'N/A'}</p>
                          </button>
                        )}
                      </td>
                      {/* Target Value */}
                      <td className="px-6 py-4">
                        {isSelfRatingDisabled ? (
                          <input
                            type="text"
                            value={targetValue}
                            onChange={(e) => setTargetValues({ ...targetValues, [item.id]: e.target.value })}
                            placeholder={item.is_qualitative ? "Qualitative (optional)" : "Enter target value"}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        ) : (
                          <button
                            onClick={() => setTextModal({ isOpen: true, title: 'Target Value', value: targetValue || 'N/A' })}
                            className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            <p className="truncate max-w-[150px]" title={targetValue || 'N/A'}>
                              {item.is_qualitative ? <span className="text-purple-600 font-medium">Qualitative</span> : (targetValue || 'N/A')}
                            </p>
                          </button>
                        )}
                      </td>
                      {/* Actual Value Achieved */}
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={actualValue}
                          onChange={(e) => setActualValues({ ...actualValues, [item.id]: e.target.value })}
                          placeholder="Enter actual value"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </td>
                      {/* Percentage Value Obtained */}
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${
                          actualValue && targetValueNum > 0 ? 
                            (parseFloat(actualValue) / targetValueNum) >= 1 ? 'text-green-600' : 
                            (parseFloat(actualValue) / targetValueNum) >= 0.7 ? 'text-orange-600' : 
                            'text-red-600'
                          : 'text-gray-400'
                        }`}>
                          {percentageValueObtained}
                        </span>
                      </td>
                      {/* Measure Unit */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-sm whitespace-nowrap ${item.is_qualitative ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.is_qualitative ? 'Qualitative' : (item.measure_unit || 'N/A')}
                        </span>
                      </td>
                      {/* Expected Completion Date */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.expected_completion_date 
                            ? new Date(item.expected_completion_date).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </td>
                      {/* Goal Weight */}
                      <td className="px-6 py-4">
                        {isSelfRatingDisabled ? (
                          <input
                            type="text"
                            value={goalWeight}
                            onChange={(e) => setGoalWeights({ ...goalWeights, [item.id]: e.target.value })}
                            placeholder="Enter weight (e.g., 15%)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-nowrap">{goalWeight || 'N/A'}</p>
                        )}
                      </td>
                      {/* Employee Self Rating - Conditionally Rendered */}
                      {!isSelfRatingDisabled && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.is_qualitative ? (
                            employeeQualitativeRatings[item.id] ? (
                              <div>
                                <span className="text-sm font-semibold text-purple-600">
                                  {(() => {
                                    const ratingValue = employeeQualitativeRatings[item.id];
                                    const matchingOption = qualitativeRatingOptions.find(opt => opt.rating_value === ratingValue);
                                    return matchingOption ? matchingOption.label : ratingValue;
                                  })()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not rated</span>
                            )
                          ) : empRating > 0 ? (
                            <div>
                              <span className="text-sm font-semibold text-gray-900">
                                {(() => {
                                  const ratingValue = parseFloat(String(empRating));
                                  if (Math.abs(ratingValue - 1.00) < 0.01) return '1.00';
                                  if (Math.abs(ratingValue - 1.25) < 0.01) return '1.25';
                                  if (Math.abs(ratingValue - 1.50) < 0.01) return '1.50';
                                  return parseFloat(String(empRating)).toFixed(2);
                                })()}
                              </span>
                              <span className="text-xs text-gray-500 ml-1 block">
                                ({getRatingLabel(empRating)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not rated</span>
                          )}
                        </td>
                      )}
                      {/* Employee Comment - Conditionally Rendered */}
                      {!isSelfRatingDisabled && (
                        <td className="px-6 py-4">
                          {empComment && empComment !== 'N/A' ? (
                            <button
                              onClick={() => setTextModal({ isOpen: true, title: 'Employee Comment', value: empComment })}
                              className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors"
                            >
                              <p className="truncate max-w-[200px]" title={empComment}>
                                {empComment.length > 50 ? empComment.substring(0, 50) + '...' : empComment}
                              </p>
                            </button>
                          ) : (
                            <p className="text-sm text-gray-400">N/A</p>
                          )}
                        </td>
                      )}
                      {/* Manager Rating */}
                      <td className="px-6 py-4">
                        {item.is_qualitative ? (
                          <div>
                            <select
                              value={qualitativeRatings[item.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const parsed = val === '' ? '' : parseInt(val, 10);
                                setQualitativeRatings({ ...qualitativeRatings, [item.id]: parsed });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Select qualitative rating</option>
                              {qualitativeRatingOptions.map((opt) => (
                                <option key={opt.id || opt.rating_value} value={opt.id || opt.rating_value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <select
                              value={mgrRating || 0}
                              onChange={(e) => {
                                const selectedValue = parseFloat(e.target.value);
                                console.log('🔄 [KPIReview] Select changed - Raw value:', e.target.value, 'Parsed:', selectedValue, 'Item ID:', item.id);
                                handleRatingChange(item.id, selectedValue);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                              <option value={0}>Select rating</option>
                              {ratingOptions.map((opt) => {
                                const optValue = parseFloat(String(opt.rating_value));
                                return (
                                  <option key={opt.rating_value} value={optValue}>
                                    {opt.rating_value} - {opt.label}
                                  </option>
                                );
                              })}
                            </select>
                            {mgrRating > 0 && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-500">
                                  {(() => {
                                    const ratingValue = parseFloat(String(mgrRating));
                                    if (Math.abs(ratingValue - 1.00) < 0.01) return 'Below Expectation';
                                    if (Math.abs(ratingValue - 1.25) < 0.01) return 'Meets Expectation';
                                    if (Math.abs(ratingValue - 1.50) < 0.01) return 'Exceeds Expectation';
                                    return '';
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Manager Rating % */}
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${
                          isActualValueMethod ? (
                            percentageValueObtainedNum >= 100 ? 'text-green-600' :
                            percentageValueObtainedNum >= 70 ? 'text-orange-600' :
                            percentageValueObtainedNum > 0 ? 'text-red-600' : 'text-gray-400'
                          ) : (
                            mgrRating >= 1.5 ? 'text-green-600' : 
                            mgrRating >= 1.25 ? 'text-orange-600' : 
                            mgrRating > 0 ? 'text-red-600' : 'text-gray-400'
                          )
                        }`}>
                          {managerRatingPercentage}
                        </span>
                      </td>
                      {/* Manager Comment */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          <textarea
                            value={item.is_qualitative ? (qualitativeComments[item.id] || '') : mgrComment}
                            onChange={(e) => {
                              if (item.is_qualitative) {
                                setQualitativeComments({ ...qualitativeComments, [item.id]: e.target.value });
                              } else {
                                handleCommentChange(item.id, e.target.value);
                              }
                            }}
                            placeholder={item.is_qualitative ? "Enter qualitative assessment..." : "Enter your comment..."}
                            rows={2}
                            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          {((item.is_qualitative && qualitativeComments[item.id] && qualitativeComments[item.id].length > 30) || 
                            (!item.is_qualitative && mgrComment && mgrComment.length > 30)) && (
                            <button
                              onClick={() => setTextModal({ 
                                isOpen: true, 
                                title: item.is_qualitative ? 'Qualitative Assessment' : 'Manager Comment', 
                                value: item.is_qualitative ? qualitativeComments[item.id] : mgrComment,
                                field: item.is_qualitative ? 'qualitative_comment' : 'manager_comment',
                                itemId: item.id,
                                onChange: (value) => {
                                  if (item.is_qualitative) {
                                    setQualitativeComments({ ...qualitativeComments, [item.id]: value });
                                  } else {
                                    handleCommentChange(item.id, value);
                                  }
                                }
                              })}
                              className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 border border-purple-300 rounded"
                              title="View/Edit full comment"
                            >
                              <FiExternalLink />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Fallback for legacy single KPI format
                <tr>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{review.kpi_title}</p>
                      <p className="text-xs text-gray-500">KPI-CS-001</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{review.kpi_description || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{review.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm whitespace-nowrap">
                      {review.measure_unit || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    {review.employee_rating ? (
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {review.employee_rating === 1.00 ? '1.00' : review.employee_rating === 1.25 ? '1.25' : review.employee_rating === 1.50 ? '1.50' : review.employee_rating}
                        </span>
                        <span className="text-xs text-gray-500 ml-1 block">
                          ({getRatingLabel(parseFloat(String(review.employee_rating)))})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not rated</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{review.employee_comment || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={review.manager_rating || 0}
                      onChange={(e) => handleRatingChange(0, parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={0}>Select rating</option>
                      {ratingOptions.map((opt) => {
                        const optValue = parseFloat(String(opt.rating_value));
                        return (
                          <option key={opt.rating_value} value={optValue}>
                            {opt.rating_value} - {opt.label}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      value={review.manager_comment || ''}
                      onChange={(e) => handleCommentChange(0, e.target.value)}
                      placeholder="Enter your comment..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Average Ratings Summary */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-6">
            {!isSelfRatingDisabled && !calculationMethodName.includes('Actual vs Target') && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Employee Average Rating</p>
                <p className="text-lg font-semibold text-gray-700">
                  {employeeAvg > 0 ? employeeAvg.toFixed(2) : 'N/A'}
                </p>
                <p className="text-sm font-medium text-gray-600 mt-3 mb-1">Employee Final Rating</p>
                <p className="text-2xl font-bold text-blue-600">
                  {employeeFinalRating > 0 ? employeeFinalRating.toFixed(2) : 'N/A'}
                </p>
                {employeeFinalRating > 0 && (
                  <>
                    <p className="text-sm text-gray-500 mt-1">({getRatingLabel(employeeFinalRating)})</p>
                    <p className="text-sm font-medium text-blue-600 mt-2">
                      {((employeeFinalRating / 1.5) * 100).toFixed(2)}%
                    </p>
                  </>
                )}
              </div>
            )}
            <div className={isSelfRatingDisabled || calculationMethodName.includes('Actual vs Target') ? 'col-span-2' : ''}>
              {calculationMethodName.includes('Actual vs Target') ? (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Final Rating Percentage</p>
                  <p className="text-4xl font-bold text-purple-600">
                    {(() => {
                      // Calculate sum of all Manager Rating % values
                      let totalRatingPercentage = 0;
                      kpi?.items?.forEach(item => {
                        const actualValue = actualValues[item.id];
                        const targetValue = targetValues[item.id] || item.target_value;
                        const goalWeight = goalWeights[item.id] || item.goal_weight || item.measure_criteria;
                        const targetValueNum = targetValue ? parseFloat(String(targetValue)) : 0;
                        const goalWeightNum = goalWeight ? parseFloat(String(goalWeight).replace('%', '')) / 100 : 0;
                        
                        if (actualValue && targetValueNum > 0 && goalWeightNum > 0) {
                          const percentageObtained = (parseFloat(actualValue) / targetValueNum) * 100;
                          const ratingPercentage = percentageObtained * goalWeightNum;
                          totalRatingPercentage += ratingPercentage;
                        }
                      });
                      return totalRatingPercentage > 0 ? `${totalRatingPercentage.toFixed(2)}%` : 'Not calculated';
                    })()}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600 mb-1">Manager Average Rating</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {managerAvg > 0 ? managerAvg.toFixed(2) : 'Not rated'}
                  </p>
                  <p className="text-sm font-medium text-gray-600 mt-3 mb-1">Manager Final Rating</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {managerFinalRating > 0 ? managerFinalRating.toFixed(2) : 'Not rated'}
                  </p>
                  {managerFinalRating > 0 && (
                    <>
                      <p className="text-sm text-gray-500 mt-1">({getRatingLabel(managerFinalRating)})</p>
                      <p className="text-sm font-medium text-purple-600 mt-2">
                        Final Rating %: {((managerFinalRating / 1.5) * 100).toFixed(2)}%
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Accomplishments & Disappointments - Hide when self-rating is disabled */}
      {!isSelfRatingDisabled && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance Reflection</h2>
        
        <div className="space-y-6">
          {/* Accomplishments Table - Always show */}
          <div>
            <AccomplishmentsTable
              accomplishments={accomplishments}
              onChange={setAccomplishments}
              mode="manager"
              ratingOptions={ratingOptions.map(opt => ({ 
                value: parseFloat(String(opt.rating_value)), 
                label: `${parseFloat(String(opt.rating_value)).toFixed(2)} - ${opt.label}` 
              }))}
              managerRatingOptions={ratingOptions.map(opt => ({ 
                value: parseFloat(String(opt.rating_value)), 
                label: `${parseFloat(String(opt.rating_value)).toFixed(2)} - ${opt.label}` 
              }))}
            />
          </div>

          {/* Disappointments */}
          {review.disappointments && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Employee's Challenges & Disappointments</h3>
              <div className="bg-orange-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.disappointments}</p>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Guidance</h3>
              <textarea
                value={disappointmentsManagerComment}
                onChange={(e) => setDisappointmentsManagerComment(e.target.value)}
                placeholder="Provide guidance on addressing challenges..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Improvement Needed */}
          {review.improvement_needed && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Employee's Suggestions for Organizational Improvement</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.improvement_needed}</p>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Response</h3>
              <textarea
                value={improvementNeededManagerComment}
                onChange={(e) => setImprovementNeededManagerComment(e.target.value)}
                placeholder="Acknowledge employee's suggestions and provide response..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Future Plan */}
          {review.future_plan && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Employee's Future Plans & Goals</h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.future_plan}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Overall Manager Comments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Manager Comments</h2>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          placeholder="Provide your overall assessment of the employee's performance for this review period..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          Summarize the employee's overall performance, highlighting strengths and areas for improvement.
        </p>
      </div>

      {/* Signature Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <DatePicker
              label="Review Date *"
              value={reviewDate || undefined}
              onChange={setReviewDate}
              required
            />
          </div>
          <div>
            <SignatureField
              label="Manager Digital Signature *"
              value={managerSignature}
              onChange={setManagerSignature}
              required
              placeholder="Click and drag to sign"
            />
            <p className="text-sm text-gray-600 mt-2">
              By signing, you confirm that you have reviewed this employee's performance and agree with the ratings provided.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Button
          onClick={handleBack}
          variant="ghost"
          icon={FiArrowLeft}
        >
          Back
        </Button>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            icon={FiSave}
          >
            Save as Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="primary"
            icon={FiSend}
            loading={saving}
          >
            Submit Review
          </Button>
        </div>
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={() => {
          if (textModal.onChange && textModal.itemId !== undefined) {
            textModal.onChange(textModal.value);
          }
          setTextModal({ isOpen: false, title: '', value: '' });
        }}
        title={textModal.title}
        value={textModal.value}
        onChange={textModal.onChange}
        readOnly={!textModal.onChange}
      />
    </div>
  );
};

export default ManagerKPIReview;
