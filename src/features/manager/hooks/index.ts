/**
 * Manager Hooks
 */

export { useManagerDashboard } from './useManagerDashboard';
export { useManagerKPIList } from './useManagerKPIList';
export { useManagerKPIDetails } from './useManagerKPIDetails';
export { useManagerEmployeeKPIs } from './useManagerEmployeeKPIs';
export { useManagerKPISetting } from './useManagerKPISetting';
export { useManagerKPIReview } from './useManagerKPIReview';
export { useManagerKPITemplates } from './useManagerKPITemplates';
export { useTemplateApplication } from './useTemplateApplication';
export { useManagerEmployeeSelection } from './useManagerEmployeeSelection';
export { useManagerReviewsList } from './useManagerReviewsList';
export { useManagerApplyKPITemplate } from './useManagerApplyKPITemplate';
export { useApplyKPITemplate } from './useApplyKPITemplate'; // Add this NEW line
export { useManagerKPITemplateForm } from './useManagerKPITemplateForm';
export { 
  getKPIStage,
  getKPIStageWithProgress,
  getCategoryLabel, 
  getCategoryColor, 
  getCategoryIcon,
  getPeriodLabel,
  getPeriodValue 
} from './managerDashboardUtils';
export {
  parseReviewData,
  formatRating,
  getRatingLabel,
  extractCommentText,
  filterKPIItems
} from './kpiDetailsUtils';
export {
  getInitialRows,
  getMinRows,
  validateKPIForm,
  validateGoalWeights,
  getValidKPIRows,
} from './kpiSettingUtils';
export type { ItemRatings, ItemComments, ParsedReviewData } from './kpiDetailsUtils';
export type { KPIRow, KPIFormData } from './kpiSettingUtils';
export type { KPITemplate } from './useManagerKPITemplates';
export type { KPIItem } from './useManagerKPITemplateForm';

// Placeholder - will be implemented during manager refactoring
export const useManagerMeetingScheduler = () => {
  throw new Error('useManagerMeetingScheduler not yet implemented - pending manager feature refactoring');
};
