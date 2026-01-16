/**
 * KPI Final Rating Calculation Utility - Frontend
 * 
 * Centralized module for calculating final KPI ratings on the frontend.
 * Mirrors the backend calculation logic to provide real-time calculation feedback.
 * 
 * Supports multiple calculation methodologies:
 * 1. Normal Calculation: total_manager_rating / total_possible_rating * 100
 * 2. Goal Weight: Σ(rating * goal_weight)
 * 3. Actual vs Target Values: (actual_value / target_value * 100) * goal_weight
 */

export interface CompanyFeatures {
  use_goal_weight_yearly: boolean;
  use_goal_weight_quarterly: boolean;
  use_actual_values_yearly: boolean;
  use_actual_values_quarterly: boolean;
  use_normal_calculation: boolean;
  enable_employee_self_rating_quarterly: boolean;
}

export interface KPIItem {
  id?: number;
  item_id?: number;
  title: string;
  manager_rating?: number;
  employee_rating?: number;
  goal_weight?: string | number;
  actual_value?: number;
  target_value?: number;
  [key: string]: any;
}

export interface CalculationResult {
  method: string;
  averageRating: number;
  finalRating: number;
  percentage: number;
  itemCalculations: ItemCalculation[];
  [key: string]: any;
}

export interface ItemCalculation {
  item_id: number;
  title: string;
  contribution: number;
  [key: string]: any;
}

/**
 * Parse goal weight from various formats (40%, 0.4, 40)
 */
const parseGoalWeight = (goalWeight: string | number | undefined): number => {
  if (!goalWeight) return 0;

  const weightStr = String(goalWeight).trim();
  
  if (weightStr.endsWith('%')) {
    return parseFloat(weightStr.replace('%', '')) / 100;
  }
  
  const weight = parseFloat(weightStr);
  if (isNaN(weight)) return 0;
  
  // If weight > 1, assume it's a percentage (e.g., 40 means 40%)
  if (weight > 1) {
    return weight / 100;
  }
  
  return weight;
};

/**
 * Round a rating value to the nearest rating option
 */
