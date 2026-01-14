import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, Calendar, BookOpen, Bell, FileText, 
  CheckCircle, XCircle, Clock, Home, Menu, X,
  Search, Loader
} from 'lucide-react';
import {
  getTeacherProfile,
  getAssignedStudents,
  getStudentsByClass,
  markAttendance,
  assignHomework,
  createAnnouncement,
  getLeaveRequests,
  approveLeave,
  getDashboardStats,
  clearError,
  clearSuccess
} from '../../feature/teachers/teacherSlice';

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const { 
    profile, 
    students, 
    selectedClassStudents, 
    dashboardStats, 
    leaveRequests,
    loading, 
    error, 
    success 
  } = useSelector((state) => state.teacher);

  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [showModal, setShowModal] = useState(null);
  const [teacherId] = useState('T-101'); // Get from auth in real app

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [homeworkForm, setHomeworkForm] = useState({
    subject: '',
    topic: '',
    description: '',
    dueDate: ''
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'Normal'
  });

  useEffect(() => {
    dispatch(getTeacherProfile(teacherId));
    dispatch(getAssignedStudents(teacherId));
    dispatch(getDashboardStats(teacherId));
    dispatch(getLeaveRequests(teacherId));
  }, [dispatch, teacherId]);

  useEffect(() => {
    if (profile && profile.assigned_classes && profile.assigned_classes.length > 0) {
      const firstClass = profile.assigned_classes[0];
      setSelectedClass(`${firstClass.class}-${firstClass.section}`);
    }
  }, [profile]);

  useEffect(() => {
    if (selectedClass) {
      dispatch(getStudentsByClass({ teacherId, classSection: selectedClass }));
    }
  }, [selectedClass, dispatch, teacherId]);

  useEffect(() => {
    if (selectedClassStudents && selectedClassStudents.length > 0) {
      const initialAttendance = {};
      selectedClassStudents.forEach(student => {
        initialAttendance[student.admission_no] = 'Present';
      });
      setAttendanceData(initialAttendance);
    }
  }, [selectedClassStudents]);

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(clearSuccess());
        dispatch(getDashboardStats(teacherId));
        dispatch(getLeaveRequests(teacherId));
      }, 2000);
    }
  }, [success, dispatch, teacherId]);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatch(clearError());
      }, 3000);
    }
  }, [error, dispatch]);

  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'students', icon: Users, label: 'My Students' },
    { id: 'attendance', icon: Calendar, label: 'Attendance' },
    { id: 'homework', icon: BookOpen, label: 'Homework' },
    { id: 'announcements', icon: Bell, label: 'Announcements' },
    { id: 'leaves', icon: FileText, label: 'Leave Requests' },
  ];

  const handleAttendanceChange = (admissionNo, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [admissionNo]: status
    }));
  };

  const submitAttendance = () => {
    const attendance = Object.entries(attendanceData).map(([admission_no, status]) => ({
      admission_no,
      status
    }));
    
    dispatch(markAttendance({
      teacherId,
      attendanceData: {
        date: attendanceDate,
        classSection: selectedClass,
        attendance
      }
    }));
  };

  const submitHomework = () => {
    dispatch(assignHomework({
      teacherId,
      homeworkData: {
        ...homeworkForm,
        classSection: selectedClass
      }
    }));
    setShowModal(null);
    setHomeworkForm({ subject: '', topic: '', description: '', dueDate: '' });
  };

  const submitAnnouncement = () => {
    dispatch(createAnnouncement({
      teacherId,
      announcementData: {
        ...announcementForm,
        classSection: selectedClass
      }
    }));
    setShowModal(null);
    setAnnouncementForm({ title: '', message: '', priority: 'Normal' });
  };

  const handleApproveLeave = (leaveId, status) => {
    dispatch(approveLeave({
      teacherId,
      leaveData: {
        leaveId,
        status,
        remarks: ''
      }
    }));
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error.message || 'Something went wrong!'}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Operation completed successfully!
        </div>
      )}

      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-indigo-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-indigo-800">
          {sidebarOpen && <h1 className="text-xl font-bold">Teacher Portal</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-indigo-800 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-indigo-800 text-white' 
                  : 'hover:bg-indigo-800 text-indigo-200'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm">
              {profile.personal_details.name.split(' ').map(n => n[0]).join('')}
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium">{profile.personal_details.name}</p>
                <p className="text-xs text-indigo-300">{profile.teacher_id}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === currentView)?.label}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{profile.personal_details.email}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {profile.assigned_classes && profile.assigned_classes.length > 0 && (
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {profile.assigned_classes.map(ac => (
                    <option key={`${ac.class}-${ac.section}`} value={`${ac.class}-${ac.section}`}>
                      Class {ac.class}-{ac.section} ({ac.subject})
                    </option>
                  ))}
                </select>
              )}
              
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell size={20} className="text-gray-600" />
                {leaveRequests && leaveRequests.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {currentView === 'dashboard' && (
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
                    onClick={() => setCurrentView('attendance')}
                    className="p-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Calendar className="text-indigo-600 mx-auto mb-2" size={32} />
                    <p className="text-sm font-medium text-gray-900">Mark Attendance</p>
                  </button>
                  
                  <button 
                    onClick={() => setShowModal('homework')}
                    className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <BookOpen className="text-green-600 mx-auto mb-2" size={32} />
                    <p className="text-sm font-medium text-gray-900">Assign Homework</p>
                  </button>
                  
                  <button 
                    onClick={() => setShowModal('announcement')}
                    className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    <Bell className="text-yellow-600 mx-auto mb-2" size={32} />
                    <p className="text-sm font-medium text-gray-900">Create Announcement</p>
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('leaves')}
                    className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                    <p className="text-sm font-medium text-gray-900">Review Leaves</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'students' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Students in Class {selectedClass}
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader className="animate-spin text-indigo-600" size={32} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedClassStudents && selectedClassStudents.length > 0 ? (
                        selectedClassStudents.map((student) => (
                          <tr key={student.admission_no} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{student.roll_no}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {student.personal_details.first_name} {student.personal_details.last_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.admission_no}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.personal_details.phone}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {student.house}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No students found in this class
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {currentView === 'attendance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader className="animate-spin text-indigo-600" size={32} />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {selectedClassStudents && selectedClassStudents.length > 0 ? (
                        selectedClassStudents.map((student) => (
                          <div key={student.admission_no} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.roll_no}. {student.personal_details.first_name} {student.personal_details.last_name}
                              </p>
                              <p className="text-sm text-gray-600">{student.admission_no}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAttendanceChange(student.admission_no, 'Present')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  attendanceData[student.admission_no] === 'Present'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.admission_no, 'Absent')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  attendanceData[student.admission_no] === 'Absent'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.admission_no, 'Late')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  attendanceData[student.admission_no] === 'Late'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Late
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-8">No students to mark attendance</p>
                      )}
                    </div>
                    
                    {selectedClassStudents && selectedClassStudents.length > 0 && (
                      <button
                        onClick={submitAttendance}
                        disabled={loading}
                        className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? 'Submitting...' : 'Submit Attendance'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {currentView === 'leaves' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h3>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader className="animate-spin text-indigo-600" size={32} />
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {leaveRequests && leaveRequests.length > 0 ? (
                    leaveRequests.map((leave) => (
                      <div key={leave._id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{leave.student_name}</p>
                            <p className="text-sm text-gray-600 mt-1">{leave.admission_no}</p>
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Duration:</span> {leave.from_date} to {leave.to_date}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Reason:</span> {leave.reason}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveLeave(leave._id, 'Approved')}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveLeave(leave._id, 'Rejected')}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No pending leave requests
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showModal === 'homework' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Assign Homework</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={homeworkForm.subject}
                  onChange={(e) => setHomeworkForm({...homeworkForm, subject: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={homeworkForm.topic}
                  onChange={(e) => setHomeworkForm({...homeworkForm, topic: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({...homeworkForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={homeworkForm.dueDate}
                  onChange={(e) => setHomeworkForm({...homeworkForm, dueDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={submitHomework}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button 
                  onClick={() => setShowModal(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}




      {/* Announcement Modal */}
      {showModal === 'announcement' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={submitAnnouncement} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                  Create
                </button>
                <button 
                  onClick={() => setShowModal(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;