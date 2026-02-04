import React from 'react';
import { FiCheckCircle, FiInfo, FiFileText, FiEdit, FiBell, FiEye } from 'react-icons/fi';
import { useEmployeeReviews } from '../hooks';
import { Button } from '../../../components/common';
import { KPI } from '../../../types';

const Reviews: React.FC = () => {
  const {
    kpis,
    reviews,
    loading,
    error,
    getReviewStatus,
    isSelfRatingEnabledForKPI,
    handleViewKPI,
    handleStartReview,
    handleConfirmReview,
  } = useEmployeeReviews();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  // Check if there are any KPIs where self-rating is disabled
  const managerLedKPIs = kpis.filter(kpi => !isSelfRatingEnabledForKPI(kpi));
  const selfRatingKPIs = kpis.filter(kpi => isSelfRatingEnabledForKPI(kpi));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs Awaiting Review</h1>
        <p className="text-sm text-gray-600 mt-1">
          {managerLedKPIs.length > 0 && selfRatingKPIs.length > 0
            ? 'Complete self-assessments or view manager-led KPIs'
            : managerLedKPIs.length > 0
            ? 'View your KPIs - Reviews will be conducted by your manager'
            : 'Complete your self-assessment for acknowledged KPIs'}
        </p>
      </div>

      {/* Self-Rating Enabled Notice - for employees with self-rating KPIs */}
      {selfRatingKPIs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-green-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Self-Rating Enabled</h3>
              <p className="text-sm text-green-800">
                You will initiate the review process for {selfRatingKPIs.length} KPI{selfRatingKPIs.length > 1 ? 's' : ''}. 
                Complete your self-assessment and submit for manager review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manager-Led Review Notice */}
      {managerLedKPIs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-blue-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Self-Rating Disabled - Manager Will Initiate</h3>
              <p className="text-sm text-blue-800 mb-2">
                Your manager will initiate and conduct reviews for the following KPIs:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                {managerLedKPIs.map(kpi => {
                  const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'Yearly' : 'Quarterly';
                  return (
                    <li key={kpi.id} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      <span className="font-medium">{kpi.title}</span>
                      <span className="mx-2">•</span>
                      <span className="text-blue-700">{kpiPeriod}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                You'll be notified when your manager completes the review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Table */}
      {kpis.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">You have no KPIs pending review at this time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My KPIs</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI TITLE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PERIOD</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kpis.map((kpi: KPI) => {
                  const statusInfo = getReviewStatus(kpi);
                  const review = reviews.find(r => r.kpi_id === kpi.id);
                  const reviewStatus = (review as any)?.status || review?.review_status;
                  const isManagerLed = !isSelfRatingEnabledForKPI(kpi);
                  const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'Yearly' : 'Quarterly';
                  
                  return (
                    <tr key={kpi.id} className={`hover:bg-gray-50 ${isManagerLed ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{kpi.title}</p>
                          <p className="text-sm text-gray-500">{kpi.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{kpi.quarter} {kpi.year}</p>
                        {/* Show period-specific self-rating status badge for ALL KPIs */}
                        {isManagerLed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                            {kpiPeriod} - Self-rating disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mt-1">
                            {kpiPeriod} - Self-rating enabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.stage.includes('Review Pending') && <FiFileText className="mr-1" />}
                          {statusInfo.stage.includes('Self-Rating Required') && <FiEdit className="mr-1" />}
                          {statusInfo.stage.includes('Awaiting Your Confirmation') && <FiBell className="mr-1" />}
                          {statusInfo.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {/* For manager-led KPIs, only show view button */}
                          {isManagerLed ? (
                            <Button
                              onClick={() => handleViewKPI(kpi.id)}
                              variant="secondary"
                              size="sm"
                              icon={FiEye}
                            >
                              View KPI
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleViewKPI(kpi.id)}
                                variant="link"
                                size="sm"
                              >
                                View
                              </Button>
                              
                              {/* Review Pending or Self-Rating Required */}
                              {(!review || reviewStatus === 'pending') && (
                                <Button
                                  onClick={() => handleStartReview(kpi.id)}
                                  variant="primary"
                                  size="sm"
                                >
                                  {reviewStatus === 'pending' ? 'Continue Review' : 'Start Review'}
                                </Button>
                              )}
                              
                              {/* Awaiting Your Confirmation */}
                              {review && (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation') && (
                                <Button
                                  onClick={() => handleConfirmReview(review.id)}
                                  variant="primary"
                                  size="sm"
                                >
                                  Confirm Review
                                </Button>
                              )}
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
