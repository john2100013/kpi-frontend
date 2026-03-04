import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as bonusApi from '../../services/bonusApi';
import type { EmployeeBonus, BonusType, BonusMultiplier } from '../../services/bonusApi';

// Types
interface BonusState {
  bonusTypes: BonusType[];
  employeeBonuses: EmployeeBonus[];
  multipliers: BonusMultiplier[];
  currentBonus: EmployeeBonus | null;
  loading: boolean;
  multipliersLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: BonusState = {
  bonusTypes: [],
  employeeBonuses: [],
  multipliers: [],
  currentBonus: null,
  loading: false,
  multipliersLoading: false,
  error: null,
};

// Async thunks
export const fetchBonusTypes = createAsyncThunk(
  'bonus/fetchTypes',
  async (_, { rejectWithValue }) => {
    try {
      const bonusTypes = await bonusApi. getBonusTypes();
      return bonusTypes;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bonus types');
    }
  }
);

export const fetchEmployeeBonuses = createAsyncThunk(
  'bonus/fetchEmployeeBonuses',
  async (filters: { employeeId?: number; departmentId?: number; paymentStatus?: string; year?: number; quarter?: string } | undefined, { rejectWithValue }) => {
    try {
      const bonuses = await bonusApi.getEmployeeBonuses(filters);
      return bonuses;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employee bonuses');
    }
  }
);

export const updateBonusStatus = createAsyncThunk(
  'bonus/updateStatus',
  async ({ bonusId, status, notes }: {
    bonusId: number;
    status: 'pending' | 'paid' | 'rejected';
    notes?: string;
  }, { rejectWithValue }) => {
    try {
      const bonus = await bonusApi.updateBonusStatus(bonusId, status, notes);
      return bonus;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update bonus status');
    }
  }
);

export const adjustBonusAmount = createAsyncThunk(
  'bonus/adjustAmount',
  async ({ bonusId, amount, reason }: {
    bonusId: number;
    amount: number;
    reason: string;
  }, { rejectWithValue }) => {
    try {
      const bonus = await bonusApi.adjustBonusAmount(bonusId, amount, reason);
      return bonus;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to adjust bonus amount');
    }
  }
);

export const calculateEmployeeBonus = createAsyncThunk(
  'bonus/calculateEmployee',
  async (bonusData: {
    employeeId: number;
    kpiId: number;
    periodType?: 'quarterly' | 'yearly';
  }, { rejectWithValue }) => {
    try {
      const bonus = await bonusApi.calculateEmployeeBonus(bonusData);
      return bonus;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to calculate employee bonus');
    }
  }
);

// Bonus Multiplier Thunks
export const fetchBonusMultipliers = createAsyncThunk(
  'bonus/fetchMultipliers',
  async (_, { rejectWithValue }) => {
    try {
      const multipliers = await bonusApi.getBonusMultipliers();
      return multipliers;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bonus multipliers. Please try again.');
    }
  }
);

export const createBonusMultiplier = createAsyncThunk(
  'bonus/createMultiplier',
  async (multiplierData: {
    achievementPercentage: number;
    multiplier: number;
    displayOrder?: number;
  }, { rejectWithValue }) => {
    try {
      const multiplier = await bonusApi.createBonusMultiplier(multiplierData);
      return multiplier;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create bonus multiplier. Please check your input.');
    }
  }
);

export const updateBonusMultiplier = createAsyncThunk(
  'bonus/updateMultiplier',
  async ({ multiplierId, multiplierData }: {
    multiplierId: number;
    multiplierData: {
      achievementPercentage: number;
      multiplier: number;
      displayOrder?: number;
    };
  }, { rejectWithValue }) => {
    try {
      const multiplier = await bonusApi.updateBonusMultiplier(multiplierId, multiplierData);
      return multiplier;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update bonus multiplier. Please try again.');
    }
  }
);

export const deleteBonusMultiplier = createAsyncThunk(
  'bonus/deleteMultiplier',
  async (multiplierId: number, { rejectWithValue }) => {
    try {
      await bonusApi.deleteBonusMultiplier(multiplierId);
      return multiplierId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete bonus multiplier');
    }
  }
);

export const bulkUploadMultipliers = createAsyncThunk(
  'bonus/bulkUploadMultipliers',
  async (file: File, { rejectWithValue }) => {
    try {
      const result = await bonusApi.bulkUploadMultipliers(file);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload multipliers. Please check the file format.');
    }
  }
);

// Slice
const bonusSlice = createSlice({
  name: 'bonus',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBonus: (state, action: PayloadAction<EmployeeBonus | null>) => {
      state.currentBonus = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch bonus types
    builder
      .addCase(fetchBonusTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBonusTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.bonusTypes = action.payload;
      })
      .addCase(fetchBonusTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch employee bonuses
    builder
      .addCase(fetchEmployeeBonuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeBonuses.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeBonuses = action.payload;
      })
      .addCase(fetchEmployeeBonuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update bonus status
    builder
      .addCase(updateBonusStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBonusStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employeeBonuses.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.employeeBonuses[index] = action.payload;
        }
      })
      .addCase(updateBonusStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Adjust bonus amount
    builder
      .addCase(adjustBonusAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adjustBonusAmount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employeeBonuses.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.employeeBonuses[index] = action.payload;
        }
      })
      .addCase(adjustBonusAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Calculate employee bonus
    builder
      .addCase(calculateEmployeeBonus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateEmployeeBonus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employeeBonuses.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.employeeBonuses[index] = action.payload;
        } else {
          state.employeeBonuses.push(action.payload);
        }
      })
      .addCase(calculateEmployeeBonus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch bonus multipliers
    builder
      .addCase(fetchBonusMultipliers.pending, (state) => {
        state.multipliersLoading = true;
        state.error = null;
      })
      .addCase(fetchBonusMultipliers.fulfilled, (state, action) => {
       
        state.multipliersLoading = false;
        state.multipliers = action.payload;
      
      })
      .addCase(fetchBonusMultipliers.rejected, (state, action) => {
        state.multipliersLoading = false;
        state.error = action.payload as string;
      });

    // Create bonus multiplier
    builder
      .addCase(createBonusMultiplier.pending, (state) => {
        state.multipliersLoading = true;
        state.error = null;
      })
      .addCase(createBonusMultiplier.fulfilled, (state, action) => {
        state.multipliersLoading = false;
        state.multipliers.push(action.payload);
      })
      .addCase(createBonusMultiplier.rejected, (state, action) => {
        state.multipliersLoading = false;
        state.error = action.payload as string;
      });

    // Update bonus multiplier
    builder
      .addCase(updateBonusMultiplier.pending, (state) => {
        state.multipliersLoading = true;
        state.error = null;
      })
      .addCase(updateBonusMultiplier.fulfilled, (state, action) => {
        state.multipliersLoading = false;
        const index = state.multipliers.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.multipliers[index] = action.payload;
        }
      })
      .addCase(updateBonusMultiplier.rejected, (state, action) => {
        state.multipliersLoading = false;
        state.error = action.payload as string;
      });

    // Delete bonus multiplier
    builder
      .addCase(deleteBonusMultiplier.pending, (state) => {
        state.multipliersLoading = true;
        state.error = null;
      })
      .addCase(deleteBonusMultiplier.fulfilled, (state, action) => {
        state.multipliersLoading = false;
        state.multipliers = state.multipliers.filter((m) => m.id !== action.payload);
      })
      .addCase(deleteBonusMultiplier.rejected, (state, action) => {
        state.multipliersLoading = false;
        state.error = action.payload as string;
      });

    // Bulk upload bonus multipliers
    builder
      .addCase(bulkUploadMultipliers.pending, (state) => {
        state.multipliersLoading = true;
        state.error = null;
      })
      .addCase(bulkUploadMultipliers.fulfilled, (state, action) => {
        state.multipliersLoading = false;
        // Refresh multipliers list after successful upload
        // The payload contains the uploaded multipliers
        if (action.payload.multipliers) {
          state.multipliers = action.payload.multipliers;
        }
      })
      .addCase(bulkUploadMultipliers.rejected, (state, action) => {
        state.multipliersLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentBonus } = bonusSlice.actions;
export default bonusSlice.reducer;
