import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Loader, BarChart2, CheckSquare, TrendingUp, AlertCircle, 
  Calendar, History, Clock, Download, Users, 
  UserCheck, UserX, MoreVertical, Search, Bookmark, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { markAttendance, getAttendanceSummary, getAttendance, getApprovedLeaves } from '../../../feature/teachers/teacherSlice';
import { 
  Tooltip, ResponsiveContainer, AreaChart, 
  Area, XAxis, YAxis, CartesianGrid, PieChart, 
  Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  Present: { grad: 'from-[#10B981] to-[#34D399]', shadow: 'shadow-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  Absent: { grad: 'from-[#F43F5E] to-[#FB7185]', shadow: 'shadow-rose-200', text: 'text-rose-700', bg: 'bg-rose-50' },
  Late: { grad: 'from-[#F59E0B] to-[#FBBF24]', shadow: 'shadow-amber-200', text: 'text-amber-700', bg: 'bg-amber-50' },
  'Not Marked': { grad: 'from-slate-400 to-slate-500', shadow: 'shadow-slate-200', text: 'text-slate-700', bg: 'bg-slate-50' }
};

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
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
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
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      fetch(`${API_BASE}/api/teacher/${teacherId}/backlog-status/${attendanceDate}/${selectedClass}`)
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

  const getStudentClassInfo = (id) => {
    const s = students?.find(stud => stud.admission_no === id);
    if (!s) return selectedClass || 'N/A';
    const c = s.academic?.current_class || s.class || '';
    const sec = s.academic?.section || s.section || '';
    if (c && sec) return `${c}-${sec}`;
    return selectedClass || 'N/A';
  };

  const getLeaveStatus = (admissionNo) => {
    return approvedLeaves?.find(l => l.admission_no === admissionNo);
  };

  // Analytics Helpers
  const studentStats = attendanceSummary?.student_stats || [];

  const handleExportExcel = () => {
    if (!studentStats || studentStats.length === 0) return;

    const exportData = studentStats.map(stat => {
      const student = students?.find(s => s.admission_no === stat.admission_no);
      return {
        'Roll No': student?.academic?.roll_no || student?.roll_no || '-',
        'Student Name': getStudentName(stat.admission_no),
        'Admission No': stat.admission_no,
        'Class': student?.academic?.current_class ? `${student.academic.current_class}-${student.academic.section || ''}` : '-',
        'Present Days': stat.present_days,
        'Absent Days': stat.absent_days,
        'Percentage (%)': stat.percentage
      };
    });

    const exportWs = XLSX.utils.json_to_sheet(exportData);
    const exportWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(exportWb, exportWs, "Attendance Report");

    // Generate filename based on date range
    let dateRangeStr = summaryRange;
    if (summaryRange === 'month') {
      dateRangeStr = new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' });
    } else if (summaryRange === 'custom') {
      dateRangeStr = `${customRange.startDate}_to_${customRange.endDate}`;
    }

    const exportFileName = `Attendance_Report_${selectedClass}_${dateRangeStr}.xlsx`;
    XLSX.writeFile(exportWb, exportFileName);
  };
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 min-w-[150px]">
          <p className="font-bold text-slate-800">{payload[0].payload.fullName}</p>
          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">ID: {payload[0].payload.admissionNo}</p>
          <p className="font-black text-indigo-600 mt-2 text-lg">{payload[0].value}% <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance</span></p>
        </div>
      );
    }
    return null;
  };

  // Filtered Students
  const filteredStudents = students?.filter(student => {
    const name = getStudentName(student.admission_no).toLowerCase();
    const roll = (student.academic?.roll_no || student.roll_no || "").toString();
    const adm = student.admission_no.toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || roll.includes(query) || adm.includes(query);
  }) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Premium Header & Glassmorphic Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-4 rounded-[32px] border border-white/60 shadow-xl shadow-indigo-900/5">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 w-fit">
          {[
            { id: 'mark', label: 'Mark Attendance', icon: CheckSquare },
            { id: 'history', label: 'History', icon: History },
            { id: 'summary', label: 'Insights & Analytics', icon: BarChart2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-200"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon size={18} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'mark' && (
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none w-full sm:w-64 transition-all"
              />
            </div>
          )}
          <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden lg:block"></div>
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <Calendar size={18} className="text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">{selectedClass}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.3 }}
           className="min-h-[600px]"
        >
          {activeTab === 'mark' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Quick Status Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', value: students?.length || 0, icon: Users, color: 'indigo' },
                  { label: 'Present Today', value: Object.values(attendanceData).filter(v => v === 'Present').length, icon: UserCheck, color: 'emerald' },
                  { label: 'Absent Today', value: Object.values(attendanceData).filter(v => v === 'Absent').length, icon: UserX, color: 'rose' },
                  { label: 'On Leave', value: approvedLeaves?.length || 0, icon: Bookmark, color: 'amber' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow"
                  >
                    <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <h4 className="text-2xl font-black text-slate-800">{stat.value}</h4>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Daily Roll Call</h3>
                    <p className="text-slate-500 font-medium">Capture student presence with ease.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-bold"
                    />
                  </div>
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
                          Attendance for this date has already been marked. You are in <strong>edit mode</strong>.
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
                  <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="relative text-center">
                      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Students...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredStudents && filteredStudents.length > 0 ? (
                        filteredStudents.map((student, idx) => {
                          const leaveInfo = getLeaveStatus(student.admission_no);
                          const currentStatus = attendanceData[student.admission_no] || 'Not Marked';
                          const statusStyle = STATUS_COLORS[currentStatus];

                          return (
                            <motion.div 
                              key={student.admission_no} 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`group relative bg-white border rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden ${
                                leaveInfo ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'
                              } ${(isEditing && isPastDate()) ? 'opacity-80' : ''}`}
                            >
                              <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${statusStyle.grad} flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:scale-110`}>
                                    {getStudentName(student.admission_no).charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-800 text-lg leading-none group-hover:text-indigo-600 transition-colors">
                                      {student.academic?.roll_no ? `${student.academic.roll_no}. ` : student.roll_no ? `${student.roll_no}. ` : ""}
                                      {getStudentName(student.admission_no)}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">
                                        ID: {student.admission_no}
                                      </span>
                                      {leaveInfo && (
                                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-100/50 px-2 py-1 rounded-lg">
                                          <AlertCircle size={10} /> ON LEAVE
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                  <MoreVertical size={18} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between mb-6 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Trend</span>
                                <div className="flex gap-1.5">
                                  {[1, 1, 0, 1, 1].map((p, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${p ? 'bg-emerald-400' : 'bg-rose-400'} opacity-30 group-hover:opacity-100 transition-all shadow-sm`} />
                                  ))}
                                </div>
                              </div>

                              <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex gap-1 relative z-10">
                                {['Present', 'Absent', 'Late'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleAttendanceChange(student.admission_no, status)}
                                    disabled={isEditing && isPastDate()}
                                    className={`relative flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 active:scale-95 ${
                                      attendanceData[student.admission_no] === status
                                      ? 'text-white shadow-md'
                                      : 'text-slate-400 hover:text-slate-600'
                                    } ${(isEditing && isPastDate()) ? 'cursor-not-allowed' : ''}`}
                                  >
                                    {attendanceData[student.admission_no] === status && (
                                      <motion.div 
                                        layoutId={`activeStatus-${student.admission_no}`}
                                        className={`absolute inset-0 bg-gradient-to-r ${STATUS_COLORS[status].grad} rounded-xl`}
                                      />
                                    )}
                                    <span className="relative z-10 uppercase tracking-wider">{status}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-20 text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-widest">No students matched your search.</p>
                        </div>
                      )}
                    </div>

                    {filteredStudents.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={initiateSubmit}
                        disabled={loading || (isEditing && isPastDate()) || !backlogStatus.allowed || checkingBacklog}
                        className={`mt-12 w-full py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-xl transition-all ${
                          ((isEditing && isPastDate()) || !backlogStatus.allowed || checkingBacklog)
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300 ring-4 ring-indigo-500/10'
                        }`}
                      >
                        {loading ? 'Processing...' : checkingBacklog ? 'Checking...' : isEditing ? 'Update Records' : 'Save Attendance'}
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Logs</h3>
                  <p className="text-slate-500 font-medium">Review and audit past attendance records.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-bold shadow-sm"
                  />
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-20 flex justify-center"><Loader className="animate-spin text-indigo-600" /></div>
                ) : attendance && attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marked By</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.map(student => {
                          const record = attendance.find(a => a.admission_no === student.admission_no);
                          const status = record ? record.status : 'Not Marked';
                          return (
                            <tr key={student.admission_no} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm`}>
                                    {getStudentName(student.admission_no).charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800">{getStudentName(student.admission_no)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Roll: {student.roll_no || '-'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex justify-center">
                                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text} border border-current opacity-80`}>
                                    {status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-500">
                                {record ? record.marked_by_name || 'N/A' : '-'}
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ChevronRight size={18} /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-20 text-center space-y-3">
                    <Clock size={40} className="mx-auto text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No records found for this date.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'summary' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Analytics Dashboard</h3>
                  <p className="text-slate-500 font-medium">Visualizing trends and distribution patterns.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    {['overall', 'weekly', 'monthly', 'month', 'custom'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setSummaryRange(r)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${summaryRange === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {r === 'weekly' ? '7 Days' : r === 'monthly' ? '30 Days' : r}
                      </button>
                    ))}
                  </div>

                  {summaryRange === 'month' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-bold text-sm shadow-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  )}

                  {summaryRange === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={customRange.startDate}
                        onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-bold text-sm shadow-sm"
                      />
                      <span className="text-slate-400 font-black">to</span>
                      <input
                        type="date"
                        value={customRange.endDate}
                        onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 font-bold text-sm shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modern Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] p-8 rounded-[32px] text-white shadow-xl shadow-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Class Average</p>
                    <TrendingUp size={20} className="text-indigo-200" />
                  </div>
                  <h4 className="text-4xl font-black">{attendanceSummary?.class_average || 0}%</h4>
                  <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${attendanceSummary?.class_average || 0}%` }} className="h-full bg-white" />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attendance Stats</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-4xl font-black text-slate-800">{attendanceSummary?.total_school_days || 0}</h4>
                    <span className="text-xs font-bold text-slate-400">Total School Days</span>
                  </div>
                  <Calendar className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform" size={120} />
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Students at Risk</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-4xl font-black text-rose-500">{(attendanceSummary?.student_stats || []).filter(s => s.percentage < 75).length}</h4>
                    <span className="text-xs font-bold text-rose-400">Waitlist Overview</span>
                  </div>
                  <div className="mt-4 flex -space-x-2">
                    {(() => {
                      const riskStudents = (attendanceSummary?.student_stats || [])
                        .filter(s => s.percentage < 75)
                        .sort((a, b) => a.percentage - b.percentage)
                        .slice(0, 5);
                      if (riskStudents.length === 0) return <span className="text-xs text-slate-400 font-bold ml-1">None! 🎉</span>;
                      return riskStudents.map((s, i) => {
                        const initial = getStudentName(s.admission_no).charAt(0);
                        return (
                          <div key={i} title={getStudentName(s.admission_no)} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm relative z-10 hover:z-20 hover:scale-110 transition-transform">
                            {initial}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Row 2: Full Width Area Chart */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center justify-between">
                  Attendance Trend
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase">Real-time</span>
                </h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceSummary?.student_stats?.map(s => {
                      const fullName = getStudentName(s.admission_no);
                      return {
                        name: fullName.split(' ')[0],
                        fullName: fullName,
                        admissionNo: s.admission_no,
                        value: s.percentage
                      };
                    }) || []}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 3: Donut Chart & Detailed Watchlist Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Modern Donut Chart */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center">
                  <h4 className="text-lg font-black text-slate-800 mb-8 self-start">Engagement Distribution</h4>
                  <div className="h-[300px] w-full relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <p className="text-3xl font-black text-slate-800">{attendanceSummary?.class_average || 0}%</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Present</p>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Good (>90%)', value: attendanceSummary?.distribution?.above90 || 1 },
                            { name: 'Monitor (75-90%)', value: attendanceSummary?.distribution?.between75and90 || 0 },
                            { name: 'Critical (<75%)', value: attendanceSummary?.distribution?.below75 || 0 }
                          ]}
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {['#10B981', '#F59E0B', '#F43F5E'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Critical Watchlist Container */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                       <AlertCircle size={20} className="text-rose-500" />
                       Critical Watchlist
                    </h4>
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
                      {'< 75% Attendance'}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const riskStudents = (attendanceSummary?.student_stats || [])
                        .filter(s => s.percentage < 75)
                        .sort((a, b) => a.percentage - b.percentage);
                      if (riskStudents.length === 0) return <div className="text-sm text-slate-400 font-bold bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center mt-4">All students are in good standing! 🎉</div>;
                      return riskStudents.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 transition-colors border border-rose-100/50 group">
                          <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-rose-700 transition-colors">{getStudentName(s.admission_no)}</p>
                            <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">ID: {s.admission_no}</p>
                          </div>
                          <span className="text-sm font-black text-rose-600 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-rose-100">{s.percentage}%</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Detailed Student Report Section */}
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 border-b border-slate-50 gap-6">
                  <div>
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">Student Performance Audit</h4>
                    <p className="text-sm text-slate-400 font-medium">Detailed breakdown of cumulative attendance.</p>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all font-bold text-sm shadow-lg shadow-emerald-900/10"
                  >
                    <Download size={18} />
                    Export Report
                  </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Present</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Absent</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(attendanceSummary?.student_stats || []).map((student) => (
                          <React.Fragment key={student.admission_no}>
                            <tr className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-8 py-5">
                                <p className="font-bold text-slate-800">{getStudentName(student.admission_no)}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                  ID: <span className="text-slate-500">{student.admission_no}</span> 
                                  <span className="mx-2 text-slate-300">|</span> 
                                  Class: <span className="text-slate-500">{getStudentClassInfo(student.admission_no)}</span>
                                </p>
                              </td>
                              <td className="px-8 py-5 text-center font-bold text-emerald-600">{student.present_days}d</td>
                              <td className="px-8 py-5 text-center font-bold text-rose-500">{student.absent_days}d</td>
                              <td className="px-8 py-5">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${student.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' : student.percentage >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {student.percentage}%
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button
                                  onClick={() => setExpandedStudent(expandedStudent === student.admission_no ? null : student.admission_no)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                >
                                  {expandedStudent === student.admission_no ? <Users size={18} /> : <ChevronRight size={18} />}
                                </button>
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expandedStudent === student.admission_no && (
                                <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-50/50">
                                  <td colSpan="5" className="px-8 py-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Absence History</p>
                                    <div className="flex flex-wrap gap-2">
                                      {student.absent_dates?.length > 0 ? student.absent_dates.map(date => (
                                        <span key={date} className="px-3 py-1 bg-white border border-rose-100 text-rose-600 text-[10px] font-bold rounded-lg shadow-sm">
                                          {date}
                                        </span>
                                      )) : <span className="text-emerald-600 font-bold italic text-xs">No absences recorded! 🌟</span>}
                                    </div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Reason Modal */}
      <AnimatePresence>
        {showReasonModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 space-y-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <AlertCircle size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Edit Confirmation</h3>
                <p className="text-slate-500 font-medium">Please provide a reason for modifying this attendance record.</p>
              </div>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Reason for change..."
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none h-32 resize-none text-slate-800 font-medium"
                autoFocus
              />
              <div className="flex gap-4">
                <button onClick={() => setShowReasonModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={submitAttendance} disabled={!editReason.trim()} className="flex-1 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceView;