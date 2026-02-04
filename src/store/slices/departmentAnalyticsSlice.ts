/**
 * Department Analytics Slice
 * Manages department performance metrics and statistics
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface DepartmentStatusDistribution {
  pending: number;
  acknowledged_review_pending: number;
  self_rating_submitted: number;
  awaiting_employee_confirmation: number;
  review_completed: number;
  review_rejected: number;
  no_kpi: number;
}

export interface DepartmentPerformanceMetrics {
  period: string;
  quarter?: string;
  year: number;
  period_label: string;
  total_kpis: number;
  completed_kpis: number;
  total_reviews: number;
  average_rating: number;
  min_rating: number;
  max_rating: number;
  completion_rate: number;
}

export interface PeriodComparison {
  period: string;
  quarter?: string;
  year: number;
  period_label: string;
  employee_count?: number;
  total_kpis: number;
  completed_kpis: number;
  average_rating: number;
  previous_rating: number | null;
  trend: 'improving' | 'declining' | 'stable';
  trend_percentage: number;
  rating_stddev?: number;
  completion_rate: number;
  trends?: {
    rating_change: number | null;
    kpi_change: number;
    completion_change: number;
  } | null;
}

export interface DepartmentAnalyticsState {
  statusDistribution: Record<number, DepartmentStatusDistribution>;
  performanceMetrics: Record<number, DepartmentPerformanceMetrics[]>;
  periodComparisons: Record<number, PeriodComparison[]>;
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentAnalyticsState = {
  statusDistribution: {},
  performanceMetrics: {},
  periodComparisons: {},
  loading: false,
  error: null,
};

// Fetch status distribution for a department
export const fetchDepartmentStatusDistribution = createAsyncThunk(
  'departmentAnalytics/fetchStatusDistribution',
  async (departmentId: number) => {
    const response = await api.get(`/analytics/departments/${departmentId}/status-distribution`);
    return { departmentId, data: response.data.data };
  }
);

// Fetch performance metrics for a department
export const fetchDepartmentPerformanceMetrics = createAsyncThunk(
  'departmentAnalytics/fetchPerformanceMetrics',
  async (departmentId: number) => {
    const response = await api.get(`/analytics/departments/${departmentId}/performance-metrics`);
    return { departmentId, data: response.data.data };
  }
);

// Fetch period comparisons for a department
export const fetchDepartmentPeriodComparisons = createAsyncThunk(
  'departmentAnalytics/fetchPeriodComparisons',
  async ({ departmentId, periodType }: { departmentId: number; periodType: 'quarterly' | 'yearly' }) => {
    const response = await api.get(`/analytics/departments/${departmentId}/period-comparisons`, {
      params: { periodType }
    });
    return { departmentId, data: response.data.data };
  }
);

const departmentAnalyticsSlice = createSlice({
  name: 'departmentAnalytics',
  initialState,
  reducers: {
    clearDepartmentAnalytics: (state) => {
      state.statusDistribution = {};
      state.performanceMetrics = {};
      state.periodComparisons = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Status Distribution
      .addCase(fetchDepartmentStatusDistribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentStatusDistribution.fulfilled, (state, action) => {
        state.loading = false;
        state.statusDistribution[action.payload.departmentId] = action.payload.data;
      })
      .addCase(fetchDepartmentStatusDistribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch status distribution';
      })
      // Performance Metrics
      .addCase(fetchDepartmentPerformanceMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentPerformanceMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.performanceMetrics[action.payload.departmentId] = action.payload.data;
      })
      .addCase(fetchDepartmentPerformanceMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch performance metrics';
      })
      // Period Comparisons
      .addCase(fetchDepartmentPeriodComparisons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentPeriodComparisons.fulfilled, (state, action) => {
        state.loading = false;
        state.periodComparisons[action.payload.departmentId] = action.payload.data;
      })
      .addCase(fetchDepartmentPeriodComparisons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch period comparisons';
      });
  },
});

export const { clearDepartmentAnalytics } = departmentAnalyticsSlice.actions;
export default departmentAnalyticsSlice.reducer;
