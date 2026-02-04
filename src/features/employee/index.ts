/**
 * Employee Feature Module
 */

// Export pages explicitly to avoid conflicts
export { default as EmployeeDashboard } from './pages/Dashboard';
export { default as KPIAcknowledgement } from '../shared/pages/KPIAcknowledgementSign';
export { default as KPIDetails } from '../shared/pages/KPIDetails';
export { default as Reviews } from './pages/Reviews.tsx';
export { default as SelfRating } from './pages/KPIReview';
export { default as KPIList } from './pages/KPIList';
export { default as KPIConfirmation } from './pages/KPIConfirmation';
export { default as AcknowledgeList } from './pages/AcknowledgeList';

// Export components
export * from './components';

// Export hooks
export * from './hooks';

// Export services
export * from './services';

// Export types explicitly to avoid conflicts
export type {
  EmployeeState,
  AcknowledgementData,
  EmployeeKPIFilter,
  EmployeeDashboardStats,
  RatingOption,
  SelfRatingDraft,
  SelfRatingSubmission,
  TextModalState,
  ItemRatings,
  ItemComments,
  KPIReviewConfirmation,
  ConfirmationSubmission,
} from './types';
