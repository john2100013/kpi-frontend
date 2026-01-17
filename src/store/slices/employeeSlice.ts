import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api';
import { RootState } from '../index';

// Types
interface Employee {
  id: number;
  name: string;
  email: string;
  payroll_number: string;
  department: string;
  department_id?: number;
  position: string;
  manager_id?: number;
  manager_name?: string;
  status?: string;
  phone?: string;
  hire_date?: string;
  company_id?: number;
}

interface EmployeeState {
  employees: Employee[];
  currentEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  filters: {
    search?: string;
    department?: string;
    manager?: number;
    status?: string;
  };
}

// Initial state
const initialState: EmployeeState = {
  employees: [],
  currentEmployee: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
  },
  filters: {},
};

// Async thunks

/**
 * Fetch all employees with optional filters and pagination
 */
export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      department?: string;
      manager?: number;
      status?: string;
      companyId?: number;
      managerId?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      console.log('[employeeSlice] 📡 Fetching employees with params:', params);
      // Backend uses /users/list with role=employee parameter
      const response = await api.get('/users/list', { 
        params: { ...params, role: 'employee' } 
      });
      console.log('[employeeSlice] ✅ Employees fetched:', {
        count: response.data.users?.length || 0,
        total: response.data.pagination?.total || 0
      });
      return response.data;
    } catch (error: any) {
      console.error('[employeeSlice] ❌ Failed to fetch employees:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

/**
 * Fetch a single employee by ID
 */
export const fetchEmployeeById = createAsyncThunk(
  'employees/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employee');
    }
  }
);

/**
 * Create a new employee
 */
export const createEmployee = createAsyncThunk(
  'employees/create',
  async (
    data: {
      name: string;
      email: string;
      payroll_number: string;
      department_id: number;
      position: string;
      manager_id?: number;
      phone?: string;
      hire_date?: string;
      password?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/employees', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

/**
 * Update an existing employee
 */
export const updateEmployee = createAsyncThunk(
  'employees/update',
  async (
    {
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        name: string;
        email: string;
        payroll_number: string;
        department_id: number;
        position: string;
        manager_id?: number;
        phone?: string;
        status?: string;
      }>;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/employees/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

/**
 * Delete an employee
 */
export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/employees/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete employee');
    }
  }
);

/**
 * Upload employees from Excel file
 */
export const uploadEmployeesExcel = createAsyncThunk(
  'employees/uploadExcel',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/employees/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload Excel file');
    }
  }
);

/**
 * Fetch employees by department
 */
