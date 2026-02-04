/**
 * Redux Store Configuration
 * 
 * Main Redux store setup using Redux Toolkit.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import kpiReducer from './slices/kpiSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';
import employeeReducer from './slices/employeeSlice';
import departmentReducer from './slices/departmentSlice';
import settingsReducer from './slices/settingsSlice';
import statisticsReducer from './slices/statisticsSlice';
import departmentAnalyticsReducer from './slices/departmentAnalyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kpi: kpiReducer,
    ui: uiReducer,
    notifications: notificationReducer,
    employees: employeeReducer,
    departments: departmentReducer,
    settings: settingsReducer,
    statistics: statisticsReducer,
    departmentAnalytics: departmentAnalyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/selectCompany/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user', 'auth.selectedCompany'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
