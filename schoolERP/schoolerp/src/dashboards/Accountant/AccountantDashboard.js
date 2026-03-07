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

import "./AccountantDashboard.css"; // Restored - layout rules were neutralized to prevent conflicts

const AccountantDashboard = () => {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <AccountantSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header/Topbar section */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Accountant Portal</h1>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-semibold text-gray-700">School Accountant</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Fee & Accounts Dept</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-6 pb-24 lg:pb-6">
                    <div className="max-w-7xl mx-auto">
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
                </main>
            </div>
        </div>
    );
};

export default AccountantDashboard;
