import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTeacherLeaves, approveTeacherLeave } from '../../../feature/admin/adminSlice';
import { Search, CheckCircle, XCircle } from 'lucide-react';

const TeachersLeaveView = ({ adminId }) => {
    const dispatch = useDispatch();
    const { teacherLeaveRequests, loading } = useSelector((state) => state.admin);

    const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Approved', 'Rejected'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (adminId) {
            dispatch(getTeacherLeaves({ adminId, status: activeTab === 'All' ? '' : activeTab }));
        }
    }, [activeTab, adminId, dispatch]);

    const handleApproveReject = async (leaveId, status) => {
        const actionText = status === 'Approved' ? 'Approve' : 'Reject';
        if (!window.confirm(`Are you sure you want to ${actionText} this leave request?`)) return;

        const remarks = window.prompt(`Enter remarks for ${actionText} (optional):`);

        try {
            await dispatch(approveTeacherLeave({
                adminId,
                leaveId,
                status,
                remarks: remarks || ''
            })).unwrap();

            // Refresh list
            dispatch(getTeacherLeaves({ adminId, status: activeTab === 'All' ? '' : activeTab }));
        } catch (error) {
            console.error("Failed to update leave request", error);
            alert("Failed to update request status.");
        }
    };

    // Filter by search query
    const filteredRequests = teacherLeaveRequests?.filter(req =>
        req.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                    {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search teacher or reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {activeTab} Teacher Leaves
                    </h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {filteredRequests?.length || 0} Total
                    </span>
                </div>

                <div className="overflow-x-auto">
                    {loading && !teacherLeaveRequests?.length ? (
                        <div className="p-8 text-center text-gray-500">Loading leave requests...</div>
                    ) : filteredRequests?.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No {activeTab.toLowerCase()} leave requests found.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRequests?.map((request) => (
                                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{request.teacher_name}</div>
                                            <div className="text-sm text-gray-500">ID: {request.teacher_id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(request.start_date).toLocaleDateString('en-GB')} to {new Date(request.end_date).toLocaleDateString('en-GB')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 line-clamp-2 max-w-xs">{request.reason}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {new Date(request.applied_on).toLocaleDateString('en-GB')}
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {request.status === 'Pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApproveReject(request._id, 'Approved')}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors title='Approve'"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveReject(request._id, 'Rejected')}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors title='Reject'"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeachersLeaveView;
