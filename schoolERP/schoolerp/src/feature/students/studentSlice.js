import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:5000/api/student";
// const API_URL = "https://schoolerp-1xul.onrender.com/api/student";
//  https://schoolerp-1xul.onrender.com
console.log("ENV:", process.env.REACT_APP_API_URL);
const API_URL = `${process.env.REACT_APP_API_URL}/api/student`

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

// Submit Homework
export const submitHomework = createAsyncThunk(
  "student/submitHomework",
  async ({ studentId, homeworkId, submissionData }, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response = await axios.post(
        `${API_URL}/${studentId}/homework/${homeworkId}/submit`,
        submissionData,
        config
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
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

// Teachers list for leave application
export const fetchStudentTeachers = createAsyncThunk(
  "student/fetchTeachers",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/teachers`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Apply for Leave
export const applyForLeave = createAsyncThunk(
  "student/applyLeave",
  async ({ studentId, leaveData }, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const res = await axios.post(`${API_URL}/${studentId}/leave`, leaveData, config);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Student Leaves
export const getStudentLeaves = createAsyncThunk(
  "student/getLeaves",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${studentId}/leaves`);
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

// Helper to get initial profile from localStorage (if user is student)
const getInitialProfile = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return (user && user.role === "student") ? user : null;
  } catch (error) {
    return null;
  }
};

const initialState = {
  profile: getInitialProfile(),
  homework: [],
  attendance: [],
  exams: [],
  payments: [],
  transport: null,
  timetable: [],
  announcements: [],
  leaves: [], // Student leave history
  // New results state
  results: [],
  analytics: null,
  examResults: null,
  performanceGraph: null,
  subjectPerformance: null,
  classRank: null,
  teachers: null, // Change to null to differentiate "not fetched" from "no results"
  leaveSuccess: false,

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
  fetchTeachers: "teachers",
  getLeaves: "leaves",
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    resetStudent: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Special case for leave application
      .addCase(applyForLeave.fulfilled, (state) => {
        state.loading = false;
        state.leaveSuccess = true;
      })
      .addCase(applyForLeave.pending, (state) => {
        state.leaveSuccess = false;
      })
      .addCase(applyForLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Pending matcher
      .addMatcher(
        (action) => action?.type?.startsWith("student/") && action?.type?.endsWith("/pending"),
        (state) => {
          state.loading = true;
          // Only clear error if it's not a common "loading" state conflict
          // (Actually, let's keep it but handle teachers better)
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