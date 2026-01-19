import React from 'react';
import { Users, Calendar, BookOpen, Clock, FileText, Bell } from 'lucide-react';

const DashboardView = ({ dashboardStats, onViewChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardStats?.totalStudents || 0}
              </p>
            </div>
            <Users className="text-blue-500" size={32} />
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
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Homework</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardStats?.activeHomework || 0}
              </p>
            </div>
            <BookOpen className="text-green-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Attendance</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardStats?.attendanceMarked || 0}
              </p>
            </div>
            <Calendar className="text-purple-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Assigned Classes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardStats?.assignedClasses || 0}
              </p>
            </div>
            <FileText className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onViewChange('attendance')}
            className="p-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Calendar className="text-indigo-600 mx-auto mb-2" size={32} />
            <p className="text-sm font-medium text-gray-900">Mark Attendance</p>
          </button>
          
          <button 
            onClick={() => onViewChange('homework')}
            className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
          >
            <BookOpen className="text-green-600 mx-auto mb-2" size={32} />
            <p className="text-sm font-medium text-gray-900">Assign Homework</p>
          </button>
          
          <button 
            onClick={() => onViewChange('announcements')}
            className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
          >
            <Bell className="text-yellow-600 mx-auto mb-2" size={32} />
            <p className="text-sm font-medium text-gray-900">Create Announcement</p>
          </button>
          
          <button 
            onClick={() => onViewChange('leaves')}
            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <FileText className="text-purple-600 mx-auto mb-2" size={32} />
            <p className="text-sm font-medium text-gray-900">Review Leaves</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;