import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:5000/api/teacher";
const API_URL = "https://schoolerp-1xul.onrender.com/api/teacher";
 

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
      const response = await axios.post(`${API_URL}/${teacherId}/announcement`, announcementData);
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

const initialState = {
  profile: null,
  students: [],
  selectedClassStudents: [],
  attendance: [],
  homework: [],
  announcements: [],
  leaveRequests: [],
  dashboardStats: null,
  loading: false,
  error: null,
  success: false,
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    resetTeacher: (state) => {
      state.profile = null;
      state.students = [];
      state.selectedClassStudents = [];
      state.attendance = [];
      state.homework = [];
      state.announcements = [];
      state.leaveRequests = [];
      state.dashboardStats = null;
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
      
      // Assign Homework
      .addCase(assignHomework.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignHomework.fulfilled, (state, action) => {
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
      
      // Get Leave Requests
      .addCase(getLeaveRequests.fulfilled, (state, action) => {
        state.leaveRequests = action.payload;
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
      });
  },
});

export const { resetTeacher, clearError, clearSuccess } = teacherSlice.actions;
export default teacherSlice.reducer;