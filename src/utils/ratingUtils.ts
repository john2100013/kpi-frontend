/**
 * Rating Utilities for Frontend
 * Helper functions for rating calculations and rounding
 */

export interface RatingOption {
  rating_value: number;
  label: string;
  rating_type: string;
}

/**
 * Round a rating value to the nearest company rating option
 * @param rating - The calculated average rating
 * @param ratingOptions - Array of company rating option objects or values
 * @returns The rounded rating
 */
export const roundToNearestRatingOption = (
  rating: number,
  ratingOptions: RatingOption[] | number[]
): number => {
  if (!rating || isNaN(rating) || !ratingOptions || ratingOptions.length === 0) {
    return 0;
  }

  // Extract numeric values from rating options
  const options = ratingOptions
    .map(opt => typeof opt === 'number' ? opt : parseFloat(String(opt.rating_value)))
    .filter(opt => !isNaN(opt))
    .sort((a, b) => a - b);

  if (options.length === 0) {
    return 0;
  }

  // Find the nearest rating option
  let nearest = options[0];
  let minDiff = Math.abs(rating - nearest);

  for (const option of options) {
    const diff = Math.abs(rating - option);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = option;
    }
  }

  return nearest;
};

/**
 * Get rating label based on value
 */
export const getRatingLabel = (rating: number): string => {
  if (rating >= 1.4) return 'Exceeds Expectation';
  if (rating >= 1.15) return 'Meets Expectation';
  if (rating > 0) return 'Below Expectation';
  return 'Not Rated';
};

/**
 * Get rating color classes based on value
 */
export const getRatingColor = (rating: number): { label: string; color: string } => {
  if (rating >= 1.4) return { label: 'Exceeds Expectation', color: 'text-green-700 bg-green-100' };
  if (rating >= 1.15) return { label: 'Meets Expectation', color: 'text-blue-700 bg-blue-100' };
  return { label: 'Below Expectation', color: 'text-orange-700 bg-orange-100' };
};

/**
 * Format rating for display
 */
export const formatRating = (rating: number): string => {
  return rating > 0 ? rating.toFixed(2) : '0.00';
};
