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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {navigationItems.find(item => item.id === currentView)?.label}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{profile.personal_details.email}</p>
        </div>

        <div className="flex items-center gap-4">
          {profile.assigned_classes && profile.assigned_classes.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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