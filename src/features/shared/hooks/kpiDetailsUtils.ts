/**
 * KPI Details Utility Functions
 */

import { KPI, KPIReview } from '../../../types';

export interface ItemRatings {
  [key: number]: number;
}

export interface ItemComments {
  [key: number]: string;
}

export interface ParsedReviewData {
  employeeItemRatings: ItemRatings;
  employeeItemComments: ItemComments;
  managerItemRatings: ItemRatings;
  managerItemComments: ItemComments;
}

/**
 * Parse review data to extract item ratings and comments
 * UPDATED: Now uses structured item_ratings data (same as KPIConfirmation)
 */
export const parseReviewData = (review: KPIReview | null): ParsedReviewData => {
  const employeeItemRatings: ItemRatings = {};
  const employeeItemComments: ItemComments = {};
  const managerItemRatings: ItemRatings = {};
  const managerItemComments: ItemComments = {};

  if (!review) {

    return { employeeItemRatings, employeeItemComments, managerItemRatings, managerItemComments };
  }

 

  // PRIORITY 1: Use structured `item_ratings` data (same as KPIConfirmation.tsx)
  if ((review as any).item_ratings) {
    
    // Parse employee ratings from structured data
    if ((review as any).item_ratings.employee) {
      Object.entries((review as any).item_ratings.employee).forEach(([itemId, ratingData]: [string, any]) => {
        const id = parseInt(itemId);
        employeeItemRatings[id] = parseFloat(String(ratingData.rating)) || 0;
        employeeItemComments[id] = ratingData.comment || '';
      });
    }

    // Parse manager ratings from structured data
    if ((review as any).item_ratings.manager) {
      Object.entries((review as any).item_ratings.manager).forEach(([itemId, ratingData]: [string, any]) => {
        const id = parseInt(itemId);
        managerItemRatings[id] = parseFloat(String(ratingData.rating)) || 0;
        managerItemComments[id] = ratingData.comment || '';
      });
    }

    

    return { employeeItemRatings, employeeItemComments, managerItemRatings, managerItemComments };
  }

  // FALLBACK: Try legacy JSON format in comment fields

  // Parse employee ratings/comments from JSON in comment field
  try {
    const empData = JSON.parse(review.employee_comment || '{}');
    if (empData.items && Array.isArray(empData.items)) {
      empData.items.forEach((item: any) => {
        if (item.item_id) {
          employeeItemRatings[item.item_id] = item.rating || 0;
          employeeItemComments[item.item_id] = item.comment || '';
        }
      });
    }
  } catch (error) {

  }

  // Parse manager ratings/comments from JSON in comment field
  try {
    const mgrData = JSON.parse(review.manager_comment || '{}');
    if (mgrData.items && Array.isArray(mgrData.items)) {
      mgrData.items.forEach((item: any) => {
        if (item.item_id) {
          managerItemRatings[item.item_id] = item.rating || 0;
          managerItemComments[item.item_id] = item.comment || '';
        }
      });

    }
  } catch (error) {

  }

 
  return { employeeItemRatings, employeeItemComments, managerItemRatings, managerItemComments };
};

/**
 * Format rating value with validation
 */
export const formatRating = (rating: number | string): string => {
  const num = typeof rating === 'number' ? rating : parseFloat(String(rating || '0'));
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

/**
 * Get rating expectation label
 */
export const getRatingLabel = (rating: number | string): string | null => {
  const num = typeof rating === 'number' ? rating : parseFloat(String(rating || '0'));
  if (isNaN(num) || num === 0) return null;
  
  if (num === 1.00) return 'Below';
  if (num === 1.25) return 'Meets';
  if (num === 1.50) return 'Exceeds';
  return '';
};

/**
 * Extract comment text from review (handles both JSON and plain text)
 */
export const extractCommentText = (comment: string | null | undefined): string => {
  if (!comment) return '';
  
  try {
    const parsed = JSON.parse(comment);
    if (parsed.items) {
      return parsed.items.map((i: any) => i.comment).filter(Boolean).join('\n\n');
    }
    return comment;
  } catch {
    return comment;
  }
};

/**
 * Filter KPI items to ensure they belong to the specific KPI
 */
export const filterKPIItems = (kpi: KPI | null, kpiId: number): KPI | null => {
  if (!kpi) return null;
  
  const filteredKPI = { ...kpi };
  
  if (filteredKPI.items && Array.isArray(filteredKPI.items)) {
    filteredKPI.items = filteredKPI.items.filter((item: any) => {
      return item.kpi_id === kpiId || !item.kpi_id;
    });
  }
  
  return filteredKPI;
};
