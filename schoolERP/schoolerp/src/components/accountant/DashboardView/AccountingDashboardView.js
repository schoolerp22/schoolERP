import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats, getReceipts } from "../../../feature/accounting/accountingSlice";
import { IndianRupee, TrendingUp, FileText, Users, ArrowUpRight, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

const payModeIcon = (mode) => {
    if (mode === "Cash") return <Banknote size={14} />;
    if (mode === "Cheque") return <CreditCard size={14} />;
    return <Smartphone size={14} />;
};

const AccountingDashboardView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { dashboardStats, receipts, isLoading } = useSelector((state) => state.accounting);

    useEffect(() => {
        dispatch(getDashboardStats());
        dispatch(getReceipts({ limit: 5 }));
    }, [dispatch]);

    const { todayCollection = 0, monthlyCollection = 0, totalReceiptsThisMonth = 0, totalStudents = 0, recentReceipts = [] } = dashboardStats || {};

    // Payment mode breakdown from recent receipts
    const modeMap = {};
    (receipts?.length ? receipts : recentReceipts).forEach(r => {
        if (!modeMap[r.paymentMode]) modeMap[r.paymentMode] = 0;
        modeMap[r.paymentMode] += r.totalAmount || 0;
    });
    const pieData = Object.entries(modeMap).map(([name, value]) => ({ name, value }));

    // Trend: group recentReceipts by date
    const trendMap = {};
    recentReceipts.forEach(r => {
        const d = r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "?";
        trendMap[d] = (trendMap[d] || 0) + (r.totalAmount || 0);
    });
    const trendData = Object.entries(trendMap).map(([date, amount]) => ({ date, amount }));

    const stats = [
        {
            label: "Today's Collection",
            value: `₹${todayCollection.toLocaleString("en-IN")}`,
            icon: <IndianRupee size={22} />,
            gradient: "from-violet-500 to-indigo-600",
            light: "bg-violet-50 text-violet-600",
            change: "+Today"
        },
        {
            label: "Monthly Collection",
            value: `₹${monthlyCollection.toLocaleString("en-IN")}`,
            icon: <TrendingUp size={22} />,
            gradient: "from-emerald-500 to-teal-600",
            light: "bg-emerald-50 text-emerald-600",
            change: "This Month"
        },
        {
            label: "Receipts This Month",
            value: totalReceiptsThisMonth,
            icon: <FileText size={22} />,
            gradient: "from-amber-500 to-orange-500",
            light: "bg-amber-50 text-amber-600",
            change: "Transactions"
        },
        {
            label: "Total Students",
            value: totalStudents.toLocaleString("en-IN"),
            icon: <Users size={22} />,
            gradient: "from-sky-500 to-blue-600",
            light: "bg-sky-50 text-sky-600",
            change: "Enrolled"
        },
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accounts Overview</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <button
                    onClick={() => navigate("/dashboard/accountant/collect")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <IndianRupee size={16} /> Collect Fee
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.light}`}>
                                {s.icon}
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{s.change}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                        <h3 className="text-xl font-bold text-gray-900">{isLoading ? "—" : s.value}</h3>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Collection Trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Recent Collection Trend</h3>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-medium">Last 5 Receipts</span>
                    </div>
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                                <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Amount"]} />
                                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#colorAmt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No collection data yet</div>
                    )}
                </div>

                {/* Payment Modes Pie */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4">Payment Modes</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                    {pieData.map((_, idx) => (
                                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                                <Legend iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No payments yet</div>
                    )}
                </div>
            </div>

            {/* Recent Receipts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Recent Receipts</h3>
                    <button
                        onClick={() => navigate("/dashboard/accountant/receipts")}
                        className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
                    >
                        View All <ArrowUpRight size={12} />
                    </button>
                </div>
                {recentReceipts.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">No recent receipts</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <th className="p-3 text-left font-semibold">Receipt No</th>
                                <th className="p-3 text-left font-semibold">Student</th>
                                <th className="p-3 text-left font-semibold">Months</th>
                                <th className="p-3 text-left font-semibold">Mode</th>
                                <th className="p-3 text-right font-semibold">Amount</th>
                                <th className="p-3 text-left font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReceipts.map((r, i) => (
                                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-3 font-mono text-xs text-indigo-600 font-semibold">{r.receiptNo}</td>
                                    <td className="p-3">
                                        <div className="font-medium text-gray-800">{r.studentName}</div>
                                        <div className="text-xs text-gray-400">{r.admissionNo}</div>
                                    </td>
                                    <td className="p-3 text-xs text-gray-500">{(r.months || []).join(", ")}</td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.paymentMode === "Cash" ? "bg-green-50 text-green-700" :
                                                r.paymentMode === "Cheque" ? "bg-orange-50 text-orange-700" :
                                                    "bg-blue-50 text-blue-700"
                                            }`}>
                                            {payModeIcon(r.paymentMode)} {r.paymentMode}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-bold text-gray-800">₹{(r.totalAmount || 0).toLocaleString("en-IN")}</td>
                                    <td className="p-3 text-xs text-gray-400">
                                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN") : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AccountingDashboardView;
