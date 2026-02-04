import { KPI, KPIReview } from '../../../types';
import { ItemRatings, ItemComments, SelfRatingDraft } from '../types';

export const getRatingLabel = (rating: number): string => {
  if (rating >= 1.4) return 'Exceeds Expectation';
  if (rating >= 1.15) return 'Meets Expectation';
  if (rating > 0) return 'Below Expectation';
  return 'Not Rated';
};

export const calculateAverageRating = (ratings: ItemRatings, kpi: KPI | null): number => {
  if (!kpi) return 0;
  
  const items = kpi.items || [];
  if (items.length === 0) {
    return ratings[0] || 0;
  }

  const nonQualitativeItems = items.filter(item => !item.is_qualitative);
  if (nonQualitativeItems.length === 0) return 0;

  const total = nonQualitativeItems.reduce((sum, item) => sum + (ratings[item.id] || 0), 0);
  return total / nonQualitativeItems.length;
};

export const calculateCompletion = (ratings: ItemRatings, kpi: KPI | null): number => {
  if (!kpi) return 0;
  
  const items = kpi.items || [];
  if (items.length === 0) {
    return ratings[0] > 0 ? 100 : 0;
  }

  const nonQualitativeItems = items.filter(item => !item.is_qualitative);
  if (nonQualitativeItems.length === 0) return 100;

  const completed = nonQualitativeItems.filter(item => (ratings[item.id] || 0) > 0).length;
  return Math.round((completed / nonQualitativeItems.length) * 100);
};

export const roundToAllowedRating = (value: number): number => {
  const allowed = [1.0, 1.25, 1.5];
  return allowed.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
};

export const saveDraftToLocalStorage = (kpiId: number, draft: SelfRatingDraft): void => {
  try {
    localStorage.setItem(`kpi_draft_${kpiId}`, JSON.stringify(draft));
  } catch (error) {
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.error('Could not save draft. Please try again.');
    }
  }
};

export const loadDraftFromLocalStorage = (kpiId: number): SelfRatingDraft | null => {
  try {
    const draft = localStorage.getItem(`kpi_draft_${kpiId}`);
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    return null;
  }
};

export const clearDraftFromLocalStorage = (kpiId: number): void => {
  try {
    localStorage.removeItem(`kpi_draft_${kpiId}`);
  } catch (error) {
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.error('Could not clear draft. Please try again.');
    }
  }
};

export const parseExistingReviewData = (review: KPIReview) => {
  const result = {
    ratings: {} as ItemRatings,
    comments: {} as ItemComments,
    majorAccomplishments: '',
    disappointments: '',
  };

  try {
    // NEW: First try to use structured item_ratings if available
    if (review.item_ratings?.employee) {
      Object.entries(review.item_ratings.employee).forEach(([itemId, ratingData]: [string, any]) => {
        const id = parseInt(itemId);
        result.ratings[id] = parseFloat(ratingData.rating) || 0;
        result.comments[id] = ratingData.comment || '';
      });
      
      // Get major_accomplishments and disappointments from review level
      result.majorAccomplishments = review.major_accomplishments || '';
      result.disappointments = review.disappointments || '';
      
      return result;
    }

    // FALLBACK: Parse from JSON (backward compatibility)
    const commentData = JSON.parse(review.employee_comment || '{}');
    
    if (commentData.items && Array.isArray(commentData.items)) {
      commentData.items.forEach((item: any) => {
        if (item.item_id) {
          result.ratings[item.item_id] = item.rating || 0;
          result.comments[item.item_id] = item.comment || '';
        }
      });
    }

    result.majorAccomplishments = commentData.major_accomplishments || review.major_accomplishments || '';
    result.disappointments = commentData.disappointments || review.disappointments || '';
  } catch (error) {
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.error('Could not load review data. Please try again.');
    }
  }

  return result;
};

export const validateSelfRating = (
  ratings: ItemRatings,
  signature: string,
  reviewDate: Date | null, // Changed from string
  kpi: KPI
): { valid: boolean; error?: string } => {
  if (!signature) {
    return { valid: false, error: 'Please provide your signature' };
  }

  if (!reviewDate) {
    return { valid: false, error: 'Please provide the review date' };
  }

  const items = kpi.items || [];
  const nonQualitativeItems = items.filter(item => !item.is_qualitative);

  if (nonQualitativeItems.length > 0) {
    const allRated = nonQualitativeItems.every(item => (ratings[item.id] || 0) > 0);
    if (!allRated) {
      return { valid: false, error: 'Please provide ratings for all non-qualitative KPI items' };
    }
  } else if (items.length === 0) {
    if (!ratings[0] || ratings[0] === 0) {
      return { valid: false, error: 'Please provide a rating' };
    }
  }

  return { valid: true };
};

export const prepareSelfRatingSubmission = (
  ratings: ItemRatings,
  comments: ItemComments,
  signature: string,
  reviewDate: Date | null, // Changed from string
  majorAccomplishments: string,
  disappointments: string,
  kpi: KPI
) => {
  const items = kpi.items || [];

  // Convert Date to string for API
  const reviewPeriod = reviewDate ? reviewDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  if (items.length > 0) {
    const itemsData = items.map(item => ({
      item_id: item.id,
      rating: ratings[item.id] || 0,
      comment: comments[item.id] || '',
    }));

    const averageRating = calculateAverageRating(ratings, kpi);

    return {
      employee_rating: averageRating,
      employee_comment: JSON.stringify({
        items: itemsData,
        major_accomplishments: majorAccomplishments,
        disappointments: disappointments,
      }),
      employee_signature: signature,
      review_period: reviewPeriod, // Send as string to backend
      review_quarter: kpi.quarter,
      review_year: kpi.year,
      major_accomplishments: majorAccomplishments,
      disappointments: disappointments,
    };
  } else {
    return {
      employee_rating: ratings[0] || 0,
      employee_comment: comments[0] || '',
      employee_signature: signature,
      review_period: reviewPeriod, // Send as string to backend
      review_quarter: kpi.quarter,
      review_year: kpi.year,
      major_accomplishments: majorAccomplishments,
      disappointments: disappointments,
    };
  }
};