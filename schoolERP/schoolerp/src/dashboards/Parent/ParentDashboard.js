import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchChildren, fetchNotifications, setSelectedChild } from "../../feature/parent/parentSlice";
import { logout } from "../../feature/auth/authSlice";
import { useNavigate } from "react-router-dom";
import ParentSidebar from "../../components/parent/ParentSidebar";
import ChildSelector from "../../components/parent/ChildSelector";
import OverviewView from "../../components/parent/OverviewView";
import AttendanceView from "../../components/parent/AttendanceView";
import ResultsView from "../../components/parent/ResultsView";
import FeesView from "../../components/parent/FeesView";
import NotificationsView from "../../components/parent/NotificationsView";
import "./ParentDashboard.css"; // Restored - conflicting layout rules are now commented out in the CSS file

export default function ParentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { children, selectedChild, notifications, loading } = useSelector(s => s.parent);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    dispatch(fetchChildren());
    dispatch(fetchNotifications());
  }, [dispatch]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const renderView = () => {
    if (!selectedChild) return (
      <div className="parent-empty-state">
        <div className="parent-empty-icon">👨‍👩‍👦</div>
        <h3>No students linked</h3>
        <p>Please contact your school administrator to link your children to this account.</p>
      </div>
    );
    switch (activeView) {
      case "overview": return <OverviewView />;
      case "attendance": return <AttendanceView />;
      case "results": return <ResultsView />;
      case "fees": return <FeesView />;
      case "notifications": return <NotificationsView />;
      default: return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <ParentSidebar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        isOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h1 className="text-xl font-bold text-gray-800">
              {activeView === "overview" && "Dashboard Overview"}
              {activeView === "attendance" && "Attendance History"}
              {activeView === "results" && "Examination Results"}
              {activeView === "fees" && "Fee & Payment Management"}
              {activeView === "notifications" && "Recent Notifications"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full" onClick={() => setActiveView("notifications")}>
                🔔 <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{unreadCount}</span>
              </button>
            )}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700">{user?.name || "Parent"}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Parent Account</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-4 md:p-6 pb-24 md:pb-6">
          {/* Child Selector */}
          {children.length > 1 && (
            <div className="mb-6">
              <ChildSelector
                children={children}
                selectedChild={selectedChild}
                onSelect={(child) => dispatch(setSelectedChild(child))}
              />
            </div>
          )}

          <div className="max-w-7xl mx-auto">
            {loading && <div className="h-1 bg-indigo-600 animate-pulse mb-4 rounded" />}
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
