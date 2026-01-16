import { KPI } from '../../../types';
import { KPIReviewConfirmation } from '../types';

export interface ParsedItemRatings {
  employeeItemRatings: { [key: number]: number };
  employeeItemComments: { [key: number]: string };
  managerItemRatings: { [key: number]: number };
  managerItemComments: { [key: number]: string };
}

export const parseItemRatingsFromReview = (review: KPIReviewConfirmation): ParsedItemRatings => {
  const result: ParsedItemRatings = {
    employeeItemRatings: {},
    employeeItemComments: {},
    managerItemRatings: {},
    managerItemComments: {},
  };

  // Only use structured `item_ratings` source. Do not fall back to legacy JSON fields.
  if (review.item_ratings) {
    // Parse employee ratings from structured data
    if (review.item_ratings.employee) {
      Object.entries(review.item_ratings.employee).forEach(([itemId, ratingData]: [string, any]) => {
        const id = parseInt(itemId);
        result.employeeItemRatings[id] = parseFloat(String(ratingData.rating)) || 0;
        result.employeeItemComments[id] = ratingData.comment || '';
      });
    }

    // Parse manager ratings from structured data
    if (review.item_ratings.manager) {
      Object.entries(review.item_ratings.manager).forEach(([itemId, ratingData]: [string, any]) => {
        const id = parseInt(itemId);
        result.managerItemRatings[id] = parseFloat(String(ratingData.rating)) || 0;
        result.managerItemComments[id] = ratingData.comment || '';
      });
    }
  } else {
    // No structured ratings present - return empty parsed result (consumer will show Not Rated)
    console.warn('⚠️ [parseItemRatingsFromReview] No structured item_ratings present on review id', review.id);
  }

  return result;
};

export interface RatingSummary {
  avgEmployeeRating: number;
  avgManagerRating: number;
  itemCount: number;
}

export const calculateRatingSummary = (
  review: KPIReviewConfirmation,
  kpi: KPI | null
): RatingSummary => {
  let totalEmployeeRating = 0;
  let totalManagerRating = 0;
  let itemCount = 0;

  if (kpi && kpi.items && kpi.items.length > 0) {
    const parsed = parseItemRatingsFromReview(review);

    kpi.items.forEach((item) => {
      totalEmployeeRating += parsed.employeeItemRatings[item.id] || 0;
      totalManagerRating += parsed.managerItemRatings[item.id] || 0;
    });
    itemCount = kpi.items.length;
  } else {
    // Legacy format
    totalEmployeeRating = review.employee_rating || 0;
    totalManagerRating = review.manager_rating || 0;
    itemCount = 1;
  }

  const avgEmployeeRating = itemCount > 0 ? totalEmployeeRating / itemCount : 0;
  const avgManagerRating = itemCount > 0 ? totalManagerRating / itemCount : 0;

  return { avgEmployeeRating, avgManagerRating, itemCount };
};

export const getRatingPercentage = (rating: number): string => {
  return ((rating * 100) / 1.5).toFixed(1);
};

export const getRatingDescription = (rating: number): string => {
  if (rating >= 1.4) return 'Exceeds Expectation';
  if (rating >= 1.15) return 'Meets Expectation';
  if (rating > 0) return 'Below Expectation';
  return 'Not Rated';
};

export const getItemRatingDescription = (rating: number): string => {
  if (rating === 1.0) return 'Below Expectation';
  if (rating === 1.25) return 'Meets Expectation';
  if (rating === 1.5) return 'Exceeds Expectation';
  if (rating === 0) return 'Not Rated';
  return 'Custom';
};

export const validateConfirmation = (
  action: 'approve' | 'reject' | null,
  rejectionNote: string,
  signature: string
): { valid: boolean; error?: string } => {
  if (!action) {
    return { valid: false, error: 'Please select whether to approve or reject this review' };
  }

  if (action === 'reject' && !rejectionNote.trim()) {
    return { valid: false, error: 'Please provide a reason for rejecting this review' };
  }

  if (action === 'approve' && !signature) {
    return { valid: false, error: 'Please provide your signature to approve this review' };
  }

  return { valid: true };
};