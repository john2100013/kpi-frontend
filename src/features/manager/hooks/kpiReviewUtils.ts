/**
 * KPI Review Utilities
 * 
 * Utility functions for KPI Review form parsing, validation, and calculations.
 */

import type { KPIItem } from '../../../types';

export interface ItemRatingsMap {
  [itemId: number]: number;
}

export interface ItemCommentsMap {
  [itemId: number]: string;
}

export interface QualitativeRatingsMap {
  [itemId: number]: string;
}

export interface ReviewDraftData {
  managerRatings: ItemRatingsMap;
  managerComments: ItemCommentsMap;
  qualitativeRatings: QualitativeRatingsMap;
  qualitativeComments: ItemCommentsMap;
  overallComment: string;
  managerSignature: string;
  reviewDate: string;
  majorAccomplishmentsManagerComment: string;
  disappointmentsManagerComment: string;
  improvementNeededManagerComment: string;
}

/**
 * Parse employee ratings/comments from review JSON or structured data
 */
export const parseEmployeeData = (employeeComment: string, itemRatings?: any): {
  ratings: ItemRatingsMap;
  comments: ItemCommentsMap;
} => {
  const ratings: ItemRatingsMap = {};
  const comments: ItemCommentsMap = {};

  // NEW: First try to use structured item_ratings if available
  if (itemRatings?.employee) {
    Object.entries(itemRatings.employee).forEach(([itemId, ratingData]: [string, any]) => {
      const id = parseInt(itemId);
      const ratingValue = parseFloat(ratingData.rating);
      ratings[id] = ratingValue;
      comments[id] = String(ratingData.comment || '');
      console.log(`📊 [KPIReview Utils] Structured - Item ${id} - Rating: ${ratingValue}`);
    });
    return { ratings, comments };
  }

  // FALLBACK: Parse from JSON (backward compatibility)
  try {
    const employeeData = JSON.parse(employeeComment || '{}');
    console.log('📋 [KPIReview Utils] Parsed employee data:', employeeData);
    
    if (employeeData.items && Array.isArray(employeeData.items)) {
      employeeData.items.forEach((item: any) => {
        if (item.item_id) {
          const ratingValue = parseFloat(String(item.rating || 0));
          console.log(`📊 [KPIReview Utils] Item ${item.item_id} - Rating: ${item.rating}, Parsed: ${ratingValue}`);
          ratings[item.item_id] = ratingValue;
          comments[item.item_id] = String(item.comment || '');
        }
      });
    } else {
      console.warn('⚠️ [KPIReview Utils] Employee data.items is not an array:', employeeData);
    }
  } catch (error) {
    console.error('❌ [KPIReview Utils] Error parsing employee data:', error);
    // If parsing fails and we have KPI items, return empty maps
  }

  return { ratings, comments };
};

/**
 * Parse manager ratings/comments from review JSON or structured data
 */
export const parseManagerData = (managerComment: string, itemRatings?: any): {
  ratings: ItemRatingsMap;
  comments: ItemCommentsMap;
} => {
  const ratings: ItemRatingsMap = {};
  const comments: ItemCommentsMap = {};

  // NEW: First try to use structured item_ratings if available
  if (itemRatings?.manager) {
    Object.entries(itemRatings.manager).forEach(([itemId, ratingData]: [string, any]) => {
      const id = parseInt(itemId);
      ratings[id] = parseFloat(ratingData.rating) || 0;
      comments[id] = ratingData.comment || '';
    });
    return { ratings, comments };
  }

  // FALLBACK: Parse from JSON (backward compatibility)
  try {
    const managerData = JSON.parse(managerComment || '{}');
    if (managerData.items && Array.isArray(managerData.items)) {
      managerData.items.forEach((item: any) => {
        if (item.item_id) {
          ratings[item.item_id] = item.rating || 0;
          comments[item.item_id] = item.comment || '';
        }
      });
    }
  } catch (error) {
    // If not JSON, return empty maps
    console.error('Error parsing manager data:', error);
  }

  return { ratings, comments };
};

/**
 * Initialize rating/comment maps for KPI items
 */
export const initializeItemMaps = (items: KPIItem[]): {
  ratings: ItemRatingsMap;
  comments: ItemCommentsMap;
} => {
  const ratings: ItemRatingsMap = {};
  const comments: ItemCommentsMap = {};
  
  items.forEach((item) => {
    ratings[item.id] = 0;
    comments[item.id] = '';
  });
  
  return { ratings, comments };
};

