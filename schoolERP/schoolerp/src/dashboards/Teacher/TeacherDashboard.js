import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader } from 'lucide-react';

import Sidebar from '../../components/teacher/Sidebar/Sidebar';
import Header from '../../components/teacher/Header/Header';
import DashboardView from '../../components/teacher/DashboardView/DashboardView';
import { Home, Users as UsersIcon, Calendar as CalendarIcon, Menu as MenuIcon } from 'lucide-react';
import StudentsView from '../../components/teacher/StudentsView/StudentsView';
import AttendanceView from '../../components/teacher/AttendanceView/AttendanceView';
import HomeworkView from '../../components/teacher/HomeworkView/HomeworkView';
import AnnouncementsView from '../../components/teacher/AnnouncementsView/AnnouncementsView';
import LeaveApproval from '../../components/teacher/LeaveApproval/LeaveApproval';
import TimetableManagement from '../../components/teacher/TimetableManagement/TimetableManagement';
//Import Results Components
import ResultsUpload from '../../components/teacher/ResultsUpload/ResultsUpload';
import TeacherPerformanceDashboard from '../../components/teacher/TeacherPerformanceDashboard/TeacherPerformanceDashboard';
import MyAttendanceView from '../../components/teacher/MyAttendanceView/MyAttendanceView';
import MyLeavesView from '../../components/teacher/MyLeavesView/MyLeavesView';
import TeacherChatView from '../../components/teacher/ClassChatView/TeacherChatView';

import {
  getTeacherProfile,
  getAssignedStudents,
  getStudentsByClass,
  getDashboardStats,
  getLeaveRequests,
  getAllLeaveRequests,
  clearError,
  clearSuccess
} from '../../feature/teachers/teacherSlice';

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  console.log("TeacherDashboard Render. User:", user);
  const {
    profile,
    // students, 
    selectedClassStudents,
    dashboardStats,
    leaveRequests,

    loadings,

    error,
    success
  } = useSelector((state) => state.teacher);

  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default false for mobile first, can adjust based on screen size later
  const [selectedClass, setSelectedClass] = useState('');

  const teacherId = user?.teacher_id;
  console.log("Derived teacherId:", teacherId);

  useEffect(() => {
    if (teacherId) {
      console.log("Dispatching teacher actions for:", teacherId);
      dispatch(getTeacherProfile(teacherId));
      dispatch(getAssignedStudents(teacherId));
      dispatch(getDashboardStats(teacherId));
      dispatch(getLeaveRequests(teacherId));
      dispatch(getAllLeaveRequests(teacherId));
    } else {
      console.log("Skipping dispatch - teacherId is missing");
    }
  }, [dispatch, teacherId]);

  useEffect(() => {
    if (profile && profile.assigned_classes && profile.assigned_classes.length > 0) {
      const firstClass = profile.assigned_classes[0];
      const hasSection = firstClass.section && firstClass.section !== 'undefined';
      setSelectedClass(hasSection ? `${firstClass.class}-${firstClass.section}` : `${firstClass.class}`);
    }
  }, [profile]);

  useEffect(() => {
    if (selectedClass) {
      dispatch(getStudentsByClass({ teacherId, classSection: selectedClass }));
    }
  }, [selectedClass, dispatch, teacherId]);

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(clearSuccess());
        dispatch(getDashboardStats(teacherId));
        dispatch(getLeaveRequests(teacherId));
        dispatch(getAllLeaveRequests(teacherId));
      }, 2000);
    }
  }, [success, dispatch, teacherId]);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatch(clearError());
      }, 3000);
    }
  }, [error, dispatch]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            dashboardStats={dashboardStats}
            onViewChange={setCurrentView}
          />
        );
      case 'students':
        return (
          <StudentsView
            students={selectedClassStudents}
            selectedClass={selectedClass}
            loadings={loadings}
          />
        );
      case 'my-attendance':
        return (
          <MyAttendanceView />
        );
      case 'my-leaves':
        return (
          <MyLeavesView />
        );
      case 'attendance':
        return (
          <AttendanceView
            students={selectedClassStudents}
            selectedClass={selectedClass}
            teacherId={teacherId}
            loadings={loadings}
          />
        );
      case 'homework':
        return (
          <HomeworkView
            selectedClass={selectedClass}
            teacherId={teacherId}
            profile={profile}
          />
        );
      case 'results':
      case 'results-upload':
        return (
          <ResultsUpload
            teacherId={teacherId}
            profile={profile}
            selectedClass={selectedClass}
          />
        );
      case 'results-performance':
        return (
          <TeacherPerformanceDashboard
            teacherId={teacherId}
            profile={profile}
          />
        );
      case 'announcements':
        return (
          <AnnouncementsView
            selectedClass={selectedClass}
            teacherId={teacherId}
            profile={profile}
          />
        );
      case 'leaves':
        return (
          <LeaveApproval
            teacherId={teacherId}
          />
        );
      case 'timetable':
        return (
          <TimetableManagement
            teacherId={teacherId}
            selectedClass={selectedClass}
          />
        );
      case 'class-chat':
        return <TeacherChatView selectedClass={selectedClass} />;
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
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error.message || 'Something went wrong!'}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Operation completed successfully!
        </div>
      )}

      <Sidebar
        profile={profile}
        currentView={currentView}
        onViewChange={setCurrentView}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          profile={profile}
          currentView={currentView}
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
          leaveRequests={leaveRequests}
        />

        <main className={`flex-1 min-h-0 ${currentView === 'class-chat' ? 'overflow-hidden p-0' : 'overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24 md:pb-6'}`}>
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex justify-around items-center py-2 px-2 safe-area-pb">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <Home size={24} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
        <button
          onClick={() => setCurrentView('students')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentView === 'students' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <UsersIcon size={24} />
          <span className="text-[10px] mt-1 font-medium">Students</span>
        </button>
        <button
          onClick={() => setCurrentView('attendance')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentView === 'attendance' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <CalendarIcon size={24} />
          <span className="text-[10px] mt-1 font-medium">Attendance</span>
        </button>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center p-2 rounded-lg text-gray-500"
        >
          <MenuIcon size={24} />
          <span className="text-[10px] mt-1 font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;