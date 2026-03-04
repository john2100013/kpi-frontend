/**
 * HR Utility Functions
 * 
 * Helper functions for HR feature
 */

import { KPI, KPIReview } from '../../../types';
import { FiClock, FiFileText, FiBell, FiCheckCircle, FiEye, FiUsers } from 'react-icons/fi';
import React from 'react';

/**
 * Get KPI stage information
 */
export const getKPIStage = (
  kpi: KPI,
  reviews: KPIReview[]
): { stage: string; color: string; icon: React.ReactNode } => {
  // Find ANY review (including drafts) for status checking
  const review = reviews.find(r => r.kpi_id === kpi.id);
  
  // Find SUBMITTED review (excluding drafts) for "Review Pending" check
  const submittedReview = reviews.find(r => r.kpi_id === kpi.id && r.is_draft !== true);

  if (kpi.status === 'pending') {
    return {
      stage: 'KPI Setting - Awaiting Acknowledgement',
      color: 'bg-orange-100 text-orange-700',
      icon: React.createElement(FiClock, { className: 'inline' })
    };
  }

  // Check for SUBMITTED review, not drafts
  if (kpi.status === 'acknowledged' && !submittedReview) {
    return {
      stage: 'KPI Acknowledged - Review Pending',
      color: 'bg-blue-100 text-blue-700',
      icon: React.createElement(FiFileText, { className: 'inline' })
    };
  }

  if (review) {
    if (review.review_status === 'employee_submitted') {
      return {
        stage: 'Self-Rating Submitted - Awaiting Manager Review',
        color: 'bg-yellow-100 text-yellow-700',
        icon: React.createElement(FiClock, { className: 'inline' })
      };
    }

    if (review.review_status === 'manager_submitted' || review.review_status === 'completed') {
      return {
        stage: 'KPI Review Completed',
        color: 'bg-green-100 text-green-700',
        icon: React.createElement(FiCheckCircle, { className: 'inline' })
      };
    }

    if (review.review_status === 'pending') {
      return {
        stage: 'KPI Review - Self-Rating Required',
        color: 'bg-purple-100 text-purple-700',
        icon: React.createElement(FiFileText, { className: 'inline' })
      };
    }
  }

  return {
    stage: 'In Progress',
    color: 'bg-gray-100 text-gray-700',
    icon: React.createElement(FiClock, { className: 'inline' })
  };
};

/**
 * Get category label
 */
export const getCategoryLabel = (category: string): string => {
  const labels: { [key: string]: string } = {
    pending: 'KPI Setting - Awaiting Acknowledgement',
    acknowledged_review_pending: 'KPI Acknowledged - Review Pending',
    self_rating_submitted: 'Self-Rating Submitted - Awaiting Manager Review',
    awaiting_employee_confirmation: 'Awaiting Employee Confirmation',
    review_completed: 'KPI Review Completed',
    review_rejected: 'Review Rejected by Employee',
    review_pending: 'KPI Review - Self-Rating Required',
    no_kpi: 'No KPI Assigned',
    rejection_resolved: 'Resolved Issues',
  };
  return labels[category] || category;
};

/**
 * Get category color classes
 */
export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    pending: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    acknowledged_review_pending: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    self_rating_submitted: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    awaiting_employee_confirmation: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    review_completed: 'bg-green-100 text-green-700 hover:bg-green-200',
    review_rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
    review_pending: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    no_kpi: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    rejection_resolved: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
};

/**
 * Get category icon component
 */
export const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: any } = {
    pending: FiClock,
    review_pending: FiClock,
    acknowledged_review_pending: FiFileText,
    self_rating_submitted: FiFileText,
    awaiting_employee_confirmation: FiBell,
    review_completed: FiCheckCircle,
    review_rejected: FiEye,
    no_kpi: FiUsers,
    rejection_resolved: FiCheckCircle,
  };
  
  const IconComponent = iconMap[category];
  return IconComponent ? React.createElement(IconComponent, { className: 'inline mr-2' }) : null;
};

/**
 * Get period label from period setting
 */
export const getPeriodLabel = (setting: { 
  period_type: string; 
  quarter: string | null; 
  year: number 
}): string => {
  if (setting.period_type === 'quarterly') {
    return `${setting.quarter} ${setting.year}`;
  }
  return `${setting.year}`;
};

/**
 * Get period value for filtering
 */
export const getPeriodValue = (setting: { 
  period_type: string; 
  quarter: string | null; 
  year: number 
}): string => {
  return `${setting.period_type}|${setting.quarter || ''}|${setting.year}`;
};
