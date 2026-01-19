import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:5000/api/student";
// const API_URL = "https://schoolerp-1xul.onrender.com/api/student";
//  https://schoolerp-1xul.onrender.com
console.log("ENV:", process.env.REACT_APP_API_URL);
 const API_URL =`${process.env.REACT_APP_API_URL}/api/student`

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

// ========== NEW RESULTS ACTIONS ==========

// Get all results
export const getStudentResults = createAsyncThunk(
  "student/getResults",
  async ({ admissionNo, year = "2024-25", params = {} }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({ year, ...params }).toString();
      const res = await axios.get(`${API_URL}/${admissionNo}/results?${query}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get student analytics
export const getStudentAnalytics = createAsyncThunk(
  "student/getAnalytics",
  async ({ admissionNo, year = "2024-25" }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${admissionNo}/analytics?year=${year}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get exam-wise results
export const getExamResults = createAsyncThunk(
  "student/getExamResults",
  async ({ admissionNo, examId, year = "2024-25" }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${API_URL}/${admissionNo}/results/exam/${examId}?year=${year}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get performance graph data
export const getPerformanceGraph = createAsyncThunk(
  "student/getPerformanceGraph",
  async ({ admissionNo, type, year = "2024-25" }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${API_URL}/${admissionNo}/performance-graph?type=${type}&year=${year}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get subject performance details
export const getSubjectPerformance = createAsyncThunk(
  "student/getSubjectPerformance",
  async ({ admissionNo, subject, year = "2024-25" }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${API_URL}/${admissionNo}/subject-performance/${subject}?year=${year}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get class rank
export const getClassRank = createAsyncThunk(
  "student/getClassRank",
  async ({ admissionNo, examId, year = "2024-25" }, { rejectWithValue }) => {
    try {
      const query = examId ? `?exam_id=${examId}&year=${year}` : `?year=${year}`;
      const res = await axios.get(`${API_URL}/${admissionNo}/class-rank${query}`);
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
  // New results state
  results: [],
  analytics: null,
  examResults: null,
  performanceGraph: null,
  subjectPerformance: null,
  classRank: null,

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
  getResults: "results",
  getAnalytics: "analytics",
  getExamResults: "examResults",
  getPerformanceGraph: "performanceGraph",
  getSubjectPerformance: "subjectPerformance",
  getClassRank: "classRank",
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