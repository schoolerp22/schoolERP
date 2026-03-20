import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Calendar, CheckCircle2, Clock, 
    ArrowRight, PieChart as PieIcon, 
    AlertCircle, UserCheck, UserX,
    ChevronRight
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, 
    ResponsiveContainer 
} from 'recharts';
import {
    getSelfAttendance,
    checkSelfBacklogStatus,
    markSelfAttendance,
    requestSelfAttendanceBacklog,
    getSelfAttendanceBacklogs,
    getDashboardStats
} from '../../../feature/teachers/teacherSlice';

const MyAttendanceView = () => {
    const dispatch = useDispatch();
    const { profile, selfAttendanceHistory, selfAttendanceBacklogs, dashboardStats, loading } = useSelector((state) => state.teacher);

    const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showBacklogModal, setShowBacklogModal] = useState(false);
    const [backlogStartDate, setBacklogStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [backlogEndDate, setBacklogEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [backlogReason, setBacklogReason] = useState("");

    const fetchHistory = useCallback(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

        dispatch(getSelfAttendance({
            teacherId: profile.teacher_id,
            startDate: startOfMonth,
            endDate: endOfMonth
        }));
    }, [dispatch, profile]);

    const checkDateStatus = useCallback(async () => {
        await dispatch(checkSelfBacklogStatus({ teacherId: profile.teacher_id, date: selectedDate })).unwrap();
    }, [dispatch, profile, selectedDate]);

    useEffect(() => {
        if (profile?.teacher_id) {
            fetchHistory();
            dispatch(getSelfAttendanceBacklogs(profile.teacher_id));
            dispatch(getDashboardStats(profile.teacher_id));
        }
    }, [profile, fetchHistory, dispatch]);

    useEffect(() => {
        if (profile?.teacher_id && selectedDate) {
            checkDateStatus();
        }
    }, [selectedDate, profile, checkDateStatus]);

    const handleMark = async (status) => {
        try {
            await dispatch(markSelfAttendance({
                teacherId: profile.teacher_id,
                attendanceData: {
                    date: selectedDate,
                    status: status,
                    reason: status === 'Present' ? 'Regular Marking' : 'Marked Absent'
                }
            })).unwrap();
            fetchHistory();
            checkDateStatus();
            dispatch(getDashboardStats(profile.teacher_id));
        } catch (error) {
            console.error("Failed to mark attendance", error);
        }
    };

    const handleRequestBacklog = async (e) => {
        e.preventDefault();
        try {
            await dispatch(requestSelfAttendanceBacklog({
                teacherId: profile.teacher_id,
                requestData: {
                    start_date: backlogStartDate,
                    end_date: backlogEndDate,
                    reason: backlogReason
                }
            })).unwrap();
            setBacklogReason("");
            setShowBacklogModal(false);
            dispatch(getSelfAttendanceBacklogs(profile.teacher_id));
        } catch (error) {
            console.error("Failed to request backlog", error);
        }
    };

    // Calculate Stats for Donut Chart
    const statsData = useMemo(() => {
        const present = selfAttendanceHistory.filter(r => r.status === 'Present').length;
        const absent = selfAttendanceHistory.filter(r => r.status === 'Absent').length;
        const halfDay = selfAttendanceHistory.filter(r => r.status === 'Half-Day').length;
        const total = present + absent + halfDay || 1; 

        return {
            chart: [
                { name: 'Present', value: present, color: '#10b981' },
                { name: 'Absent', value: absent, color: '#ef4444' },
                { name: 'Half-Day', value: halfDay, color: '#6366f1' },
            ],
            present, absent, halfDay,
            percentage: Math.round((present / total) * 100)
        };
    }, [selfAttendanceHistory]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-1 pt-4">
            {/* Top Row Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Today's Attendance Card */}
                <div className="bg-white p-8 rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            Today's Attendance
                        </h3>

                        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <Clock size={24} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Status</p>
                                    <p className="text-xl font-black text-indigo-900">
                                        {dashboardStats?.selfAttendanceStatus || 'Pending'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-500 font-medium text-sm">
                                <Calendar size={18} className="text-gray-400" />
                                <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400 font-medium text-xs">
                                <AlertCircle size={18} className="text-gray-300" />
                                <span>Mark before 10:00 AM for regular status.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button 
                                onClick={() => handleMark('Present')}
                                disabled={dashboardStats?.selfAttendanceStatus === 'Present'}
                                className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:bg-indigo-400 shadow-lg shadow-indigo-200"
                            >
                                <UserCheck size={20} />
                                Mark Present
                            </button>
                            <button 
                                onClick={() => handleMark('Absent')}
                                disabled={dashboardStats?.selfAttendanceStatus === 'Absent'}
                                className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-gray-100 hover:border-rose-200 hover:bg-rose-50 text-gray-600 hover:text-rose-600 rounded-2xl font-bold transition-all disabled:opacity-50"
                            >
                                <UserX size={20} />
                                Mark Absent
                            </button>
                        </div>
                    </div>
                </div>

                {/* Monthly Statistics Card (Donut) */}
                <div className="bg-[#f8fafc] p-8 rounded-[32px] border border-slate-200 shadow-md shadow-slate-200/50">
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center justify-between">
                        Monthly Summary
                        <PieIcon size={20} className="text-gray-400" />
                    </h3>

                    <div className="flex items-center gap-4">
                        <div className="h-40 w-40 shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statsData.chart}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statsData.chart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-800">{statsData.percentage}%</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Present</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present
                                </p>
                                <p className="text-lg font-black text-slate-800">{statsData.present} days</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-rose-600 tracking-wider flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-rose-500"></span> Absent
                                </p>
                                <p className="text-lg font-black text-slate-800">{statsData.absent} days</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Half-Day
                                </p>
                                <p className="text-lg font-black text-slate-800">{statsData.halfDay} day</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Attendance Mini List */}
                <div className="bg-white p-8 rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <h3 className="text-lg font-black text-gray-900 mb-6">Recent Status</h3>
                    <div className="space-y-4">
                        {selfAttendanceHistory.slice(0, 4).map((record) => (
                            <div key={record._id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                        record.status === 'Absent' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                                    }`}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">
                                        {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${
                                        record.status === 'Present' ? 'text-emerald-500' :
                                        record.status === 'Absent' ? 'text-rose-500' : 'text-indigo-500'
                                    }`}>
                                        {record.status}
                                    </span>
                                    <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => {}} className="w-full mt-8 py-3 flex items-center justify-center gap-2 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold transition-all border border-gray-100">
                        View Monthly Calendar <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Bottom Section: Detailed History & Backlogs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Detailed History Table-Card */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 leading-tight">Recent Detailed History</h3>
                        <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <div className="flex gap-1">
                                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {selfAttendanceHistory.length > 0 ? selfAttendanceHistory.slice(0, 4).map((record) => (
                            <div key={record._id} className="grid grid-cols-4 items-center p-4 rounded-2xl hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-800">{new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <div className={`h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                                        record.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}>
                                        <CheckCircle2 size={8} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${
                                        record.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}></span>
                                    <span className="text-sm font-bold text-slate-600">{record.status}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">1 day</span>
                                </div>
                                <div className="text-xs font-bold text-slate-400 italic truncate pr-4">
                                    {record.reason || "N/A"}
                                </div>
                                <div className="justify-self-end">
                                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-tight">
                                        Approved
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 py-8 italic text-sm">No attendance records found</p>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">Need to mark past attendance?</p>
                        <button 
                            onClick={() => setShowBacklogModal(true)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                        >
                            Request Backlog +
                        </button>
                    </div>
                </div>

                {/* Backlog Requests Column */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-900 leading-tight">Backlog Requests</h3>
                    </div>

                    <div className="space-y-4">
                        {selfAttendanceBacklogs.length > 0 ? selfAttendanceBacklogs.slice(0, 3).map((backlog) => (
                            <div key={backlog._id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-black text-slate-800">
                                        {new Date(backlog.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                                        backlog.status === 'Open' ? 'bg-emerald-100 text-emerald-600' :
                                        backlog.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {backlog.status === 'Open' ? 'Approved' : backlog.status}
                                        {backlog.status === 'Open' && <ChevronRight size={10} className="inline ml-1" />}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-tight">Reason: {backlog.reason}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Requested: {new Date(backlog.requested_at).toLocaleDateString()}</p>
                            </div>
                        )) : (
                            <p className="text-center text-gray-400 py-8 italic text-sm">No backlog requests found</p>
                        )}
                    </div>

                    <button 
                        onClick={() => setShowBacklogModal(true)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95"
                    >
                        Request Backlog
                    </button>
                </div>
            </div>

            {/* Backlog Request Modal Overlay */}
            {showBacklogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Request Backlog</h2>
                            <button onClick={() => setShowBacklogModal(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors">
                                <ArrowRight className="rotate-180" size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleRequestBacklog} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-bold text-gray-700"
                                        value={backlogStartDate}
                                        onChange={(e) => setBacklogStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-bold text-gray-700"
                                        value={backlogEndDate}
                                        onChange={(e) => setBacklogEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-1">Reason</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-bold text-gray-700"
                                    placeholder="Explain why you could not mark attendance on time..."
                                    rows="3"
                                    required
                                    value={backlogReason}
                                    onChange={(e) => setBacklogReason(e.target.value)}
                                ></textarea>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 disabled:opacity-50">
                                {loading ? "Sending..." : "Send Request to Admin"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAttendanceView;
