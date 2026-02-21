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

// Get students for results upload (separate from attendance)
export const getStudentsForResults = createAsyncThunk(
  "teacher/getStudentsForResults",
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

// Edit homework
export const editHomework = createAsyncThunk(
  "teacher/editHomework",
  async ({ teacherId, homeworkId, homeworkData }, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response = await axios.put(
        `${API_URL}/${teacherId}/homework/${homeworkId}`,
        homeworkData,
        config
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get homework submissions
export const getHomeworkSubmissions = createAsyncThunk(
  "teacher/getHomeworkSubmissions",
  async ({ teacherId, homeworkId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/${teacherId}/homework/${homeworkId}/submissions`
      );
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

// Assign homework (Supports File Upload)
export const assignHomework = createAsyncThunk(
  "teacher/assignHomework",
  async ({ teacherId, homeworkData }, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response = await axios.post(`${API_URL}/${teacherId}/homework`, homeworkData, config);
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

// Create announcement (Supports File Upload)
export const createAnnouncement = createAsyncThunk(
  "teacher/createAnnouncement",
  async ({ teacherId, announcementData }, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response = await axios.post(`${API_URL}/${teacherId}/announcements`, announcementData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Update announcement
export const updateAnnouncement = createAsyncThunk(
  "teacher/updateAnnouncement",
  async ({ teacherId, announcementId, announcementData }, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response = await axios.put(`${API_URL}/${teacherId}/announcements/${announcementId}`, announcementData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Delete announcement
export const deleteAnnouncement = createAsyncThunk(
  "teacher/deleteAnnouncement",
  async ({ teacherId, announcementId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${teacherId}/announcements/${announcementId}`);
      return announcementId; // Return ID to filter out from state
    } catch (error) {
       return rejectWithValue(
        error.response?.data || error.message || "Something went wrong"
      );
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
  async ({ teacherId, classNum, section = "A", year = "2024-25" }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/${teacherId}/marking-scheme/${classNum}?year=${year}&section=${section}`
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
  submissions: [], // For viewing homework submissions
  announcements: [],
  leaveRequests: [], // Pending requests
  allLeaveRequests: [], // Approved, Rejected, Pending
  approvedLeaves: [], // New state for auto-marking
  dashboardStats: null,
  // results state
  markingScheme: null,
  resultsStudents: [], // Separate state for results upload
  classResults: [],
  resultsStats: null,
  classComparison: [],
  timetable: null,

  loadings: {
    profile: false,
    students: false,
    stats: false,
    markingScheme: false,
    results: false,
    leaves: false,
    attendance: false,
    announcements: false,
    homework: false
  },
  loading: false, // Global/Form loading
  error: null,
  success: false,
};


// Save/Update Timetable
export const saveTimetable = createAsyncThunk(
  "teacher/saveTimetable",
  async ({ teacherId, classSection, timetable }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/${teacherId}/timetable`,
        { classSection, timetable }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get Timetable
export const getTimetable = createAsyncThunk(
  "teacher/getTimetable",
  async ({ teacherId, classSection }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/${teacherId}/timetable/${classSection}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

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
        state.loadings.profile = true;
      })
      .addCase(getTeacherProfile.fulfilled, (state, action) => {
        state.loadings.profile = false;
        state.profile = action.payload;
      })
      .addCase(getTeacherProfile.rejected, (state, action) => {
        state.loadings.profile = false;
        state.error = action.payload;
      })

      // Get Students
      .addCase(getAssignedStudents.pending, (state) => {
        state.loadings.students = true;
      })
      .addCase(getAssignedStudents.fulfilled, (state, action) => {
        state.loadings.students = false;
        state.students = action.payload;
      })
      .addCase(getAssignedStudents.rejected, (state, action) => {
        state.loadings.students = false;
        state.error = action.payload;
      })

      // Get Students by Class
      .addCase(getStudentsByClass.pending, (state) => {
        state.loadings.students = true;
      })
      .addCase(getStudentsByClass.fulfilled, (state, action) => {
        state.loadings.students = false;
        state.selectedClassStudents = action.payload;
      })
      .addCase(getStudentsByClass.rejected, (state, action) => {
        state.loadings.students = false;
        state.error = action.payload;
      })

      // Get Students for Results Upload (separate state)
      .addCase(getStudentsForResults.pending, (state) => {
        state.loadings.students = true;
      })
      .addCase(getStudentsForResults.fulfilled, (state, action) => {
        state.loadings.students = false;
        state.resultsStudents = action.payload;
      })
      .addCase(getStudentsForResults.rejected, (state, action) => {
        state.loadings.students = false;
        state.error = action.payload;
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
        state.loadings.attendance = true;
      })
      .addCase(getAttendanceSummary.fulfilled, (state, action) => {
        state.loadings.attendance = false;
        state.attendanceSummary = action.payload;
      })
      .addCase(getAttendanceSummary.rejected, (state, action) => {
        state.loadings.attendance = false;
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

      // Edit Homework
      .addCase(editHomework.pending, (state) => {
        state.loading = true;
      })
      .addCase(editHomework.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(editHomework.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Homework Submissions
      .addCase(getHomeworkSubmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getHomeworkSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(getHomeworkSubmissions.rejected, (state, action) => {
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

      // Update Announcement
      .addCase(updateAnnouncement.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Announcement
      .addCase(deleteAnnouncement.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.announcements = state.announcements.filter(a => a._id !== action.payload);
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
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
        state.loadings.leaves = true;
      })
      .addCase(getAllLeaveRequests.fulfilled, (state, action) => {
        state.loadings.leaves = false;
        state.allLeaveRequests = action.payload;
      })
      .addCase(getAllLeaveRequests.rejected, (state, action) => {
        state.loadings.leaves = false;
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
        state.loadings.markingScheme = true;
      })
      .addCase(getMarkingScheme.fulfilled, (state, action) => {
        state.loadings.markingScheme = false;
        state.markingScheme = action.payload;
      })
      .addCase(getMarkingScheme.rejected, (state, action) => {
        state.loadings.markingScheme = false;
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
        state.loadings.results = true;
      })
      .addCase(getClassResults.fulfilled, (state, action) => {
        state.loadings.results = false;
        state.classResults = action.payload;
      })
      .addCase(getClassResults.rejected, (state, action) => {
        state.loadings.results = false;
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
      })
      // Save Timetable
      .addCase(saveTimetable.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Optionally update local state if needed
      })
      .addCase(saveTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Timetable
      .addCase(getTimetable.pending, (state) => {
        state.loadings.timetable = true;
      })
      .addCase(getTimetable.fulfilled, (state, action) => {
        state.loadings.timetable = false;
        state.timetable = action.payload;
      })
      .addCase(getTimetable.rejected, (state, action) => {
        state.loadings.timetable = false;
        state.error = action.payload;
      });
  },
});

export const { resetTeacher, clearError, clearSuccess } = teacherSlice.actions;
export default teacherSlice.reducer;