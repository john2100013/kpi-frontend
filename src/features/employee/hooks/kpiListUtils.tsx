import React from 'react';
import { FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';
import { KPI, KPIReview } from '../../../types';

export interface KPIStageInfo {
  stage: string;
  color: string;
  icon: React.ReactNode;
}

export const getKPIStage = (kpi: KPI, reviews: KPIReview[], isSelfRatingEnabled: boolean = true): KPIStageInfo => {
  // Find review for this KPI
  const review = reviews.find(r => r.kpi_id === kpi.id);

  if (kpi.status === 'pending') {
    return {
      stage: 'KPI Setting - Awaiting Acknowledgement',
      color: 'bg-orange-100 text-orange-700',
      icon: <FiClock className="inline" />
    };
  }

  if (kpi.status === 'acknowledged' && !review) {
    // If self-rating is disabled, show Manager Will Initiate Review
    if (!isSelfRatingEnabled) {
      return {
        stage: 'Manager Will Initiate Review',
        color: 'bg-blue-100 text-blue-700',
        icon: <FiClock className="inline" />
      };
    }
    return {
      stage: 'KPI Acknowledged - Review Pending',
      color: 'bg-blue-100 text-blue-700',
      icon: <FiFileText className="inline" />
    };
  }

  if (review) {
      if (review.review_status === 'manager_submitted' || review.review_status === 'awaiting_employee_confirmation') {
      return {
        stage: 'Awaiting Your Confirmation',
        color: 'bg-indigo-100 text-indigo-700',
        icon: <FiClock className="inline" />
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
        icon: <FiFileText className="inline" />
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

export interface KPIActionInfo {
  label: string | null;
  onClick: (() => void) | null;
}

export const getPrimaryAction = (
  kpi: KPI,
  review: KPIReview | undefined,
  navigate: (path: string) => void
): KPIActionInfo => {
  if (kpi.status === 'pending') {
    return {
      label: 'Acknowledge KPI',
      onClick: () => navigate(`/employee/kpi-acknowledgement/${kpi.id}`)
    };
  }

  if (review && (review.review_status === 'manager_submitted' || review.review_status === 'awaiting_employee_confirmation')) {
      return {
      label: 'Confirm',
      onClick: () => navigate(`/employee/kpi-confirmation/${review.id}`)
    };
  }

  if (kpi.status === 'acknowledged' && (!review || review.review_status === 'pending')) {
    return {
      label: 'Review KPI',
      onClick: () => navigate(`/employee/self-rating/${kpi.id}`)
    };
  }

  return {
    label: null,
    onClick: null
  };
};

export const canEditReview = (review: KPIReview | undefined): boolean => {
  if (!review) return false;
  return review.review_status === 'employee_submitted';
};