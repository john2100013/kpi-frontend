import React from 'react';
import { FiArrowLeft, FiInfo } from 'react-icons/fi';
import { useManagerReviewsList } from '../hooks';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

const ReviewsList: React.FC = () => {
  const {
    reviews,
    acknowledgedKPIs,
    loading,
    pendingCount,
    getStatusColor,
    handleBack,
    handleReview,
    handleEdit,
    handleViewKPI,
    handleView,
    handleStartReview,
    shouldShowAsManagerInitiated,
  } = useManagerReviewsList();

  const { features, loading: featuresLoading } = useCompanyFeatures();

  console.log('📋 [ReviewsList] Component render:', {
    loading,
    featuresLoading,
    reviewsCount: reviews.length,
    acknowledgedKPIsCount: acknowledgedKPIs.length,
    pendingCount
  });
  console.log('📋 [ReviewsList] Company features:', features);

  if (loading || featuresLoading) {
    console.log('⏳ [ReviewsList] Showing loading state');
    return <div className="p-6">Loading...</div>;
  }

  // Filter acknowledged KPIs that need manager to initiate based on self-rating settings
  // KEEP ALL KPIs - just categorize them for display
  const managerInitiateKPIs = acknowledgedKPIs.filter(shouldShowAsManagerInitiated);
  const employeeSelfRateKPIs = acknowledgedKPIs.filter(kpi => !shouldShowAsManagerInitiated(kpi));
  
  console.log('📋 [ReviewsList] Manager-initiate KPIs:', {
    count: managerInitiateKPIs.length,
    kpis: managerInitiateKPIs.map(k => ({ id: k.id, title: k.title, period: k.period, employee: k.employee_name }))
  });
  console.log('📋 [ReviewsList] Employee self-rate KPIs:', {
    count: employeeSelfRateKPIs.length,
    kpis: employeeSelfRateKPIs.map(k => ({ id: k.id, title: k.title, period: k.period, employee: k.employee_name }))
  });

  // Check if we have any yearly or quarterly KPIs requiring manager initiation
  const yearlyManagerKPIs = managerInitiateKPIs.filter(k => k.period?.toLowerCase() === 'yearly');
  const quarterlyManagerKPIs = managerInitiateKPIs.filter(k => k.period?.toLowerCase() !== 'yearly');

  return (
    <div className="space-y-6">
      {/* Period-Specific Self-Rating Disabled Notice for Managers */}
      {managerInitiateKPIs.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-purple-600 text-lg flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 mb-1">
                You will initiate these reviews
              </p>
              <p className="text-sm text-purple-800">
                Employee self-rating is disabled for:
                {quarterlyManagerKPIs.length > 0 && (
                  <span className="block mt-1">
                    • <strong>Quarterly KPIs:</strong> {quarterlyManagerKPIs.length} review(s) waiting
                  </span>
                )}
                {yearlyManagerKPIs.length > 0 && (
                  <span className="block mt-1">
                    • <strong>Yearly KPIs:</strong> {yearlyManagerKPIs.length} review(s) waiting
                  </span>
                )}
              </p>
              <p className="text-xs text-purple-700 mt-2">
                You will initiate and complete these KPI reviews directly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Reviews</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and review employee KPI evaluations</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Pending Reviews ({pendingCount})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EMPLOYEE RATING</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Manager-Initiated KPIs (Acknowledged but no review yet, self-rating disabled) */}
              {managerInitiateKPIs.map((kpi) => {
                const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'Yearly' : 'Quarterly';
                return (
                <tr key={`kpi-${kpi.id}`} className="hover:bg-gray-50 bg-purple-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                    <p className="text-sm text-gray-500">{kpi.employee_department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{kpi.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {kpi.quarter} {kpi.year}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mt-1">
                      {kpiPeriod} - Self-rating disabled
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      -
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor('manager_initiate')}`}>
                      You initiate review
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStartReview(kpi.id)}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      Start Review
                    </button>
                  </td>
                </tr>
                );
              })}

              {/* Employee Self-Rate KPIs (Acknowledged but no review yet, self-rating enabled - waiting for employee) */}
              {employeeSelfRateKPIs.map((kpi) => {
                const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'Yearly' : 'Quarterly';
                return (
                <tr key={`kpi-${kpi.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{kpi.employee_name}</p>
                    <p className="text-sm text-gray-500">{kpi.employee_department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{kpi.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {kpi.quarter} {kpi.year}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mt-1">
                      {kpiPeriod} - Employee self-rates
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      -
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>
                      Self rating Enabled , Waiting for employee to initiate
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewKPI(kpi.id)}
                      className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                    >
                      View KPI
                    </button>
                  </td>
                </tr>
                );
              })}

              {/* Regular Reviews */}
              {reviews.length === 0 && acknowledgedKPIs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={`review-${review.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{review.employee_name}</p>
                      <p className="text-sm text-gray-500">{review.employee_department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{review.kpi_title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {review.review_quarter} {review.review_year}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {review.employee_rating ? parseFloat(String(review.employee_rating)).toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status || review.review_status)}`}>
                        {(review.status || review.review_status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Check if employee has already confirmed/rejected (completed or rejected status) */}
                        {((review.status || review.review_status) === 'completed' || (review.status || review.review_status) === 'rejected') ? (
                          <>
                            <span className="text-xs text-gray-500 italic">
                              Employee has confirmed - cannot edit
                            </span>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleViewKPI(review.kpi_id)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              View KPI
                            </button>
                          </>
                        ) : (review.status || review.review_status) === 'manager_submitted' || (review.status || review.review_status) === 'awaiting_employee_confirmation' ? (
                          <>
                            <button
                              onClick={() => handleEdit(review.id)}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleViewKPI(review.kpi_id)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              View KPI
                            </button>
                          </>
                        ) : ((review.status || review.review_status) === 'employee_submitted' || (review.status || review.review_status) === 'pending' || (review.status || review.review_status) === 'manager_initiated') ? (
                          <button
                            onClick={() => handleReview(review.id)}
                            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            onClick={() => handleView(review.id)}
                            className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReviewsList;
