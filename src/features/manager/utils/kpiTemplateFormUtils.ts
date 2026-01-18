export interface KPIItem {
  title: string;
  description: string;
  current_performance_status: string;
  target_value: string;
  expected_completion_date: string;
  measure_unit: string;
  goal_weight: string;
  is_qualitative: boolean;
}

export const getInitialKPIItems = (): KPIItem[] => [
  {
    title: '',
    description: '',
    current_performance_status: '',
    target_value: '',
    expected_completion_date: '',
    measure_unit: '',
    goal_weight: '',
    is_qualitative: false,
  },
];

/**
 * Calculate total goal weight from KPI items (ALL items - both qualitative and quantitative)
 */
export const calculateTotalGoalWeight = (items: KPIItem[]): number => {
  const validItems = items.filter(item => item.title?.trim() && item.description?.trim());
  // Count ALL valid items (both qualitative and quantitative)
  
  const total = validItems.reduce((sum, item) => {
    const weight = parseFloat(item.goal_weight?.replace('%', '') || '0');
    return sum + (isNaN(weight) ? 0 : weight);
  }, 0);
  
  return Math.round(total * 100) / 100;
};

/**
 * Get valid KPI items (with title and description)
 */
export const getValidKPIItems = (items: KPIItem[]): KPIItem[] => {
  return items.filter(
    item => item.title && item.title.trim() !== '' && 
            item.description && item.description.trim() !== ''
  );
};

/**
 * Validate template form - MATCHES KPI SETTING LOGIC EXACTLY
 */
export const validateTemplateForm = (
  templateName: string,
  validItems: KPIItem[],
  totalGoalWeight: number
): { valid: boolean; error?: string; needsConfirmation?: boolean } => {
  if (!templateName || templateName.trim() === '') {
    return { valid: false, error: 'Template name is required' };
  }

  if (validItems.length === 0) {
    return { valid: false, error: 'Please add at least one KPI item with title and description' };
  }

  // Validate goal weights for ALL items (both qualitative and quantitative)
  const allRows = validItems;
  
  if (allRows.length === 0) {
    return { valid: true };
  }

  const rawWeights = allRows
    .map(row => {
      const value = (row.goal_weight || '').toString().trim();
      if (!value) return NaN;
      const numeric = parseFloat(value.replace('%', ''));
      return isNaN(numeric) ? NaN : numeric;
    })
    .filter(w => !isNaN(w));

  const hasAnyWeights = rawWeights.length > 0;
  const allHaveWeights = rawWeights.length === allRows.length;
  const someHaveWeights = hasAnyWeights && !allHaveWeights;

  if (someHaveWeights) {
    return {
      valid: false,
      error: 'Some KPI items have goal weights while others do not. Please either fill in all goal weights or leave all blank.'
    };
  }

  if (!hasAnyWeights) {
    return { valid: true, needsConfirmation: true };
  }

  if (allHaveWeights) {
    let totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);
    if (rawWeights.every(w => w > 0 && w <= 1)) {
      totalWeight = totalWeight * 100;
    }

    const roundedTotal = Math.round(totalWeight * 100) / 100;
    if (roundedTotal !== 100) {
      return {
        valid: false,
        error: `Total Goal Weight must be exactly 100%. Current total is ${roundedTotal.toFixed(2)}%.`
      };
    }
  }

  return { valid: true };
};