import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Components
import Sidebar from '../../components/admin/Sidebar/Sidebar';
import Header from '../../components/admin/Header/Header';
import DashboardView from '../../components/admin/DashboardView/DashboardView';
import TeachersManagementView from '../../components/admin/TeachersManagementView/TeachersManagementView';
import StudentsManagementView from '../../components/admin/StudentsManagementView/StudentsManagementView';
import ReportsView from '../../components/admin/ReportsView/ReportsView';
import AnalyticsView from '../../components/admin/AnalyticsView/AnalyticsView';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal/DeleteConfirmModal';
import TeacherModal from '../../components/admin/TeacherModal/TeacherModal';
import StudentModal from '../../components/admin/StudentModal/StudentModal';
import TeacherDetailModal from '../../components/admin/TeacherDetailModal/TeacherDetailModal';
import StudentDetailModal from '../../components/admin/StudentDetailModal/StudentDetailModal';

// Redux actions
import {
  getDashboardStats,
  getAllTeachers,
  getAllStudents,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  addStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  getTeacherReports,
  getStudentReports,
  getAttendanceStats,
  getAcademicReports,
  getClassWiseAnalytics,
  getSubjectWiseAnalytics,
  clearError,
  clearSuccess,
} from '../../feature/admin/adminSlice';

