import React from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../../feature/auth/authSlice";
import {
  Home, BookOpen, Calendar, Bus, FileText, Bell, TrendingUp, DollarSign, LogOut
} from "lucide-react";

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
  { id: "announcements", label: "Announcements", icon: Bell },
];

const Sidebar = ({ profile, currentView, onViewChange }) => {
  const dispatch = useDispatch();

  return (
    <aside className="w-64 bg-indigo-900 text-white p-4 space-y-2 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Student Portal</h2>

      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center gap-2 w-full p-3 rounded hover:bg-indigo-800 transition ${currentView === item.id ? "bg-indigo-800" : ""
              }`}
          >
            <Icon size={20} />
            {item.label}
          </button>
        );
      })}

      <div className="mt-auto pt-4">
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2 w-full p-3 rounded hover:bg-red-700 transition text-red-100 hover:text-white mb-2"
        >
          <LogOut size={20} />
          Logout
        </button>

        <div className="p-3 bg-indigo-700 rounded-lg">
          <p className="font-semibold">
            {profile.personal_details?.first_name || "Student"}{" "}
            {profile.personal_details?.last_name || ""}
          </p>
          <p className="text-sm text-indigo-200">{profile.admission_no}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
