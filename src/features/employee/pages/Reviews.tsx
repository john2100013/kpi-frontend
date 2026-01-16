import React from 'react';
import { FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useEmployeeReviews } from '../hooks';
import { ReviewPendingKPICard } from '../components';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

const Reviews: React.FC = () => {
  const {
    kpis,
    loading,
    error,
    getReviewStatus,
    handleViewKPI,
    handleStartReview,
  } = useEmployeeReviews();

  const { features, loading: featuresLoading } = useCompanyFeatures();

  if (loading || featuresLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  const isSelfRatingEnabled = features?.enable_employee_self_rating_quarterly !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs Awaiting Review</h1>
        <p className="text-sm text-gray-600 mt-1">
          {isSelfRatingEnabled 
            ? 'Complete your self-assessment for acknowledged KPIs'
            : 'View your KPIs - Review will be conducted by your manager'}
        </p>
      </div>

      {/* Self-Rating Disabled Notice */}
      {!isSelfRatingEnabled && kpis.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Manager-Led Review Process</h3>
              <p className="text-sm text-blue-800">
                Your organization has configured the review process to start with your manager. 
                You can view your KPIs below, but the review will be initiated and completed by your manager. 
                You'll be notified when your manager completes the review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {kpis.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">You have no KPIs pending review at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {kpis.map((kpi) => {
            const statusInfo = getReviewStatus(kpi);
            
            return (
              <ReviewPendingKPICard
                key={kpi.id}
                kpi={kpi}
                statusInfo={statusInfo}
                onView={handleViewKPI}
                onStartReview={isSelfRatingEnabled ? handleStartReview : undefined}
                isSelfRatingDisabled={!isSelfRatingEnabled}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reviews;
