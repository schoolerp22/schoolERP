import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader, Home, Calendar, BookOpen, Menu, Bell } from "lucide-react";

import Sidebar from "../../components/student/Sidebar/Sidebar";
import DashboardView from "../../components/student/DashboardView/DashboardView";
import HomeworkView from "../../components/student/HomeworkView/HomeworkView";
import AttendanceView from "../../components/student/AttendanceView/AttendanceView";
import ExamView from "../../components/student/ExamView/ExamView";
import FeesView from "../../components/student/FeesView/FeesView";
import TransportView from "../../components/student/TransportView/TransportView";
import TimetableView from "../../components/student/TimetableView/TimetableView";
import AnnouncementsView from "../../components/student/AnnouncementsView/AnnouncementsView";
//Import Results Dashboard
import StudentResultsDashboard from "../../components/student/StudentResultsDashboard/StudentResultsDashboard";
import LeaveApplication from "../../components/student/LeaveApplication/LeaveApplication";
import StudentChatView from "../../components/student/StudentChatView/StudentChatView";


import {
  getStudentProfile,
  getStudentHomework,
  getStudentAttendance,
  getExamRecords,
  getPaymentHistory,
  getTransportDetails,
  getTimeTable,
  getAnnouncements,
  getStudentLeaves,
  // Import results actions
  getStudentResults,
  getStudentAnalytics
} from "../../feature/students/studentSlice";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { profile, homework, attendance, exams, payments, transport, timetable, announcements, results, analytics, loading, error } =
    useSelector((state) => state.student);
  const { user } = useSelector((state) => state.auth);
  console.log("user------sss", user);
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [academicYear, setAcademicYear] = useState("2024-25"); // Default year
  const studentId = user?.admission_no || user?.id; // Replace with auth id from context/redux

  useEffect(() => {
    console.log("🔄 Loading student data for:", studentId);

    dispatch(getStudentProfile(studentId));
    dispatch(getStudentHomework(studentId));
    dispatch(getStudentAttendance(studentId));
    dispatch(getExamRecords(studentId));
    dispatch(getPaymentHistory(studentId));
    dispatch(getTransportDetails(studentId));
    dispatch(getTimeTable(studentId));
    dispatch(getAnnouncements(studentId));
    dispatch(getStudentLeaves(studentId));
  }, [dispatch, studentId]);

  // Load results when profile is available or year changes
  useEffect(() => {
    if (profile?.admission_no) {
      console.log(`📊 Fetching results for ${profile.admission_no} year ${academicYear}`);
      dispatch(getStudentResults({
        admissionNo: profile.admission_no,
        year: academicYear
      }));
      dispatch(getStudentAnalytics({
        admissionNo: profile.admission_no,
        year: academicYear
      }));
    }
  }, [dispatch, profile?.admission_no, academicYear]);

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex justify-center items-center flex-col">
        <p className="text-red-500 text-xl mb-4">Error: {typeof error === 'string' ? error : error?.message || JSON.stringify(error)}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (loading || !profile) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  // Render different views based on selected menu
  const renderView = () => {
    switch (view) {
      case "dashboard":
        return <DashboardView profile={profile} homework={homework} exams={exams} />;
      case "homework":
        return <HomeworkView homework={homework} studentId={studentId} />;
      case "attendance":
        return <AttendanceView attendance={attendance} />;
      case "exam":
        return <ExamView exams={exams} />;
      case "fees":
        return <FeesView payments={payments} />;
      case "transport":
        return <TransportView transport={transport} />;
      case "timetable":
        return <TimetableView timetable={timetable} />
      case "leave":
        return <LeaveApplication />;
      case "announcements":
        return <AnnouncementsView announcements={announcements} />;
      case "class-chat":
        return <StudentChatView />;
      case "results":
        return (
          <StudentResultsDashboard
            admissionNo={profile.admission_no}
            analytics={analytics}
            results={results}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
          />
        );
      default:
        return <DashboardView profile={profile} homework={homework} exams={exams} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        profile={profile}
        currentView={view}
        onViewChange={setView}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header (replaces Sidebar branding on small screens when closed) */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 flex items-center justify-between md:hidden shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Student Portal</h1>
          <button
            onClick={() => setView("announcements")}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <Bell size={20} />
          </button>
        </header>

        <main className={`flex-1 min-h-0 ${view === 'class-chat' ? 'overflow-hidden p-0' : 'overflow-y-auto custom-scrollbar bg-gray-50 pb-20 md:p-6 md:pb-6'}`}>
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 pb-safe z-40">
        <button
          onClick={() => setView("dashboard")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === "dashboard" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => setView("attendance")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === "attendance" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <Calendar size={20} />
          <span className="text-[10px] font-medium">Attendance</span>
        </button>
        <button
          onClick={() => setView("homework")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === "homework" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] font-medium">Homework</span>
        </button>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-900"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;