import React from 'react';
import { FiArrowLeft, FiSave, FiSend, FiExternalLink } from 'react-icons/fi';
import { Button } from '../../../components/common';
import SignatureField from '../../../components/SignatureField';
import DatePicker from '../../../components/DatePicker';
import TextModal from '../../../components/TextModal';
import AccomplishmentsTable from '../../../components/AccomplishmentsTable';
import { useEmployeeSelfRating } from '../hooks';
import { getRatingLabel } from '../hooks/selfRatingUtils';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';
import { KPIItem } from '../../../types';
import { RatingOption } from '../types';

const SelfRating: React.FC = () => {
  const {
    user,
    kpi,
    loading,
    saving,
    ratings,
    comments,
    employeeSignature,
    reviewDate,
    ratingOptions,
    qualitativeRatingOptions,
    majorAccomplishments,
    disappointments,
    improvementNeeded,
    accomplishments,
    futurePlan,
    textModal,
    averageRating,
    completion,
    employeeRatingPercentage,
    goalWeights,
    setEmployeeSignature,
    setReviewDate,
    setMajorAccomplishments,
    setDisappointments,
    setImprovementNeeded,
    setAccomplishments,
    setFuturePlan,
    handleRatingChange,
    handleCommentChange,
    handleSaveDraft,
    handleSubmit,
    openTextModal,
    closeTextModal,
    updateTextModalValue,
    navigate,
  } = useEmployeeSelfRating();

  // Department feature detection for calculation method
  const { getCalculationMethodName, isEmployeeSelfRatingEnabled } = useCompanyFeatures(kpi?.id);
  
  // Get calculation method based on KPI period
  const kpiPeriod = kpi?.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
  const calculationMethodName = kpi?.period ? getCalculationMethodName(kpi.period) : 'Normal Calculation';
  const isSelfRatingEnabled = kpi?.period ? isEmployeeSelfRatingEnabled(kpiPeriod) : false;

  // NEW LOGIC: Hide Performance Reflection when Quarterly + Goal Weight + Self Rating Enabled
  const shouldHidePerformanceReflection = 
    kpiPeriod === 'quarterly' && 
    calculationMethodName.includes('Goal Weight') && 
    isSelfRatingEnabled;

  console.log('🎨 [SelfRating] Component render:', { 
    loading, 
    hasKpi: !!kpi, 
    kpiId: kpi?.id,
    calculationMethodName,
    kpiPeriod,
    isSelfRatingEnabled
  });

  if (loading) {
    console.log('⏳ [SelfRating] Showing loading state');
    return <div className="p-6">Loading KPI details...</div>;
  }
  
  if (!kpi) {
    console.log('❌ [SelfRating] No KPI data - showing error state');
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">Failed to load KPI details. Please try again.</p>
        </div>
      </div>
    );
  }
  
  console.log('✅ [SelfRating] Rendering main content for KPI:', { id: kpi.id, title: kpi.title });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
            icon={FiArrowLeft}
            className="p-2"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'} KPI Self-Rating
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {kpi.quarter} {kpi.year} • {kpi.period === 'quarterly' ? 'Jan - Mar' : 'Jan - Dec'}{' '}
              {kpi.year} • Due: March 31, {kpi.year}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleSaveDraft} variant="secondary" icon={FiSave}>
            Save as Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="primary"
            icon={FiSend}
            loading={saving}
          >
            Submit Self-Rating
          </Button>
        </div>
      </div>

      {/* Instructions and Calculation Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Self-Rating Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Self-Rating Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800 list-disc list-inside">
            <li>
              Provide honest and accurate self-assessments based on your actual achievements during
              this quarter
            </li>
            <li>
              Add comments to explain your rating, highlight achievements, or note any challenges
              faced
            </li>
            <li>
              Your self-rating will be reviewed by your manager during the KPI review meeting
            </li>
          </ul>
        </div>

        {/* Department Calculation Settings */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-4">Department Calculation Settings</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Calculation Method for {kpi?.period || 'Quarterly'} KPIs:
              </p>
              <p className="text-base font-semibold text-purple-700">
                {calculationMethodName}
              </p>
            </div>
            <div className="border-t border-purple-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Self-Rating Status:
              </p>
              <p className={`text-base font-semibold ${
                isSelfRatingEnabled ? 'text-green-600' : 'text-orange-600'
              }`}>
                {isSelfRatingEnabled ? '✓ Enabled' : '✗ Disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Review Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mr-3">
                KPI Period: {kpi.period === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </span>
              <span className="text-sm text-gray-600">
                Total KPIs: {kpi.items?.length || kpi.item_count || 1}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '1800px' }}>
            <thead className="bg-gray-50">
              <tr className="border-b-2 border-gray-400">
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '200px' }}
                >
                  KPI TITLE
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '250px' }}
                >
                  KPI DESCRIPTION
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '180px' }}
                >
                  CURRENT PERFORMANCE STATUS
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '150px' }}
                >
                  TARGET VALUE
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '120px' }}
                >
                  MEASURE UNIT
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '150px' }}
                >
                  EXPECTED COMPLETION DATE
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '120px' }}
                >
                  GOAL WEIGHT
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-r border-gray-300"
                  style={{ minWidth: '150px' }}
                >
                  SELF RATING *
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                  style={{ minWidth: '200px' }}
                >
                  EMPLOYEE COMMENT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi.items && kpi.items.length > 0 ? (
                kpi.items.map((item: KPIItem, index: number) => {
                  const itemRating = ratings[item.id] || 0;
                  const itemComment = comments[item.id] || '';
                  const isQualitative = item.is_qualitative;
                  return (
                    <tr key={item.id} className={isQualitative ? 'bg-purple-50' : ''}>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div>
                          <Button
                            onClick={() =>
                              openTextModal('KPI Title', item.title || 'N/A')
                            }
                            variant="ghost"
                            className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors p-0 justify-start"
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
                          <p className="text-xs text-gray-500">
                            KPI-{kpi.quarter}-{String(index + 1).padStart(3, '0')}
                          </p>
                          {isQualitative && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-200 text-purple-800 rounded">
                              Qualitative - Manager Rates
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <Button
                          onClick={() =>
                            openTextModal(
                              'KPI Description',
                              item.description || 'N/A'
                            )
                          }
                          variant="ghost"
                          className="text-left text-sm text-gray-700 hover:text-purple-600 transition-colors p-0 justify-start"
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
                      <td className="px-6 py-4 border-r border-gray-200">
                        <Button
                          onClick={() =>
                            openTextModal(
                              'Current Performance Status',
                              item.current_performance_status || 'N/A'
                            )
                          }
                          variant="ghost"
                          className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors p-0 justify-start"
                        >
                          <p
                            className="truncate max-w-[180px]"
                            title={item.current_performance_status || 'N/A'}
                          >
                            {item.current_performance_status || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <Button
                          onClick={() =>
                            openTextModal('Target Value', item.target_value || 'N/A')
                          }
                          variant="ghost"
                          className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors p-0 justify-start"
                        >
                          <p
                            className="truncate max-w-[150px]"
                            title={item.target_value || 'N/A'}
                          >
                            {item.target_value || 'N/A'}
                          </p>
                        </Button>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm whitespace-nowrap">
                          {item.measure_unit || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.expected_completion_date
                            ? new Date(item.expected_completion_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-nowrap">
                          {item.goal_weight || item.measure_criteria || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="space-y-2">
                          {isQualitative ? (
                            <>
                              <select
                                value={itemRating || 0}
                                onChange={(e) => {
                                  const selectedValue = parseFloat(e.target.value);
                                  console.log(
                                    '🔄 [SelfRating] Qualitative select changed - value:',
                                    selectedValue
                                  );
                                  if (!isNaN(selectedValue)) {
                                    handleRatingChange(item.id, selectedValue);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50"
                              >
                                <option value={0}>Select qualitative rating</option>
                                {qualitativeRatingOptions.length > 0 ? (
                                  qualitativeRatingOptions.map((opt: RatingOption, idx: number) => {
                                    const optValue =
                                      typeof opt.rating_value === 'number'
                                        ? opt.rating_value
                                        : parseFloat(String(opt.rating_value || '0'));
                                    return (
                                      <option
                                        key={`${opt.rating_value}-${opt.label}-${idx}`}
                                        value={optValue}
                                      >
                                        {opt.label}
                                      </option>
                                    );
                                  })
                                ) : (
                                  <option value={0} disabled>
                                    No qualitative ratings configured
                                  </option>
                                )}
                              </select>
                              {itemRating > 0 && qualitativeRatingOptions.length > 0 && (
                                <div className="mt-1">
                                  <span className="text-sm font-semibold text-purple-700">
                                    {qualitativeRatingOptions.find((opt: RatingOption) => 
                                      parseFloat(String(opt.rating_value || '0')) === itemRating
                                    )?.label || 'Selected'}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <select
                                value={itemRating || 0}
                                onChange={(e) => {
                                  const selectedValue = parseFloat(e.target.value);
                                  console.log(
                                    '🔄 [SelfRating] Select changed - value:',
                                    selectedValue
                                  );
                                  if (!isNaN(selectedValue)) {
                                    handleRatingChange(item.id, selectedValue);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              >
                                <option value={0}>Select rating</option>
                                {ratingOptions.length > 0 ? (
                                  ratingOptions.map((opt: RatingOption, idx: number) => {
                                    const optValue =
                                      typeof opt.rating_value === 'number'
                                        ? opt.rating_value
                                        : parseFloat(String(opt.rating_value || '0'));
                                    return (
                                      <option
                                        key={`${opt.rating_value}-${opt.label}-${idx}`}
                                        value={optValue}
                                      >
                                        {opt.rating_value} - {opt.label}
                                      </option>
                                    );
                                  })
                                ) : (
                                  <>
                                    <option value={1.0}>1.00 - Below Expectation</option>
                                    <option value={1.25}>1.25 - Meets Expectation</option>
                                    <option value={1.5}>1.50 - Exceeds Expectation</option>
                                  </>
                                )}
                              </select>
                              {itemRating > 0 && (
                                <div className="mt-1">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {getRatingLabel(itemRating)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          <textarea
                            value={itemComment}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            placeholder="Optional comment..."
                            rows={2}
                            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          {itemComment && itemComment.length > 30 && (
                            <Button
                              onClick={() =>
                                openTextModal(
                                  'Employee Comment',
                                  itemComment,
                                  'comment',
                                  item.id,
                                  (value: string) => handleCommentChange(item.id, value)
                                )
                              }
                              variant="ghost"
                              size="xs"
                              icon={FiExternalLink}
                              className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 border border-purple-300"
                              title="View/Edit full comment"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Optional</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Legacy fallback for single KPI format
                <tr>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{kpi.title}</p>
                      <p className="text-xs text-gray-500">KPI-{kpi.quarter}-001</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.description || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{kpi.target_value || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">N/A</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">
                      {kpi.measure_unit || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{kpi.measure_criteria || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <select
                        value={ratings[0] || 0}
                        onChange={(e) => {
                          const selectedValue = parseFloat(e.target.value);
                          if (!isNaN(selectedValue)) {
                            handleRatingChange(0, selectedValue);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={0}>Select rating</option>
                        {ratingOptions.length > 0 ? (
                          ratingOptions.map((opt: RatingOption) => {
                            const optValue =
                              typeof opt.rating_value === 'number'
                                ? opt.rating_value
                                : parseFloat(String(opt.rating_value || '0'));
                            return (
                              <option key={`${opt.rating_value}-${opt.label}`} value={optValue}>
                                {opt.rating_value} - {opt.label}
                              </option>
                            );
                          })
                        ) : (
                          <>
                            <option value={1.0}>1.00 - Below Expectation</option>
                            <option value={1.25}>1.25 - Meets Expectation</option>
                            <option value={1.5}>1.50 - Exceeds Expectation</option>
                          </>
                        )}
                      </select>
                      {ratings[0] > 0 && (
                        <div className="mt-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {getRatingLabel(ratings[0])}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      value={comments[0] || ''}
                      onChange={(e) => handleCommentChange(0, e.target.value)}
                      placeholder="Optional comment..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Major Accomplishments & Disappointments */}
      {/* Hide when Quarterly + Goal Weight + Self Rating Enabled */}
      {!shouldHidePerformanceReflection && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Reflection</h2>
        <p className="text-sm text-gray-600 mb-6">
          Please share your major accomplishments and any challenges or disappointments during this
          review period.
        </p>

        <div className="space-y-6">
          {/* Accomplishments Table */}
          <AccomplishmentsTable
            accomplishments={accomplishments}
            onChange={setAccomplishments}
            mode="employee"
            ratingOptions={ratingOptions.map(opt => ({ 
              value: Number(opt.rating_value), 
              label: `${Number(opt.rating_value).toFixed(2)} - ${opt.label}` 
            }))}
          />

          {/* Major Accomplishments - Old Text Field (kept for legacy data) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Accomplishments Notes (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Any additional context or accomplishments not captured in the table above.
            </p>
            <textarea
              value={majorAccomplishments}
              onChange={(e) => setMajorAccomplishments(e.target.value)}
              placeholder="Optional additional notes..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Disappointments / Challenges */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-300">
              <h3 className="text-md font-semibold text-gray-900">Challenges & Disappointments</h3>
              <p className="text-xs text-gray-600 mt-1">Share any obstacles, setbacks, or areas where you faced difficulties</p>
            </div>
            <div className="p-5">
              <textarea
                value={disappointments}
                onChange={(e) => setDisappointments(e.target.value)}
                placeholder="Example: Faced delays in project X due to resource constraints. Needed more training on the new system..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Organizational Improvement Needed */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-300">
              <h3 className="text-md font-semibold text-gray-900">Suggestions for Organizational Improvement</h3>
              <p className="text-xs text-gray-600 mt-1">Share suggestions on what the organization can do to support your growth and performance</p>
            </div>
            <div className="p-5">
              <textarea
                value={improvementNeeded}
                onChange={(e) => setImprovementNeeded(e.target.value)}
                placeholder="Example: Better access to training resources, improved communication tools, additional team support..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Future Plan */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-300">
              <h3 className="text-md font-semibold text-gray-900">Future Plans & Goals</h3>
              <p className="text-xs text-gray-600 mt-1">What are your goals and plans for the next review period? How do you plan to grow and improve?</p>
            </div>
            <div className="p-5">
              <textarea
                value={futurePlan}
                onChange={(e) => setFuturePlan(e.target.value)}
                placeholder="Example: Plan to complete certification in X, improve skills in Y, take on leadership role in Z project..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Summary Section - Moved before Employee Confirmation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">\n        <h2 className="text-lg font-semibold text-gray-900 mb-4">Self-Rating Summary</h2>
        <div className="p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Self-Rating:</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {averageRating > 0 ? `${averageRating.toFixed(2)}` : '0.00'}
                  </span>
                  {averageRating > 0 && (
                    <span className="text-sm text-gray-600">
                      ({getRatingLabel(averageRating)})
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Final Rating %:</p>
                <p className="text-2xl font-bold text-purple-600">
                  {employeeRatingPercentage !== null && employeeRatingPercentage !== undefined 
                    ? `${employeeRatingPercentage.toFixed(2)}%` 
                    : '0.00%'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion:</p>
                <p
                  className={`text-2xl font-bold ${
                    completion === 100 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {completion}%
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 italic">*All ratings are required before submission</p>
          </div>
        </div>
      </div>

      {/* Employee Confirmation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Confirmation</h2>
        <p className="text-sm text-gray-600 mb-6">
          By signing below, I confirm that the self-ratings provided are accurate to the best of my knowledge.
        </p>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
            <p className="font-semibold text-gray-900 text-sm">Digital Signature *</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SignatureField
                  label=""
                  value={employeeSignature}
                  onChange={setEmployeeSignature}
                  required
                  placeholder="Click and drag to sign"
                />
                <Button
                  onClick={() => setEmployeeSignature('')}
                  variant="link"
                  size="sm"
                  className="text-sm text-red-600 hover:text-red-700 mt-2 p-0"
                >
                  Clear Signature
                </Button>
              </div>

              <div className="space-y-4">
                <DatePicker
                  label="Self-Review Date *"
                  value={reviewDate}
                  onChange={setReviewDate}
                  required
                />
                <div className="space-y-3 pt-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Employee Name</p>
                    <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Payroll Number</p>
                    <p className="font-semibold text-gray-900">{user?.payroll_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Date & Time</p>
                    <p className="text-sm text-gray-700">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Important Notice</h3>
            <p className="text-sm text-yellow-800">
              Once submitted, your self-rating will be sent to your manager for review. You will be
              notified when your manager schedules the KPI review meeting to discuss your
              performance.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => navigate('/employee/dashboard')}
          variant="ghost"
          icon={FiArrowLeft}
          className="text-gray-700 hover:text-gray-900"
        >
          Back to Dashboard
        </Button>
        <div className="flex items-center space-x-3">
          <Button onClick={handleSaveDraft} variant="secondary" icon={FiSave}>
            Save as Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="primary"
            icon={FiSend}
            loading={saving}
          >
            Submit Self-Rating
          </Button>
        </div>
      </div>

      {/* Text Modal */}
      <TextModal
        isOpen={textModal.isOpen}
        onClose={closeTextModal}
        title={textModal.title}
        value={textModal.value}
        onChange={textModal.onChange ? updateTextModalValue : undefined}
        readOnly={!textModal.onChange}
      />
    </div>
  );
};

export default SelfRating;

