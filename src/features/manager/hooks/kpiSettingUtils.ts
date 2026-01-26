/**
 * KPI Setting Utilities
 * 
 * Utility functions for KPI Setting form validation and logic.
 */

export interface KPIRow {
  title: string;
  description: string;
  current_performance_status: string;
  target_value: string;
  expected_completion_date: string;
  measure_unit: string;
  goal_weight: string;
  is_qualitative: boolean;
  exclude_from_calculation?: number;  // 0 = included, 1 = excluded from calculation
}

export interface KPIFormData {
  kpiRows: KPIRow[];
  period: 'quarterly' | 'yearly';
  quarter: string;
  year: number;
  meetingDate: Date | null;
  managerSignature: string;
  selectedPeriodSetting: any;
}

/**
 * Get initial KPI rows based on period type
 */
export const getInitialRows = (periodType: 'quarterly' | 'yearly'): KPIRow[] => {
  const defaultRow: KPIRow = {
    title: '',
    description: '',
    current_performance_status: '',
    target_value: '',
    expected_completion_date: '',
    measure_unit: '',
    goal_weight: '',
    is_qualitative: false
  };
  const rowCount = periodType === 'yearly' ? 5 : 3;
  return Array(rowCount).fill(null).map(() => ({ ...defaultRow }));
};

/**
 * Get minimum required rows for a period type
 */
export const getMinRows = (period: 'quarterly' | 'yearly'): number => {
  return period === 'yearly' ? 5 : 3;
};

/**
 * Validate KPI form data
 */
export const validateKPIForm = (
  kpiRows: KPIRow[],
  period: 'quarterly' | 'yearly',
  managerSignature: string
): { isValid: boolean; error?: string } => {
  if (!managerSignature) {
    return { isValid: false, error: 'Please provide your digital signature' };
  }

  const validKpiRows = kpiRows.filter(
    kpi => kpi.title && kpi.title.trim() !== '' && kpi.description && kpi.description.trim() !== ''
  );

  const minRows = getMinRows(period);
  if (validKpiRows.length < minRows) {
    return { isValid: false, error: `Please fill in at least ${minRows} KPI items for ${period} KPIs` };
  }

  if (validKpiRows.length === 0) {
    return { isValid: false, error: 'Please fill in at least one KPI row' };
  }

  return { isValid: true };
};

/**
 * Validate goal weights for all KPI items (qualitative and non-qualitative)
 */
export const validateGoalWeights = (
  kpiRows: KPIRow[]
): { isValid: boolean; error?: string; needsConfirmation?: boolean } => {
  const validKpiRows = kpiRows.filter(
    kpi => kpi.title && kpi.title.trim() !== '' && kpi.description && kpi.description.trim() !== ''
  );

  // Include ALL valid rows (both qualitative and non-qualitative)
  const allRows = validKpiRows;
  
  if (allRows.length === 0) {
    return { isValid: true };
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
      isValid: false,
      error: 'Some KPI items have goal weights while others do not. Please either fill in all goal weights or leave all blank.'
    };
  }

  if (!hasAnyWeights) {
    return { isValid: true, needsConfirmation: true };
  }

  if (allHaveWeights) {
    let totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);
    if (rawWeights.every(w => w > 0 && w <= 1)) {
      totalWeight = totalWeight * 100;
    }

    const roundedTotal = Math.round(totalWeight * 100) / 100;
    if (roundedTotal !== 100) {
      return {
        isValid: false,
        error: `Total Goal Weight must be exactly 100%. Current total is ${roundedTotal.toFixed(2)}%.`
      };
    }
  }

  return { isValid: true };
};

/**
 * Filter valid KPI rows for submission
 */
export const getValidKPIRows = (kpiRows: KPIRow[]): KPIRow[] => {
  return kpiRows.filter(
    kpi => kpi.title && kpi.title.trim() !== '' && kpi.description && kpi.description.trim() !== ''
  );
};

/**
 * Draft management - get draft key
 */
export const getDraftKey = (employeeId: string): string => {
  return `kpi-setting-draft-${employeeId}`;
};

/**
 * Save draft to localStorage
 */
export const saveDraftToStorage = (employeeId: string, formData: KPIFormData): void => {
  const draftKey = getDraftKey(employeeId);
  const draftData = {
    kpiRows: formData.kpiRows,
    period: formData.period,
    quarter: formData.quarter,
    year: formData.year,
    meetingDate: formData.meetingDate?.toISOString(),
    managerSignature: formData.managerSignature,
    selectedPeriodSetting: formData.selectedPeriodSetting,
  };
  localStorage.setItem(draftKey, JSON.stringify(draftData));
};

/**
 * Load draft from localStorage
 */
export const loadDraftFromStorage = (employeeId: string): Partial<KPIFormData> | null => {
  try {
    const draftKey = getDraftKey(employeeId);
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) return null;

    const draftData = JSON.parse(savedDraft);
    
    // Check if draft has any actual data
    const hasDraftData = draftData.kpiRows?.some((row: any) => 
      (row.title && row.title.trim()) || (row.description && row.description.trim())
    );

    if (!hasDraftData && draftData.period) {
      // If no draft data but period exists, set default rows for that period
      draftData.kpiRows = getInitialRows(draftData.period);
    }

    // Convert meetingDate string back to Date
    if (draftData.meetingDate) {
      draftData.meetingDate = new Date(draftData.meetingDate);
    }

    return draftData;
  } catch (error) {
    return null;
  }
};

/**
 * Clear draft from localStorage
 */
export const clearDraftFromStorage = (employeeId: string): void => {
  const draftKey = getDraftKey(employeeId);
  localStorage.removeItem(draftKey);
};
