import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
}

interface Credentials {
  name: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
};

// Role mapping
const roleApiMap: Record<string, string> = {
  customer: 'customers',
  vendor: 'vendors',
  admin: 'admin',
};

// Async thunks
export const registerUser = createAsyncThunk<
  { success: boolean },
  { role: keyof typeof roleApiMap; credentials: Credentials },
  { rejectValue: string }
>(
  'auth/register',
  async ({ role, credentials }, { rejectWithValue }) => {
    try {
      const apiRole = roleApiMap[role];
      await axios.post(`http://localhost:5000/api/${apiRole}/register`, credentials);
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk<
  { user: User; token: string },
  { role: keyof typeof roleApiMap; email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ role, email, password }, { rejectWithValue }) => {
    try {
      const apiRole = roleApiMap[role];
      const { data } = await axios.post(
        `http://localhost:5000/api/${apiRole}/login`,
        { email, password }
      );

      const user: User = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      const token = data.token;

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.user = null;
        state.token = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload!;
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload!;
      });
  },
});

export const { logout, clearError, setError } = authSlice.actions;
export default authSlice.reducer;