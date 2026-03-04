import React from 'react';
import { FiEye } from 'react-icons/fi';
import { Button } from '../../../components/common';
import { KPI } from '../../../types';
import { KPIStageInfo, KPIActionInfo } from '../hooks/kpiListUtils';

interface KPIListRowProps {
  kpi: KPI;
  stageInfo: KPIStageInfo;
  primaryAction: KPIActionInfo;
  showEditButton: boolean;
  onView: (kpiId: number) => void;
  onEdit: (kpiId: number) => void;
  isSelfRatingEnabled?: boolean;
  calculationMethod?: string;
}

export const KPIListRow: React.FC<KPIListRowProps> = ({
  kpi,
  stageInfo,
  primaryAction,
  showEditButton,
  onView,
  onEdit,
  isSelfRatingEnabled = true,
  calculationMethod = 'Normal Calculation',
}) => {
  const kpiPeriodLabel = kpi.period?.toLowerCase() === 'yearly' ? 'Yearly' : 'Quarterly';
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-semibold text-gray-900">{kpi.title}</p>
          {kpi.items && kpi.items.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              KPI Form with {kpi.items.length} item{kpi.items.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600">
          <p>{kpi.quarter} {kpi.year}</p>
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
          {/* Show calculation method */}
          <p className="text-xs text-gray-500 mt-1">{calculationMethod}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${stageInfo.color}`}>
          {stageInfo.icon}
          <span>{stageInfo.stage}</span>
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => onView(kpi.id)}
            variant="link"
            icon={FiEye}
            className="text-sm"
          >
            View
          </Button>
          {primaryAction.label && primaryAction.onClick && isSelfRatingEnabled && (
            <>
              <span className="text-gray-300">|</span>
              <Button
                onClick={primaryAction.onClick}
                variant="primary"
                size="xs"
              >
                {primaryAction.label}
              </Button>
            </>
          )}
          {showEditButton && isSelfRatingEnabled && (
            <>
              <span className="text-gray-300">|</span>
              <Button
                onClick={() => onEdit(kpi.id)}
                variant="link"
                className="text-sm"
              >
                Edit
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};