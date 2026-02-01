import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader, BarChart2, CheckSquare, TrendingUp, AlertCircle, Calendar, History, Clock } from 'lucide-react';
import { markAttendance, getAttendanceSummary, getAttendance, getApprovedLeaves } from '../../../feature/teachers/teacherSlice';
import {
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#ef4444', '#eab308', '#22c55e']; // Red (<75), Yellow (75-90), Green (>90)

const AttendanceView = ({ students, selectedClass, teacherId, loadings }) => {
  const [activeTab, setActiveTab] = useState('mark'); // 'mark', 'summary', 'history'

  const loading = activeTab === 'mark' ? (loadings?.students || loadings?.leaves) :
    activeTab === 'summary' ? loadings?.attendance :
      loadings?.attendance;
  const dispatch = useDispatch();
  const { attendanceSummary, attendance, approvedLeaves } = useSelector((state) => state.teacher);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]); // Separate date for history
  const [attendanceData, setAttendanceData] = useState({});
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [summaryRange, setSummaryRange] = useState('overall'); // 'overall', 'weekly', 'monthly', 'month', 'custom'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customRange, setCustomRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Track if we have already auto-filled from leaves to prevent overwriting manual changes
  const hasAutoFilledRef = useRef(false);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    // Tab: Insights
    if (activeTab === 'summary' && selectedClass) {
      const params = { range: summaryRange };
      if (summaryRange === 'month') {
        params.month = selectedMonth;
      } else if (summaryRange === 'custom') {
        params.startDate = customRange.startDate;
        params.endDate = customRange.endDate;
      }
      dispatch(getAttendanceSummary({ teacherId, classSection: selectedClass, ...params }));
    }
    // Tab: Mark Attendance (Fetch Approved Leaves only)
    else if (activeTab === 'mark' && selectedClass && attendanceDate) {
      hasAutoFilledRef.current = false;
      dispatch(getApprovedLeaves({ teacherId, date: attendanceDate, classSection: selectedClass }));
    }
    // Tab: History (Fetch Past Attendance)
    else if (activeTab === 'history' && selectedClass && historyDate) {
      dispatch(getAttendance({ teacherId, date: historyDate, classSection: selectedClass }));
    }
  }, [activeTab, selectedClass, teacherId, dispatch, attendanceDate, historyDate, summaryRange, selectedMonth, customRange]);

  // --- 2. MARK TAB: Initialize Default State (Present) + Leaves ---
  useEffect(() => {
    if (activeTab === 'mark' && students && students.length > 0) {
      const initialAttendance = {};

      students.forEach(student => {
        // Default to Present
        initialAttendance[student.admission_no] = 'Present';
      });

      // Auto-mark Approved Leaves
      if (approvedLeaves && approvedLeaves.length > 0) {
        approvedLeaves.forEach(leave => {
          if (initialAttendance[leave.admission_no]) {
            initialAttendance[leave.admission_no] = 'Absent';
          }
        });
      }

      setAttendanceData(initialAttendance);
    }
  }, [students, activeTab, approvedLeaves, attendanceDate]); // Re-run when leaves load or date changes (reset)

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

  // --- HELPER FUNCTIONS ---
  const getStudentName = (id) => {
    const s = students?.find(stud => stud.admission_no === id);
    if (!s) return id;
    const personal = s.personal_details || {};
    const first = personal.first_name || '';
    const last = (personal.last_name && personal.last_name !== 'undefined') ? personal.last_name : '';
    return `${first} ${last}`.trim() || id;
  };

  const getLeaveStatus = (admissionNo) => {
    return approvedLeaves?.find(l => l.admission_no === admissionNo);
  };

  // Analytics Helpers
  const studentStats = attendanceSummary?.student_stats || [];
  const lowAttendanceStudents = studentStats.filter(s => s.percentage < 75).sort((a, b) => a.percentage - b.percentage).slice(0, 10);
  const pieData = attendanceSummary?.distribution ? [
    { name: 'Critical (<75%)', value: attendanceSummary.distribution.below75 },
    { name: 'Monitor (75-90%)', value: attendanceSummary.distribution.between75and90 },
    { name: 'Good (>90%)', value: attendanceSummary.distribution.above90 },
  ] : [];

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('mark')}
          className={`pb-2 px-4 flex items-center gap-2 font-medium white-space-nowrap transition-colors ${activeTab === 'mark'
            ? 'border-b-2 border-indigo-600 text-indigo-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <CheckSquare size={18} />
          Mark Attendance
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-4 flex items-center gap-2 font-medium white-space-nowrap transition-colors ${activeTab === 'history'
            ? 'border-b-2 border-indigo-600 text-indigo-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <History size={18} />
          History
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-2 px-4 flex items-center gap-2 font-medium white-space-nowrap transition-colors ${activeTab === 'summary'
            ? 'border-b-2 border-indigo-600 text-indigo-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <BarChart2 size={18} />
          Insights & Analytics
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

        {/* --- 1. MARK ATTENDANCE VIEW --- */}
        {activeTab === 'mark' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
                <p className="text-sm text-gray-500">Default is "Present". Students on Approved Leave are auto-marked Absent.</p>
              </div>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {students && students.length > 0 ? (
                    students.map((student) => {
                      const leaveInfo = getLeaveStatus(student.admission_no);
                      return (
                        <div key={student.admission_no} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 ${leaveInfo ? 'bg-orange-50 border-orange-200' : 'border-gray-200'}`}>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.academic?.roll_no ? `${student.academic.roll_no}. ` : student.roll_no ? `${student.roll_no}. ` : ""}
                              {getStudentName(student.admission_no)}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-indigo-600 font-bold uppercase tracking-tight bg-indigo-50 px-1.5 rounded border border-indigo-100 italic">
                                Class {student.academic?.current_class || "-"}{student.academic?.section && `-${student.academic.section}`}
                              </p>
                              <p className="text-sm text-gray-600">{student.admission_no}</p>
                              {leaveInfo && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  ON LEAVE
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {['Present', 'Absent', 'Late'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(student.admission_no, status)}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-all ${attendanceData[student.admission_no] === status
                                  ? status === 'Present' ? 'bg-green-500 text-white shadow-md'
                                    : status === 'Absent' ? 'bg-red-500 text-white shadow-md'
                                      : 'bg-yellow-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-8">No students found for this class.</p>
                  )}
                </div>

                {students && students.length > 0 && (
                  <button
                    onClick={submitAttendance}
                    disabled={loading}
                    className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit Attendance'}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* --- 2. HISTORY VIEW (NEW) --- */}
        {activeTab === 'history' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
                <p className="text-sm text-gray-500">View past attendance records.</p>
              </div>
              <input
                type="date"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {attendance && attendance.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-4 font-semibold text-gray-600">Roll No</th>
                        <th className="p-4 font-semibold text-gray-600">Student Name</th>
                        <th className="p-4 font-semibold text-gray-600">Status</th>
                        <th className="p-4 font-semibold text-gray-600">Marked By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map(student => {
                        // Find status for this student in fetched attendance
                        const record = attendance.find(a => a.admission_no === student.admission_no);
                        const status = record ? record.status : 'Not Marked';

                        return (
                          <tr key={student.admission_no} className="hover:bg-gray-50">
                            <td className="p-4 text-gray-600">{student.roll_no}</td>
                            <td className="p-4 font-medium text-gray-900">
                              {getStudentName(student.admission_no)}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${status === 'Present' ? 'bg-green-100 text-green-700' :
                                status === 'Absent' ? 'bg-red-100 text-red-700' :
                                  status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {record ? record.marked_by_name || 'Teacher' : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Clock size={32} className="text-gray-300" />
                    <p>No attendance records found for {historyDate}.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* --- 3. ANALYTICS VIEW --- */}
        {activeTab === 'summary' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Attendance Insights</h3>
                <p className="text-sm text-gray-500 italic">Showing data for: <span className="text-indigo-600 font-semibold">
                  {summaryRange === 'overall' ? 'Cumulative Session' :
                    summaryRange === 'weekly' ? 'Last 7 Days' :
                      summaryRange === 'monthly' ? 'Last 30 Days' :
                        summaryRange === 'month' ? new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' }) :
                          `Custom: ${customRange.startDate} to ${customRange.endDate}`}
                </span></p>
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Range Type:</span>
                <select
                  value={summaryRange}
                  onChange={(e) => setSummaryRange(e.target.value)}
                  className="bg-white text-xs font-semibold text-gray-700 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 cursor-pointer px-2 py-1"
                >
                  <option value="overall">Cumulative</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">Last 30 Days</option>
                  <option value="month">Specific Month</option>
                  <option value="custom">Custom Range</option>
                </select>

                {summaryRange === 'month' && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-white text-xs font-semibold text-indigo-600 border border-indigo-100 rounded-md focus:ring-2 focus:ring-indigo-500 cursor-pointer px-2 py-1"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                )}

                {summaryRange === 'custom' && (
                  <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                    <input
                      type="date"
                      value={customRange.startDate}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="bg-white text-[10px] p-1 border border-gray-200 rounded"
                    />
                    <span className="text-[10px] text-gray-400">to</span>
                    <input
                      type="date"
                      value={customRange.endDate}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="bg-white text-[10px] p-1 border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : (
              <>
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-indigo-900 font-semibold">Class Average</h4>
                      <TrendingUp className="text-indigo-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-indigo-700 mt-2">{attendanceSummary?.class_average || 0}%</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-green-900 font-semibold">Total School Days</h4>
                      <Calendar className="text-green-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-green-700 mt-2">{attendanceSummary?.total_school_days || 0}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-red-900 font-semibold">Absentees (Avg)</h4>
                      <AlertCircle className="text-red-600" size={20} />
                    </div>
                    {/* Rough average of absentees per day could be calculated, simplistic here */}
                    <p className="text-3xl font-bold text-red-700 mt-2">{lowAttendanceStudents.length} <span className="text-sm font-normal text-red-600">students critical</span></p>
                  </div>
                </div>

                {/* Graphs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm min-h-[300px]">
                    <h4 className="text-gray-800 font-semibold mb-4">Attendance Distribution</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm min-h-[300px]">
                    <h4 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="text-red-500" size={18} />
                      Low Attendance Watchlist ({'<'}75%)
                    </h4>
                    {lowAttendanceStudents.length > 0 ? (
                      <div className="space-y-3 overflow-y-auto max-h-[250px]">
                        {lowAttendanceStudents.map(s => (
                          <div key={s.admission_no} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                            <span className="font-medium text-red-900">{getStudentName(s.admission_no)}</span>
                            <span className="font-bold text-red-600">{s.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-600 bg-green-50 p-4 rounded-lg text-center">🎉 All students are above 75%!</p>
                    )}
                  </div>
                </div>

                {/* All Students List with Absent Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Student Report</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="p-4 font-semibold text-gray-600">Roll No</th>
                          <th className="p-4 font-semibold text-gray-600">Student Name</th>
                          <th className="p-4 font-semibold text-gray-600">Class</th>
                          <th className="p-4 font-semibold text-gray-600">Present (Avg)</th>
                          <th className="p-4 font-semibold text-gray-600">Absent (Avg)</th>
                          <th className="p-4 font-semibold text-gray-600">Percentage</th>
                          <th className="p-4 font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentStats.map((student) => (
                          <React.Fragment key={student.admission_no}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-medium text-gray-900 text-sm">
                                {(() => {
                                  const s = students?.find(st => st.admission_no === student.admission_no);
                                  return s?.academic?.roll_no || s?.roll_no || "-";
                                })()}
                              </td>
                              <td className="p-4 font-medium text-gray-900">
                                {getStudentName(student.admission_no)}
                                <div className="text-[10px] text-gray-400 font-mono tracking-tighter">{student.admission_no}</div>
                              </td>
                              <td className="p-4 text-xs font-bold text-gray-600 uppercase">
                                {(() => {
                                  const s = students?.find(st => st.admission_no === student.admission_no);
                                  return s?.academic?.current_class ? `${s.academic.current_class}-${s.academic.section || ''}` : "-";
                                })()}
                              </td>
                              <td className="p-4 text-green-600 font-medium">{student.present_days}</td>
                              <td className="p-4 text-red-600 font-medium">{student.absent_days}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.percentage >= 90 ? 'bg-green-100 text-green-700' :
                                  student.percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {student.percentage}%
                                </span>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => setExpandedStudent(expandedStudent === student.admission_no ? null : student.admission_no)}
                                  className="text-indigo-600 hover:underline text-sm font-medium"
                                >
                                  {expandedStudent === student.admission_no ? "Hide Details" : "View Absent Dates"}
                                </button>
                              </td>
                            </tr>
                            {/* EXPANDED ROW FOR ABSENT DATES */}
                            {expandedStudent === student.admission_no && (
                              <tr className="bg-gray-50">
                                <td colSpan="5" className="p-4">
                                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Dates Absent:</h5>
                                  {student.absent_dates && student.absent_dates.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {student.absent_dates.map(date => (
                                        <span key={date} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded border border-red-200">
                                          {date}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm italic">Never absent! 🌟</span>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AttendanceView;