export default function SchoolAdminDashboard() {
  const dispatch = useDispatch();
  const {
    dashboardStats,
    teachers,
    teachersPagination,
    students,
    studentsPagination,
    teacherReports,
    studentReports,
    attendanceStats,
    academicReports,
    classWiseAnalytics,
    subjectWiseAnalytics,
    loading,
    error,
    success,
    successMessage,
  } = useSelector((state) => state.admin);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useSelector((state) => state.auth);
  // Use admin_id from user object, or fallback to 'ADMIN-001' only if absolutely necessary (or just null)
  // Assuming the user object for admin has 'admin_id' or 'id'
  const adminId = user?.admin_id || user?.id || 'ADMIN-001';

  // Modal states
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null,
    item: null,
  });

  const [teacherModal, setTeacherModal] = useState({
    isOpen: false,
    mode: 'add',
    teacher: null,
  });

  const [studentModal, setStudentModal] = useState({
    isOpen: false,
    mode: 'add',
    student: null,
  });

  const [teacherDetailModal, setTeacherDetailModal] = useState({
    isOpen: false,
    teacher: null,
  });

  const [studentDetailModal, setStudentDetailModal] = useState({
    isOpen: false,
    student: null,
  });

  // Teacher pagination
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherSearch, setTeacherSearch] = useState('');

  // Student pagination
  const [studentPage, setStudentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');

  //sort
  const [studentFilters, setStudentFilters] = useState({
    class: '',
    section: '',
    year: ''
  });
  const [studentSort, setStudentSort] = useState('');

  // Initial data load
  useEffect(() => {
    dispatch(getDashboardStats(adminId));
  }, [dispatch, adminId]);

  // Load data based on current view
  useEffect(() => {
    switch (currentView) {
      case 'teachers':
        dispatch(getAllTeachers({
          adminId,
          params: { page: teacherPage, search: teacherSearch }
        }));
        break;
      case 'students':
        dispatch(getAllStudents({
          adminId,
          params: {
            page: studentPage,
            search: studentSearch,
            class: studentFilters.class,
            section: studentFilters.section,
            year: studentFilters.year,
            sortBy: studentSort
          }
        }));
        break;
      case 'reports':
        dispatch(getTeacherReports(adminId));
        dispatch(getStudentReports({ adminId }));
        dispatch(getAttendanceStats({ adminId }));
        dispatch(getAcademicReports(adminId));
        break;
      case 'analytics':
        dispatch(getClassWiseAnalytics(adminId));
        dispatch(getSubjectWiseAnalytics(adminId));
        break;
      default:
        break;
    }
  }, [currentView, dispatch, adminId, studentPage, studentSearch, studentFilters, studentSort, teacherPage, teacherSearch]);

  // Handle success/error notifications
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(clearSuccess());
        // Refresh data after successful operation
        if (currentView === 'teachers') {
          dispatch(getAllTeachers({ adminId, params: { page: teacherPage } }));
        } else if (currentView === 'students') {
          dispatch(getAllStudents({ adminId, params: { page: studentPage } }));
        }
        dispatch(getDashboardStats(adminId));
      }, 2000);
    }
  }, [success, dispatch, adminId, currentView, teacherPage, studentPage]);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatch(clearError());
      }, 3000);
    }
  }, [error, dispatch]);

  //sort
  const handleStudentFilterChange = (filters) => {
    setStudentFilters(filters);
    setStudentPage(1); // Reset to first page when filtering
  };

  const handleStudentSortChange = (sort) => {
    setStudentSort(sort);
  };

  // Teacher handlers
  const handleTeacherSearch = (search) => {
    setTeacherSearch(search);
    setTeacherPage(1);
  };

  const handleTeacherPageChange = (page) => {
    setTeacherPage(page);
  };

  const handleAddTeacher = () => {
    setTeacherModal({ isOpen: true, mode: 'add', teacher: null });
  };

  const handleEditTeacher = (teacher) => {
    setTeacherModal({ isOpen: true, mode: 'edit', teacher });
  };

  const handleTeacherSubmit = (teacherData) => {
    if (teacherModal.mode === 'add') {
      dispatch(addTeacher({ adminId, teacherData }));
    } else {
      dispatch(updateTeacher({
        adminId,
        teacherId: teacherModal.teacher.teacher_id,
        updateData: teacherData
      }));
    }
    setTeacherModal({ isOpen: false, mode: 'add', teacher: null });
  };

  const handleViewTeacher = (teacher) => {
    setTeacherDetailModal({ isOpen: true, teacher });
  };

  const handleDeleteTeacher = (teacher) => {
    setDeleteModal({
      isOpen: true,
      type: 'teacher',
      item: teacher,
    });
  };

  // Student handlers
  const handleStudentSearch = (search) => {
    setStudentSearch(search);
    setStudentPage(1);
  };

  const handleStudentPageChange = (page) => {
    setStudentPage(page);
  };

  const handleAddStudent = () => {
    setStudentModal({ isOpen: true, mode: 'add', student: null });
  };

  const handleEditStudent = (student) => {
    setStudentModal({ isOpen: true, mode: 'edit', student });
  };

  const handleStudentSubmit = (submitData) => {
    if (submitData.type === 'csv') {
      // Handle CSV bulk upload
      dispatch(bulkUploadStudents({ adminId, csvData: submitData.data }));
    } else if (studentModal.mode === 'add') {
      // Handle manual add
      dispatch(addStudent({ adminId, studentData: submitData.data }));
    } else {
      // Handle edit
      dispatch(updateStudent({
        adminId,
        studentId: studentModal.student.admission_no,
        updateData: submitData.data
      }));
    }
    setStudentModal({ isOpen: false, mode: 'add', student: null });
  };

  const handleViewStudent = (student) => {
    setStudentDetailModal({ isOpen: true, student });
  };

  const handleDeleteStudent = (student) => {
    setDeleteModal({
      isOpen: true,
      type: 'student',
      item: student,
    });
  };

  // Delete confirmation
  const handleConfirmDelete = () => {
    if (deleteModal.type === 'teacher') {
      dispatch(deleteTeacher({
        adminId,
        teacherId: deleteModal.item.teacher_id
      }));
    } else if (deleteModal.type === 'student') {
      dispatch(deleteStudent({
        adminId,
        studentId: deleteModal.item.admission_no
      }));
    }
    setDeleteModal({ isOpen: false, type: null, item: null });
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            dashboardStats={dashboardStats}
            onViewChange={setCurrentView}
          />
        );
      case 'teachers':
        return (
          <TeachersManagementView
            teachers={teachers}
            pagination={teachersPagination}
            loading={loading}
            onAdd={handleAddTeacher}
            onEdit={handleEditTeacher}
            onDelete={handleDeleteTeacher}
            onView={handleViewTeacher}
            onSearch={handleTeacherSearch}
            onPageChange={handleTeacherPageChange}
          />
        );
      case 'students':
        return (
          <StudentsManagementView
            students={students}
            pagination={studentsPagination}
            loading={loading}
            onAdd={handleAddStudent}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            onView={handleViewStudent}
            onSearch={handleStudentSearch}
            onPageChange={handleStudentPageChange}
            onFilterChange={handleStudentFilterChange}
            onSortChange={handleStudentSortChange}
          />
        );
      case 'reports':
        return (
          <ReportsView
            teacherReports={teacherReports}
            studentReports={studentReports}
            attendanceStats={attendanceStats}
            academicReports={academicReports}
            loading={loading}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            classWiseAnalytics={classWiseAnalytics}
            subjectWiseAnalytics={subjectWiseAnalytics}
            loading={loading}
          />
        );
      default:
        return (
          <DashboardView
            dashboardStats={dashboardStats}
            onViewChange={setCurrentView}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Success Notification */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage || 'Operation completed successfully!'}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error.message || 'Something went wrong!'}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} />

        <main className="flex-1 overflow-y-auto p-6">
          {renderView()}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
        onConfirm={handleConfirmDelete}
        itemType={deleteModal.type}
        itemName={
          deleteModal.type === 'teacher'
            ? deleteModal.item?.personal_details?.name
            : deleteModal.type === 'student'
              ? `${deleteModal.item?.personal_details?.first_name} ${deleteModal.item?.personal_details?.last_name}`
              : ''
        }
      />

      {/* Teacher Modal */}
      <TeacherModal
        isOpen={teacherModal.isOpen}
        onClose={() => setTeacherModal({ isOpen: false, mode: 'add', teacher: null })}
        onSubmit={handleTeacherSubmit}
        teacher={teacherModal.teacher}
        mode={teacherModal.mode}
      />

      {/* Student Modal */}
      <StudentModal
        isOpen={studentModal.isOpen}
        onClose={() => setStudentModal({ isOpen: false, mode: 'add', student: null })}
        onSubmit={handleStudentSubmit}
        student={studentModal.student}
        mode={studentModal.mode}
      />

      {/* Teacher Detail Modal */}
      <TeacherDetailModal
        isOpen={teacherDetailModal.isOpen}
        onClose={() => setTeacherDetailModal({ isOpen: false, teacher: null })}
        teacher={teacherDetailModal.teacher}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={studentDetailModal.isOpen}
        onClose={() => setStudentDetailModal({ isOpen: false, student: null })}
        student={studentDetailModal.student}
      />
    </div>
  );
}
