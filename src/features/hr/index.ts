/**
 * HR Feature Module
 * 
 * Public API for HR feature
 */

// Pages
export * from './pages';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Services
export * from './services';

// Export specific types to avoid ambiguity
export type { 
  DepartmentStatistic, 
  Employee, 
  PeriodSetting, 
  Manager,
  DashboardFilters,
  RatingOption,
  ReminderSetting,
  DailyReminderSetting,
  RejectedKPIFilter,
  RejectedKPIStats,
  TextModalState,
  StageInfo,
  ItemCalculation
} from './types/hr.types';
