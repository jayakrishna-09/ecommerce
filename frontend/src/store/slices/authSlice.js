import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Load initial state from localStorage
const initialState = {
  user: JSON.parse(localStorage.getItem('users')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
};

// Map frontend roles to backend routes
const roleApiMap = {
  customer: 'customers',
  vendor: 'vendors',
  admin: 'admin',
};

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ role, credentials }, { rejectWithValue }) => {
    try {
      const apiRole = roleApiMap[role];
      await axios.post(`http://localhost:5000/api/${apiRole}/register`, credentials);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ role, email, password }, { rejectWithValue }) => {
    try {
      const apiRole = roleApiMap[role];
      const { data } = await axios.post(
        `http://localhost:5000/api/${apiRole}/login`,
        {email, password}
      );

      const user = {
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
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
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
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;