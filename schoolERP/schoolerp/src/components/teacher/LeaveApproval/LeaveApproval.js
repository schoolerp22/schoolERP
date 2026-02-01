import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLeaveRequests, approveLeave, getAllLeaveRequests } from "../../../feature/teachers/teacherSlice";
import { Clock, CheckCircle, XCircle, MessageSquare, Calendar, User } from "lucide-react";
import { toast } from "react-toastify";

const LeaveApproval = ({ teacherId }) => {
    const dispatch = useDispatch();
    const { leaveRequests, allLeaveRequests, loading } = useSelector((state) => state.teacher);

    const [processingId, setProcessingId] = useState(null);
    const [remarksInput, setRemarksInput] = useState({});
    const [activeTab, setActiveTab] = useState("pending"); // pending or history

    useEffect(() => {
        if (teacherId) {
            dispatch(getLeaveRequests(teacherId));
            dispatch(getAllLeaveRequests(teacherId));
        }
    }, [dispatch, teacherId]);

    // Calculate summary statistics from allLeaveRequests
    const summary = allLeaveRequests.reduce((acc, req) => {
        if (req.status === 'Pending') acc.pending++;
        else if (req.status === 'Approved') acc.approved++;
        else if (req.status === 'Rejected') acc.rejected++;
        return acc;
    }, { pending: 0, approved: 0, rejected: 0 });

    const handleAction = async (leaveId, status) => {
        setProcessingId(leaveId);

        try {
            await dispatch(approveLeave({
                teacherId,
                leaveData: {
                    leaveId,
                    status,
                    remarks: remarksInput[leaveId] || ""
                }
            })).unwrap();

            toast.success(`Leave request ${status.toLowerCase()} successfully`);
            // Refresh lists
            dispatch(getLeaveRequests(teacherId));
            dispatch(getAllLeaveRequests(teacherId));
        } catch (error) {
            toast.error(error.message || "Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRemarkChange = (id, value) => {
        setRemarksInput(prev => ({ ...prev, [id]: value }));
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric"
        });
    };

    const getSafeName = (name, id) => {
        if (!name || name.includes('undefined')) return id;
        return name;
    };

    const getSafeClass = (cls, sec) => {
        if (!cls || !sec) return "N/A";
        return `${cls}-${sec}`;
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading && !allLeaveRequests.length) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Pending</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.pending}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Approved</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.approved}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-lg text-red-600">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Rejected</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.rejected}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-gray-100 w-fit rounded-xl border border-gray-200">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "pending"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    Pending Requests ({leaveRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "history"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    Decision History
                </button>
            </div>

            {/* Content Area */}
            <div className="grid gap-6">
                {activeTab === "pending" ? (
                    leaveRequests.length > 0 ? (
                        leaveRequests.map((request) => (
                            <div key={request._id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                                {/* Left: Student Info */}
                                <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 pr-0 md:pr-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{getSafeName(request.student_name, request.admission_no)}</h3>
                                            <p className="text-xs text-gray-500">{getSafeClass(request.class, request.section)} | {request.admission_no}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                                        <Clock size={14} className="text-amber-500" />
                                        Applied on: {formatDate(request.request_date)}
                                    </div>
                                </div>

                                {/* Middle: Leave Details */}
                                <div className="md:w-2/4 space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-semibold uppercase flex items-center gap-2 border border-indigo-100">
                                            <Calendar size={14} />
                                            {request.type}
                                        </div>
                                        <span className="font-bold text-gray-900 tracking-tight">
                                            {formatDate(request.from_date)}
                                            {request.type === "Multi Day" && ` → ${formatDate(request.to_date)}`}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative">
                                        <MessageSquare className="absolute -top-2 -left-2 text-indigo-200" size={20} />
                                        <p className="text-sm text-gray-700 italic">"{request.reason}"</p>
                                    </div>

                                    <div className="flex items-center gap-3 w-full group">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                placeholder="Add remarks for student (optional)..."
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                value={remarksInput[request._id] || ""}
                                                onChange={(e) => handleRemarkChange(request._id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="md:w-1/4 flex flex-col justify-center gap-3 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                                    <button
                                        onClick={() => handleAction(request._id, 'Approved')}
                                        disabled={processingId === request._id}
                                        className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold transition-all shadow-sm active:transform active:scale-95 disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(request._id, 'Rejected')}
                                        disabled={processingId === request._id}
                                        className="flex items-center justify-center gap-2 w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg font-bold transition-all active:transform active:scale-95 disabled:opacity-50"
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-inner">
                            <div className="p-4 bg-green-50 rounded-full mb-4">
                                <CheckCircle className="text-green-500" size={48} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">All Caught Up!</h3>
                            <p className="text-sm text-gray-500 font-medium">No pending leave requests to review.</p>
                        </div>
                    )
                ) : (
                    /* History Tab Content */
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden anim-fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Leave Dates</th>
                                        <th className="px-6 py-4">Reason</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allLeaveRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic font-medium">
                                                No decision history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        allLeaveRequests.map((req) => (
                                            <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800">{getSafeName(req.student_name, req.admission_no)}</span>
                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">{getSafeClass(req.class, req.section)} | {req.admission_no}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-semibold text-gray-700">{formatDate(req.from_date)}</span>
                                                        {req.type === "Multi Day" && <span className="text-gray-400 font-medium">to {formatDate(req.to_date)}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <p className="text-gray-600 line-clamp-1 italic text-xs">"{req.reason}"</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(req.status)}`}>
                                                        {req.status}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-indigo-600 font-medium">{req.remarks || <span className="text-gray-300">-</span>}</p>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveApproval;
