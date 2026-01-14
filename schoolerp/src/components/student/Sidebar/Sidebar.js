import React from "react";
import {
  Home, BookOpen, Calendar, Bus, FileText, Bell
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "attendance", label: "Attendance", icon: Calendar },
  { id: "exam", label: "Exam Marks", icon: FileText },
  { id: "fees", label: "Fees", icon: FileText },
  { id: "transport", label: "Transport", icon: Bus },
  { id: "timetable", label: "Timetable", icon: Calendar },
  { id: "announcements", label: "Announcements", icon: Bell },
];

const Sidebar = ({ profile, currentView, onViewChange }) => {
  return (
    <aside className="w-64 bg-indigo-900 text-white p-4 space-y-2 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Student Portal</h2>

      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center gap-2 w-full p-3 rounded hover:bg-indigo-800 transition ${
              currentView === item.id ? "bg-indigo-800" : ""
            }`}
          >
            <Icon size={20} />
            {item.label}
          </button>
        );
      })}

      <div className="mt-auto p-3 bg-indigo-700 rounded-lg">
        <p className="font-semibold">
          {profile.personal_details?.first_name || "Student"}{" "}
          {profile.personal_details?.last_name || ""}
        </p>
        <p className="text-sm text-indigo-200">{profile.admission_no}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
