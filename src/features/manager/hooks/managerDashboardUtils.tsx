/**
 * Manager Dashboard Utility Functions
 */

import React from 'react';
import { FiClock, FiFileText, FiBell, FiCheckCircle, FiEdit, FiUsers, FiTarget } from 'react-icons/fi';
import { KPI, KPIReview } from '../../../types';
import { PeriodSetting } from '../types';

/**
 * Check if manager should initiate review based on KPI period and company settings
 */
export const shouldManagerInitiateReview = (
  kpi: KPI,
  companyFeatures: { enable_employee_self_rating_quarterly?: boolean; enable_employee_self_rating_yearly?: boolean } | null
): boolean => {
  if (!companyFeatures) return false;
  
  // For quarterly KPIs, check quarterly self-rating setting
  if (kpi.period === 'quarterly') {
    return companyFeatures.enable_employee_self_rating_quarterly === false;
  }
  
  // For yearly KPIs, check yearly self-rating setting
  if (kpi.period === 'yearly' || kpi.period === 'Yearly') {
    return companyFeatures.enable_employee_self_rating_yearly === false;
  }
  
  // Default to quarterly setting for backward compatibility
  return companyFeatures.enable_employee_self_rating_quarterly === false;
};

/**
 * Get KPI stage information
 */
export const getKPIStage = (
  kpi: KPI,
  reviews: KPIReview[],
  companyFeatures?: { enable_employee_self_rating_quarterly?: boolean; enable_employee_self_rating_yearly?: boolean } | null
): { stage: string; color: string; icon: React.ReactNode } => {
  const review = reviews.find(r => r.kpi_id === kpi.id);

  if (kpi.status === 'pending') {
    return {
      stage: 'KPI Setting - Awaiting Acknowledgement',
      color: 'bg-orange-100 text-orange-700',
      icon: <FiClock className="inline" />
    };
  }

  // Check if this is a manager-initiated review (acknowledged but no review, self-rating disabled)
  if (kpi.status === 'acknowledged' && !review && companyFeatures) {
    const isManagerInitiated = shouldManagerInitiateReview(kpi, companyFeatures);
    if (isManagerInitiated) {
      return {
        stage: 'You Initiate Review',
        color: 'bg-purple-100 text-purple-700',
        icon: <FiTarget className="inline" />
      };
    }
  }

  if (kpi.status === 'acknowledged' && !review) {
    return {
      stage: 'KPI Acknowledged - Review Pending',
      color: 'bg-blue-100 text-blue-700',
      icon: <FiFileText className="inline" />
    };
  }

  if (review) {
    if (review.review_status === 'manager_submitted') {
      return {
        stage: 'Awaiting Employee Confirmation',
        color: 'bg-indigo-100 text-indigo-700',
        icon: <FiBell className="inline" />
      };
    }

    if (review.review_status === 'employee_submitted') {
      return {
        stage: 'Self-Rating Submitted - Awaiting Manager Review',
        color: 'bg-yellow-100 text-yellow-700',
        icon: <FiClock className="inline" />
      };
    }

    if (review.review_status === 'completed') {
      return {
        stage: 'KPI Review Completed',
        color: 'bg-green-100 text-green-700',
        icon: <FiCheckCircle className="inline" />
      };
    }

    if (review.review_status === 'rejected') {
      return {
        stage: 'Review Rejected',
        color: 'bg-red-100 text-red-700',
        icon: <FiEdit className="inline" />
      };
    }

    if (review.review_status === 'pending') {
      return {
        stage: 'KPI Review - Self-Rating Required',
        color: 'bg-purple-100 text-purple-700',
        icon: <FiFileText className="inline" />
      };
    }
  }

  return {
    stage: 'In Progress',
    color: 'bg-gray-100 text-gray-700',
    icon: <FiClock className="inline" />
  };
};

/**
 * Get KPI stage information with progress (for dashboard)
 */
export const getKPIStageWithProgress = (
  kpi: KPI,
  reviews: KPIReview[],
  companyFeatures?: { enable_employee_self_rating_quarterly?: boolean; enable_employee_self_rating_yearly?: boolean } | null
): { stage: string; color: string; icon: React.ReactNode; progress: number } => {
  const stageInfo = getKPIStage(kpi, reviews, companyFeatures);
  let progress = 45; // Default

  // Calculate progress based on stage
  if (stageInfo.stage === 'KPI Setting - Awaiting Acknowledgement') {
    progress = 25;
  } else if (stageInfo.stage === 'You Initiate Review') {
    progress = 50; // Manager needs to start review
  } else if (stageInfo.stage === 'KPI Acknowledged - Review Pending') {
    progress = 45;
  } else if (stageInfo.stage === 'KPI Review - Self-Rating Required') {
    progress = 60;
  } else if (stageInfo.stage === 'Self-Rating Submitted - Awaiting Manager Review') {
    progress = 75;
  } else if (stageInfo.stage === 'Awaiting Employee Confirmation') {
    progress = 90;
  } else if (stageInfo.stage === 'KPI Review Completed') {
    progress = 100;
  } else if (stageInfo.stage === 'Review Rejected') {
    progress = 50;
  }

  return {
    ...stageInfo,
    progress,
  };
};

/**
 * Get category label
 */
export const getCategoryLabel = (category: string): string => {
  const labels: { [key: string]: string } = {
    pending: 'KPI Setting - Awaiting Acknowledgement',
    acknowledged_review_pending: 'KPI Acknowledged - Review Pending',
    manager_initiate_review: 'You Initiate Review',
    self_rating_submitted: 'Self-Rating Submitted - Awaiting Manager Review',
    awaiting_employee_confirmation: 'Awaiting Employee Confirmation',
    review_completed: 'KPI Review Completed',
    review_rejected: 'Review Rejected by Employee',
    review_pending: 'KPI Review - Self-Rating Required',
    no_kpi: 'No KPI Assigned',
  };
  return labels[category] || category;
};

/**
 * Get category color
 */
export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    pending: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    acknowledged_review_pending: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    manager_initiate_review: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    self_rating_submitted: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    awaiting_employee_confirmation: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    review_completed: 'bg-green-100 text-green-700 hover:bg-green-200',
    review_rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
    review_pending: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    no_kpi: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: string): React.ReactNode => {
  switch (category) {
    case 'pending':
    case 'review_pending':
      return <FiClock className="inline mr-2" />;
    case 'acknowledged_review_pending':
    case 'self_rating_submitted':
      return <FiFileText className="inline mr-2" />;
    case 'manager_initiate_review':
      return <FiTarget className="inline mr-2" />;
    case 'awaiting_employee_confirmation':
      return <FiBell className="inline mr-2" />;
    case 'review_completed':
      return <FiCheckCircle className="inline mr-2" />;
    case 'review_rejected':
      return <FiEdit className="inline mr-2" />;
    case 'no_kpi':
      return <FiUsers className="inline mr-2" />;
    default:
      return null;
  }
};

/**
 * Get period label
 */
export const getPeriodLabel = (setting: PeriodSetting): string => {
  if (setting.period_type === 'quarterly') {
    return `${setting.quarter} ${setting.year}`;
  }
  return `${setting.year}`;
};

/**
 * Get period value
 */
export const getPeriodValue = (setting: PeriodSetting): string => {
  return `${setting.period_type}|${setting.quarter || ''}|${setting.year}`;
};
