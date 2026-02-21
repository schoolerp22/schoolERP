import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getTeachersAttendance,
    getTeacherAttendanceBacklogs,
    approveTeacherAttendanceBacklog
} from '../../../feature/admin/adminSlice';
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const TeachersAttendanceView = ({ adminId }) => {
    const dispatch = useDispatch();
    const {
        teachersAttendanceData,
        teacherAttendanceBacklogs,
        loading
    } = useSelector((state) => state.admin);

    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'backlogs'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (activeTab === 'attendance' && adminId) {
            dispatch(getTeachersAttendance({ adminId, date: selectedDate }));
        } else if (activeTab === 'backlogs' && adminId) {
            dispatch(getTeacherAttendanceBacklogs({ adminId, status: '' })); // Fetch all backlogs
        }
    }, [activeTab, selectedDate, adminId, dispatch]);

    const handleApproveReject = async (requestId, status) => {
        if (!window.confirm(`Are you sure you want to mark this request as ${status}?`)) return;

        try {
            await dispatch(approveTeacherAttendanceBacklog({
                adminId,
                requestId,
                status,
                remarks: `Request ${status} by Admin`
            })).unwrap();

            // Refresh backlogs
            dispatch(getTeacherAttendanceBacklogs({ adminId, status: '' }));
        } catch (error) {
            console.error("Failed to update backlog request", error);
            alert("Failed to update request status.");
        }
    };

    // Filter attendance data
    const filteredAttendance = teachersAttendanceData?.filter(teacher =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.teacher_id.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="p-4 md:p-6 pb-24 md:pb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Teacher Attendance </h1>

            {/* TABS */}
            <div className="flex border-b border-gray-200 mb-6 bg-white shrink-0 shadow-sm rounded-t-lg overflow-x-auto whitespace-nowrap hide-scrollbar">
                <button
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 flex-1 md:flex-none ${activeTab === 'attendance'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    onClick={() => setActiveTab('attendance')}
                >
                    Daily Attendance
                </button>
                <button
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 flex-1 md:flex-none ${activeTab === 'backlogs'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    onClick={() => setActiveTab('backlogs')}
                >
                    Backlog Requests
                    {teacherAttendanceBacklogs?.filter(b => b.status === "Pending").length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                            {teacherAttendanceBacklogs.filter(b => b.status === "Pending").length}
                        </span>
                    )}
                </button>
            </div>

            {/* CONTENT */}
            {activeTab === 'attendance' && (
                <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 p-6">

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search teacher..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <label className="text-sm text-gray-600 font-medium">Date:</label>
                            <input
                                type="date"
                                className="border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-auto"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table / Cards */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading attendance...</div>
                    ) : filteredAttendance.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No teachers found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap hidden md:table">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4">Teacher ID</th>
                                        <th className="py-3 px-4">Name</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAttendance.map(teacher => (
                                        <tr key={teacher.teacher_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-gray-900">{teacher.teacher_id}</td>
                                            <td className="py-3 px-4 text-gray-700">{teacher.name}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${teacher.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                        teacher.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                            teacher.status === 'Half-Day' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {teacher.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 text-xs">{teacher.edit_note || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile View */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {filteredAttendance.map(teacher => (
                                    <div key={teacher.teacher_id} className="bg-white border text-sm border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold text-gray-900 block">{teacher.name}</span>
                                                <span className="text-xs text-gray-500">{teacher.teacher_id}</span>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${teacher.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                    teacher.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                        teacher.status === 'Half-Day' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-600'
                                                }`}>
                                                {teacher.status}
                                            </span>
                                        </div>
                                        {teacher.edit_note && (
                                            <p className="text-xs text-gray-600 italic mt-1">Note: {teacher.edit_note}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'backlogs' && (
                <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 p-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading requests...</div>
                    ) : teacherAttendanceBacklogs?.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No backlog requests found.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teacherAttendanceBacklogs?.map(request => (
                                <div key={request._id} className="border border-gray-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{request.teacher_name}</h3>
                                            <p className="text-xs text-gray-500">{request.teacher_id}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                request.status === 'Open' ? 'bg-green-100 text-green-700' :
                                                    request.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                                        <p><span className="font-medium text-gray-700">Type:</span> Past Attendance Backlog</p>
                                        <p><span className="font-medium text-gray-700">Date:</span> {new Date(request.start_date).toLocaleDateString()}</p>
                                        <p><span className="font-medium text-gray-700">Reason:</span> {request.reason}</p>
                                    </div>

                                    {request.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproveReject(request._id, 'Open')}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle size={16} /> Open Let
                                            </button>
                                            <button
                                                onClick={() => handleApproveReject(request._id, 'Rejected')}
                                                className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center justify-center gap-1"
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </div>
                                    )}

                                    {request.status === 'Open' && (
                                        <button
                                            onClick={() => handleApproveReject(request._id, 'Closed')}
                                            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 flex items-center justify-center gap-1"
                                        >
                                            <XCircle size={16} /> Close Backlog Window
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeachersAttendanceView;
