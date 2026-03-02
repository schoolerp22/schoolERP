import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Download } from "lucide-react";
import API from "../../../feature/auth/axios";

const ReportsView = () => {
    const [activeTab, setActiveTab] = useState("Date");
    const { classes } = useSelector((state) => state.accounting);

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedPayMode, setSelectedPayMode] = useState("");

    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [generated, setGenerated] = useState(false);

    const token = localStorage.getItem("token");

    const handleGenerate = async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (fromDate) params.append("startDate", fromDate);
            if (toDate) params.append("endDate", toDate);
            params.append("limit", "200");

            const res = await API.get(`/api/accounting/payments/receipts?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let data = res.data.receipts || [];

            // Client-side filter for class and payment mode
            if (selectedClass) data = data.filter(r => String(r.class) === selectedClass);
            if (selectedPayMode) data = data.filter(r => r.paymentMode === selectedPayMode);

            setReceipts(data);
            setGenerated(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    const totalCollected = receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    const byPayMode = receipts.reduce((acc, r) => {
        acc[r.paymentMode] = (acc[r.paymentMode] || 0) + (r.totalAmount || 0);
        return acc;
    }, {});

    const tabs = ["Date", "Class", "Payment Mode", "Defaulters"];

    return (
        <div className="accountant-dashboard-view">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
                {generated && receipts.length > 0 && (
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        <Download size={16} /> Export / Print
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="flex border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setGenerated(false); setReceipts([]); }}
                            className={`px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === tab
                                ? "text-blue-600 bg-blue-50/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {tab}-wise Report
                            {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 min-w-32">
                            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div className="flex-1 min-w-32">
                            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        {activeTab === "Class" && (
                            <div className="flex-1 min-w-32">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white">
                                    <option value="">All Classes</option>
                                    {(classes || []).map(c => (
                                        <option key={c._id} value={c.className}>{c.className}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {activeTab === "Payment Mode" && (
                            <div className="flex-1 min-w-32">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                                <select value={selectedPayMode} onChange={e => setSelectedPayMode(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white">
                                    <option value="">All Modes</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>
                        )}
                        <div className="flex items-end">
                            <button onClick={handleGenerate} disabled={loading}
                                className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium text-sm disabled:opacity-50">
                                {loading ? "Loading..." : "Generate Report"}
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded">{error}</div>}

                    {/* Summary Cards */}
                    {generated && (
                        <>
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <p className="text-xs text-green-600 font-medium mb-1">Total Collected</p>
                                    <p className="text-2xl font-bold text-green-700">₹{totalCollected.toLocaleString()}</p>
                                </div>
                                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Total Receipts</p>
                                    <p className="text-2xl font-bold text-blue-700">{receipts.length}</p>
                                </div>
                                {Object.entries(byPayMode).map(([mode, amount]) => (
                                    <div key={mode} className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                        <p className="text-xs text-purple-600 font-medium mb-1">{mode}</p>
                                        <p className="text-xl font-bold text-purple-700">₹{amount.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            {receipts.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-lg">No receipts found for the selected filters.</p>
                                </div>
                            ) : (
                                <div className="border border-gray-100 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-gray-600">Receipt No</th>
                                                <th className="p-3 font-semibold text-gray-600">Student</th>
                                                <th className="p-3 font-semibold text-gray-600">Adm No</th>
                                                <th className="p-3 font-semibold text-gray-600">Class</th>
                                                <th className="p-3 font-semibold text-gray-600">Months</th>
                                                <th className="p-3 font-semibold text-gray-600">Mode</th>
                                                <th className="p-3 font-semibold text-gray-600 text-right">Amount</th>
                                                <th className="p-3 font-semibold text-gray-600">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {receipts.map(r => (
                                                <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="p-3 font-mono text-xs text-blue-600">{r.receiptNo}</td>
                                                    <td className="p-3 font-medium text-gray-800">{r.studentName}</td>
                                                    <td className="p-3 text-gray-500">{r.admissionNo}</td>
                                                    <td className="p-3 text-gray-600">{r.class || "-"}</td>
                                                    <td className="p-3 text-gray-500 text-xs">{(r.months || []).join(", ")}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.paymentMode === "Cash" ? "bg-green-50 text-green-700" :
                                                            r.paymentMode === "Cheque" ? "bg-orange-50 text-orange-700" :
                                                                "bg-blue-50 text-blue-700"}`}>
                                                            {r.paymentMode}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-semibold text-gray-800 text-right">₹{(r.totalAmount || 0).toLocaleString()}</td>
                                                    <td className="p-3 text-gray-400 text-xs">
                                                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN") : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={6} className="p-3 font-bold text-gray-700 text-right">Total:</td>
                                                <td className="p-3 font-bold text-gray-800 text-right">₹{totalCollected.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {!generated && !loading && (
                        <div className="border border-gray-100 rounded-lg bg-white p-16 text-center text-gray-500 flex flex-col items-center">
                            <span className="text-4xl mb-4 opacity-40">📊</span>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Generate {activeTab} Report</h3>
                            <p className="max-w-sm text-sm">Select date range{activeTab === "Class" ? " and class" : ""} above, then click Generate Report.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
