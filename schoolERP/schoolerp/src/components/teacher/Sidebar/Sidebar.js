import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../../feature/auth/authSlice';
import {
  Users, Calendar, BookOpen, Bell, FileText,
  Home, Menu, X, Upload, BarChart3, LogOut
} from 'lucide-react';
import LogoutConfirmModal from '../../common/LogoutConfirmModal';

const Sidebar = ({ profile, currentView, onViewChange, sidebarOpen, onToggleSidebar }) => {
  const dispatch = useDispatch();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'students', icon: Users, label: 'My Students' },
    { id: 'attendance', icon: Calendar, label: 'Attendance' },
    { id: 'homework', icon: BookOpen, label: 'Homework' },
    { id: 'announcements', icon: Bell, label: 'Announcements' },
    { id: 'leaves', icon: FileText, label: 'Leave Requests' },
    { id: 'timetable', icon: Calendar, label: 'Manage Timetable' },
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
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} bg-indigo-900 text-white transition-all duration-300 flex flex-col md:relative h-full shadow-xl md:shadow-none`}>
        <div className="p-4 flex items-center justify-between border-b border-indigo-800 break-all md:break-normal">
          {sidebarOpen && <h1 className="text-xl font-bold truncate">Teacher Portal</h1>}
          <button
            onClick={onToggleSidebar}
            className={`p-2 hover:bg-indigo-800 rounded-lg ${!sidebarOpen ? 'mx-auto' : ''}`}
          >
            <Menu size={20} className={sidebarOpen ? 'hidden md:block shrink-0' : 'shrink-0'} />
            {sidebarOpen && <X size={20} className="md:hidden shrink-0" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (window.innerWidth < 768 && sidebarOpen) {
                  onToggleSidebar();
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${currentView === item.id
                ? 'bg-indigo-800 text-white'
                : 'hover:bg-indigo-800 text-indigo-200'
                }`}
            >
              <item.icon size={20} className={!sidebarOpen ? 'md:mx-auto' : ''} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-red-700 text-red-100 hover:text-white mb-2"
          >
            <LogOut size={20} className={!sidebarOpen ? 'md:mx-auto text-red-300' : ''} />
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

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 mx-auto md:mx-0">
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
    </>
  );
};

export default Sidebar;