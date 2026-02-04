/**
 * KPI Redux Slice
 * 
 * State management for KPI functionality.
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api';
import { KPI, KPIReview } from '../../types';
import { RootState } from '../index';

interface KPIState {
  kpis: KPI[];
  currentKPI: KPI | null;
  reviews: KPIReview[];
  currentReview: KPIReview | null;
  filters: {
    period?: string;
    status?: string;
    search?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: KPIState = {
  kpis: [],
  currentKPI: null,
  reviews: [],
  currentReview: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  loading: false,
  error: null,
};

// Async thunks
export const fetchKPIs = createAsyncThunk(
  'kpi/fetchKPIs',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/kpis', { params });
      return response.data.kpis || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KPIs');
    }
  }
);

export const fetchKPIById = createAsyncThunk(
  'kpi/fetchKPIById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/kpis/${id}`);
      return response.data.kpi;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KPI');
    }
  }
);

export const createKPI = createAsyncThunk(
  'kpi/createKPI',
  async (data: Partial<KPI>, { rejectWithValue }) => {
    try {
      const response = await api.post('/kpis', data);
      return response.data.kpi;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create KPI');
    }
  }
);

export const updateKPI = createAsyncThunk(
  'kpi/updateKPI',
  async ({ id, data }: { id: number; data: Partial<KPI> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/kpis/${id}`, data);
      return response.data.kpi;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update KPI');
    }
  }
);

export const deleteKPI = createAsyncThunk(
  'kpi/deleteKPI',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/kpis/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete KPI');
    }
  }
);

export const fetchReviews = createAsyncThunk(
  'kpi/fetchReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/kpi-review');
      return response.data.data?.reviews || response.data.reviews || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const fetchKPIsAndReviews = createAsyncThunk(
  'kpi/fetchKPIsAndReviews',
  async (_, { rejectWithValue }) => {
    try {
      const [kpisRes, reviewsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/kpi-review'),
      ]);
      
      return {
        kpis: kpisRes.data.data?.kpis || kpisRes.data.kpis || [],
        reviews: reviewsRes.data.data?.reviews || reviewsRes.data.reviews || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch data');
    }
  }
);

const kpiSlice = createSlice({
  name: 'kpi',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<KPIState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentKPI: (state, action: PayloadAction<KPI | null>) => {
      state.currentKPI = action.payload;
    },
    setCurrentReview: (state, action: PayloadAction<KPIReview | null>) => {
      state.currentReview = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch KPIs
    builder
      .addCase(fetchKPIs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKPIs.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = action.payload;
      })
      .addCase(fetchKPIs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch KPI by ID
    builder
      .addCase(fetchKPIById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKPIById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentKPI = action.payload;
      })
      .addCase(fetchKPIById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create KPI
    builder
      .addCase(createKPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createKPI.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis.push(action.payload);
      })
      .addCase(createKPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update KPI
    builder
      .addCase(updateKPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateKPI.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.kpis.findIndex((kpi) => kpi.id === action.payload.id);
        if (index !== -1) {
          state.kpis[index] = action.payload;
        }
        if (state.currentKPI?.id === action.payload.id) {
          state.currentKPI = action.payload;
        }
      })
      .addCase(updateKPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete KPI
    builder
      .addCase(deleteKPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteKPI.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = state.kpis.filter((kpi) => kpi.id !== action.payload);
        if (state.currentKPI?.id === action.payload) {
          state.currentKPI = null;
        }
      })
      .addCase(deleteKPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Reviews
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch KPIs and Reviews together
    builder
      .addCase(fetchKPIsAndReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKPIsAndReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = action.payload.kpis;
        state.reviews = action.payload.reviews;
      })
      .addCase(fetchKPIsAndReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Selectors
export const selectAllKPIs = (state: RootState) => state.kpi.kpis;
export const selectCurrentKPI = (state: RootState) => state.kpi.currentKPI;
export const selectAllReviews = (state: RootState) => state.kpi.reviews;
export const selectCurrentReview = (state: RootState) => state.kpi.currentReview;
export const selectKPILoading = (state: RootState) => state.kpi.loading;
export const selectKPIError = (state: RootState) => state.kpi.error;

// Memoized selectors
export const selectKPIsByEmployee = createSelector(
  [selectAllKPIs, (_state: RootState, employeeId: number) => employeeId],
  (kpis, employeeId) => kpis.filter((kpi) => kpi.employee_id === employeeId)
);

export const { setFilters, clearFilters, setCurrentKPI, setCurrentReview, clearError } = kpiSlice.actions;
export default kpiSlice.reducer;