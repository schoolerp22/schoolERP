import React from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../../feature/auth/authSlice";
import {
  Home, BookOpen, Calendar, Bus, FileText, Bell, TrendingUp, DollarSign, LogOut, CheckCircle, Menu, X, MessageSquare
} from "lucide-react";
import LogoutConfirmModal from "../../common/LogoutConfirmModal";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "attendance", label: "Attendance", icon: Calendar },
  { id: "exam", label: "Exam Marks", icon: FileText },
  {
    id: "results",
    label: "My Results",
    icon: TrendingUp,
    badge: "NEW",
    badgeColor: "bg-green-500"
  },
  { id: "fees", label: "Fees", icon: DollarSign },
  { id: "transport", label: "Transport", icon: Bus },
  { id: "timetable", label: "Timetable", icon: Calendar },
  { id: "leaves", label: "Leave Application", icon: CheckCircle }, // Fixed ID to match dashboard
  { id: "class-chat", label: "Class Chat", icon: MessageSquare },
  { id: "announcements", label: "Announcements", icon: Bell },
];

const Sidebar = ({ profile, currentView, onViewChange, sidebarOpen, onToggleSidebar, unreadCount = 0 }) => {
  const dispatch = useDispatch();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full z-50 md:z-auto bg-indigo-900 text-white transition-all duration-300 flex flex-col shadow-xl md:shadow-none
          ${sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full md:w-20 md:translate-x-0"}`}
      >
        <div className="flex items-center justify-between p-4 mb-2">
          {sidebarOpen && <h2 className="text-xl font-bold truncate">Student Portal</h2>}

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-indigo-800 rounded-lg hidden md:block"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-indigo-800 rounded-lg md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-1 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const showUnread = item.id === 'class-chat' && unreadCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  if (window.innerWidth < 768) {
                    onToggleSidebar();
                  }
                }}
                className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-indigo-800 transition ${currentView === item.id ? "bg-indigo-800 text-white" : "text-indigo-200"
                  }`}
              >
                <div className="relative shrink-0">
                  <Icon size={20} />
                  {!sidebarOpen && showUnread && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                {sidebarOpen && showUnread && (
                  <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {sidebarOpen && item.badge && !showUnread && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-indigo-800">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-700 transition text-red-100 hover:text-white mb-4"
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>

          <LogoutConfirmModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={() => {
              setShowLogoutModal(false);
              dispatch(logout());
            }}
          />

          {sidebarOpen && (
            <div className="p-3 bg-indigo-700 rounded-xl">
              <p className="font-semibold text-sm truncate">
                {profile.personal_details?.first_name || "Student"}{" "}
                {profile.personal_details?.last_name || ""}
              </p>
              <p className="text-xs text-indigo-300 truncate">{profile.admission_no}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
