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
        <div className="space-y-6 sm:space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 sm:px-0">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Teachers</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.totalTeachers || 0}
                            </p>
                        </div>
                        <GraduationCap className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Students</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.totalStudents || 0}
                            </p>
                        </div>
                        <Users className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Active Teachers</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.activeTeachers || 0}
                            </p>
                        </div>
                        <GraduationCap className="text-purple-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Classes</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                {dashboardStats?.totalClasses || 0}
                            </p>
                        </div>
                        <School className="text-orange-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 px-4 sm:px-0">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Attendance Today</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                                {dashboardStats?.attendanceToday || 0}
                            </p>
                        </div>
                        <Calendar className="text-indigo-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Active Homework</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                                {dashboardStats?.activeHomework || 0}
                            </p>
                        </div>
                        <BookOpen className="text-teal-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Pending Leaves</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                                {dashboardStats?.pendingLeaves || 0}
                            </p>
                        </div>
                        <Clock className="text-yellow-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 sm:px-0 mb-4 sm:mb-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <button
                            onClick={() => onViewChange('teachers')}
                            className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group active:scale-95"
                        >
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-3 mx-auto group-hover:scale-110 transition-transform">
                                <GraduationCap className="text-blue-600" size={24} />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Teachers</p>
                        </button>

                        <button
                            onClick={() => onViewChange('students')}
                            className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 transition-colors group active:scale-95"
                        >
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-3 mx-auto group-hover:scale-110 transition-transform">
                                <Users className="text-green-600" size={24} />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Students</p>
                        </button>

                        <button
                            onClick={() => onViewChange('reports')}
                            className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-colors group active:scale-95"
                        >
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-3 mx-auto group-hover:scale-110 transition-transform">
                                <FileText className="text-purple-600" size={24} />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Reports</p>
                        </button>

                        <button
                            onClick={() => onViewChange('analytics')}
                            className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-colors group active:scale-95"
                        >
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-3 mx-auto group-hover:scale-110 transition-transform">
                                <Calendar className="text-orange-600" size={24} />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Analytics</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