/**
 * Get rating label for numeric rating
 */
export const getRatingLabel = (rating: number): string => {
  if (rating === 1.00) return 'Below Expectation';
  if (rating === 1.25) return 'Meets Expectation';
  if (rating === 1.50) return 'Exceeds Expectation';
  return `${rating}`;
};

/**
 * Calculate average rating from item ratings and accomplishments
 */
export const calculateAverageRating = (
  items: KPIItem[],
  ratingsMap: ItemRatingsMap,
  accomplishments?: any[]
): number => {
  if (!items || items.length === 0) return 0;
  const itemRatings = items.map((item) => ratingsMap[item.id] || 0).filter(r => r > 0);
  
  // Include manager ratings from accomplishments if available
  const accomplishmentRatings = accomplishments 
    ? accomplishments
        .filter(acc => acc.manager_rating !== null && acc.manager_rating !== undefined && acc.manager_rating > 0)
        .map(acc => acc.manager_rating)
    : [];
  
  const allRatings = [...itemRatings, ...accomplishmentRatings];
  if (allRatings.length === 0) return 0;
  return allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
};

/**
 * Round rating to nearest allowed value (1.00, 1.25, or 1.50)
 */
export const roundToAllowedRating = (averageRating: number): number => {
  const allowedRatings = [1.00, 1.25, 1.50];
  return allowedRatings.reduce((prev, curr) => 
    Math.abs(curr - averageRating) < Math.abs(prev - averageRating) ? curr : prev
  );
};

/**
 * Validate all KPI items are rated
 */
export const validateAllItemsRated = (
  items: KPIItem[],
  managerRatings: ItemRatingsMap,
  qualitativeRatings: QualitativeRatingsMap
): boolean => {
  return items.every((item) => {
    // Skip validation for qualitative items
    if (item.is_qualitative) {
      const qualRating = qualitativeRatings[item.id];
      return qualRating && (qualRating === 'exceeds' || qualRating === 'meets' || qualRating === 'needs_improvement');
    }
    // Validate quantitative items
    const rating = managerRatings[item.id];
    return rating !== undefined && rating !== null && (rating === 0.00 || rating === 1.00 || rating === 1.25 || rating === 1.50);
  });
};

/**
 * Build item data JSON for submission
 */
export const buildItemDataJSON = (
  items: KPIItem[],
  managerRatings: ItemRatingsMap,
  managerComments: ItemCommentsMap,
  actualValues?: Record<number, string>
): string => {
  const itemRatings = items.map((item) => managerRatings[item.id] || 0);
  const averageRating = itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;
  const roundedRating = roundToAllowedRating(averageRating);

  const itemData = {
    items: items.map((item) => ({
      item_id: item.id,
      rating: managerRatings[item.id] || 0,
      comment: managerComments[item.id] || '',
      actual_value: actualValues ? (actualValues[item.id] || '') : '',
    })),
    average_rating: averageRating,
    rounded_rating: roundedRating,
  };

  return JSON.stringify(itemData);
};

/**
 * Build qualitative ratings array for submission
 */
export const buildQualitativeRatingsArray = (
  items: KPIItem[],
  qualitativeRatings: QualitativeRatingsMap,
  qualitativeComments: ItemCommentsMap
): Array<{ item_id: number; rating: string; comment: string }> => {
  return items
    .filter(item => item.is_qualitative)
    .map(item => ({
      item_id: item.id,
      rating: qualitativeRatings[item.id] || '',
      comment: qualitativeComments[item.id] || ''
    }));
};

/**
 * Draft management - get draft key
 */
export const getReviewDraftKey = (reviewId: string): string => {
  return `kpi-review-draft-${reviewId}`;
};

/**
 * Save review draft to localStorage
 */
export const saveReviewDraft = (reviewId: string, draftData: ReviewDraftData): void => {
  const draftKey = getReviewDraftKey(reviewId);
  localStorage.setItem(draftKey, JSON.stringify(draftData));
};

/**
 * Load review draft from localStorage
 */
export const loadReviewDraft = (reviewId: string): Partial<ReviewDraftData> | null => {
  try {
    const draftKey = getReviewDraftKey(reviewId);
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) return null;
    return JSON.parse(savedDraft);
  } catch (error) {
    console.error('Error loading review draft:', error);
    return null;
  }
};

/**
 * Clear review draft from localStorage
 */
export const clearReviewDraft = (reviewId: string): void => {
  const draftKey = getReviewDraftKey(reviewId);
  localStorage.removeItem(draftKey);
};
