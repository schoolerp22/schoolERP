import React from 'react';
import {
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    FileText,
    Clock,
    School
} from 'lucide-react';

const DashboardView = ({ dashboardStats, onViewChange }) => {
    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Teachers</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.totalTeachers || 0}
                            </p>
                        </div>
                        <GraduationCap className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.totalStudents || 0}
                            </p>
                        </div>
                        <Users className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Active Teachers</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.activeTeachers || 0}
                            </p>
                        </div>
                        <GraduationCap className="text-purple-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Classes</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.totalClasses || 0}
                            </p>
                        </div>
                        <School className="text-orange-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Attendance Today</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.attendanceToday || 0}
                            </p>
                        </div>
                        <Calendar className="text-indigo-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Active Homework</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.activeHomework || 0}
                            </p>
                        </div>
                        <BookOpen className="text-teal-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Pending Leaves</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.pendingLeaves || 0}
                            </p>
                        </div>
                        <Clock className="text-yellow-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => onViewChange('teachers')}
                        className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <GraduationCap className="text-blue-600 mx-auto mb-2" size={32} />
                        <p className="text-sm font-medium text-gray-900">Manage Teachers</p>
                    </button>

                    <button
                        onClick={() => onViewChange('students')}
                        className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                    >
                        <Users className="text-green-600 mx-auto mb-2" size={32} />
                        <p className="text-sm font-medium text-gray-900">Manage Students</p>
                    </button>

                    <button
                        onClick={() => onViewChange('reports')}
                        className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                        <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                        <p className="text-sm font-medium text-gray-900">View Reports</p>
                    </button>

                    <button
                        onClick={() => onViewChange('analytics')}
                        className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                        <Calendar className="text-orange-600 mx-auto mb-2" size={32} />
                        <p className="text-sm font-medium text-gray-900">Analytics</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
