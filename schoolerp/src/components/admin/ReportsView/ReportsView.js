import React, { useState } from 'react';
import { Download } from 'lucide-react';

const ReportsView = ({
    teacherReports,
    studentReports,
    attendanceStats,
    academicReports,
    loading
}) => {
    const [activeTab, setActiveTab] = useState('teachers');

    const tabs = [
        { id: 'teachers', label: 'Teacher Reports' },
        { id: 'students', label: 'Student Reports' },
        { id: 'attendance', label: 'Attendance Stats' },
        { id: 'academic', label: 'Academic Progress' },
    ];

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-4 px-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Teacher Reports */}
                            {activeTab === 'teachers' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Teacher Performance Reports</h3>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                            <Download size={16} />
                                            Export
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Homework</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Announcements</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {teacherReports && teacherReports.length > 0 ? (
                                                    teacherReports.map((report) => (
                                                        <tr key={report.teacher_id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">{report.teacher_id}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{report.name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.assigned_classes}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.homework_assigned}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.attendance_marked}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.announcements_created}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                                            No teacher reports available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Student Reports */}
                            {activeTab === 'students' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Student Performance Reports</h3>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                            <Download size={16} />
                                            Export
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exams</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">House</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {studentReports && studentReports.length > 0 ? (
                                                    studentReports.map((report) => (
                                                        <tr key={report.admission_no} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">{report.admission_no}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{report.name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.class}-{report.section}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.total_exams}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.attendance_percentage}%</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.house}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                                            No student reports available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Attendance Stats */}
                            {activeTab === 'attendance' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Statistics</h3>
                                    {attendanceStats ? (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="bg-blue-50 p-6 rounded-lg">
                                                <p className="text-sm text-blue-600 font-medium">Total Records</p>
                                                <p className="text-3xl font-bold text-blue-900 mt-2">{attendanceStats.total_records}</p>
                                            </div>
                                            <div className="bg-green-50 p-6 rounded-lg">
                                                <p className="text-sm text-green-600 font-medium">Present</p>
                                                <p className="text-3xl font-bold text-green-900 mt-2">{attendanceStats.present}</p>
                                            </div>
                                            <div className="bg-red-50 p-6 rounded-lg">
                                                <p className="text-sm text-red-600 font-medium">Absent</p>
                                                <p className="text-3xl font-bold text-red-900 mt-2">{attendanceStats.absent}</p>
                                            </div>
                                            <div className="bg-yellow-50 p-6 rounded-lg">
                                                <p className="text-sm text-yellow-600 font-medium">Attendance Rate</p>
                                                <p className="text-3xl font-bold text-yellow-900 mt-2">{attendanceStats.attendance_rate}%</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500 py-8">No attendance statistics available</p>
                                    )}
                                </div>
                            )}

                            {/* Academic Progress */}
                            {activeTab === 'academic' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Progress by Class</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Exams</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {academicReports && academicReports.length > 0 ? (
                                                    academicReports.map((report, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">{report.class}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{report.section}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.total_students}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{report.total_exams}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                            No academic reports available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
