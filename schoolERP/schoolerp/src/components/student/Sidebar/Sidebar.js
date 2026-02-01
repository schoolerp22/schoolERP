import React from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../../feature/auth/authSlice";
import {
  Home, BookOpen, Calendar, Bus, FileText, Bell, TrendingUp, DollarSign, LogOut, CheckCircle, Menu, X
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
  { id: "leave", label: "Leave Application", icon: CheckCircle }, // Added Leave Option
  { id: "announcements", label: "Announcements", icon: Bell },
];

const Sidebar = ({ profile, currentView, onViewChange, sidebarOpen, onToggleSidebar }) => {
  const dispatch = useDispatch();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  return (
    <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-indigo-900 text-white p-4 space-y-2 flex flex-col transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        {sidebarOpen && <h2 className="text-xl font-bold">Student Portal</h2>}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-indigo-800 rounded-lg"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-indigo-800 transition ${currentView === item.id ? "bg-indigo-800 text-white" : "text-indigo-200"
                }`}
            >
              <Icon size={20} className="shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarOpen && item.badge && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-indigo-800">
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
  );
};

export default Sidebar;
