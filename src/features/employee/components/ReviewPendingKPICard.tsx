import React from 'react';
import { FiFileText, FiEye, FiClock } from 'react-icons/fi';
import { Button } from '../../../components/common';
import { KPI } from '../../../types';

interface ReviewPendingKPICardProps {
  kpi: KPI;
  statusInfo: {
    stage: string;
    color: string;
  };
  onView: (kpiId: number) => void;
  onStartReview?: (kpiId: number) => void;
  isSelfRatingDisabled?: boolean;
}

export const ReviewPendingKPICard: React.FC<ReviewPendingKPICardProps> = ({
  kpi,
  statusInfo,
  onView,
  onStartReview,
  isSelfRatingDisabled = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{kpi.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusInfo.color}`}>
              <FiFileText className="inline" />
              <span>{statusInfo.stage}</span>
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{kpi.description}</p>
          
          {isSelfRatingDisabled && (
            <div className="mb-3 flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <FiClock className="flex-shrink-0" />
              <span>Waiting for manager to start review</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Period</p>
              <p className="font-medium text-gray-900">{kpi.quarter} {kpi.year}</p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium text-gray-900 capitalize">{kpi.period}</p>
            </div>
            <div>
              <p className="text-gray-500">KPI Items</p>
              <p className="font-medium text-gray-900">{kpi.items?.length || kpi.item_count || 1}</p>
            </div>
            {kpi.meeting_date && (
              <div>
                <p className="text-gray-500">Meeting Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(kpi.meeting_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="ml-4 flex flex-col space-x-2">
          <Button
            onClick={() => onView(kpi.id)}
            variant="link"
            icon={FiEye}
            className="text-sm"
          >
            View
          </Button>
          {!isSelfRatingDisabled && onStartReview && (
            <Button
              onClick={() => onStartReview(kpi.id)}
              variant="primary"
              size="sm"
            >
              Start Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};