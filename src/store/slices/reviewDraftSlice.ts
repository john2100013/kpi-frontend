import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// Types
interface DraftData {
  overall_rating?: number;
  average_rating?: number;
  employee_rating_percentage?: number;
  item_ratings?: Array<{
    item_id: number;
    rating: number;
    comment: string;
  }>;
  employee_signature?: string;
  review_period?: string;
  review_quarter?: string;
  review_year?: number;
  major_accomplishments?: string;
  disappointments?: string;
  improvement_needed?: string;
  future_plan?: string;
  accomplishments?: Array<any>;
}

interface Draft {
  id: number;
  kpi_id: number;
  employee_rating?: number;
  employee_final_rating?: number;
  average_rating?: number;
  overall_rating?: number;
  employee_rating_percentage?: number;
  employee_final_rating_percentage?: number;
  employee_signature?: string;
  major_accomplishments?: string;
  disappointments?: string;
  improvement_needed?: string;
  future_plan?: string;
  item_ratings?: Array<any>;
  accomplishments?: Array<any>;
  created_at?: string;
  updated_at?: string;
}

interface ReviewDraftState {
  currentDraft: Draft | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: string | null;
}

const initialState: ReviewDraftState = {
  currentDraft: null,
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
};

// Async thunks
export const saveDraft = createAsyncThunk(
  'reviewDraft/saveDraft',
  async ({ kpiId, draftData }: { kpiId: number; draftData: DraftData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/kpi-review/${kpiId}/draft`, draftData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save draft');
    }
  }
);

export const loadDraft = createAsyncThunk(
  'reviewDraft/loadDraft',
  async (kpiId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/kpi-review/${kpiId}/draft`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load draft');
    }
  }
);

export const deleteDraft = createAsyncThunk(
  'reviewDraft/deleteDraft',
  async (kpiId: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/kpi-review/${kpiId}/draft`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete draft');
    }
  }
);

// Slice
const reviewDraftSlice = createSlice({
  name: 'reviewDraft',
  initialState,
  reducers: {
    clearDraft: (state) => {
      state.currentDraft = null;
      state.error = null;
      state.lastSaved = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Save draft
    builder.addCase(saveDraft.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(saveDraft.fulfilled, (state, action: PayloadAction<any>) => {
      state.saving = false;
      state.currentDraft = action.payload.draft;
      state.lastSaved = new Date().toISOString();
      state.error = null;
    });
    builder.addCase(saveDraft.rejected, (state, action) => {
      state.saving = false;
      state.error = action.payload as string;
    });

    // Load draft
    builder.addCase(loadDraft.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadDraft.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.currentDraft = action.payload.draft;
      state.error = null;
     
    });
    builder.addCase(loadDraft.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || 'Failed to load draft. Please try again.';
    });

    // Delete draft
    builder.addCase(deleteDraft.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteDraft.fulfilled, (state) => {
      state.loading = false;
      state.currentDraft = null;
      state.lastSaved = null;
      state.error = null;
    });
    builder.addCase(deleteDraft.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearDraft, clearError } = reviewDraftSlice.actions;
export default reviewDraftSlice.reducer;
