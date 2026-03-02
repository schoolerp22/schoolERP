import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AccountantSidebar from "../../components/accountant/Sidebar/AccountantSidebar";

// Views
import AccountingDashboardView from "../../components/accountant/DashboardView/AccountingDashboardView";
import CollectFeeView from "../../components/accountant/CollectFee/CollectFeeView";
import ReceiptListView from "../../components/accountant/Receipt/ReceiptListView";
import StudentListView from "../../components/accountant/Students/StudentListView";
import ReportsView from "../../components/accountant/Reports/ReportsView";
import FeeStructureView from "../../components/accountant/FeeStructure/FeeStructureView";

import "./AccountantDashboard.css";

const AccountantDashboard = () => {
    return (
        <div className="accountant-dashboard-layout">
            <AccountantSidebar />
            <div className="accountant-main-content">
                <Routes>
                    <Route path="/" element={<AccountingDashboardView />} />
                    <Route path="/collect" element={<CollectFeeView />} />
                    <Route path="/receipts" element={<ReceiptListView />} />
                    <Route path="/students" element={<StudentListView />} />
                    <Route path="/reports" element={<ReportsView />} />
                    <Route path="/structure" element={<FeeStructureView />} />
                    <Route path="*" element={<Navigate to="/dashboard/accountant" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default AccountantDashboard;
