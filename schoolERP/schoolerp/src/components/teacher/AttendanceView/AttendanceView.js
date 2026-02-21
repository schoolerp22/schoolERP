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

  // New State for Edit Flow
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);

  // Backlog Status State
  const [backlogStatus, setBacklogStatus] = useState({ allowed: true, reason: "Today's attendance", isToday: true });
  const [checkingBacklog, setCheckingBacklog] = useState(false);

  // Computed Check for Past Date
  const isPastDate = () => {
    const selected = new Date(attendanceDate);
    const today = new Date();
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return selected < today;
  };

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
    // Tab: Mark Attendance (Fetch Approved Leaves AND Existing Attendance)
    else if (activeTab === 'mark' && selectedClass && attendanceDate) {
      hasAutoFilledRef.current = false;
      dispatch(getApprovedLeaves({ teacherId, date: attendanceDate, classSection: selectedClass }));

      // Fetch existing attendance to see if already marked
      dispatch(getAttendance({ teacherId, date: attendanceDate, classSection: selectedClass }))
        .unwrap()
        .then((data) => {
          setExistingAttendance(data || []);
          setIsEditing(data && data.length > 0);
        })
        .catch(() => {
          setExistingAttendance([]);
          setIsEditing(false);
        });
    }
    // Tab: History (Fetch Past Attendance)
    else if (activeTab === 'history' && selectedClass && historyDate) {
      dispatch(getAttendance({ teacherId, date: historyDate, classSection: selectedClass }));
    }
  }, [activeTab, selectedClass, teacherId, dispatch, attendanceDate, historyDate, summaryRange, selectedMonth, customRange]);

  // --- CHECK BACKLOG STATUS FOR SELECTED DATE ---
  useEffect(() => {
    if (activeTab === 'mark' && selectedClass && attendanceDate) {
      setCheckingBacklog(true);
      fetch(`http://localhost:5000/api/teacher/${teacherId}/backlog-status/${attendanceDate}/${selectedClass}`)
        .then(res => res.json())
        .then(data => {
          setBacklogStatus(data);
          setCheckingBacklog(false);
        })
        .catch(() => {
          setBacklogStatus({ allowed: false, reason: "Error checking backlog status" });
          setCheckingBacklog(false);
        });
    }
  }, [activeTab, attendanceDate, selectedClass, teacherId]);

  // --- 2. MARK TAB: Initialize Default State (Present) + Leaves + Existing Attendance ---
  useEffect(() => {
    if (activeTab === 'mark' && students && students.length > 0) {
      const initialAttendance = {};

      students.forEach(student => {
        // Default to Present
        initialAttendance[student.admission_no] = 'Present';
      });

      // Override with Existing Attendance if available
      if (existingAttendance && existingAttendance.length > 0) {
        existingAttendance.forEach(record => {
          if (initialAttendance[record.admission_no]) { // Only if student still in list
            initialAttendance[record.admission_no] = record.status;
          }
        });
      }
      // Only apply leaves if NOT editing existing records (or maybe apply anyway? applying anyway is safer as leaves might be new)
      // Decision: Apply leaves ON TOP of defaults, but if existing record says 'Present' and leave says 'Absent', trust existing user input? 
      // Safer: If existing attendance is present, use that. If not, use leaves.
      // But user typically wants to see the saved state.

      // Auto-mark Approved Leaves (Only if NOT editing or if we want to show leaves visually)
      // Let's apply leaves to 'Present' defaults, but if we have existing records, we respect them unless we want to force update.
      // Better UX: Show leaves visual indicator always. Only auto-set status if it's a fresh marking.

      if (!existingAttendance || existingAttendance.length === 0) {
        if (approvedLeaves && approvedLeaves.length > 0) {
          approvedLeaves.forEach(leave => {
            if (initialAttendance[leave.admission_no]) {
              initialAttendance[leave.admission_no] = 'Absent';
            }
          });
        }
      }

      setAttendanceData(initialAttendance);
    }
  }, [students, activeTab, approvedLeaves, existingAttendance, attendanceDate]);

  const handleAttendanceChange = (admissionNo, status) => {
    if (isPastDate() && isEditing) return; // Prevent editing past dates in UI
    setAttendanceData(prev => ({
      ...prev,
      [admissionNo]: status
    }));
  };

  const initiateSubmit = () => {
    if (isEditing) {
      setShowReasonModal(true);
    } else {
      submitAttendance();
    }
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
        attendance,
        reason: isEditing ? editReason : null
      }
    })).then(() => {
      setShowReasonModal(false);
      setEditReason("");
      // Refresh to confirm state
      dispatch(getAttendance({ teacherId, date: attendanceDate, classSection: selectedClass }))
        .unwrap()
        .then(data => {
          setExistingAttendance(data || []);
          setIsEditing(data && data.length > 0);
        });
    });
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
      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
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

      <div className="bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-200 p-4 sm:p-6 -mx-4 sm:mx-0">

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
                className="w-full sm:w-auto px-4 py-2 sm:py-2 bg-gray-50 border-none sm:border-solid sm:border-gray-300 rounded-lg sm:focus:ring-2 focus:outline-none text-gray-700 font-medium"
              />
            </div>

            {/* Backlog Status Banners */}
            {!backlogStatus.allowed && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>Attendance marking blocked:</strong> {backlogStatus.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {backlogStatus.allowed && backlogStatus.backlog && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-r shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckSquare className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      <strong>Backlog window open:</strong> {backlogStatus.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Banners */}
            {isEditing && !isPastDate() && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Attendance for this date has already been marked. You are in <strong>search/edit mode</strong>.
                      Changes will require a reason.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isEditing && isPastDate() && backlogStatus.allowed && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      This is a past record. <strong>Editing is disabled</strong> for past attendance.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                        <div key={student.admission_no} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 ${leaveInfo ? 'bg-orange-50 border-orange-200' : 'border-gray-200'} ${(isEditing && isPastDate()) ? 'opacity-75' : ''}`}>
                          <div>
                            <p className="font-semibold text-gray-900 text-[15px]">
                              {student.academic?.roll_no ? `${student.academic.roll_no}. ` : student.roll_no ? `${student.roll_no}. ` : ""}
                              {getStudentName(student.admission_no)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50">
                                Class {student.academic?.current_class || "-"}{student.academic?.section && `-${student.academic.section}`}
                              </p>
                              <p className="text-[11px] font-medium text-gray-400">{student.admission_no}</p>
                              {leaveInfo && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 tracking-wider">
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
                                // Disable selection if it's a past date and we are editing
                                disabled={isEditing && isPastDate()}
                                className={`flex-1 sm:flex-none px-2 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:transition-all active:scale-95 ${attendanceData[student.admission_no] === status
                                  ? status === 'Present' ? 'bg-green-500 text-white shadow-sm'
                                    : status === 'Absent' ? 'bg-red-500 text-white shadow-sm'
                                      : 'bg-yellow-500 text-white shadow-sm'
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                                  } ${(isEditing && isPastDate()) ? 'cursor-not-allowed' : ''}`}
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
                    onClick={initiateSubmit}
                    disabled={loading || (isEditing && isPastDate()) || !backlogStatus.allowed || checkingBacklog}
                    className={`mt-6 w-full py-3 rounded-lg font-medium shadow-md transition-colors ${((isEditing && isPastDate()) || !backlogStatus.allowed || checkingBacklog)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                  >
                    {loading ? 'Processing...' : checkingBacklog ? 'Checking...' : isEditing ? 'Update Attendance' : 'Submit Attendance'}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* Reason Modal */}
        {showReasonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Reason for Modification</h3>
              <p className="text-sm text-gray-600">
                You are modifying an existing attendance record. Please provide a reason for this change (e.g., "Correction", "Medical Certificate Received").
              </p>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Enter reason here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24 resize-none"
                autoFocus
              />
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowReasonModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAttendance}
                  disabled={!editReason.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        )
        }
        {/* --- 2. HISTORY VIEW (NEW) --- */}
        {activeTab === 'history' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
                <p className="text-sm text-gray-500">View past attendance records.</p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const d = new Date(historyDate);
                  const today = new Date();
                  d.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  const isEditable = d >= today;

                  if (isEditable) {
                    return (
                      <button
                        onClick={() => {
                          setAttendanceDate(historyDate);
                          setActiveTab('mark');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium text-sm"
                      >
                        <CheckSquare size={16} />
                        Edit Attendance
                      </button>
                    );
                  }
                  return null;
                })()}
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : (
              <div className="border border-gray-100 sm:border-gray-200 rounded-xl overflow-hidden bg-gray-50/50 sm:bg-white">
                {attendance && attendance.length > 0 ? (
                  <div className="flex flex-col sm:block">
                    {/* Desktop Table Header */}
                    <div className="hidden sm:grid grid-cols-4 bg-gray-50 border-b border-gray-200 p-4 font-semibold text-gray-600">
                      <div>Roll No</div>
                      <div>Student Name</div>
                      <div>Status</div>
                      <div>Marked By</div>
                    </div>
                    {/* List Items */}
                    <div className="divide-y divide-gray-100/60 sm:divide-gray-100">
                      {students.map(student => {
                        const record = attendance.find(a => a.admission_no === student.admission_no);
                        const status = record ? record.status : 'Not Marked';

                        return (
                          <div key={student.admission_no} className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center p-4 bg-white hover:bg-gray-50/80 transition-colors">
                            {/* Mobile specific layout */}
                            <div className="flex justify-between items-start sm:hidden mb-2">
                              <div>
                                <span className="text-xs font-bold text-gray-400">#{student.roll_no}</span>
                                <p className="font-semibold text-gray-900 text-[15px]">{getStudentName(student.admission_no)}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${status === 'Present' ? 'bg-green-100 text-green-700' :
                                status === 'Absent' ? 'bg-red-100 text-red-700' :
                                  status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {status}
                              </span>
                            </div>
                            <div className="sm:hidden text-xs text-gray-500">
                              Marked by: {record ? record.marked_by_name || 'Teacher' : '-'}
                            </div>

                            {/* Desktop specific layout */}
                            <div className="hidden sm:block text-gray-600">{student.roll_no}</div>
                            <div className="hidden sm:block font-medium text-gray-900">{getStudentName(student.admission_no)}</div>
                            <div className="hidden sm:block">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${status === 'Present' ? 'bg-green-100 text-green-700' :
                                status === 'Absent' ? 'bg-red-100 text-red-700' :
                                  status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {status}
                              </span>
                            </div>
                            <div className="hidden sm:block text-sm text-gray-500">
                              {record ? record.marked_by_name || 'Teacher' : '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
              <div className="flex sm:flex-wrap overflow-x-auto hide-scrollbar items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 w-full sm:w-auto mt-2 sm:mt-0">
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