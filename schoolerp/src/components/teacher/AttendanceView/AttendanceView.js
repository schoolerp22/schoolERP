import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Loader } from 'lucide-react';
import { markAttendance } from '../../../feature/teachers/teacherSlice';

const AttendanceView = ({ students, selectedClass, teacherId, loading }) => {
  const dispatch = useDispatch();
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    if (students && students.length > 0) {
      const initialAttendance = {};
      students.forEach(student => {
        initialAttendance[student.admission_no] = 'Present';
      });
      setAttendanceData(initialAttendance);
    }
  }, [students]);

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

  return (
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
      </div>
    </div>
  );
};

export default AttendanceView;