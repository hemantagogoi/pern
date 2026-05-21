import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, getApiErrorMessage } from '../../lib/api.js';

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('token', data.token);
    return data.user;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Login failed'));
  }
});

export const loadMe = createAsyncThunk('auth/me', async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false
  },
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loadMe.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
