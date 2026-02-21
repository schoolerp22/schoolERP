import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/admin`;

// ==================== DASHBOARD STATISTICS ====================

export const getDashboardStats = createAsyncThunk(
    "admin/getDashboardStats",
    async (adminId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/dashboard-stats`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ==================== TEACHER MANAGEMENT ====================

export const getAllTeachers = createAsyncThunk(
    "admin/getAllTeachers",
    async ({ adminId, params = {} }, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_URL}/${adminId}/teachers?${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getTeacherById = createAsyncThunk(
    "admin/getTeacherById",
    async ({ adminId, teacherId }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/teachers/${teacherId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const addTeacher = createAsyncThunk(
    "admin/addTeacher",
    async ({ adminId, teacherData }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/${adminId}/teachers`, teacherData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateTeacher = createAsyncThunk(
    "admin/updateTeacher",
    async ({ adminId, teacherId, updateData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/${adminId}/teachers/${teacherId}`, updateData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteTeacher = createAsyncThunk(
    "admin/deleteTeacher",
    async ({ adminId, teacherId }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_URL}/${adminId}/teachers/${teacherId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ==================== STUDENT MANAGEMENT ====================

export const getAllStudents = createAsyncThunk(
    "admin/getAllStudents",
    async ({ adminId, params = {} }, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_URL}/${adminId}/students?${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getStudentById = createAsyncThunk(
    "admin/getStudentById",
    async ({ adminId, studentId }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/students/${studentId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const addStudent = createAsyncThunk(
    "admin/addStudent",
    async ({ adminId, studentData }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/${adminId}/students`, studentData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateStudent = createAsyncThunk(
    "admin/updateStudent",
    async ({ adminId, studentId, updateData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/${adminId}/students/${studentId}`, updateData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteStudent = createAsyncThunk(
    "admin/deleteStudent",
    async ({ adminId, studentId }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_URL}/${adminId}/students/${studentId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const bulkUploadStudents = createAsyncThunk(
    "admin/bulkUploadStudents",
    async ({ adminId, csvData }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/${adminId}/students/bulk-upload`, { csvData });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ==================== TEACHER ATTENDANCE ADMIN ====================

export const getTeachersAttendance = createAsyncThunk(
    "admin/getTeachersAttendance",
    async ({ adminId, date }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/teachers-attendance?date=${date}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getTeacherAttendanceBacklogs = createAsyncThunk(
    "admin/getTeacherAttendanceBacklogs",
    async ({ adminId, status }, { rejectWithValue }) => {
        try {
            const query = status ? `?status=${status}` : '';
            const response = await axios.get(`${API_URL}/${adminId}/teacher-attendance-backlog${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const approveTeacherAttendanceBacklog = createAsyncThunk(
    "admin/approveTeacherAttendanceBacklog",
    async ({ adminId, requestId, status, remarks }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/${adminId}/teacher-attendance-backlog/${requestId}/approve`, {
                status,
                remarks
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ==================== TEACHER LEAVES ADMIN ====================

export const getTeacherLeaves = createAsyncThunk(
    "admin/getTeacherLeaves",
    async ({ adminId, status }, { rejectWithValue }) => {
        try {
            const query = status ? `?status=${status}` : '';
            const response = await axios.get(`${API_URL}/${adminId}/teacher-leaves${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const approveTeacherLeave = createAsyncThunk(
    "admin/approveTeacherLeave",
    async ({ adminId, leaveId, status, remarks }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/${adminId}/teacher-leaves/${leaveId}/approve`, {
                status,
                remarks
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ==================== REPORTS & ANALYTICS ====================

export const getTeacherReports = createAsyncThunk(
    "admin/getTeacherReports",
    async (adminId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/reports/teachers`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getStudentReports = createAsyncThunk(
    "admin/getStudentReports",
    async ({ adminId, params = {} }, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_URL}/${adminId}/reports/students?${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getAttendanceStats = createAsyncThunk(
    "admin/getAttendanceStats",
    async ({ adminId, params = {} }, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_URL}/${adminId}/reports/attendance?${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getAcademicReports = createAsyncThunk(
    "admin/getAcademicReports",
    async (adminId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/reports/academic`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getClassWiseAnalytics = createAsyncThunk(
    "admin/getClassWiseAnalytics",
    async (adminId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/analytics/class-wise`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getSubjectWiseAnalytics = createAsyncThunk(
    "admin/getSubjectWiseAnalytics",
    async (adminId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${adminId}/analytics/subject-wise`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ==================== INITIAL STATE ====================

const initialState = {
    // Dashboard
    dashboardStats: null,

    // Teachers
    teachers: [],
    teachersPagination: null,
    selectedTeacher: null,

    // Students
    students: [],
    studentsPagination: null,
    selectedStudent: null,

    // Reports
    teacherReports: [],
    studentReports: [],
    attendanceStats: null,
    academicReports: [],

    // Analytics
    classWiseAnalytics: [],
    subjectWiseAnalytics: [],

    // Teacher Attendance & Leaves Admin
    teachersAttendanceData: [],
    teacherAttendanceBacklogs: [],
    teacherLeaveRequests: [],

    // UI State
    loading: false,
    error: null,
    success: false,
    successMessage: null,
};

// ==================== SLICE ====================

const adminSlice = createSlice({
    name: "admin",
    initialState,
    reducers: {
        resetAdmin: (state) => {
            return initialState;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
            state.successMessage = null;
        },
        setSelectedTeacher: (state, action) => {
            state.selectedTeacher = action.payload;
        },
        setSelectedStudent: (state, action) => {
            state.selectedStudent = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Dashboard Stats
            .addCase(getDashboardStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(getDashboardStats.fulfilled, (state, action) => {
                state.loading = false;
                state.dashboardStats = action.payload;
            })
            .addCase(getDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get All Teachers
            .addCase(getAllTeachers.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllTeachers.fulfilled, (state, action) => {
                state.loading = false;
                state.teachers = action.payload.teachers;
                state.teachersPagination = action.payload.pagination;
            })
            .addCase(getAllTeachers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Teacher Leaves Admin
            .addCase(getTeacherLeaves.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTeacherLeaves.fulfilled, (state, action) => {
                state.loading = false;
                state.teacherLeaveRequests = action.payload;
            })
            .addCase(getTeacherLeaves.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(approveTeacherLeave.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveTeacherLeave.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(approveTeacherLeave.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get Teacher By ID
            .addCase(getTeacherById.fulfilled, (state, action) => {
                state.selectedTeacher = action.payload;
            })

            // Add Teacher
            .addCase(addTeacher.pending, (state) => {
                state.loading = true;
            })
            .addCase(addTeacher.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(addTeacher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Teacher
            .addCase(updateTeacher.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateTeacher.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(updateTeacher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Teacher
            .addCase(deleteTeacher.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteTeacher.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(deleteTeacher.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get All Students
            .addCase(getAllStudents.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllStudents.fulfilled, (state, action) => {
                state.loading = false;
                state.students = action.payload.students;
                state.studentsPagination = action.payload.pagination;
            })
            .addCase(getAllStudents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get Student By ID
            .addCase(getStudentById.fulfilled, (state, action) => {
                state.selectedStudent = action.payload;
            })

            // Add Student
            .addCase(addStudent.pending, (state) => {
                state.loading = true;
            })
            .addCase(addStudent.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(addStudent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Student
            .addCase(updateStudent.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateStudent.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(updateStudent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Student
            .addCase(deleteStudent.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteStudent.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(deleteStudent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Bulk Upload Students
            .addCase(bulkUploadStudents.pending, (state) => {
                state.loading = true;
            })
            .addCase(bulkUploadStudents.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(bulkUploadStudents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Reports
            .addCase(getTeacherReports.fulfilled, (state, action) => {
                state.teacherReports = action.payload;
            })
            .addCase(getStudentReports.fulfilled, (state, action) => {
                state.studentReports = action.payload;
            })
            .addCase(getAttendanceStats.fulfilled, (state, action) => {
                state.attendanceStats = action.payload;
            })
            .addCase(getAcademicReports.fulfilled, (state, action) => {
                state.academicReports = action.payload;
            })

            // Analytics
            .addCase(getClassWiseAnalytics.fulfilled, (state, action) => {
                state.classWiseAnalytics = action.payload;
            })
            .addCase(getSubjectWiseAnalytics.fulfilled, (state, action) => {
                state.subjectWiseAnalytics = action.payload;
            })

            // Teacher Attendance Admin
            .addCase(getTeachersAttendance.pending, (state) => {
                state.loading = true;
            })
            .addCase(getTeachersAttendance.fulfilled, (state, action) => {
                state.loading = false;
                state.teachersAttendanceData = action.payload;
            })
            .addCase(getTeachersAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getTeacherAttendanceBacklogs.pending, (state) => {
                state.loading = true;
            })
            .addCase(getTeacherAttendanceBacklogs.fulfilled, (state, action) => {
                state.loading = false;
                state.teacherAttendanceBacklogs = action.payload;
            })
            .addCase(getTeacherAttendanceBacklogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(approveTeacherAttendanceBacklog.pending, (state) => {
                state.loading = true;
            })
            .addCase(approveTeacherAttendanceBacklog.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.successMessage = action.payload.message;
            })
            .addCase(approveTeacherAttendanceBacklog.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    resetAdmin,
    clearError,
    clearSuccess,
    setSelectedTeacher,
    setSelectedStudent
} = adminSlice.actions;

export default adminSlice.reducer;
