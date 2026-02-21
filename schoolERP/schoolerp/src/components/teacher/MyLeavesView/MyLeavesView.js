import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSelfLeaves, applyForSelfLeave } from '../../../feature/teachers/teacherSlice';
import { Calendar, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

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

            alert('Leave application submitted successfully for Admin approval.');
            setShowForm(false);
            setReason("");
            setAttachment(null);

            // Refresh history
            dispatch(getSelfLeaves(profile.teacher_id));

        } catch (error) {
            console.error('Failed to submit leave', error);
            alert(error.message || 'Failed to submit leave request');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle className="text-green-500" size={20} />;
            case 'Rejected': return <XCircle className="text-red-500" size={20} />;
            default: return <Clock className="text-yellow-500" size={20} />;
        }
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
        switch (status) {
            case 'Approved': return `${baseClasses} bg-green-100 text-green-700`;
            case 'Rejected': return `${baseClasses} bg-red-100 text-red-700`;
            default: return `${baseClasses} bg-yellow-100 text-yellow-700`;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">My Leave Applications</h2>
                    <p className="text-sm text-gray-500">Apply for leaves and track your requests</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    {showForm ? 'Cancel Application' : 'Apply for Leave'}
                </button>
            </div>

            {/* Application Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in-down">
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                <select
                                    value={leaveType}
                                    onChange={(e) => setLeaveType(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Full-Day">Full Day</option>
                                    <option value="Half-Day">Half Day</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {leaveType === 'Full-Day' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            <div className={leaveType === 'Full-Day' ? 'md:col-span-1' : 'md:col-span-2'}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
                            <textarea
                                required
                                rows="3"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why you are requesting leave..."
                                className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            ></textarea>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Submit to Admin
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Leave History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        My Leave History
                    </h3>
                </div>

                {loading && myLeavesHistory.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Loading your history...</div>
                ) : myLeavesHistory?.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center">
                        <Calendar size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-500">You haven't requested any leaves yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {myLeavesHistory?.map((leave) => (
                            <div key={leave._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={getStatusBadge(leave.status)}>
                                                {leave.status}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                Applied on {new Date(leave.applied_on).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>

                                        <h4 className="font-medium text-gray-900 mb-1">
                                            {new Date(leave.start_date).toLocaleDateString('en-GB')}
                                            {leave.start_date !== leave.end_date && ` to ${new Date(leave.end_date).toLocaleDateString('en-GB')}`}
                                        </h4>
                                        <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-100">
                                            {leave.reason}
                                        </p>

                                        {leave.admin_remarks && (
                                            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 border-l-4 border-l-blue-500">
                                                <span className="font-medium">Admin Remarks:</span> {leave.admin_remarks}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                        {getStatusIcon(leave.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default MyLeavesView;
