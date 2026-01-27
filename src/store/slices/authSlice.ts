/**
 * Auth Redux Slice
 * 
 * State management for authentication.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { setCSRFToken } from '../../services/api';
import { User, Company } from '../../types';

interface AuthState {
  user: User | null;
  companies: Company[];
  hasMultipleCompanies: boolean;
  selectedCompany: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  passwordChangeRequired: boolean;
  sessionExpiry: number | null;
}

const initialState: AuthState = {
  user: null,
  companies: [],
  hasMultipleCompanies: false,
  selectedCompany: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  passwordChangeRequired: false,
  sessionExpiry: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ payrollNumber, password }: { payrollNumber: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', {
        payroll_number: payrollNumber,
        password,
      });

   
      if (response.data.csrfToken) {
        setCSRFToken(response.data.csrfToken);
      } else {
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

   

      if (response.data.csrfToken) {
        setCSRFToken(response.data.csrfToken);
      } else {
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      setCSRFToken(null);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const selectCompany = createAsyncThunk(
  'auth/selectCompany',
  async (companyId: number, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/select-company', { companyId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Company selection failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user data');
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Session refresh failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue('Not authenticated');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.passwordChangeRequired = action.payload.requires_password_change || false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.companies = [];
      state.hasMultipleCompanies = false;
      state.selectedCompany = null;
      state.isAuthenticated = false;
      state.passwordChangeRequired = false;
      state.sessionExpiry = null;
      state.error = null;
      setCSRFToken(null);
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.companies = action.payload.companies || [];
        state.hasMultipleCompanies = action.payload.hasMultipleCompanies || false;
        state.passwordChangeRequired = action.payload.passwordChangeRequired || false;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.expiresAt || null;

        if (action.payload.companies && action.payload.companies.length > 0) {
          const primary = action.payload.companies.find((c: Company) => c.is_primary) || action.payload.companies[0];
          state.selectedCompany = primary;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Login with email
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.companies = action.payload.companies || [];
        state.hasMultipleCompanies = action.payload.hasMultipleCompanies || false;
        state.passwordChangeRequired = action.payload.passwordChangeRequired || false;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.expiresAt || null;

        if (action.payload.companies && action.payload.companies.length > 0) {
          const primary = action.payload.companies.find((c: Company) => c.is_primary) || action.payload.companies[0];
          state.selectedCompany = primary;
        }
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.companies = [];
        state.hasMultipleCompanies = false;
        state.selectedCompany = null;
        state.isAuthenticated = false;
        state.passwordChangeRequired = false;
        state.sessionExpiry = null;
        state.error = null;
        setCSRFToken(null);
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
        setCSRFToken(null);
      });

    // Select company
    builder
      .addCase(selectCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(selectCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = { ...state.user!, company_id: action.payload.companyId };
        state.selectedCompany = state.companies.find(c => c.id === action.payload.companyId) || state.selectedCompany;
        state.sessionExpiry = action.payload.expiresAt || null;
      })
      .addCase(selectCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.companies = action.payload.companies || [];
        state.hasMultipleCompanies = action.payload.hasMultipleCompanies || false;
        state.isAuthenticated = true;
        state.passwordChangeRequired = action.payload.user.requires_password_change || false;
        state.error = null;

        if (action.payload.companies && action.payload.companies.length > 0) {
          const primary = action.payload.companies.find((c: Company) => c.is_primary) || action.payload.companies[0];
          state.selectedCompany = primary;
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Refresh session
    builder
      .addCase(refreshSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionExpiry = action.payload.expiresAt || null;
        state.error = null;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.companies = action.payload.companies || [];
        state.hasMultipleCompanies = action.payload.hasMultipleCompanies || false;
        state.isAuthenticated = true;
        state.passwordChangeRequired = action.payload.user.requires_password_change || false;
        state.error = null;

        if (action.payload.companies && action.payload.companies.length > 0) {
          const primary = action.payload.companies.find((c: Company) => c.is_primary) || action.payload.companies[0];
          state.selectedCompany = primary;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { setUser, clearAuth, clearError, setError, setSessionExpiry } = authSlice.actions;
export default authSlice.reducer;
