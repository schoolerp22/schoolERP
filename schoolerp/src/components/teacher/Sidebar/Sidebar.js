import React from 'react';
import { 
  Users, Calendar, BookOpen, Bell, FileText, 
  Home, Menu, X,Upload, BarChart3
} from 'lucide-react';

const Sidebar = ({ profile, currentView, onViewChange, sidebarOpen, onToggleSidebar }) => {
  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'students', icon: Users, label: 'My Students' },
    { id: 'attendance', icon: Calendar, label: 'Attendance' },
    { id: 'homework', icon: BookOpen, label: 'Homework' },
    { id: 'announcements', icon: Bell, label: 'Announcements' },
    { id: 'leaves', icon: FileText, label: 'Leave Requests' },
     { 
      id: 'results-upload', 
      icon: Upload, 
      label: 'Upload Results',
      badge: 'NEW',
      badgeColor: 'bg-green-500'
    },
    { 
      id: 'results-performance', 
      icon: BarChart3, 
      label: 'Performance Analytics',
      badge: 'NEW',
      badgeColor: 'bg-green-500'
    },
  ];

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-indigo-900 text-white transition-all duration-300 flex flex-col`}>
      <div className="p-4 flex items-center justify-between border-b border-indigo-800">
        {sidebarOpen && <h1 className="text-xl font-bold">Teacher Portal</h1>}
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-indigo-800 rounded-lg"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentView === item.id 
                ? 'bg-indigo-800 text-white' 
                : 'hover:bg-indigo-800 text-indigo-200'
            }`}
          >
            <item.icon size={20} />
            {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm">
            {profile.personal_details.name.split(' ').map(n => n[0]).join('')}
          </div>
          {sidebarOpen && (
            <div className="flex-1">
              <p className="text-sm font-medium">{profile.personal_details.name}</p>
              <p className="text-xs text-indigo-300">{profile.teacher_id}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;