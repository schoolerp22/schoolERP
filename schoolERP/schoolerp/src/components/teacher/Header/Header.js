import React from 'react';
import { Bell } from 'lucide-react';

const Header = ({ profile, currentView, selectedClass, onClassChange, leaveRequests }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'students', label: 'My Students' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'homework', label: 'Homework' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'leaves', label: 'Leave Requests' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
            {navigationItems.find(item => item.id === currentView)?.label}
          </h2>
          <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">{profile.personal_details.email}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {profile.assigned_classes && profile.assigned_classes.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="px-2 py-1.5 md:px-4 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[120px] md:max-w-xs"
            >
              {profile.assigned_classes.map(ac => {
                const hasSection = ac.section && ac.section !== 'undefined';
                const value = hasSection ? `${ac.class}-${ac.section}` : `${ac.class}`;
                const label = hasSection ? `Class ${ac.class}-${ac.section}` : `Class ${ac.class}`;
                return (
                  <option key={value} value={value}>
                    {label} ({ac.subject})
                  </option>
                );
              })}
            </select>
          )}

          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell size={20} className="text-gray-600" />
            {leaveRequests && leaveRequests.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;