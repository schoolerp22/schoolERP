import React from "react";
import { useSelector } from "react-redux";
import { Clock, CheckCircle, XCircle, FileText, Calendar, User, MessageCircle } from "lucide-react";

const LeaveHistory = () => {
    const { leaves, loading } = useSelector((state) => state.student);

    // Calculate status summary
    const summary = leaves.reduce(
        (acc, leave) => {
            acc.total += 1;
            if (leave.status === "Approved") acc.approved += 1;
            else if (leave.status === "Pending") acc.pending += 1;
            else if (leave.status === "Rejected") acc.rejected += 1;
            return acc;
        },
        { total: 0, approved: 0, pending: 0, rejected: 0 }
    );

    const getStatusColor = (status) => {
        switch (status) {
            case "Approved":
                return "bg-green-100 text-green-800 border-green-200";
            case "Pending":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "Rejected":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Approved":
                return <CheckCircle size={16} className="text-green-600" />;
            case "Pending":
                return <Clock size={16} className="text-amber-600" />;
            case "Rejected":
                return <XCircle size={16} className="text-red-600" />;
            default:
                return null;
        }
    };

    if (loading && leaves.length === 0) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-hover hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Total Applied</p>
                            <p className="text-xl font-bold text-gray-800">{summary.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-hover hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Pending</p>
                            <p className="text-xl font-bold text-gray-800">{summary.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-hover hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Approved</p>
                            <p className="text-xl font-bold text-gray-800">{summary.approved}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-hover hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Rejected</p>
                            <p className="text-xl font-bold text-gray-800">{summary.rejected}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" />
                        Previous Requests
                    </h3>
                    <span className="text-xs text-gray-500">{leaves.length} records found</span>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {leaves.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 italic">No leave history found.</div>
                    ) : (
                        leaves.map((leave) => (
                            <div key={leave._id} className="p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-800 text-sm">
                                            {new Date(leave.from_date).toLocaleDateString()}
                                            {leave.type === "Multi Day" && ` - ${new Date(leave.to_date).toLocaleDateString()}`}
                                        </span>
                                        <span className="text-xs font-bold text-indigo-500 uppercase mt-0.5">{leave.type}</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(leave.status)}`}>
                                        {getStatusIcon(leave.status)}
                                        {leave.status}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 line-clamp-2 italic">"{leave.reason}"</p>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <User size={12} />
                                        <span className="text-xs font-medium">
                                            {leave.status === "Pending"
                                                ? (leave.target_teacher_name || leave.target_teacher_id || "N/A")
                                                : (leave.approver_name || leave.approved_by_name || leave.target_teacher_name || "N/A")}
                                        </span>
                                    </div>
                                </div>

                                {leave.remarks && (
                                    <div className="flex items-start gap-2 p-2.5 mt-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <MessageCircle size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-indigo-800">{leave.remarks}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Dates</th>
                                <th className="px-6 py-3">Type / Reason</th>
                                <th className="px-6 py-3">Approver</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Response</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                                        No leave history found.
                                    </td>
                                </tr>
                            ) : (
                                leaves.map((leave) => (
                                    <tr key={leave._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {/* Safe Name Display (Optional but good practice) */}
                                            <div className="text-[10px] text-gray-400 mb-1">ID: {leave.admission_no}</div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">
                                                    {new Date(leave.from_date).toLocaleDateString()}
                                                </span>
                                                {leave.type === "Multi Day" && (
                                                    <span className="text-[11px] text-gray-500">
                                                        to {new Date(leave.to_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase font-bold text-indigo-500">{leave.type}</span>
                                                <p className="text-gray-600 line-clamp-1 italic">"{leave.reason}"</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User size={14} className="text-gray-400" />
                                                <span className="font-medium">
                                                    {leave.status === "Pending"
                                                        ? (leave.target_teacher_name || leave.target_teacher_id || "N/A")
                                                        : (leave.approver_name || leave.approved_by_name || leave.target_teacher_name || "N/A")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                                                {getStatusIcon(leave.status)}
                                                {leave.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {leave.remarks ? (
                                                <div className="flex items-start gap-2 max-w-xs p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                                    <MessageCircle size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-indigo-700">{leave.remarks}</p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-[11px]">No remarks yet</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveHistory;