export const fetchEmployeesByDepartment = createAsyncThunk(
  'employees/fetchByDepartment',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/employees/department/${departmentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

/**
 * Fetch employees by manager
 */
export const fetchEmployeesByManager = createAsyncThunk(
  'employees/fetchByManager',
  async (managerId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/employees/manager/${managerId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

// Slice
const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setCurrentEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.currentEmployee = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<EmployeeState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    clearEmployees: (state) => {
      state.employees = [];
      state.pagination = {
        page: 1,
        totalPages: 1,
        total: 0,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch all employees
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        console.log('[employeeSlice] 📋 Processing fetched employees:', action.payload);
        
        // Backend returns { success: true, data: { users: [...], pagination: {...} } }
        if (action.payload.data?.users) {
          state.employees = action.payload.data.users;
          state.pagination = action.payload.data.pagination || {
            page: 1,
            totalPages: 1,
            total: action.payload.data.users.length,
          };
        } else if (action.payload.users) {
          // Direct format: { users: [...], pagination: {...} }
          state.employees = action.payload.users;
          state.pagination = action.payload.pagination || {
            page: 1,
            totalPages: 1,
            total: action.payload.users.length,
          };
        } else if (action.payload.employees) {
          // Fallback for legacy format
          state.employees = action.payload.employees;
          state.pagination = {
            page: action.payload.page || 1,
            totalPages: action.payload.totalPages || 1,
            total: action.payload.total || action.payload.employees.length,
          };
        } else if (Array.isArray(action.payload)) {
          state.employees = action.payload;
        } else {
          console.warn('[employeeSlice] ⚠️ Unexpected payload format:', action.payload);
          state.employees = [];
        }
        console.log('[employeeSlice] ✅ Employees stored:', {
          count: state.employees.length,
          pagination: state.pagination
        });
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('[employeeSlice] ❌ fetchEmployees rejected:', action.payload);
      });

    // Fetch employee by ID
    builder
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEmployee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create employee
    builder
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees.push(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update employee
    builder
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employees.findIndex((emp) => emp.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = action.payload;
        }
        if (state.currentEmployee?.id === action.payload.id) {
          state.currentEmployee = action.payload;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete employee
    builder
      .addCase(deleteEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = state.employees.filter((emp) => emp.id !== action.payload);
        if (state.currentEmployee?.id === action.payload) {
          state.currentEmployee = null;
        }
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Upload Excel
    builder
      .addCase(uploadEmployeesExcel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadEmployeesExcel.fulfilled, (state, action) => {
        state.loading = false;
        // After Excel upload, typically need to refetch the full list
        // The uploaded employees info is returned but we'll refetch for consistency
        if (action.payload.employees) {
          state.employees = [...state.employees, ...action.payload.employees];
        }
      })
      .addCase(uploadEmployeesExcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch by department
    builder
      .addCase(fetchEmployeesByDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeesByDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = Array.isArray(action.payload) ? action.payload : action.payload.employees || [];
      })
      .addCase(fetchEmployeesByDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch by manager
    builder
      .addCase(fetchEmployeesByManager.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeesByManager.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = Array.isArray(action.payload) ? action.payload : action.payload.employees || [];
      })
      .addCase(fetchEmployeesByManager.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { setCurrentEmployee, setFilters, clearFilters, clearError, clearEmployees } =
  employeeSlice.actions;

// Selectors

/**
 * Select all employees
 */
export const selectEmployees = (state: RootState) => state.employees.employees;

/**
 * Select current employee
 */
export const selectCurrentEmployee = (state: RootState) => state.employees.currentEmployee;

/**
 * Select loading state
 */
export const selectEmployeesLoading = (state: RootState) => state.employees.loading;

/**
 * Select error state
 */
export const selectEmployeesError = (state: RootState) => state.employees.error;

/**
 * Select pagination info
 */
export const selectEmployeesPagination = (state: RootState) => state.employees.pagination;

/**
 * Select filters
 */
export const selectEmployeesFilters = (state: RootState) => state.employees.filters;

/**
 * Memoized selector: Get active employees only
 */
export const selectActiveEmployees = createSelector([selectEmployees], (employees) =>
  employees.filter((emp) => emp.status === 'active' || !emp.status)
);

/**
 * Memoized selector: Get employees by department
 */
export const selectEmployeesByDepartment = createSelector(
  [selectEmployees, (_state: RootState, department: string) => department],
  (employees, department) => employees.filter((emp) => emp.department === department)
);

/**
 * Memoized selector: Get employees by manager
 */
export const selectEmployeesByManager = createSelector(
  [selectEmployees, (_state: RootState, managerId: number) => managerId],
  (employees, managerId) => employees.filter((emp) => emp.manager_id === managerId)
);

/**
 * Memoized selector: Get filtered employees based on current filters
 */
export const selectFilteredEmployees = createSelector(
  [selectEmployees, selectEmployeesFilters],
  (employees, filters) => {
    let filtered = employees;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          emp.payroll_number.toLowerCase().includes(searchLower)
      );
    }

    if (filters.department) {
      filtered = filtered.filter((emp) => emp.department === filters.department);
    }

    if (filters.manager) {
      filtered = filtered.filter((emp) => emp.manager_id === filters.manager);
    }

    if (filters.status) {
      filtered = filtered.filter((emp) => emp.status === filters.status);
    }

    return filtered;
  }
);

/**
 * Memoized selector: Get employee count by department
 */
export const selectEmployeeCountByDepartment = createSelector([selectEmployees], (employees) => {
  const counts: Record<string, number> = {};
  employees.forEach((emp) => {
    counts[emp.department] = (counts[emp.department] || 0) + 1;
  });
  return counts;
});

/**
 * Memoized selector: Get departments list from employees
 */
export const selectUniqueDepartments = createSelector([selectEmployees], (employees) => {
  const departments = new Set(employees.map((emp) => emp.department));
  return Array.from(departments).sort();
});

// Reducer export
export default employeeSlice.reducer;
