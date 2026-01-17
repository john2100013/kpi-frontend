import React from 'react';
import { KPI, KPIReview } from '../../../types';
import { Button } from '../../../components/common';
import { DashboardStageInfo } from '../hooks/dashboardUtils';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';

interface DashboardKPIRowProps {
  kpi: KPI;
  review: KPIReview | undefined;
  stageInfo: DashboardStageInfo;
  onView: (kpiId: number) => void;
  onAcknowledge: (kpiId: number) => void;
  onReview: (kpiId: number) => void;
  onConfirm: (reviewId: number) => void;
  onEdit: (kpiId: number) => void;
}

export const DashboardKPIRow: React.FC<DashboardKPIRowProps> = ({
  kpi,
  review,
  stageInfo,
  onView,
  onAcknowledge,
  onReview,
  onConfirm,
  onEdit,
}) => {
  const { features } = useCompanyFeatures();
  
  // Backend may send either 'status' or 'review_status' field
  const reviewStatus = (review as any)?.status || review?.review_status;
  
  // Check if self-rating is enabled for this KPI based on its period
  const kpiPeriod = kpi.period?.toLowerCase() === 'yearly' ? 'yearly' : 'quarterly';
  const kpiPeriodLabel = kpi.period?.toLowerCase() === 'yearly' ? 'Yearly' : 'Quarterly';
  const isSelfRatingEnabled = kpiPeriod === 'yearly' 
    ? features?.enable_employee_self_rating_yearly !== false 
    : features?.enable_employee_self_rating_quarterly !== false;
  
  const isPending = kpi.status === 'pending';
  const needsReview = kpi.status === 'acknowledged' && (!review || reviewStatus === 'pending');
  const needsConfirmation = review && (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation');
  const canEdit = review && reviewStatus === 'employee_submitted';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-semibold text-gray-900">{kpi.title}</p>
          {kpi.items && kpi.items.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {kpi.items.length} KPI item{kpi.items.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-600">
          {kpi.quarter} {kpi.year}
        </p>
        {/* Show period-specific self-rating status badge */}
        {isSelfRatingEnabled ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mt-1">
            {kpiPeriodLabel} - Self-rating enabled
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mt-1">
            {kpiPeriodLabel} - Self-rating disabled
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${stageInfo.color}`}>
          {stageInfo.icon}
          <span>{stageInfo.stage}</span>
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          {isPending ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAcknowledge(kpi.id)}
            >
              Acknowledge
            </Button>
          ) : (
            <>
              <Button
                variant="link"
                size="sm"
                onClick={() => onView(kpi.id)}
              >
                View
              </Button>
              
              {needsReview && (
                <>
                  <span className="text-gray-300">|</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onReview(kpi.id)}
                  >
                    Review
                  </Button>
                </>
              )}

              {needsConfirmation && (
                <>
                  <span className="text-gray-300">|</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onConfirm(review.id)}
                  >
                    Confirm
                  </Button>
                </>
              )}

              {canEdit && (
                <>
                  <span className="text-gray-300">|</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(kpi.id)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
};