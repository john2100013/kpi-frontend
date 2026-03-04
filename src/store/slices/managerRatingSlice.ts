/**
 * Manager Rating Redux Slice
 * 
 * State management for Manager Rating functionality with intelligent caching.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { RootState } from '../index';
import type { ManagerRatingTemplate as BaseManagerRatingTemplate } from '../../types';

// Types
export interface ManagerRatingTemplate extends BaseManagerRatingTemplate {
  // Extending the base type in case we need additional fields in Redux
}

export interface RatingOption {
  id: number;
  rating_scale_name: string;
  rating_value: number;
  label: string;
  description: string | null;
  display_order: number;
}

export interface RatingScale {
  scaleName: string;
  options: RatingOption[];
}

export interface Assignment {
  id: number;
  template_id: number;
  template_name?: string;
  department_id: number;
  department_name?: string;
  due_date: string;
  company_id: number;
  total_employees?: number;
  submitted_count?: number;
  pending_count?: number;
  created_at?: string;
  assigned_by?: number;
  status?: string;
  is_active?: number;
  updated_at?: string;
}

interface ManagerRatingState {
  // Templates
  templates: ManagerRatingTemplate[];
  currentTemplate: ManagerRatingTemplate | null;
  templatesLoading: boolean;
  templatesError: string | null;
  templatesLastFetch: number | null;
  
  // Rating Options
  ratingOptions: RatingOption[];
  ratingScales: RatingScale[];
  optionsLoading: boolean;
  optionsError: string | null;
  optionsLastFetch: number | null;
  
  // Assignments
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  assignmentsLoading: boolean;
  assignmentsError: string | null;
  assignmentsLastFetch: number | null;
  assignmentsFilter: 'all' | 'active' | 'completed' | 'overdue';
  
  // Cache settings (5 minutes)
  cacheExpiry: number;
}

// Initial state
const initialState: ManagerRatingState = {
  templates: [],
  currentTemplate: null,
  templatesLoading: false,
  templatesError: null,
  templatesLastFetch: null,
  
  ratingOptions: [],
  ratingScales: [],
  optionsLoading: false,
  optionsError: null,
  optionsLastFetch: null,
  
  assignments: [],
  currentAssignment: null,
  assignmentsLoading: false,
  assignmentsError: null,
  assignmentsLastFetch: null,
  assignmentsFilter: 'all',
  
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

// Helper function to check if cache is still valid
const isCacheValid = (lastFetch: number | null, expiry: number): boolean => {
  if (!lastFetch) return false;
  return Date.now() - lastFetch < expiry;
};

// ============================================================================
// Async Thunks - Templates
// ============================================================================

export const fetchTemplates = createAsyncThunk(
  'managerRating/fetchTemplates',
  async (forceRefresh: boolean = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { templatesLastFetch, cacheExpiry, templates } = state.managerRating;
      
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid(templatesLastFetch, cacheExpiry) && templates.length > 0) {
        return { templates, fromCache: true };
      }
      
      const response = await api.get('/manager-rating/templates');
      return { 
        templates: response.data.data.templates || [], 
        fromCache: false 
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch templates');
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  'managerRating/fetchTemplateById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/manager-rating/templates/${id}`);
      return response.data.data.template;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch template');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'managerRating/createTemplate',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/manager-rating/templates', data);
      return response.data.data.template;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create template');
    }
  }
);

export const updateTemplate = createAsyncThunk(
  'managerRating/updateTemplate',
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/manager-rating/templates/${id}`, data);
      return response.data.data.template;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update template');
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'managerRating/deleteTemplate',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/manager-rating/templates/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete template');
    }
  }
);

// ============================================================================
// Async Thunks - Rating Options
// ============================================================================

export const fetchRatingOptions = createAsyncThunk(
  'managerRating/fetchRatingOptions',
  async (forceRefresh: boolean = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { optionsLastFetch, cacheExpiry, ratingOptions } = state.managerRating;
      
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid(optionsLastFetch, cacheExpiry) && ratingOptions.length > 0) {
        return { options: ratingOptions, fromCache: true };
      }
      
      const response = await api.get('/manager-rating/rating-options');
      const grouped = response.data.data.options || {};
      
      // Flatten to array
      const allOptions: RatingOption[] = [];
      Object.values(grouped).forEach((options: any) => {
        allOptions.push(...options);
      });
      
      return { 
        options: allOptions, 
        fromCache: false 
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch rating options');
    }
  }
);

export const createRatingScale = createAsyncThunk(
  'managerRating/createRatingScale',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/manager-rating/rating-scales', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create rating scale');
    }
  }
);

export const updateRatingScale = createAsyncThunk(
  'managerRating/updateRatingScale',
  async ({ scaleName, data }: { scaleName: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/manager-rating/rating-scales/${encodeURIComponent(scaleName)}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update rating scale');
    }
  }
);

export const deleteRatingScale = createAsyncThunk(
  'managerRating/deleteRatingScale',
  async (scaleName: string, { rejectWithValue }) => {
    try {
      await api.delete(`/manager-rating/rating-scales/${encodeURIComponent(scaleName)}`);
      return scaleName;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete rating scale');
    }
  }
);

// ============================================================================
// Async Thunks - Assignments
// ============================================================================

export const fetchAssignments = createAsyncThunk(
  'managerRating/fetchAssignments',
  async (forceRefresh: boolean = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { assignmentsLastFetch, cacheExpiry, assignments } = state.managerRating;
      
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid(assignmentsLastFetch, cacheExpiry) && assignments.length > 0) {
        return { assignments, fromCache: true };
      }
      
      const response = await api.get('/manager-rating/assignments');
      return { 
        assignments: response.data.data.assignments || [], 
        fromCache: false 
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch assignments');
    }
  }
);

export const createAssignment = createAsyncThunk(
  'managerRating/createAssignment',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/manager-rating/assignments', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create assignment');
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  'managerRating/deleteAssignment',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/manager-rating/assignments/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete assignment');
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const managerRatingSlice = createSlice({
  name: 'managerRating',
  initialState,
  reducers: {
    // Set filter for assignments
    setAssignmentsFilter: (state, action: PayloadAction<'all' | 'active' | 'completed' | 'overdue'>) => {
      state.assignmentsFilter = action.payload;
    },
    
    // Clear current template
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.templatesError = null;
      state.optionsError = null;
      state.assignmentsError = null;
    },
    
    // Invalidate caches (force refresh on next fetch)
    invalidateTemplatesCache: (state) => {
      state.templatesLastFetch = null;
    },
    
    invalidateOptionsCache: (state) => {
      state.optionsLastFetch = null;
    },
    
    invalidateAssignmentsCache: (state) => {
      state.assignmentsLastFetch = null;
    },
    
    // Clear all data
    resetManagerRating: () => initialState,
  },
  extraReducers: (builder) => {
    // ======== Templates ========
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload.templates;
        if (!action.payload.fromCache) {
          state.templatesLastFetch = Date.now();
        }
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload as string;
      });
    
    builder
      .addCase(fetchTemplateById.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload as string;
      });
    
    builder
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.push(action.payload);
        state.templatesLastFetch = null; // Invalidate cache
      });
    
    builder
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const index = state.templates.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.templatesLastFetch = null; // Invalidate cache
      });
    
    builder
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter(t => t.id !== action.payload);
        state.templatesLastFetch = null; // Invalidate cache
      });
    
    // ======== Rating Options ========
    builder
      .addCase(fetchRatingOptions.pending, (state) => {
        state.optionsLoading = true;
        state.optionsError = null;
      })
      .addCase(fetchRatingOptions.fulfilled, (state, action) => {
        state.optionsLoading = false;
        state.ratingOptions = action.payload.options;
        
        // Group by rating scale name
        const grouped: { [key: string]: RatingOption[] } = {};
        action.payload.options.forEach(option => {
          if (!grouped[option.rating_scale_name]) {
            grouped[option.rating_scale_name] = [];
          }
          grouped[option.rating_scale_name].push(option);
        });
        
        state.ratingScales = Object.keys(grouped).map(scaleName => ({
          scaleName,
          options: grouped[scaleName].sort((a, b) => a.rating_value - b.rating_value)
        }));
        
        if (!action.payload.fromCache) {
          state.optionsLastFetch = Date.now();
        }
      })
      .addCase(fetchRatingOptions.rejected, (state, action) => {
        state.optionsLoading = false;
        state.optionsError = action.payload as string;
      });
    
    builder
      .addCase(createRatingScale.fulfilled, (state) => {
        state.optionsLastFetch = null; // Invalidate cache
      });
    
    builder
      .addCase(updateRatingScale.fulfilled, (state) => {
        state.optionsLastFetch = null; // Invalidate cache
      });
    
    builder
      .addCase(deleteRatingScale.fulfilled, (state, action) => {
        state.ratingOptions = state.ratingOptions.filter(
          opt => opt.rating_scale_name !== action.payload
        );
        state.ratingScales = state.ratingScales.filter(
          scale => scale.scaleName !== action.payload
        );
        state.optionsLastFetch = null; // Invalidate cache
      });
    
    // ======== Assignments ========
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.assignmentsLoading = true;
        state.assignmentsError = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.assignmentsLoading = false;
        state.assignments = action.payload.assignments;
        if (!action.payload.fromCache) {
          state.assignmentsLastFetch = Date.now();
        }
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.assignmentsLoading = false;
        state.assignmentsError = action.payload as string;
      });
    
    builder
      .addCase(createAssignment.fulfilled, (state) => {
        state.assignmentsLastFetch = null; // Invalidate cache
      });
    
    builder
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.assignments = state.assignments.filter(a => a.id !== action.payload);
        state.assignmentsLastFetch = null; // Invalidate cache
      });
  },
});

// ============================================================================
// Selectors
// ============================================================================

export const selectTemplates = (state: RootState) => state.managerRating.templates;
export const selectTemplatesLoading = (state: RootState) => state.managerRating.templatesLoading;
export const selectTemplatesError = (state: RootState) => state.managerRating.templatesError;
export const selectCurrentTemplate = (state: RootState) => state.managerRating.currentTemplate;

export const selectRatingOptions = (state: RootState) => state.managerRating.ratingOptions;
export const selectRatingScales = (state: RootState) => state.managerRating.ratingScales;
export const selectOptionsLoading = (state: RootState) => state.managerRating.optionsLoading;
export const selectOptionsError = (state: RootState) => state.managerRating.optionsError;

export const selectAssignments = (state: RootState) => state.managerRating.assignments;
export const selectAssignmentsLoading = (state: RootState) => state.managerRating.assignmentsLoading;
export const selectAssignmentsError = (state: RootState) => state.managerRating.assignmentsError;
export const selectAssignmentsFilter = (state: RootState) => state.managerRating.assignmentsFilter;

// Export actions and reducer
export const {
  setAssignmentsFilter,
  clearCurrentTemplate,
  clearErrors,
  invalidateTemplatesCache,
  invalidateOptionsCache,
  invalidateAssignmentsCache,
  resetManagerRating,
} = managerRatingSlice.actions;

export default managerRatingSlice.reducer;
