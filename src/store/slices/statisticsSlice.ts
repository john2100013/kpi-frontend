import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Types
interface DepartmentStatistic {
  department_id: number;
  department: string;
  total_employees: number;
  categories: {
    pending: number;
    acknowledged_review_pending: number;
    self_rating_submitted: number;
    awaiting_employee_confirmation: number;
    review_completed: number;
    review_rejected: number;
    review_pending: number;
    no_kpi: number;
  };
}

interface DashboardCounts {
  totalKPIs: number;
  pendingReviews: number;
  completedReviews: number;
  totalEmployees: number;
}

interface StatisticsState {
  departmentStatistics: DepartmentStatistic[];
  dashboardCounts: DashboardCounts;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: StatisticsState = {
  departmentStatistics: [],
  dashboardCounts: {
    totalKPIs: 0,
    pendingReviews: 0,
    completedReviews: 0,
    totalEmployees: 0,
  },
  loading: false,
  error: null,
};

// Async thunks
export const fetchDepartmentStatistics = createAsyncThunk(
  'statistics/fetchDepartmentStatistics',
  async (
    filters: { department?: string; period?: string; manager?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.period) params.append('period', filters.period);
      if (filters.manager) params.append('manager', filters.manager);


      const response = await api.get(`/departments/statistics?${params.toString()}`);

      // Log each department's statistics
      if (response.data?.data?.statistics) {
        response.data.data.statistics.forEach((dept: any) => {

        });
      }
      
      // Backend returns { success: true, data: { statistics: [...] } }
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department statistics');
    }
  }
);

export const fetchDashboardCounts = createAsyncThunk(
  'statistics/fetchDashboardCounts',
  async (_, { rejectWithValue }) => {
    try {
      const [kpisRes, reviewsRes, employeesRes] = await Promise.all([
        api.get('/kpis/count'),
        api.get('/kpi-review/pending/count'),
        api.get('/employees/count'),
      ]);

      return {
        totalKPIs: kpisRes.data.count || 0,
        pendingReviews: reviewsRes.data.count || 0,
        completedReviews: 0,
        totalEmployees: employeesRes.data.count || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard counts');
    }
  }
);

export const fetchEmployeesByCategory = createAsyncThunk(
  'statistics/fetchEmployeesByCategory',
  async ({ department, category }: { department: string; category: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/statistics/employees?department=${department}&category=${category}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees by category');
    }
  }
);

// Slice
const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearStatistics: (state) => {
      state.departmentStatistics = [];
      state.dashboardCounts = {
        totalKPIs: 0,
        pendingReviews: 0,
        completedReviews: 0,
        totalEmployees: 0,
      };
    },
  },
  extraReducers: (builder) => {
    // Department Statistics
    builder
      .addCase(fetchDepartmentStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentStatistics.fulfilled, (state, action) => {

        state.loading = false;
        
        // Handle multiple response formats
        let statistics = [];
        if (Array.isArray(action.payload)) {
          statistics = action.payload;
        } else if (action.payload?.statistics && Array.isArray(action.payload.statistics)) {
          statistics = action.payload.statistics;
        } else if (action.payload?.data?.statistics && Array.isArray(action.payload.data.statistics)) {
          statistics = action.payload.data.statistics;
        }
        

        state.departmentStatistics = statistics;
      })
      .addCase(fetchDepartmentStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Dashboard Counts
    builder
      .addCase(fetchDashboardCounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardCounts = action.payload;
      })
      .addCase(fetchDashboardCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearStatistics } = statisticsSlice.actions;
export default statisticsSlice.reducer;
