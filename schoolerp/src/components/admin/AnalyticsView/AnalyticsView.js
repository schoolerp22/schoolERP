import React from 'react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

const AnalyticsView = ({ classWiseAnalytics, subjectWiseAnalytics, loading }) => {
    return (
        <div className="space-y-6">
            {/* Class-wise Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="text-indigo-600" size={24} />
                    <h3 className="text-lg font-semibold text-gray-900">Class-wise Analytics</h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boys</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Girls</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender Ratio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {classWiseAnalytics && classWiseAnalytics.length > 0 ? (
                                    classWiseAnalytics.map((analytics, index) => {
                                        const ratio = analytics.student_count > 0
                                            ? `${((analytics.boys / analytics.student_count) * 100).toFixed(1)}% : ${((analytics.girls / analytics.student_count) * 100).toFixed(1)}%`
                                            : 'N/A';

                                        return (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{analytics.class}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{analytics.section}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{analytics.student_count}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                        {analytics.boys}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                                                        {analytics.girls}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{ratio}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                            No class-wise analytics available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Subject-wise Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <PieChart className="text-green-600" size={24} />
                    <h3 className="text-lg font-semibold text-gray-900">Subject-wise Analytics</h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectWiseAnalytics && subjectWiseAnalytics.length > 0 ? (
                            subjectWiseAnalytics.map((analytics, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-2">{analytics.subject}</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Teachers:</span>
                                                    <span className="font-medium text-gray-900">{analytics.teacher_count}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Classes:</span>
                                                    <span className="font-medium text-gray-900">{analytics.class_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <TrendingUp className="text-green-500" size={20} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500 py-8">
                                No subject-wise analytics available
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                    <h4 className="text-sm font-medium opacity-90 mb-2">Total Classes</h4>
                    <p className="text-3xl font-bold">{classWiseAnalytics?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                    <h4 className="text-sm font-medium opacity-90 mb-2">Total Subjects</h4>
                    <p className="text-3xl font-bold">{subjectWiseAnalytics?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                    <h4 className="text-sm font-medium opacity-90 mb-2">Total Students</h4>
                    <p className="text-3xl font-bold">
                        {classWiseAnalytics?.reduce((sum, c) => sum + c.student_count, 0) || 0}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
