/**
 * useCompanyFeatures Hook
 * NOW USES DEPARTMENT-LEVEL FEATURES
 * This hook has been updated to fetch department-specific features instead of company-level
 * Maintains backward compatibility with existing code
 * @deprecated Use useDepartmentFeatures directly for new code
 */

import { useDepartmentFeatures, DepartmentFeatures } from './useDepartmentFeatures';

// Re-export the interface with old name for backward compatibility
export interface CompanyFeatures extends DepartmentFeatures {}

/**
 * Hook that uses department features but maintains the old API
 * This allows existing code to work without changes
 */
export const useCompanyFeatures = (kpiId?: number, initialData?: DepartmentFeatures | null) => {
  // Delegate to the new department features hook
  const departmentFeaturesHook = useDepartmentFeatures(kpiId, initialData);

  // Return the same interface, just with department features
  return {
    ...departmentFeaturesHook,
    // Alias 'features' to maintain backward compatibility
    features: departmentFeaturesHook.features,
  };
};