const roundToNearestRatingOption = (rating: number, ratingOptions: number[]): number => {
  if (!rating || isNaN(rating) || !ratingOptions || ratingOptions.length === 0) {
    return 0;
  }

  const options = [...ratingOptions].sort((a, b) => a - b);
  
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
 * Calculate rating using Normal Calculation method
 */
const calculateNormalRating = (
  items: KPIItem[], 
  ratingOptions: number[],
  raterType: 'employee' | 'manager' = 'manager'
): CalculationResult => {
  const maxRating = Math.max(...ratingOptions);
  
  let totalRating = 0;
  let totalPossibleRating = 0;
  
  const itemCalculations = items.map(item => {
    const rating = raterType === 'employee' 
      ? (parseFloat(String(item.employee_rating)) || 0)
      : (parseFloat(String(item.manager_rating)) || 0);
    const possibleRating = maxRating;
    
    totalRating += rating;
    totalPossibleRating += possibleRating;
    
    return {
      item_id: item.item_id || item.id || 0,
      title: item.title,
      rating,
      possible_rating: possibleRating,
      contribution: rating,
    };
  });
  
  const percentage = totalPossibleRating > 0 
    ? (totalRating / totalPossibleRating) * 100 
    : 0;
  
  const averageRating = (percentage / 100) * maxRating;
  
  return {
    method: 'normal',
    averageRating,
    finalRating: averageRating,
    percentage,
    totalRating,
    totalPossibleRating,
    itemCalculations,
  };
};

/**
 * Calculate rating using Goal Weight method
 */
const calculateGoalWeightRating = (
  items: KPIItem[], 
  ratingOptions: number[],
  raterType: 'employee' | 'manager' = 'manager'
): CalculationResult => {
  let weightedSum = 0;
  let totalWeight = 0;
  
  const itemCalculations = items.map(item => {
    const rating = raterType === 'employee'
      ? (parseFloat(String(item.employee_rating)) || 0)
      : (parseFloat(String(item.manager_rating)) || 0);
    const weight = parseGoalWeight(item.goal_weight);
    const contribution = rating * weight;
    
    weightedSum += contribution;
    totalWeight += weight;
    
    return {
      item_id: item.item_id || item.id || 0,
      title: item.title,
      rating,
      goal_weight: weight,
      goal_weight_display: `${(weight * 100).toFixed(0)}%`,
      contribution,
    };
  });
  
  const averageRating = weightedSum;
  const percentage = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  
  return {
    method: 'goal_weight',
    averageRating,
    finalRating: averageRating,
    percentage,
    weightedSum,
    totalWeight,
    itemCalculations,
  };
};

/**
 * Calculate rating using Actual vs Target Values method
 * Formula: (Actual Value / Target Value * 100) * Goal Weight = Manager Rating %
 */
const calculateActualValueRating = (
  items: KPIItem[], 
  ratingOptions: number[]
): CalculationResult => {
  let totalManagerRatingPercentage = 0;
  let totalWeight = 0;
  
  const itemCalculations = items.map(item => {
    const actualValue = parseFloat(String(item.actual_value)) || 0;
    const targetValue = parseFloat(String(item.target_value)) || 0;
    const weight = parseGoalWeight(item.goal_weight);
    
    const percentageAchieved = targetValue > 0 
      ? (actualValue / targetValue) * 100 
      : 0;
    
    // Manager Rating % = Percentage Achieved * Goal Weight (in percentage form)
    const managerRatingPercentage = percentageAchieved * weight;
    
    totalManagerRatingPercentage += managerRatingPercentage;
    totalWeight += weight;
    
    return {
      item_id: item.item_id || item.id || 0,
      title: item.title,
      actual_value: actualValue,
      target_value: targetValue,
      percentage_achieved: percentageAchieved,
      goal_weight: weight,
      goal_weight_display: `${(weight * 100).toFixed(0)}%`,
      manager_rating_percentage: managerRatingPercentage,
      contribution: managerRatingPercentage,
    };
  });
  
  // Final Rating % is the sum of all Manager Rating % values
  const finalRatingPercentage = totalManagerRatingPercentage;
  
  return {
    method: 'actual_value',
    averageRating: finalRatingPercentage / 100, // Convert to decimal for compatibility
    finalRating: finalRatingPercentage / 100,
    percentage: finalRatingPercentage,
    totalManagerRatingPercentage: finalRatingPercentage,
    totalWeight,
    itemCalculations,
  };
};

/**
 * Main function: Calculate final KPI rating based on company features
 */
export const calculateFinalKPIRating = (
  items: KPIItem[],
  ratingOptions: number[],
  features: CompanyFeatures,
  kpiType: 'yearly' | 'quarterly' = 'yearly',
  raterType: 'employee' | 'manager' = 'manager'
): CalculationResult => {
  try {
    if (!items || items.length === 0) {
      return {
        method: 'none',
        averageRating: 0,
        finalRating: 0,
        percentage: 0,
        itemCalculations: [],
        error: 'No items provided',
      };
    }

    if (!ratingOptions || ratingOptions.length === 0) {
      return {
        method: 'none',
        averageRating: 0,
        finalRating: 0,
        percentage: 0,
        itemCalculations: [],
        error: 'No rating options provided',
      };
    }

    let calculationResult: CalculationResult;
    
    // Determine which calculation method to use
    if (kpiType === 'yearly') {
      if (features.use_actual_values_yearly) {
        calculationResult = calculateActualValueRating(items, ratingOptions);
      } else if (features.use_goal_weight_yearly) {
        calculationResult = calculateGoalWeightRating(items, ratingOptions, raterType);
      } else {
        calculationResult = calculateNormalRating(items, ratingOptions, raterType);
      }
    } else if (kpiType === 'quarterly') {
      if (features.use_actual_values_quarterly) {
        calculationResult = calculateActualValueRating(items, ratingOptions);
      } else if (features.use_goal_weight_quarterly) {
        calculationResult = calculateGoalWeightRating(items, ratingOptions, raterType);
      } else {
        calculationResult = calculateNormalRating(items, ratingOptions, raterType);
      }
    } else {
      calculationResult = calculateNormalRating(items, ratingOptions, raterType);
    }
    
    // Round the final rating
    const finalRating = roundToNearestRatingOption(
      calculationResult.averageRating, 
      ratingOptions
    );
    
    return {
      ...calculationResult,
      finalRating,
      ratingOptions,
    };
  } catch (error) {
    console.error('Error calculating final KPI rating:', error);
    return {
      method: 'error',
      averageRating: 0,
      finalRating: 0,
      percentage: 0,
      itemCalculations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Helper: Get calculation method display name
 */
export const getCalculationMethodName = (features: CompanyFeatures, kpiType: 'yearly' | 'quarterly'): string => {
  if (kpiType === 'yearly') {
    if (features.use_actual_values_yearly) return 'Actual vs Target (Yearly)';
    if (features.use_goal_weight_yearly) return 'Goal Weight (Yearly)';
    return 'Normal Calculation (Yearly)';
  } else {
    if (features.use_actual_values_quarterly) return 'Actual vs Target (Quarterly)';
    if (features.use_goal_weight_quarterly) return 'Goal Weight (Quarterly)';
    return 'Normal Calculation (Quarterly)';
  }
};

/**
 * Helper: Check if goal weights are required for current configuration
 */
export const areGoalWeightsRequired = (features: CompanyFeatures, kpiType: 'yearly' | 'quarterly'): boolean => {
  if (kpiType === 'yearly') {
    return features.use_goal_weight_yearly || features.use_actual_values_yearly;
  } else {
    return features.use_goal_weight_quarterly || features.use_actual_values_quarterly;
  }
};

/**
 * Helper: Check if actual values are required for current configuration
 */
export const areActualValuesRequired = (features: CompanyFeatures, kpiType: 'yearly' | 'quarterly'): boolean => {
  if (kpiType === 'yearly') {
    return features.use_actual_values_yearly;
  } else {
    return features.use_actual_values_quarterly;
  }
};
