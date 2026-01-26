import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// Types
interface Department {
  id: number;
  name: string;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentState {
  departments: Department[];
  currentDepartment: Department | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DepartmentState = {
  departments: [],
  currentDepartment: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {

      // Backend: GET /departments requires superadmin role (403 for HR)
      // Use /departments/list instead which is accessible to all authenticated users
      const response = await api.get('/departments/list');
      // Backend returns: { success: true, data: { departments: [...] } }
      const departments = response.data.data?.departments || response.data.departments || [];
      return { departments };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

export const fetchDepartmentById = createAsyncThunk(
  'departments/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {

      // Use /departments/list/:departmentId for fetching single department
      const response = await api.get(`/departments/list/${id}`);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (data: { name: string; company_id?: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/departments', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, data }: { id: number; data: { name: string } }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/departments/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update department');
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/departments/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete department');
    }
  }
);

// Slice
const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    setCurrentDepartment: (state, action: PayloadAction<Department | null>) => {
      state.currentDepartment = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;

        // action.payload is { departments: [...] }
        if (action.payload.departments && Array.isArray(action.payload.departments)) {
          state.departments = action.payload.departments;
        } else if (Array.isArray(action.payload)) {
          // Fallback for direct array format
          state.departments = action.payload;
        } else {
          state.departments = [];
        }

      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch by ID
    builder
      .addCase(fetchDepartmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDepartment = action.payload;
      })
      .addCase(fetchDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create
    builder
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments.push(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update
    builder
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.departments.findIndex((dept) => dept.id === action.payload.id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete
    builder
      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = state.departments.filter((dept) => dept.id !== action.payload);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentDepartment, clearError } = departmentSlice.actions;
export default departmentSlice.reducer;
