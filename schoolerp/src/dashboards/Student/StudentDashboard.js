import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "lucide-react";

import Sidebar from "../../components/student/Sidebar/Sidebar";
import DashboardView from "../../components/student/DashboardView/DashboardView";
import HomeworkView from "../../components/student/HomeworkView/HomeworkView";
import AttendanceView from "../../components/student/AttendanceView/AttendanceView";
import ExamView from "../../components/student/ExamView/ExamView";
import FeesView from "../../components/student/FeesView/FeesView";
import TransportView from "../../components/student/TransportView/TransportView";
import TimetableView from "../../components/student/TimetableView/TimetableView";
import AnnouncementsView from "../../components/student/AnnouncementsView/AnnouncementsView";


import {
  getStudentProfile,
  getStudentHomework,
  getStudentAttendance,
  getExamRecords,
  getPaymentHistory,
  getTransportDetails,
  getTimeTable,
  getAnnouncements
} from "../../feature/students/studentSlice";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { profile, homework, attendance, exams, payments, transport, timetable, announcements, loading, error } =
    useSelector((state) => state.student);

  const [view, setView] = useState("dashboard");
  const studentId = "2026-001"; // Replace with auth id from context/redux

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
  }, [dispatch, studentId]);

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex justify-center items-center flex-col">
        <p className="text-red-500 text-xl mb-4">Error: {error}</p>
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
        return <HomeworkView homework={homework} />;
      case "attendance":
        return <AttendanceView attendance={attendance} />;
      case "exam":
        return <ExamView exams={exams} />;
      case "fees":
        return <FeesView payments={payments} />;
      case "transport":
        return <TransportView transport={transport} />;
      case "timetable":
        return <TimetableView timetable={timetable} />;
      case "announcements":
        return <AnnouncementsView announcements={announcements} />;
      default:
        return <DashboardView profile={profile} homework={homework} exams={exams} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        profile={profile} 
        currentView={view} 
        onViewChange={setView} 
      />
      
      <main className="flex-1 p-6 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default StudentDashboard;