import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader, BarChart2, CheckSquare, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { markAttendance, getAttendanceSummary } from '../../../feature/teachers/teacherSlice';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#ef4444', '#eab308', '#22c55e']; // Red (<75), Yellow (75-90), Green (>90)

const AttendanceView = ({ students, selectedClass, teacherId, loading }) => {
  const dispatch = useDispatch();
  const { attendanceSummary } = useSelector((state) => state.teacher);

  const [activeTab, setActiveTab] = useState('mark'); // 'mark' or 'summary'
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [expandedStudent, setExpandedStudent] = useState(null); // ID of student to show absent dates

  useEffect(() => {
    if (activeTab === 'mark' && students && students.length > 0) {
      const initialAttendance = {};
      students.forEach(student => {
        initialAttendance[student.admission_no] = 'Present';
      });
      setAttendanceData(initialAttendance);
    }
  }, [students, activeTab]);

  useEffect(() => {
    if (activeTab === 'summary' && selectedClass) {
      dispatch(getAttendanceSummary({ teacherId, classSection: selectedClass }));
    }
  }, [activeTab, selectedClass, teacherId, dispatch]);

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

  // --- HELPER FOR SUMMARY UI ---
  const getStudentName = (id) => {
    const s = students?.find(stud => stud.admission_no === id);
    return s ? `${s.personal_details.first_name} ${s.personal_details.last_name}` : id;
  };

  // Filter Top and Bottom students
  const studentStats = attendanceSummary?.student_stats || [];
  const topStudents = [...studentStats].sort((a, b) => b.percentage - a.percentage).slice(0, 10);
  const lowAttendanceStudents = studentStats.filter(s => s.percentage < 75).sort((a, b) => a.percentage - b.percentage).slice(0, 10);

  const pieData = attendanceSummary?.distribution ? [
    { name: 'Critical (<75%)', value: attendanceSummary.distribution.below75 },
    { name: 'Monitor (75-90%)', value: attendanceSummary.distribution.between75and90 },
    { name: 'Good (>90%)', value: attendanceSummary.distribution.above90 },
  ] : [];

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('mark')}
          className={`pb-2 px-4 flex items-center gap-2 font-medium transition-colors ${activeTab === 'mark'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <CheckSquare size={18} />
          Mark Attendance
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-2 px-4 flex items-center gap-2 font-medium transition-colors ${activeTab === 'summary'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <BarChart2 size={18} />
          Insights & Analytics
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

        {/* --- MARK ATTENDANCE VIEW --- */}
        {activeTab === 'mark' && (
          <>
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
                  {students && students.length > 0 ? (
                    students.map((student) => (
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
                            className={`px-4 py-2 rounded-lg font-medium ${attendanceData[student.admission_no] === 'Present'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student.admission_no, 'Absent')}
                            className={`px-4 py-2 rounded-lg font-medium ${attendanceData[student.admission_no] === 'Absent'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student.admission_no, 'Late')}
                            className={`px-4 py-2 rounded-lg font-medium ${attendanceData[student.admission_no] === 'Late'
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

                {students && students.length > 0 && (
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
          </>
        )}

        {/* --- ANALYTICS VIEW --- */}
        {activeTab === 'summary' && (
          <div className="space-y-8">
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
                          <th className="p-4 font-semibold text-gray-600">Student Name</th>
                          <th className="p-4 font-semibold text-gray-600">Present Days</th>
                          <th className="p-4 font-semibold text-gray-600">Absent Days</th>
                          <th className="p-4 font-semibold text-gray-600">Percentage</th>
                          <th className="p-4 font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentStats.map((student) => (
                          <React.Fragment key={student.admission_no}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-medium text-gray-900">
                                {getStudentName(student.admission_no)}
                                <div className="text-xs text-gray-500">{student.admission_no}</div>
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