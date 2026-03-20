import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSelfLeaves, applyForSelfLeave } from '../../../feature/teachers/teacherSlice';
import { 
    Calendar, FileText, CheckCircle, XCircle, Clock, 
    MoreHorizontal, Plus, X, Upload, Info, Lightbulb, 
    CalendarDays 
} from 'lucide-react';

const MyLeavesView = () => {
    const dispatch = useDispatch();
    const { profile, myLeavesHistory, loading } = useSelector((state) => state.teacher);

    const [showForm, setShowForm] = useState(false);
    const [leaveType, setLeaveType] = useState('Full-Day');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState("");
    const [attachment, setAttachment] = useState(null);

    useEffect(() => {
        if (profile?.teacher_id) {
            dispatch(getSelfLeaves(profile.teacher_id));
        }
    }, [dispatch, profile]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('start_date', startDate);
        formData.append('end_date', leaveType === 'Half-Day' ? startDate : endDate);
        formData.append('reason', `${leaveType === 'Half-Day' ? '[Half-Day] ' : ''}${reason}`);
        if (attachment) {
            formData.append('attachment', attachment);
        }

        try {
            await dispatch(applyForSelfLeave({
                teacherId: profile.teacher_id,
                leaveData: formData
            })).unwrap();

            setShowForm(false);
            setReason("");
            setAttachment(null);
            dispatch(getSelfLeaves(profile.teacher_id));
        } catch (error) {
            console.error('Failed to submit leave', error);
            alert(error.message || 'Failed to submit leave request');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle size={14} />;
            case 'Rejected': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const getStatusClasses = (status) => {
        switch (status) {
            case 'Approved': return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100";
            case 'Rejected': return "bg-rose-50 text-rose-600 ring-1 ring-rose-100";
            default: return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-1">
            
            {/* Minimal Header Section - Only Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 text-sm"
                >
                    <Plus size={18} />
                    Request Leave
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content: Leave History Table */}
                <div className="lg:col-span-2 bg-white rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white">
                        <h3 className="text-lg font-black text-slate-800">My Leave History</h3>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-400">
                            <CalendarDays size={16} />
                            <span className="text-[10px] font-black uppercase tracking-wider">{new Date().getFullYear()} Statistics</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Start Date</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">End Date</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Days</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Reason</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && myLeavesHistory.length === 0 ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-slate-400 italic text-sm">Loading history...</td></tr>
                                ) : myLeavesHistory?.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <Calendar size={40} className="text-slate-100 mb-3" />
                                                <p className="text-slate-400 font-medium italic text-sm">No leave applications found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    myLeavesHistory?.map((leave) => {
                                        const start = new Date(leave.start_date);
                                        const end = new Date(leave.end_date);
                                        const diffTime = Math.abs(end - start);
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                        return (
                                            <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-extrabold text-slate-700">
                                                        {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-400">
                                                        {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">{diffDays} day{diffDays > 1 ? 's' : ''}</span>
                                                </td>
                                                <td className="px-6 py-4 min-w-[200px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-600">
                                                            {leave.reason}
                                                        </span>
                                                        {leave.attachment && (
                                                            <div className="h-5 w-5 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                                                                <FileText size={12} className="text-indigo-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusClasses(leave.status)}`}>
                                                        {getStatusIcon(leave.status)}
                                                        {leave.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-gray-300 hover:text-slate-400 transition-colors">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Sidebar: Pro-Tips & Stats */}
                <div className="space-y-6">
                    <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 shadow-md shadow-indigo-100/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <Lightbulb size={100} className="text-indigo-600" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-indigo-900 mb-5 flex items-center gap-2">
                                Pro-Tips <Lightbulb className="text-amber-400" size={20} />
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { text: "Check Admin Remarks in your history for direct feedback.", icon: <Info size={12} /> },
                                    { text: "Submit early to help us manage class coverage effectively.", icon: <Clock size={12} /> },
                                    { text: "Medical certs for sick leaves speed up the approval process.", icon: <FileText size={12} /> }
                                ].map((tip, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-indigo-600">{tip.icon}</span>
                                        </div>
                                        <p className="text-xs font-semibold text-indigo-700/80 leading-relaxed">
                                            {tip.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 shadow-md shadow-slate-200/50 overflow-hidden relative group">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Quick Insights</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Total</p>
                                <p className="text-xl font-black text-slate-800">{myLeavesHistory?.length || 0}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                                <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Approved</p>
                                <p className="text-xl font-black text-emerald-700">{myLeavesHistory?.filter(l => l.status === 'Approved').length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Leave Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[28px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        
                        <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors">
                            <X size={16} />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Request Leave</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Leave Application Form</p>
                        </div>

                        {/* Centered Tabs */}
                        <div className="flex p-1 bg-slate-50 rounded-xl mb-6 max-w-[280px] mx-auto">
                            <button 
                                onClick={() => setLeaveType('Full-Day')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                                    leaveType === 'Full-Day' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Full Day
                            </button>
                            <button 
                                onClick={() => setLeaveType('Half-Day')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                                    leaveType === 'Half-Day' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Half Day
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Start Date</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <input
                                            type="date"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-50 text-sm font-bold text-slate-700 transition-all outline-none"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {leaveType === 'Full-Day' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">End Date</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                            <input
                                                type="date"
                                                required
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-50 text-sm font-bold text-slate-700 transition-all outline-none"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Attachment <span className="text-slate-300 font-medium">(Optional)</span></label>
                                <div className="relative group">
                                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <div className="flex items-center w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                                        <input
                                            type="file"
                                            id="leave-attachment"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="leave-attachment" className="text-sm font-bold text-slate-400 cursor-pointer flex-1 truncate">
                                            {attachment ? attachment.name : "Upload supporting documents..."}
                                        </label>
                                        {attachment && (
                                            <button type="button" onClick={() => setAttachment(null)} className="ml-2 text-slate-300 hover:text-rose-500">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Reason for Leave</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 text-sm font-medium text-slate-700 transition-all outline-none resize-none"
                                    placeholder="Briefly explain your absence..."
                                    rows="3"
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95 mt-2"
                            >
                                {loading ? "SUBMITTING..." : "SUBMIT REQUEST"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyLeavesView;
