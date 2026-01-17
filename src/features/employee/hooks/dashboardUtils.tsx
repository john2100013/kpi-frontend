import React from 'react';
import { FiClock, FiFileText, FiBell, FiCheckCircle, FiEdit } from 'react-icons/fi';
import { KPI, KPIReview } from '../../../types';

export interface DashboardStageInfo {
  stage: string;
  color: string;
  icon: React.ReactNode;
}

export const getDashboardKPIStage = (kpi: KPI, reviews: KPIReview[]): DashboardStageInfo => {
  const review = reviews.find(r => r.kpi_id === kpi.id);

  // Backend may send either 'status' or 'review_status' field
  const reviewStatus = (review as any)?.status || review?.review_status;

  console.log(`🎯 [getDashboardKPIStage] KPI ${kpi.id} (${kpi.title}):`, {
    kpi_status: kpi.status,
    has_review: !!review,
    review_id: review?.id,
    review_status_field: review?.review_status,
    status_field: (review as any)?.status,
    resolved_status: reviewStatus
  });

  if (kpi.status === 'pending') {
    return {
      stage: 'KPI Setting - Awaiting Acknowledgement',
      color: 'bg-orange-100 text-orange-700',
      icon: <FiClock className="inline" />
    };
  }

  if (kpi.status === 'acknowledged' && !review) {
    return {
      stage: 'KPI Acknowledged - Review Pending',
      color: 'bg-blue-100 text-blue-700',
      icon: <FiFileText className="inline" />
    };
  }

  if (review) {
    console.log(`🔍 [getDashboardKPIStage] KPI ${kpi.id} has review:`, {
      review_id: review.id,
      reviewStatus,
      reviewStatus_type: typeof reviewStatus,
      reviewStatus_raw: JSON.stringify(reviewStatus),
      is_manager_submitted: reviewStatus === 'manager_submitted',
      is_awaiting_confirmation: reviewStatus === 'awaiting_employee_confirmation',
      condition_check: (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation')
    });

    if (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation') {
      console.log(`✅ [getDashboardKPIStage] KPI ${kpi.id} matched 'Awaiting Your Confirmation'`);
      return {
        stage: 'Awaiting Your Confirmation',
        color: 'bg-indigo-100 text-indigo-700',
        icon: <FiBell className="inline" />
      };
    }

    if (reviewStatus === 'employee_submitted') {
      return {
        stage: 'Self-Rating Submitted - Awaiting Manager Review',
        color: 'bg-yellow-100 text-yellow-700',
        icon: <FiClock className="inline" />
      };
    }

    if (reviewStatus === 'completed') {
      return {
        stage: 'KPI Review Completed',
        color: 'bg-green-100 text-green-700',
        icon: <FiCheckCircle className="inline" />
      };
    }

    if (reviewStatus === 'rejected') {
      return {
        stage: 'Review Rejected',
        color: 'bg-red-100 text-red-700',
        icon: <FiEdit className="inline" />
      };
    }

    if (reviewStatus === 'pending') {
      return {
        stage: 'KPI Review - Self-Rating Required',
        color: 'bg-purple-100 text-purple-700',
        icon: <FiFileText className="inline" />
      };
    }
  }

  console.log(`⚠️ [getDashboardKPIStage] KPI ${kpi.id} falling through to 'In Progress' - status not matched:`, {
    reviewStatus: reviewStatus,
    reviewStatusValue: JSON.stringify(reviewStatus)
  });

  return {
    stage: 'In Progress',
    color: 'bg-gray-100 text-gray-700',
    icon: <FiClock className="inline" />
  };
};

export interface DashboardStats {
  totalKpis: number;
  reviewCompleted: number;
  settingCompleted: number;
  awaitingAcknowledgement: number;
  reviewPending: number;
  selfRatingRequired: number;
  awaitingManagerReview: number;
  awaitingConfirmation: number;
  completed: number;
  rejected: number;
}

export const calculateDashboardStats = (kpis: KPI[], reviews: KPIReview[]): DashboardStats => {
  console.log('📊 [calculateDashboardStats] Calculating stats with:', {
    totalKPIs: kpis.length,
    totalReviews: reviews.length,
    kpiStatuses: kpis.map(k => ({ id: k.id, status: k.status, title: k.title }))
  });

  const awaitingAcknowledgement = kpis.filter(k => k.status === 'pending');
  const reviewPending = kpis.filter(k => {
    const review = reviews.find(r => r.kpi_id === k.id);
    return k.status === 'acknowledged' && !review;
  });
  const selfRatingRequired = kpis.filter(k => {
    const review = reviews.find(r => r.kpi_id === k.id);
    const reviewStatus = (review as any)?.status || review?.review_status;
    return review && reviewStatus === 'pending';
  });
  const awaitingManagerReview = kpis.filter(k => {
    const review = reviews.find(r => r.kpi_id === k.id);
    const reviewStatus = (review as any)?.status || review?.review_status;
    return review && reviewStatus === 'employee_submitted';
  });
  const awaitingConfirmation = kpis.filter(k => {
    const review = reviews.find(r => r.kpi_id === k.id);
    const reviewStatus = (review as any)?.status || review?.review_status;
    console.log(`🔎 [awaitingConfirmation Filter] KPI ${k.id}:`, {
      kpi_title: k.title,
      has_review: !!review,
      review_id: review?.id,
      reviewStatus,
      reviewStatus_type: typeof reviewStatus,
      is_manager_submitted: reviewStatus === 'manager_submitted',
      is_awaiting_confirmation: reviewStatus === 'awaiting_employee_confirmation',
      passes_filter: review && (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation')
    });
    return review && (reviewStatus === 'manager_submitted' || reviewStatus === 'awaiting_employee_confirmation');
  });
  const completed = kpis.filter(k => {
    const review = reviews.find(r => r.kpi_id === k.id);
    const reviewStatus = (review as any)?.status || review?.review_status;
    return review && reviewStatus === 'completed';
  });
  const rejected = kpis.filter(k => {
    const review = reviews.find(r => r.kpi_id === k.id);
    const reviewStatus = (review as any)?.status || review?.review_status;
    return review && reviewStatus === 'rejected';
  });

  console.log('📈 [calculateDashboardStats] Stats breakdown:', {
    awaitingAcknowledgement: awaitingAcknowledgement.length,
    awaitingAcknowledgementKPIs: awaitingAcknowledgement.map(k => ({ id: k.id, status: k.status, title: k.title })),
    reviewPending: reviewPending.length,
    selfRatingRequired: selfRatingRequired.length,
    awaitingManagerReview: awaitingManagerReview.length,
    awaitingConfirmation: awaitingConfirmation.length,
    completed: completed.length,
    rejected: rejected.length
  });

  return {
    totalKpis: kpis.length,
    reviewCompleted: kpis.filter(k => {
      const review = reviews.find(r => r.kpi_id === k.id);
      const reviewStatus = (review as any)?.status || review?.review_status;
      return review && (reviewStatus === 'manager_submitted' || reviewStatus === 'completed');
    }).length,
    settingCompleted: kpis.filter(k => k.status === 'acknowledged').length,
    awaitingAcknowledgement: awaitingAcknowledgement.length,
    reviewPending: reviewPending.length,
    selfRatingRequired: selfRatingRequired.length,
    awaitingManagerReview: awaitingManagerReview.length,
    awaitingConfirmation: awaitingConfirmation.length,
    completed: completed.length,
    rejected: rejected.length,
  };
};

export const getUniquePeriods = (kpis: KPI[]): string[] => {
  return Array.from(new Set(kpis.map(kpi => `${kpi.quarter} ${kpi.year}`))).sort();
};

export const filterKpis = (
  kpis: KPI[],
  reviews: KPIReview[],
  searchTerm: string,
  selectedPeriod: string,
  selectedStatus: string
): KPI[] => {
  return kpis.filter(kpi => {
    const matchesSearch = searchTerm === '' || 
      kpi.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = selectedPeriod === '' || 
      `${kpi.quarter} ${kpi.year}` === selectedPeriod;
    
    const stageInfo = getDashboardKPIStage(kpi, reviews);
    const matchesStatus = selectedStatus === '' || 
      stageInfo.stage.toLowerCase().includes(selectedStatus.toLowerCase());

    return matchesSearch && matchesPeriod && matchesStatus;
  });
};

export const scrollToTable = () => {
  document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};