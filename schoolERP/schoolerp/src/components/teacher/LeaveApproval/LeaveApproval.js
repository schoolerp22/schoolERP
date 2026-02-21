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
        <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 sm:border-gray-200 shadow-sm flex flex-row items-center gap-3 sm:gap-4 min-w-[140px] sm:min-w-0 flex-1">
                    <div className="p-2 sm:p-3 bg-amber-50 rounded-xl text-amber-600">
                        <Clock size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Pending</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{summary.pending}</p>
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 sm:border-gray-200 shadow-sm flex flex-row items-center gap-3 sm:gap-4 min-w-[140px] sm:min-w-0 flex-1">
                    <div className="p-2 sm:p-3 bg-green-50 rounded-xl text-green-600">
                        <CheckCircle size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Approved</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{summary.approved}</p>
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 sm:border-gray-200 shadow-sm flex flex-row items-center gap-3 sm:gap-4 min-w-[140px] sm:min-w-0 flex-1">
                    <div className="p-2 sm:p-3 bg-red-50 rounded-xl text-red-600">
                        <XCircle size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Rejected</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{summary.rejected}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-gray-100/80 w-full sm:w-fit rounded-xl border border-gray-100">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === "pending"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    Pending <span className="hidden sm:inline">Requests</span> ({leaveRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === "history"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    History
                </button>
            </div>

            {/* Content Area */}
            <div className="grid gap-4 sm:gap-6">
                {activeTab === "pending" ? (
                    leaveRequests.length > 0 ? (
                        leaveRequests.map((request) => (
                            <div key={request._id} className="bg-white border border-gray-100 sm:border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row gap-5 sm:gap-6 hover:shadow-md transition-shadow">
                                {/* Left: Student Info */}
                                <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-gray-50 pb-4 md:pb-0 pr-0 md:pr-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 sm:p-2.5 bg-indigo-50 rounded-full text-indigo-600">
                                            <User size={20} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-[15px] sm:text-base">{getSafeName(request.student_name, request.admission_no)}</h3>
                                            <p className="text-[11px] sm:text-xs font-semibold text-gray-400">{getSafeClass(request.class, request.section)} | {request.admission_no}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 sm:mt-4 text-[11px] sm:text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                        <Clock size={12} className="text-amber-500" />
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
                                        {request.attachment && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <a
                                                    href={`${process.env.REACT_APP_API_URL}${request.attachment}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                    View Attachment
                                                </a>
                                            </div>
                                        )}
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
                                <div className="md:w-1/4 flex flex-row md:flex-col justify-center gap-3 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 mt-2 sm:mt-0">
                                    <button
                                        onClick={() => handleAction(request._id, 'Approved')}
                                        disabled={processingId === request._id}
                                        className="flex-1 md:w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-white py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(request._id, 'Rejected')}
                                        disabled={processingId === request._id}
                                        className="flex-1 md:w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                    <div className="bg-transparent sm:bg-white rounded-xl border-0 sm:border border-gray-200 sm:shadow-sm overflow-hidden anim-fade-in -mx-4 sm:mx-0">
                        {/* Desktop Table Header */}
                        <div className="hidden sm:grid grid-cols-5 bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100 px-6 py-4">
                            <div>Student</div>
                            <div>Leave Dates</div>
                            <div>Reason</div>
                            <div>Status</div>
                            <div>Remarks</div>
                        </div>

                        <div className="divide-y divide-gray-100/60 sm:divide-gray-100">
                            {allLeaveRequests.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 font-medium">
                                    No decision history found.
                                </div>
                            ) : (
                                allLeaveRequests.map((req) => (
                                    <div key={req._id} className="flex flex-col sm:grid sm:grid-cols-5 sm:items-center p-4 sm:px-6 sm:py-4 bg-white hover:bg-gray-50/50 transition-colors mb-2 sm:mb-0 border-y sm:border-y-0 border-gray-100">
                                        {/* Mobile Top Row: Student & Status */}
                                        <div className="sm:hidden flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[15px] text-gray-900">{getSafeName(req.student_name, req.admission_no)}</span>
                                                <span className="text-[10px] text-gray-400 font-bold tracking-wider">{getSafeClass(req.class, req.section)} | {req.admission_no}</span>
                                            </div>
                                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(req.status)}`}>
                                                {req.status}
                                            </div>
                                        </div>

                                        {/* Mobile Middle Row: Dates & Reason */}
                                        <div className="sm:hidden flex flex-col gap-1 mb-2">
                                            <div className="text-xs text-gray-700 font-medium">
                                                {formatDate(req.from_date)} {req.type === "Multi Day" && <span className="text-gray-400">to {formatDate(req.to_date)}</span>}
                                            </div>
                                            <p className="text-gray-500 italic text-[11px]">"{req.reason}"</p>
                                        </div>

                                        {/* Mobile Bottom Row: Remarks */}
                                        <div className="sm:hidden mt-2 pt-2 border-t border-gray-50">
                                            <p className="text-[11px] text-indigo-600 font-medium">
                                                <span className="text-gray-400 font-normal">Remarks: </span>
                                                {req.remarks || <span className="text-gray-300">-</span>}
                                            </p>
                                        </div>

                                        {/* Desktop Layout -> Matches Grid Columns */}
                                        <div className="hidden sm:flex flex-col">
                                            <span className="font-bold text-gray-800 text-sm">{getSafeName(req.student_name, req.admission_no)}</span>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">{getSafeClass(req.class, req.section)} | {req.admission_no}</span>
                                        </div>
                                        <div className="hidden sm:flex flex-col text-xs">
                                            <span className="font-semibold text-gray-700">{formatDate(req.from_date)}</span>
                                            {req.type === "Multi Day" && <span className="text-gray-400 font-medium tracking-tight">to {formatDate(req.to_date)}</span>}
                                        </div>
                                        <div className="hidden sm:block max-w-xs pr-4 text-xs italic text-gray-600 line-clamp-2">
                                            "{req.reason}"
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(req.status)}`}>
                                                {req.status}
                                            </div>
                                        </div>
                                        <div className="hidden sm:block text-xs text-indigo-600 font-medium break-words pr-2">
                                            {req.remarks || <span className="text-gray-300">-</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveApproval;
