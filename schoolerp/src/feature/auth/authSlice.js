import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "./axios";

// Async Thunks
export const validateToken = createAsyncThunk(
  "auth/validateToken",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const res = await API.get("/api/auth/validate", {
        headers: { Authorization: `Bearer ${token}` }
      });

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue("Session expired");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/login", credentials);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async ({ email, googleToken }, { rejectWithValue }) => {
    try {
      const response = await API.post("/api/auth/login", {
        email,
        googleToken,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Google login failed");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/forgot-password", { email });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to send OTP");
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/verify-otp", data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Invalid OTP");
    }
  }
);

export const resetPasswordAction = createAsyncThunk(
  "auth/resetPassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/reset-password", data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Password Reset Failed");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    role: localStorage.getItem("role") || null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null,
    message: null,
  },

  reducers: {
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.message = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("role", action.payload.role);
    },
    clearError: (state) => {
      state.error = null;
      state.message = null;
    }
  },

  extraReducers: (builder) => {
    builder
      // Validate Token
      .addCase(validateToken.pending, (state) => { state.loading = true })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.role = action.payload.user?.role || "student";
        // Update localStorage to keep it fresh
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        if (action.payload.user?.role) localStorage.setItem("role", action.payload.user.role);
      })
      .addCase(validateToken.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      })

      // Login User (Email/Pass)
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.role;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("role", action.payload.role);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Google Login
      .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.role;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("role", action.payload.role);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Forgot Pass
      .addCase(forgotPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify OTP
      .addCase(verifyOTP.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset Pass
      .addCase(resetPasswordAction.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(resetPasswordAction.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(resetPasswordAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

