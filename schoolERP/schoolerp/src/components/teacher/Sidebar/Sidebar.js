import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../../feature/auth/authSlice';
import {
  Calendar, BookOpen, Bell, FileText,
  Home, Menu, X, Upload, BarChart3, LogOut,
  ClipboardCheck, CalendarDays, Clock, MessageSquare,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import LogoutConfirmModal from '../../common/LogoutConfirmModal';

const Sidebar = ({ profile, currentView, onViewChange, sidebarOpen, onToggleSidebar, unreadCount = 0 }) => {
  const dispatch = useDispatch();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'my-attendance', icon: ClipboardCheck, label: 'My Attendance' },
    { id: 'my-leaves', icon: FileText, label: 'My Leaves' },
    { id: 'attendance', icon: CalendarDays, label: 'Student Attendance' },
    { id: 'leaves', icon: Calendar, label: 'Leave Approvals' },
    { id: 'homework', icon: BookOpen, label: 'Homework' },
    { id: 'announcements', icon: Bell, label: 'Announcements' },
    { id: 'class-chat', icon: MessageSquare, label: 'Class Chat' },
    { id: 'timetable', icon: Clock, label: 'Timetable' },
    {
      id: 'results-upload',
      icon: Upload,
      label: 'Upload Results',
      badge: 'NEW',
      badgeColor: 'bg-green-500'
    },
    {
      id: 'results-manage',
      icon: Clock,
      label: 'Manage Results'
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

      <aside className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} bg-gradient-to-b from-[#4f46e5] to-[#4338ca] text-white transition-all duration-500 flex flex-col md:relative h-full shadow-2xl md:shadow-none overflow-x-hidden`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <ClipboardCheck size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold truncate tracking-tight">Teacher Portal</h1>
            </div>
          )}
          <button
            onClick={onToggleSidebar}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${!sidebarOpen ? 'mx-auto' : ''}`}
          >
            <Menu size={20} className={sidebarOpen ? 'hidden md:block shrink-0' : 'shrink-0'} />
            {sidebarOpen && <X size={20} className="md:hidden shrink-0" />}
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${sidebarOpen ? 'p-3' : 'py-2'} space-y-1`}>
          {navigationItems.map((item) => {
            const showUnread = item.id === 'class-chat' && unreadCount > 0;
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={sidebarOpen ? { x: 4 } : {}}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onViewChange(item.id);
                  if (window.innerWidth < 768 && sidebarOpen) {
                    onToggleSidebar();
                  }
                }}
                className={`w-full flex items-center transition-all duration-200 group relative ${isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'hover:bg-white/10 text-indigo-100'
                  } ${sidebarOpen ? 'gap-2.5 p-2 rounded-xl mx-2 w-[calc(100%-16px)]' : 'justify-center p-2 h-11 w-full'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-white rounded-r-full z-10 ${sidebarOpen ? 'left-0' : 'left-0'}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative shrink-0 p-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-white/20 scale-110 shadow-indigo-500/20 shadow-lg' : 'group-hover:bg-white/20'
                  }`}>
                  <item.icon size={20} />
                  {!sidebarOpen && showUnread && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-[#4f46e5]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {sidebarOpen && <span className={`text-xs tracking-wide transition-all ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>}
                {sidebarOpen && showUnread && (
                  <span className="ml-auto min-w-[20px] h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 animate-bounce">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {sidebarOpen && item.badge && !showUnread && (
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.badgeColor} text-white`}>
                    {item.badge}
                  </span>
                )}
                {sidebarOpen && isActive && (
                  <ChevronRight size={14} className="ml-auto opacity-50" />
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center transition-all hover:bg-red-500/20 text-red-100 hover:text-white mb-2 group ${sidebarOpen ? 'gap-3 p-2.5 rounded-xl' : 'justify-center p-2 h-11'}`}
          >
            <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <LogOut size={20} className="text-red-300 group-hover:text-white" />
            </div>
            {sidebarOpen && <span className="text-sm font-semibold">Logout</span>}
          </button>

          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner ${!sidebarOpen ? 'justify-center mx-auto w-12 p-1 overflow-hidden' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-400 p-[2px] shadow-lg shrink-0 overflow-hidden group">
              <div className="w-full h-full rounded-[10px] bg-indigo-600 flex items-center justify-center font-bold text-white uppercase transition-transform group-hover:scale-110">
                {profile.personal_details.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-none">{profile.personal_details.name}</p>
                <p className="text-[10px] text-indigo-300 mt-1 uppercase tracking-widest font-bold">{profile.teacher_id}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          dispatch(logout());
          setShowLogoutModal(false);
        }}
      />
    </>
  );
};

export default Sidebar;