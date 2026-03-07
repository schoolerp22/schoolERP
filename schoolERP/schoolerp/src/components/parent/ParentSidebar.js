import React from 'react';
import { useSelector } from 'react-redux';
import {
    Home,
    Calendar,
    Award,
    DollarSign,
    Bell,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import LogoutConfirmModal from '../common/LogoutConfirmModal';

const ParentSidebar = ({ activeView, setActiveView, onLogout, unreadCount, isOpen, onToggleSidebar }) => {
    const { user } = useSelector((state) => state.auth);
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);

    const navItems = [
        { id: "overview", icon: Home, label: "Overview" },
        { id: "attendance", icon: Calendar, label: "Attendance" },
        { id: "results", icon: Award, label: "Exam Results" },
        { id: "fees", icon: DollarSign, label: "Fees & Payments" },
        { id: "notifications", icon: Bell, label: "Notifications" },
    ];

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'P';
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onToggleSidebar}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 transform ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} bg-indigo-900 text-white transition-all duration-300 flex flex-col md:relative h-full shadow-xl md:shadow-none`}>
                <div className="p-4 flex items-center justify-between border-b border-indigo-800">
                    {isOpen && (
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🎓</span>
                            <h1 className="text-xl font-bold truncate">EduConnect</h1>
                        </div>
                    )}
                    <button
                        onClick={onToggleSidebar}
                        className={`p-2 hover:bg-indigo-800 rounded-lg ${!isOpen ? 'mx-auto' : ''}`}
                    >
                        <Menu size={20} className={isOpen ? 'hidden md:block shrink-0' : 'shrink-0'} />
                        {isOpen && <X size={20} className="md:hidden shrink-0" />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = activeView === item.id;
                        const hasUnread = item.id === 'notifications' && unreadCount > 0;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveView(item.id);
                                    if (window.innerWidth < 768 && isOpen) {
                                        onToggleSidebar();
                                    }
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-indigo-800 text-white'
                                    : 'hover:bg-indigo-800 text-indigo-200'
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    <item.icon size={20} className={!isOpen ? 'md:mx-auto' : ''} />
                                    {!isOpen && hasUnread && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                                {isOpen && hasUnread && (
                                    <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-indigo-800">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-red-700 text-red-100 hover:text-white mb-4"
                    >
                        <LogOut size={20} className={!isOpen ? 'md:mx-auto text-red-300' : ''} />
                        {isOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>

                    <LogoutConfirmModal
                        isOpen={showLogoutModal}
                        onClose={() => setShowLogoutModal(false)}
                        onConfirm={() => {
                            setShowLogoutModal(false);
                            onLogout();
                        }}
                    />

                    <div className="flex items-center gap-3 px-1">
                        <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {getInitials(user?.name)}
                        </div>
                        {isOpen && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.name || 'Parent'}</p>
                                <p className="text-xs text-indigo-300 truncate">{user?.parent_id || 'Parent ID'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default ParentSidebar;
