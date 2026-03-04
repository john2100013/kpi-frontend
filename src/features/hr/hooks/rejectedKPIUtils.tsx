/**
 * Utility functions for Rejected KPI Management
 */

import React from 'react';
import { KPI, KPIReview } from '../../../types';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export const getKPIStatusBadge = (_kpi: KPI, review?: KPIReview): React.ReactNode => {
  if (!review) return null;

  if (review.rejection_resolved_status === 'resolved') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
        <FiCheckCircle className="mr-1" />
        Resolved
      </span>
    );
  }

  if (review.review_status === 'rejected') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <FiAlertTriangle className="mr-1" />
        Rejected
      </span>
    );
  }

  return null;
};
