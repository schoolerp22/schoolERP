import React from "react";
import { Bell, Clock } from "lucide-react";

const priorityStyles = {
  High: "bg-red-100 text-red-700 border-red-300",
  Normal: "bg-blue-100 text-blue-700 border-blue-300",
  Low: "bg-gray-100 text-gray-700 border-gray-300",
};

const AnnouncementsView = ({ announcements }) => {
  console.log("📢 Announcements data:", announcements);
  if (!announcements || announcements.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow text-gray-500">
        No announcements available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
        <Bell className="text-indigo-600" />
        Announcements
      </h2>

      {announcements.map((a) => (
        <div
          key={a._id}
          className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {a.title}
              </h3>
              <p className="text-sm text-gray-500">
                👨‍🏫 {a.teacher?.name || "Teacher"}
              </p>
            </div>

            <span
              className={`text-xs px-3 py-1 rounded-full border font-medium ${
                priorityStyles[a.priority] || priorityStyles.Normal
              }`}
            >
              {a.priority}
            </span>
          </div>

          {/* Message */}
          <p className="text-gray-700 mb-3">{a.message}</p>

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={14} />
            {new Date(a.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementsView;
