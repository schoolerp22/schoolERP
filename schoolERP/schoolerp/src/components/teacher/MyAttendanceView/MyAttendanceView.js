import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getSelfAttendance,
    checkSelfBacklogStatus,
    markSelfAttendance,
    requestSelfAttendanceBacklog
} from '../../../feature/teachers/teacherSlice';

const MyAttendanceView = () => {
    const dispatch = useDispatch();
    const { profile, selfAttendanceHistory, loading } = useSelector((state) => state.teacher);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState("Present");
    const [reason, setReason] = useState("");
    const [backlogReason, setBacklogReason] = useState("");
    const [checkStatus, setCheckStatus] = useState(null); // { allowed, reason, isPast, isFuture, requiresBacklog }

    useEffect(() => {
        if (profile?.teacher_id) {
            fetchHistory();
        }
    }, [profile]);

    useEffect(() => {
        if (profile?.teacher_id && selectedDate) {
            checkDateStatus();
        }
    }, [selectedDate, profile]);

    const fetchHistory = () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

        dispatch(getSelfAttendance({
            teacherId: profile.teacher_id,
            startDate: startOfMonth,
            endDate: endOfMonth
        }));
    };

    const checkDateStatus = async () => {
        const res = await dispatch(checkSelfBacklogStatus({ teacherId: profile.teacher_id, date: selectedDate })).unwrap();
        setCheckStatus(res);
    };

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
                    start_date: selectedDate,
                    end_date: selectedDate,
                    reason: backlogReason
                }
            })).unwrap();

            setBacklogReason("");
            alert("Backlog request submitted to Admin.");
        } catch (error) {
            console.error("Failed to request backlog", error);
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
                            <p className="text-yellow-700 text-sm mb-3">
                                The window to mark attendance for this past date has closed. You must request Admin approval.
                            </p>
                            <form onSubmit={handleRequestBacklog}>
                                <textarea
                                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm mb-2"
                                    placeholder="Reason for late attendance..."
                                    rows="2"
                                    required
                                    value={backlogReason}
                                    onChange={(e) => setBacklogReason(e.target.value)}
                                ></textarea>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50">
                                    Send Request to Admin
                                </button>
                            </form>
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
        </div>
    );
};

export default MyAttendanceView;
