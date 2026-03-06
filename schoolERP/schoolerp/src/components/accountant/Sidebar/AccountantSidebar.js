import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
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
import "./AccountantSidebar.css";

const AccountantSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const location = useLocation();
    const dispatch = useDispatch();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const menuItems = [
        { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard/accountant" },
        { name: "Collect Fee", icon: <CreditCard size={20} />, path: "/dashboard/accountant/collect" },
        { name: "Receipts", icon: <FileText size={20} />, path: "/dashboard/accountant/receipts" },
        { name: "Students", icon: <Users size={20} />, path: "/dashboard/accountant/students" },
        { name: "Reports", icon: <FileSpreadsheet size={20} />, path: "/dashboard/accountant/reports" },
        { name: "Fee Structure", icon: <Settings size={20} />, path: "/dashboard/accountant/structure" },
    ];

    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <>
            <button className="accountant-mobile-toggle" onClick={toggleSidebar}>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className={`accountant-sidebar ${isOpen ? "open" : ""}`}>
                <div className="accountant-sidebar-header">
                    <img src="/logo.png" alt="School ERP" className="accountant-logo" onError={(e) => { e.target.style.display = 'none' }} />
                    {user?.schoolId && <div className="accountant-school-badge">{user.schoolId}</div>}
                </div>

                <nav className="accountant-sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`accountant-nav-item ${location.pathname === item.path ? "active" : ""}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="accountant-sidebar-footer">
                    <button
                        className="accountant-logout-btn"
                        onClick={() => setShowLogoutModal(true)}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                    <div className="accountant-user-info">
                        <span className="accountant-user-name">{user?.name || "Accountant"}</span>
                        <span className="accountant-user-role">Fee & Accounts Dept</span>
                    </div>
                </div>
            </div>

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
