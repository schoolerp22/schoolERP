import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLeaveRequests, approveLeave, getAllLeaveRequests } from "../../../feature/teachers/teacherSlice";
import { Clock, CheckCircle, XCircle, MessageSquare, Calendar, User, FileDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
            {/* Header / Subtitle Context */}
            <div className="mb-8 p-1">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Calendar size={20} />
                    </div>
                    Leave Approvals
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1 ml-13 border-l-2 border-transparent pl-13">Manage your students' leave requests efficiently.</p>
            </div>

            {/* Summary Cards */}
            <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-6 overflow-x-auto hide-scrollbar pb-2 sm:pb-0 px-1 sm:px-0">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-amber-100/40 hover:-translate-y-1 transition-all duration-300 flex flex-row items-center gap-4 min-w-[150px] sm:min-w-0 flex-1 group">
                    <div className="p-3 sm:p-4 bg-amber-50 rounded-[20px] text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Clock size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Pending</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-800 leading-none">{summary.pending}</p>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-green-100/40 hover:-translate-y-1 transition-all duration-300 flex flex-row items-center gap-4 min-w-[150px] sm:min-w-0 flex-1 group">
                    <div className="p-3 sm:p-4 bg-green-50 rounded-[20px] text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <CheckCircle size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Approved</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-800 leading-none">{summary.approved}</p>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-rose-100/40 hover:-translate-y-1 transition-all duration-300 flex flex-row items-center gap-4 min-w-[150px] sm:min-w-0 flex-1 group">
                    <div className="p-3 sm:p-4 bg-rose-50 rounded-[20px] text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <XCircle size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Rejected</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-800 leading-none">{summary.rejected}</p>
                    </div>
                </motion.div>
            </div>

            {/* Tab Navigation */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-2 p-1.5 bg-slate-50 w-full md:w-fit rounded-[20px] border border-slate-100 shadow-inner mt-4 sm:mt-10 mx-1 sm:mx-0">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "pending"
                        ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        }`}
                >
                    Pending <span className="hidden sm:inline">Requests</span> ({leaveRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "history"
                        ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        }`}
                >
                    History
                </button>
            </motion.div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === "pending" ? (
                    <motion.div key="pending" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 px-1 sm:px-0">
                        {leaveRequests.length > 0 ? (
                            leaveRequests.map((request, idx) => (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={request._id} className="bg-white border border-slate-200 rounded-[32px] shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 hover:shadow-xl hover:shadow-indigo-100/40 hover:border-indigo-100 transition-all duration-300">
                                    {/* Left: Student Info */}
                                    <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 pr-0 md:pr-4 flex flex-col justify-center">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                                            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/50 rounded-[20px] text-indigo-600 flex items-center justify-center shrink-0">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg sm:text-xl truncate">{getSafeName(request.student_name, request.admission_no)}</h3>
                                                <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{getSafeClass(request.class, request.section)} | {request.admission_no}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                                            <Clock size={12} className="text-amber-500" />
                                            Applied: {formatDate(request.request_date)}
                                        </div>
                                    </div>

                                    {/* Middle: Leave Details */}
                                    <div className="md:w-2/4 space-y-4 flex flex-col justify-center">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="bg-indigo-600 text-white shadow-sm shadow-indigo-200 px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {request.type}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm sm:text-base bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                                                {formatDate(request.from_date)}
                                                {request.type === "Multi Day" && <span className="text-slate-400 font-medium"> → <span className="text-slate-700 font-bold">{formatDate(request.to_date)}</span></span>}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative shadow-inner">
                                            <MessageSquare className="absolute -top-3 -left-3 text-indigo-200 fill-indigo-50" size={28} />
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic z-10 relative">"{request.reason}"</p>
                                            
                                            {request.attachment && (
                                                <div className="mt-4 pt-4 border-t border-slate-200/60 inline-block w-full">
                                                    <a
                                                        href={`${process.env.REACT_APP_API_URL}${request.attachment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/50 border border-indigo-100 hover:border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all w-fit"
                                                    >
                                                        <FileDown size={14} />
                                                        View Document
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 w-full group pt-1">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Add an internal remark (optional)..."
                                                    className="w-full bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm focus:shadow-md"
                                                    value={remarksInput[request._id] || ""}
                                                    onChange={(e) => handleRemarkChange(request._id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="md:w-1/4 flex flex-row md:flex-col justify-center sm:justify-center gap-3 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 mt-2 sm:mt-0">
                                        <button
                                            onClick={() => handleAction(request._id, 'Approved')}
                                            disabled={processingId === request._id}
                                            className="flex-1 md:w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-4 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-green-100 hover:shadow-green-200 active:scale-95 disabled:opacity-50 border border-green-400"
                                        >
                                            <CheckCircle2 size={18} />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(request._id, 'Rejected')}
                                            disabled={processingId === request._id}
                                            className="flex-1 md:w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 hover:border-rose-300 py-4 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                        >
                                            <XCircle size={18} />
                                            Decline
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-slate-200 shadow-sm text-center">
                                <div className="p-6 bg-emerald-50 rounded-[32px] mb-6 shadow-inner relative">
                                    <div className="absolute inset-0 bg-emerald-400/20 rounded-[32px] animate-pulse"></div>
                                    <CheckCircle2 className="text-emerald-500 relative z-10" size={56} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">All Caught Up!</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">You have no pending requests to review.</p>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    /* History Tab Content */
                    <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="bg-transparent sm:bg-white rounded-[32px] border-0 sm:border border-slate-200 shadow-sm overflow-hidden -mx-4 sm:mx-0 mt-4 sm:mt-6 px-1 sm:px-0">
                        {/* Desktop Table Header */}
                        <div className="hidden sm:grid grid-cols-5 bg-slate-50 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-200 px-8 py-5">
                            <div>Student</div>
                            <div>Leave Dates</div>
                            <div>Reason</div>
                            <div>Status</div>
                            <div>Remarks</div>
                        </div>

                        <div className="divide-y divide-slate-100 sm:divide-slate-100 bg-white">
                            {allLeaveRequests.length === 0 ? (
                                <div className="p-16 text-center text-slate-400 font-bold tracking-widest uppercase text-sm">
                                    No decision history found.
                                </div>
                            ) : (
                                allLeaveRequests.map((req, i) => (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={req._id} className="flex flex-col sm:grid sm:grid-cols-5 sm:items-center p-5 sm:px-8 sm:py-5 hover:bg-slate-50 transition-colors mb-2 sm:mb-0 border-y sm:border-y-0 border-slate-100 group">
                                        {/* Mobile Top Row: Student & Status */}
                                        <div className="sm:hidden flex justify-between items-start mb-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-lg text-slate-800">{getSafeName(req.student_name, req.admission_no)}</span>
                                                <span className="text-[10px] text-slate-400 font-black tracking-widest mt-1 uppercase">{getSafeClass(req.class, req.section)} | {req.admission_no}</span>
                                            </div>
                                            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusBadgeClass(req.status)}`}>
                                                {req.status}
                                            </div>
                                        </div>

                                        {/* Mobile Middle Row: Dates & Reason */}
                                        <div className="sm:hidden flex flex-col gap-2 mb-4">
                                            <div className="text-xs text-slate-700 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                                {formatDate(req.from_date)} {req.type === "Multi Day" && <span className="text-slate-400">to {formatDate(req.to_date)}</span>}
                                            </div>
                                            <p className="text-slate-500 italic text-[13px] font-medium leading-relaxed bg-slate-50 p-3 rounded-xl">"{req.reason}"</p>
                                        </div>

                                        {/* Mobile Bottom Row: Remarks */}
                                        <div className="sm:hidden pt-3 border-t border-slate-100">
                                            <p className="text-xs text-indigo-600 font-bold">
                                                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Remarks: </span>
                                                {req.remarks || <span className="text-slate-300">-</span>}
                                            </p>
                                        </div>

                                        {/* Desktop Layout -> Matches Grid Columns */}
                                        <div className="hidden sm:flex flex-col">
                                            <span className="font-black text-slate-800 text-sm">{getSafeName(req.student_name, req.admission_no)}</span>
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{getSafeClass(req.class, req.section)} | {req.admission_no}</span>
                                        </div>
                                        <div className="hidden sm:flex flex-col text-xs pr-4">
                                            <span className="font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">{formatDate(req.from_date)}</span>
                                            {req.type === "Multi Day" && <span className="text-slate-400 font-bold tracking-tight mt-1 ml-1 text-[10px] uppercase">to {formatDate(req.to_date)}</span>}
                                        </div>
                                        <div className="hidden sm:block max-w-xs pr-6 text-sm font-medium italic text-slate-500 leading-relaxed">
                                            "{req.reason}"
                                        </div>
                                        <div className="hidden sm:block pr-4">
                                            <div className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusBadgeClass(req.status)}`}>
                                                {req.status}
                                            </div>
                                        </div>
                                        <div className="hidden sm:block text-xs text-indigo-600 font-bold break-words pr-2">
                                            {req.remarks || <span className="text-slate-300">-</span>}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LeaveApproval;
