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
  [itemId: number]: string | number;
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
    });
    return { ratings, comments };
  }

  // FALLBACK: Parse from JSON (backward compatibility)
  try {
    const employeeData = JSON.parse(employeeComment || '{}');
    
    if (employeeData.items && Array.isArray(employeeData.items)) {
      employeeData.items.forEach((item: any) => {
        if (item.item_id) {
          const ratingValue = parseFloat(String(item.rating || 0));
          ratings[item.item_id] = ratingValue;
          comments[item.item_id] = String(item.comment || '');
        }
      });
    } else {
    }
  } catch (error) {
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
 * Excludes items marked with exclude_from_calculation = 1
 */
export const calculateAverageRating = (
  items: KPIItem[],
  ratingsMap: ItemRatingsMap,
  accomplishments?: any[]
): number => {
  if (!items || items.length === 0) return 0;
  
  // Filter out items excluded from calculation (exclude_from_calculation === 1)
  const includedItems = items.filter(item => !item.exclude_from_calculation || item.exclude_from_calculation === 0);
  const itemRatings = includedItems.map((item) => ratingsMap[item.id] || 0).filter(r => r > 0);
  
  // Include ratings from accomplishments if available
  // Use manager_rating if available, otherwise use employee_rating
  const accomplishmentRatings = accomplishments 
    ? accomplishments
        .filter(acc => {
          const rating = acc.manager_rating ?? acc.employee_rating;
          return rating !== null && rating !== undefined && rating > 0;
        })
        .map(acc => acc.manager_rating ?? acc.employee_rating)
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
 * Note: Items excluded from calculation (exclude_from_calculation === 1) still need to be rated
 */
export const validateAllItemsRated = (
  items: KPIItem[],
  managerRatings: ItemRatingsMap,
  qualitativeRatings: QualitativeRatingsMap
): { valid: boolean; missingItems: Array<{ item_id: number; title: string; type: 'qualitative' | 'quantitative'; value: any; parsed?: number | null }> } => {

  const missingItems: Array<{ item_id: number; title: string; type: 'qualitative' | 'quantitative'; value: any; parsed?: number | null }> = [];

  const allValid = items.every((item) => {
    // Validate qualitative items (still required even if excluded from calculation)
    if (item.is_qualitative) {
      const qualRating = qualitativeRatings[item.id];
      const hasValue = qualRating !== undefined && qualRating !== null && String(qualRating).trim().length > 0;
      if (!hasValue) {
        missingItems.push({ item_id: item.id, title: item.title || '', type: 'qualitative', value: qualRating ?? null, parsed: null });
        return false;
      }
      return true;
    }

    // Validate quantitative items - accept any numeric rating > 0 (still required even if excluded from calculation)
    const rating = managerRatings[item.id];
    const ratingNum = !isNaN(parseFloat(String(rating))) ? parseFloat(String(rating)) : NaN;
    const isValid = rating !== undefined && rating !== null && !isNaN(ratingNum) && ratingNum > 0;
    if (!isValid) {
      missingItems.push({ item_id: item.id, title: item.title || '', type: 'quantitative', value: rating ?? null, parsed: isNaN(ratingNum) ? null : ratingNum });
      return false;
    }
    return true;
  });

  if (!allValid) {
  }

  return { valid: allValid, missingItems };
};

/**
 * Build item data JSON for submission
 */
export const buildItemDataJSON = (
  items: KPIItem[],
  managerRatings: ItemRatingsMap,
  managerComments: ItemCommentsMap,
  actualValues?: Record<number, string>,
  targetValues?: Record<number, string>,
  goalWeights?: Record<number, string>,
  currentPerformanceStatuses?: Record<number, string>
): string => {
  const itemRatings = items.map((item) => managerRatings[item.id] || 0);
  const averageRating = itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;
  const roundedRating = roundToAllowedRating(averageRating);

  const itemData = {
    items: items.map((item) => {
      const actualValue = actualValues ? actualValues[item.id] : '';
      const targetValue = targetValues ? (targetValues[item.id] || item.target_value) : item.target_value;
      const goalWeight = goalWeights ? (goalWeights[item.id] || item.goal_weight || item.measure_criteria) : (item.goal_weight || item.measure_criteria);
      const currentPerfStatus = currentPerformanceStatuses ? currentPerformanceStatuses[item.id] : '';
      
      // Calculate percentages for Actual vs Target method
      let percentageValueObtained = null;
      let managerRatingPercentage = null;
      
      if (actualValue && targetValue) {
        const actualNum = parseFloat(String(actualValue));
        const targetNum = parseFloat(String(targetValue));
        const goalWeightNum = goalWeight ? parseFloat(String(goalWeight).replace('%', '')) / 100 : 0;
        
        if (!isNaN(actualNum) && !isNaN(targetNum) && targetNum > 0 && !isNaN(goalWeightNum) && goalWeightNum > 0) {
          percentageValueObtained = (actualNum / targetNum) * 100;
          managerRatingPercentage = percentageValueObtained * goalWeightNum;
        }
      }
      
      return {
        item_id: item.id,
        rating: managerRatings[item.id] || 0,
        comment: managerComments[item.id] || '',
        actual_value: actualValue || '',
        target_value: targetValue || '',
        goal_weight: goalWeight || '',
        current_performance_status: currentPerfStatus || '',
        percentage_value_obtained: percentageValueObtained,
        manager_rating_percentage: managerRatingPercentage,
      };
    }),
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
): Array<{ item_id: number; rating: string | number; comment: string }> => {
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
