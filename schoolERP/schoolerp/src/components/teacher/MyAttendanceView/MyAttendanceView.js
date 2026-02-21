import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getSelfAttendance,
    checkSelfBacklogStatus,
    markSelfAttendance,
    requestSelfAttendanceBacklog,
    getSelfAttendanceBacklogs
} from '../../../feature/teachers/teacherSlice';

const MyAttendanceView = () => {
    const dispatch = useDispatch();
    const { profile, selfAttendanceHistory, selfAttendanceBacklogs, loading } = useSelector((state) => state.teacher);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState("Present");
    const [reason, setReason] = useState("");

    // Backlog Modal State
    const [showBacklogModal, setShowBacklogModal] = useState(false);
    const [backlogStartDate, setBacklogStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [backlogEndDate, setBacklogEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [backlogReason, setBacklogReason] = useState("");

    const [checkStatus, setCheckStatus] = useState(null); // { allowed, reason, isPast, isFuture, requiresBacklog }

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
        const res = await dispatch(checkSelfBacklogStatus({ teacherId: profile.teacher_id, date: selectedDate })).unwrap();
        setCheckStatus(res);
    }, [dispatch, profile, selectedDate]);

    useEffect(() => {
        if (profile?.teacher_id) {
            fetchHistory();
            dispatch(getSelfAttendanceBacklogs(profile.teacher_id));
        }
    }, [profile, fetchHistory, dispatch]);

    useEffect(() => {
        if (profile?.teacher_id && selectedDate) {
            checkDateStatus();
        }
    }, [selectedDate, profile, checkDateStatus]);

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        if (!checkStatus?.allowed) return;

        try {
            await dispatch(markSelfAttendance({
                teacherId: profile.teacher_id,
                attendanceData: {
                    date: selectedDate,
                    status: status,
                    reason: reason
                }
            })).unwrap();

            // Refresh history and status
            fetchHistory();
            checkDateStatus();
            setReason("");
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
            alert("Backlog request submitted to Admin.");
        } catch (error) {
            console.error("Failed to request backlog", error);
            alert("Failed to submit request.");
        }
    };

    return (
        <div className="p-4 md:p-6 pb-24 md:pb-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Attendance</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ACTION CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Mark Attendance</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                            type="date"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {checkStatus?.isFuture && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">
                            Cannot mark attendance for future dates.
                        </div>
                    )}

                    {checkStatus?.isPast && !checkStatus?.allowed && (
                        <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                            <p className="text-yellow-700 text-sm">
                                The window to mark attendance for this date has closed. You must request an Attendance Backlog from the Admin.
                            </p>
                        </div>
                    )}

                    {checkStatus?.allowed && (
                        <form onSubmit={handleMarkAttendance}>
                            {checkStatus.reason && checkStatus.reason.includes('Backlog') && (
                                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg mb-4">
                                    Admin has opened a backlog window for this date.
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Half-Day">Half-Day</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Note / Reason (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Enter reason if absent/late..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Save Attendance"}
                            </button>
                        </form>
                    )}
                </div>

                {/* HISTORY CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent History (This Month)</h2>

                    {selfAttendanceHistory.length === 0 ? (
                        <p className="text-gray-500 text-sm">No attendance records found for this month.</p>
                    ) : (
                        <div className="space-y-3">
                            {selfAttendanceHistory.map((record) => (
                                <div key={record._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </p>
                                        {record.edit_note && (
                                            <p className="text-xs text-gray-500 mt-1">{record.edit_note}</p>
                                        )}
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                            record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* BACKLOG REQUEST MODAL/SECTION */}
            {showBacklogModal ? (
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-yellow-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Request Attendance Backlog</h2>
                        <button onClick={() => setShowBacklogModal(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                    </div>

                    <form onSubmit={handleRequestBacklog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                required
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                value={backlogStartDate}
                                onChange={(e) => setBacklogStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                required
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                value={backlogEndDate}
                                onChange={(e) => setBacklogEndDate(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                            <textarea
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                placeholder="Explain why you could not mark attendance on time..."
                                rows="2"
                                required
                                value={backlogReason}
                                onChange={(e) => setBacklogReason(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" disabled={loading} className="w-full md:w-auto px-6 py-2.5 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors">
                                {loading ? "Sending..." : "Send Request to Admin"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setShowBacklogModal(true)}
                        className="text-sm font-medium text-yellow-600 hover:text-yellow-700 underline"
                    >
                        Need to mark attendance for a past date? Request a Backlog
                    </button>
                </div>
            )}

            {/* BACKLOGS HISTORY SECTION */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">My Backlog Requests</h2>

                {(!selfAttendanceBacklogs || selfAttendanceBacklogs.length === 0) ? (
                    <p className="text-gray-500 text-sm">You have not requested any backlogs yet.</p>
                ) : (
                    <div className="space-y-3">
                        {selfAttendanceBacklogs.map((backlog) => (
                            <div key={backlog._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50 gap-4">
                                <div>
                                    <p className="font-medium text-gray-800 text-sm mb-1">
                                        For: {new Date(backlog.start_date).toLocaleDateString('en-GB')} - {new Date(backlog.end_date).toLocaleDateString('en-GB')}
                                    </p>
                                    <p className="text-sm text-gray-600">Reason: {backlog.reason}</p>
                                    {backlog.admin_remarks && (
                                        <p className="text-xs text-gray-500 mt-1 italic">Admin: "{backlog.admin_remarks}"</p>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full mb-2 ${backlog.status === 'Open' ? 'bg-green-100 text-green-700' :
                                        backlog.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            backlog.status === 'Closed' ? 'bg-gray-200 text-gray-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {backlog.status === 'Open' ? 'Approved' : backlog.status}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        Requested: {new Date(backlog.requested_at).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAttendanceView;
