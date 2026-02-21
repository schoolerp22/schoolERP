import React from 'react';
import { useDispatch } from "react-redux";
import { logout } from "../../../feature/auth/authSlice";
import {
    Home,
    Users,
    GraduationCap,
    BarChart3,
    FileText,
    Menu,
    X,
    LogOut,
    Calendar,
    BookOpen
} from 'lucide-react';
import LogoutConfirmModal from '../../common/LogoutConfirmModal';

const Sidebar = ({ currentView, onViewChange, sidebarOpen, setSidebarOpen }) => {
    const dispatch = useDispatch();
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);
    const navigationItems = [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'teachers', icon: GraduationCap, label: 'Teachers' },
        { id: 'students', icon: Users, label: 'Students' },
        { id: 'marking-schemes', icon: BookOpen, label: 'Marking Schemes' },
        { id: 'attendance-backlog', icon: Calendar, label: 'Attendance Backlog' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    ];

    return (
        <>
            {/* Mobile Backdrop overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed md:relative top-0 left-0 h-full z-50 md:z-auto
                    ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-20 md:translate-x-0'}
                    bg-indigo-900 text-white transition-all duration-300 flex flex-col shadow-xl md:shadow-none
                `}
            >
                <div className="p-4 flex items-center justify-between border-b border-indigo-800">
                    <h1 className={`text-xl font-bold transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'md:opacity-0 hidden md:block'}`}>
                        Admin Portal
                    </h1>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-indigo-800 rounded-lg md:hidden"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-indigo-800 rounded-lg hidden md:block"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id);
                                if (window.innerWidth < 768) setSidebarOpen(false); // Close on mobile after selection
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${currentView === item.id
                                ? 'bg-indigo-800 text-white'
                                : 'hover:bg-indigo-800 text-indigo-200'
                                }`}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'md:opacity-0 hidden md:block'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-indigo-800">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-red-700 text-red-100 hover:text-white mb-2"
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'md:opacity-0 hidden md:block'}`}>
                            Logout
                        </span>
                    </button>

                    <LogoutConfirmModal
                        isOpen={showLogoutModal}
                        onClose={() => setShowLogoutModal(false)}
                        onConfirm={() => {
                            setShowLogoutModal(false);
                            dispatch(logout());
                        }}
                    />
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-indigo-700 flex flex-shrink-0 items-center justify-center font-bold text-sm">
                            AD
                        </div>
                        <div className={`flex-1 min-w-0 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'md:opacity-0 hidden md:block'}`}>
                            <p className="text-sm font-medium truncate">Admin User</p>
                            <p className="text-xs text-indigo-300 truncate">ADMIN-001</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
