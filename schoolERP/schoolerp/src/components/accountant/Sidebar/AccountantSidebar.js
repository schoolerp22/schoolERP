import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../feature/auth/authSlice";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    FileText,
    Settings,
    X,
    Menu,
    FileSpreadsheet,
    LogOut
} from "lucide-react";
import LogoutConfirmModal from "../../common/LogoutConfirmModal";

const AccountantSidebar = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const menuItems = [
        { name: "Dashboard", id: 'dashboard', icon: LayoutDashboard, path: "/dashboard/accountant" },
        { name: "Collect Fee", id: 'collect', icon: CreditCard, path: "/dashboard/accountant/collect" },
        { name: "Receipts", id: 'receipts', icon: FileText, path: "/dashboard/accountant/receipts" },
        { name: "Students", id: 'students', icon: Users, path: "/dashboard/accountant/students" },
        { name: "Reports", id: 'reports', icon: FileSpreadsheet, path: "/dashboard/accountant/reports" },
        { name: "Fee Structure", id: 'structure', icon: Settings, path: "/dashboard/accountant/structure" },
    ];

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
    };

    const onToggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
                <div className="p-4 flex items-center justify-between border-b border-indigo-800">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
                                <span className="text-white text-lg font-bold">A</span>
                            </div>
                            <h1 className="text-xl font-bold truncate tracking-tight">Acct. Portal</h1>
                        </div>
                    )}
                    <button
                        onClick={onToggleSidebar}
                        className={`p-2 hover:bg-indigo-800 rounded-lg ${!sidebarOpen ? 'mx-auto' : ''}`}
                    >
                        <Menu size={20} className={sidebarOpen ? 'hidden md:block shrink-0' : 'shrink-0'} />
                        {sidebarOpen && <X size={20} className="md:hidden shrink-0" />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/dashboard/accountant' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={() => {
                                    if (window.innerWidth < 768) setSidebarOpen(false);
                                }}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-indigo-800 text-white'
                                    : 'hover:bg-indigo-800 text-indigo-200'
                                    }`}
                            >
                                <item.icon size={20} className={`shrink-0 ${!sidebarOpen ? 'mx-auto' : ''}`} />
                                {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-indigo-800">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-red-700 text-red-100 hover:text-white mb-4"
                    >
                        <LogOut size={20} className={`shrink-0 ${!sidebarOpen ? 'mx-auto' : ''}`} />
                        {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>

                    <div className={`flex items-center gap-3 px-1 ${!sidebarOpen ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                            {getInitials(user?.name)}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.name || 'Accountant'}</p>
                                <p className="text-xs text-indigo-300 truncate">{user?.accountant_id || 'Fee & Accounts'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Toggle Button (Visible only when sidebar is closed) */}
            {!sidebarOpen && (
                <button
                    className="md:hidden fixed top-4 left-4 z-40 p-2 bg-indigo-900 text-white rounded-lg shadow-lg"
                    onClick={onToggleSidebar}
                >
                    <Menu size={20} />
                </button>
            )}

            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    setShowLogoutModal(false);
                    dispatch(logout());
                }}
            />
        </>
    );
};

export default AccountantSidebar;
