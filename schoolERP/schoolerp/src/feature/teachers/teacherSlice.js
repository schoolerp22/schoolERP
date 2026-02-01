import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:5000/api/teacher";
// const API_URL = "https://schoolerp-1xul.onrender.com/api/teacher";
const API_URL = `${process.env.REACT_APP_API_URL}/api/teacher`


// Get teacher profile
export const getTeacherProfile = createAsyncThunk(
  "teacher/getProfile",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/profile`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get assigned students
export const getAssignedStudents = createAsyncThunk(
  "teacher/getStudents",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/students`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get students by class-section
export const getStudentsByClass = createAsyncThunk(
  "teacher/getStudentsByClass",
  async ({ teacherId, classSection }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/students/${classSection}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Mark attendance
export const markAttendance = createAsyncThunk(
  "teacher/markAttendance",
  async ({ teacherId, attendanceData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${teacherId}/attendance`, attendanceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get attendance
export const getAttendance = createAsyncThunk(
  "teacher/getAttendance",
  async ({ teacherId, date, classSection }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/attendance/${date}/${classSection}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Assign homework
export const assignHomework = createAsyncThunk(
  "teacher/assignHomework",
  async ({ teacherId, homeworkData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${teacherId}/homework`, homeworkData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get homework
export const getHomework = createAsyncThunk(
  "teacher/getHomework",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/homework`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Create announcement
export const createAnnouncement = createAsyncThunk(
  "teacher/createAnnouncement",
  async ({ teacherId, announcementData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${teacherId}/announcements`, announcementData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get announcements
export const getAnnouncements = createAsyncThunk(
  "teacher/getAnnouncements",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/announcements`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get leave requests
export const getLeaveRequests = createAsyncThunk(
  "teacher/getLeaveRequests",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/leave-requests`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get all leave requests (History)
export const getAllLeaveRequests = createAsyncThunk(
  "teacher/getAllLeaveRequests",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/leave-history`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Approve leave
export const approveLeave = createAsyncThunk(
  "teacher/approveLeave",
  async ({ teacherId, leaveData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${teacherId}/leave-approval`, leaveData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get dashboard stats
export const getDashboardStats = createAsyncThunk(
  "teacher/getDashboardStats",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${teacherId}/dashboard-stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ========== NEW RESULTS MANAGEMENT ACTIONS ==========

// Get marking scheme
export const getMarkingScheme = createAsyncThunk(
  "teacher/getMarkingScheme",
  async ({ teacherId, classNum, year = "2024-25" }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/${teacherId}/marking-scheme/${classNum}?year=${year}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Upload results
export const uploadResults = createAsyncThunk(
  "teacher/uploadResults",
  async ({ teacherId, resultsData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/${teacherId}/results/upload`,
        resultsData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get class results
export const getClassResults = createAsyncThunk(
  "teacher/getClassResults",
  async ({ teacherId, classNum, section, params = {} }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${API_URL}/${teacherId}/results/${classNum}/${section}?${query}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update result
export const updateResult = createAsyncThunk(
  "teacher/updateResult",
  async ({ teacherId, resultId, updateData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${teacherId}/results/${resultId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Publish results
export const publishResults = createAsyncThunk(
  "teacher/publishResults",
  async ({ teacherId, publishData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/${teacherId}/results/publish`,
        publishData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete result
export const deleteResult = createAsyncThunk(
  "teacher/deleteResult",
  async ({ teacherId, resultId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${teacherId}/results/${resultId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get results dashboard stats
export const getResultsStats = createAsyncThunk(
  "teacher/getResultsStats",
  async ({ teacherId, year = "2024-25" }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/${teacherId}/results/stats/dashboard?year=${year}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get class performance comparison
export const getClassComparison = createAsyncThunk(
  "teacher/getClassComparison",
  async ({ teacherId, params = {} }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${API_URL}/${teacherId}/results/stats/class-comparison?${query}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get Attendance Summary (Weekly/Monthly/Custom)
export const getAttendanceSummary = createAsyncThunk(
  "teacher/getAttendanceSummary",
  async ({ teacherId, classSection, ...params }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({
        classSection,
        range: params.range || "overall",
        ...params
      }).toString();
      const response = await axios.get(`${API_URL}/${teacherId}/attendance-summary?${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get Approved Leaves
export const getApprovedLeaves = createAsyncThunk(
  "teacher/getApprovedLeaves",
  async ({ teacherId, date, classSection }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/${teacherId}/approved-leaves?date=${date}&classSection=${classSection}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


// Helper for teacher
const getInitialProfile = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return (user && user.role === "teacher") ? user : null;
  } catch (error) {
    return null;
  }
};

const initialState = {
  profile: getInitialProfile(),
  students: [],
  selectedClassStudents: [],
  attendance: [],
  attendanceSummary: [], // Added for overview
  homework: [],
  announcements: [],
  leaveRequests: [], // Pending requests
  allLeaveRequests: [], // Approved, Rejected, Pending
  approvedLeaves: [], // New state for auto-marking
  dashboardStats: null,
  // results state
  markingScheme: null,
  classResults: [],
  resultsStats: null,
  classComparison: [],

  loading: false,
  error: null,
  success: false,
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    resetTeacher: (state) => {
      // ... existing reset logic
      state.profile = null;
      state.students = [];
      state.selectedClassStudents = [];
      state.attendance = [];
      state.attendanceSummary = [];
      state.homework = [];
      state.announcements = [];
      state.leaveRequests = [];
      state.allLeaveRequests = [];
      state.dashboardStats = null;
      //result
      state.markingScheme = null;
      state.classResults = [];
      state.resultsStats = null;
      state.classComparison = [];

      state.error = null;
      state.success = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ... existing reducers ...
      // Get Profile
      .addCase(getTeacherProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTeacherProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getTeacherProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Students
      .addCase(getAssignedStudents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAssignedStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload;
      })
      .addCase(getAssignedStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Students by Class
      .addCase(getStudentsByClass.fulfilled, (state, action) => {
        state.selectedClassStudents = action.payload;
      })

      // Mark Attendance
      .addCase(markAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Attendance
      .addCase(getAttendance.fulfilled, (state, action) => {
        state.attendance = action.payload;
      })

      // Get Attendance Summary (NEW)
      .addCase(getAttendanceSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAttendanceSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.attendanceSummary = action.payload;
      })
      .addCase(getAttendanceSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Approved Leaves
      .addCase(getApprovedLeaves.fulfilled, (state, action) => {
        state.approvedLeaves = action.payload;
      })

      // Assign Homework
      .addCase(assignHomework.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignHomework.fulfilled, (state, action) => {
        console.log("HOMEWORK PAYLOAD 👉", action.payload);
        state.loading = false;
        state.success = true;
      })
      .addCase(assignHomework.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Homework
      .addCase(getHomework.fulfilled, (state, action) => {
        state.homework = action.payload;
      })

      // Create Announcement
      .addCase(createAnnouncement.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Announcements
      .addCase(getAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload;
      })

      .addCase(getLeaveRequests.fulfilled, (state, action) => {
        state.leaveRequests = action.payload;
      })

      // Get All Leave Requests (History)
      .addCase(getAllLeaveRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.allLeaveRequests = action.payload;
      })
      .addCase(getAllLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Approve Leave
      .addCase(approveLeave.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(approveLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Dashboard Stats
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      // ========== NEW RESULTS REDUCERS ==========

      // Get Marking Scheme
      .addCase(getMarkingScheme.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMarkingScheme.fulfilled, (state, action) => {
        state.loading = false;
        state.markingScheme = action.payload;
      })
      .addCase(getMarkingScheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Upload Results
      .addCase(uploadResults.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadResults.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(uploadResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Class Results
      .addCase(getClassResults.pending, (state) => {
        state.loading = true;
      })
      .addCase(getClassResults.fulfilled, (state, action) => {
        state.loading = false;
        state.classResults = action.payload;
      })
      .addCase(getClassResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Result
      .addCase(updateResult.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateResult.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Publish Results
      .addCase(publishResults.pending, (state) => {
        state.loading = true;
      })
      .addCase(publishResults.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(publishResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Result
      .addCase(deleteResult.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteResult.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Results Stats
      .addCase(getResultsStats.fulfilled, (state, action) => {
        state.resultsStats = action.payload;
      })

      // Get Class Comparison
      .addCase(getClassComparison.fulfilled, (state, action) => {
        state.classComparison = action.payload;
      });
  },
});

export const { resetTeacher, clearError, clearSuccess } = teacherSlice.actions;
export default teacherSlice.reducer;