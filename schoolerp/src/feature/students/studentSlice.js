import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:5000/api/student";
const API_URL = "https://schoolerp-1xul.onrender.com/api/student";
//  https://schoolerp-1xul.onrender.com

// Get Student Profile
export const getStudentProfile = createAsyncThunk(
  "student/getProfile",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/profile`);
      console.log("✅ Profile fetched:", res.data);
      return res.data;
    } catch (err) {
      console.error("❌ Profile error:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Homework Assigned
export const getStudentHomework = createAsyncThunk(
  "student/getHomework",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/homework`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Attendance
export const getStudentAttendance = createAsyncThunk(
  "student/getAttendance",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/attendance`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Exam Marks
export const getExamRecords = createAsyncThunk(
  "student/getExams",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/exams`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Fees
export const getPaymentHistory = createAsyncThunk(
  "student/getPayments",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/payments`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Transport
export const getTransportDetails = createAsyncThunk(
  "student/getTransport",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/transport`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Timetable
export const getTimeTable = createAsyncThunk(
  "student/getTimetable",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/timetable`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Announcements
export const getAnnouncements = createAsyncThunk(
  "student/getAnnouncements",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/announcements`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  profile: null,
  homework: [],
  attendance: [],
  exams: [],
  payments: [],
  transport: null,
  timetable: [],
  announcements: [],
  loading: false,
  error: null,
};

// Map action names to state keys
const ACTION_TO_STATE_KEY = {
  getProfile: "profile",
  getHomework: "homework",
  getAttendance: "attendance",
  getExams: "exams",
  getPayments: "payments",
  getTransport: "transport",
  getTimetable: "timetable",
  getAnnouncements: "announcements",
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    resetStudent: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Pending matcher
      .addMatcher(
        (action) => action?.type?.startsWith("student/") && action?.type?.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      // Fulfilled matcher
      .addMatcher(
        (action) => action?.type?.startsWith("student/") && action?.type?.endsWith("/fulfilled"),
        (state, action) => {
          state.loading = false;
          
          // Extract action name: "student/getProfile/fulfilled" → "getProfile"
          const actionName = action.type.split("/")[1];
          const stateKey = ACTION_TO_STATE_KEY[actionName];
          
          if (stateKey) {
            state[stateKey] = action.payload;
            console.log(`✅ ${stateKey} updated:`, action.payload);
          }
        }
      )
      // Rejected matcher
      .addMatcher(
        (action) => action?.type?.startsWith("student/") && action?.type?.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action?.payload || "An error occurred";
          console.error("❌ Error:", action.payload);
        }
      );
  },
});

export const { resetStudent } = studentSlice.actions;
export default studentSlice.reducer;