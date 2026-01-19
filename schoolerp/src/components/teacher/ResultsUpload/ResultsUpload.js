import React, { useState, useEffect } from "react";
import { Save, Eye, Download, Upload, AlertCircle, CheckCircle, X, FileUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  getStudentsByClass,
  getMarkingScheme,
  uploadResults,
  clearError,
  clearSuccess
} from "../../../feature/teachers/teacherSlice";

export default function ResultsUpload(teacherId ) {
  const dispatch = useDispatch();

  // ===== REDUX STATE =====
  const {
    profile,
    selectedClassStudents: students = [],
    markingScheme,
    loading,
    error,
    success
  } = useSelector((state) => state.teacher);

//   let teacherId = teacherId;

  // ===== LOCAL STATE =====
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedSection, setSelectedSection] = useState("A");
  const [marksData, setMarksData] = useState({});
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [showErrorMsg, setShowErrorMsg] = useState(false);

  // ===== STATIC =====
  const exams = [
    { id: "MID_TERM_1", name: "Mid Term 1" },
    { id: "TERM_1", name: "1st Term Final" },
    { id: "TERM_2", name: "2nd Term Final" }
  ];

  const subjects = profile?.subjects || [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Hindi",
    "Computer Science"
  ];

  // Default components if marking scheme not available
  const defaultComponents = [
    { component_id: "theory", component_name: "Theory", max_marks: 70 },
    { component_id: "practical", component_name: "Practical", max_marks: 30 }
  ];

  // Use marking scheme components or default
  const components = markingScheme?.components && markingScheme.components.length > 0 
    ? markingScheme.components 
    : defaultComponents;

  // ===== FETCH DATA =====
  useEffect(() => {
    if (!teacherId) return;

    dispatch(
      getStudentsByClass({
        teacherId,
        classSection: `${selectedClass}-${selectedSection}`
      })
    );

    dispatch(
      getMarkingScheme({
        teacherId,
        classNum: selectedClass
      })
    );
  }, [teacherId, selectedClass, selectedSection, dispatch]);

  // ===== INIT MARKS =====
useEffect(() => {
  if (!students.length || !components.length) return;

  setMarksData((prev) => {
    let changed = false;
    const updated = { ...prev };

    students.forEach((student) => {
      if (!updated[student.admission_no]) {
        updated[student.admission_no] = {};
        changed = true;
      }

      components.forEach((comp) => {
        if (!updated[student.admission_no][comp.component_id]) {
          updated[student.admission_no][comp.component_id] = {
            obtained: "",
            absent: false
          };
          changed = true;
        }
      });
    });

    return changed ? updated : prev;
  });
}, [students, components]);


  // ===== SUCCESS/ERROR HANDLING =====
  useEffect(() => {
    if (success) {
      setShowSuccessMsg(true);
      setTimeout(() => {
        setShowSuccessMsg(false);
        dispatch(clearSuccess());
      }, 3000);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      setShowErrorMsg(true);
      setTimeout(() => {
        setShowErrorMsg(false);
        dispatch(clearError());
      }, 5000);
    }
  }, [error, dispatch]);

  // ===== HANDLERS =====
  const handleMarkChange = (admissionNo, componentId, value, maxMarks) => {
    const numValue = Number(value) || 0;
    
    // Validate against max marks
    if (numValue > maxMarks) {
      alert(`Marks cannot exceed ${maxMarks}`);
      return;
    }

    setMarksData((prev) => ({
      ...prev,
      [admissionNo]: {
        ...prev[admissionNo],
        [componentId]: {
          ...prev[admissionNo]?.[componentId],
          obtained: numValue
        }
      }
    }));
  };

  const handleAbsentToggle = (admissionNo, componentId) => {
    setMarksData((prev) => ({
      ...prev,
      [admissionNo]: {
        ...prev[admissionNo],
        [componentId]: {
          ...prev[admissionNo]?.[componentId],
          absent: !prev[admissionNo]?.[componentId]?.absent,
          obtained: prev[admissionNo]?.[componentId]?.absent ? 0 : prev[admissionNo]?.[componentId]?.obtained
        }
      }
    }));
  };

  const calculateTotal = (admissionNo) => {
    let obtained = 0;
    let max = 0;

    components.forEach((c) => {
      const mark = marksData[admissionNo]?.[c.component_id];
      if (mark && !mark.absent) obtained += mark.obtained;
      max += c.max_marks;
    });

    return {
      obtained,
      max,
      percentage: max ? ((obtained / max) * 100).toFixed(2) : "0.00"
    };
  };

  const getGrade = (p) => {
    if (p >= 90) return "A+";
    if (p >= 80) return "A";
    if (p >= 70) return "B+";
    if (p >= 60) return "B";
    if (p >= 50) return "C";
    if (p >= 33) return "D";
    return "F";
  };

  const getGradeColor = (grade) => {
    const colors = {
      "A+": "text-green-700 bg-green-50 border-green-200",
      "A": "text-green-600 bg-green-50 border-green-200",
      "B+": "text-blue-700 bg-blue-50 border-blue-200",
      "B": "text-blue-600 bg-blue-50 border-blue-200",
      "C": "text-yellow-700 bg-yellow-50 border-yellow-200",
      "D": "text-orange-700 bg-orange-50 border-orange-200",
      "F": "text-red-700 bg-red-50 border-red-200"
    };
    return colors[grade] || "text-gray-700 bg-gray-50 border-gray-200";
  };

  // ===== SUBMIT =====
  const handleSubmit = (publish) => {
    if (!selectedExam || !selectedSubject) {
      alert("Please select both Exam and Subject");
      return;
    }

    // Validate that at least some marks are entered
    const hasMarks = Object.values(marksData).some(studentMarks =>
      Object.values(studentMarks).some(mark => mark.obtained > 0)
    );

    if (!hasMarks) {
      alert("Please enter marks for at least one student");
      return;
    }

    const payload = {
      exam_id: selectedExam,
      subject: selectedSubject,
      class: selectedClass,
      section: selectedSection,
      academic_year: "2024-25",
      auto_publish: publish,
      students_marks: students.map((s) => ({
        admission_no: s.admission_no,
        marks: marksData[s.admission_no] || {}
      }))
    };

    dispatch(uploadResults({ teacherId, resultsData: payload }));
  };

  // ===== CSV UPLOAD =====
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        
        const newMarksData = { ...marksData };

        // Process each row (skip header)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 3) continue;

          const admissionNo = row[0].trim();
          
          // Find student
          const student = students.find(s => s.admission_no === admissionNo);
          if (!student) continue;

          // Process marks for each component
          components.forEach((comp, idx) => {
            const markValue = parseInt(row[idx + 2]); // +2 to skip admission_no and name
            if (!isNaN(markValue)) {
              newMarksData[admissionNo][comp.component_id] = {
                obtained: markValue,
                absent: false
              };
            }
          });
        }

        setMarksData(newMarksData);
        alert("CSV uploaded successfully!");
      } catch (err) {
        alert("Error parsing CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  // ===== CSV TEMPLATE =====
  const downloadTemplate = () => {
    const headers = [
      "Admission No",
      "Student Name",
      ...components.map((c) => c.component_name)
    ];

    const rows = students.map((s) => [
      s.admission_no,
      `${s.personal_details?.first_name || ""} ${s.personal_details?.last_name || ""}`,
      ...components.map(() => 0)
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `marks_template_${selectedClass}_${selectedSection}_${selectedSubject || 'subject'}.csv`;
    a.click();
  };

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {showSuccessMsg && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
            <CheckCircle size={20} />
            <span>Results uploaded successfully!</span>
            <button onClick={() => setShowSuccessMsg(false)}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* Error Message */}
        {showErrorMsg && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
            <AlertCircle size={20} />
            <span>{error?.message || "Failed to upload results"}</span>
            <button onClick={() => setShowErrorMsg(false)}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Upload Student Results</h1>
              <p className="text-gray-600 mt-1">Enter marks for students and publish results</p>
            </div>
            <Upload className="text-blue-600" size={32} />
          </div>

          {/* SELECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <select 
                value={selectedSection} 
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {["A", "B", "C", "D"].map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
              <select 
                value={selectedExam} 
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select Exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Banner */}
          {!markingScheme?.components?.length && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Using Default Marking Scheme</p>
                <p>Theory (70 marks) + Practical (30 marks). Configure marking scheme in settings for custom components.</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={downloadTemplate}
              disabled={!students.length}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              <Download size={18} /> Download CSV Template
            </button>

            <label className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm cursor-pointer">
              <FileUp size={18} /> Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>

            {(!selectedExam || !selectedSubject) && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle size={16} />
                <span>Please select exam and subject to proceed</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        {students.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-blue-600">Roll No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold min-w-[200px]">Admission No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold min-w-[180px]">Student Name</th>
                    {components.map((c) => (
                      <th key={c.component_id} className="px-4 py-3 text-center text-sm font-semibold min-w-[140px]">
                        <div>{c.component_name}</div>
                        <div className="text-xs font-normal text-blue-100 mt-1">(Max: {c.max_marks})</div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-semibold">Total</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Grade</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {students.map((s, idx) => {
                    const total = calculateTotal(s.admission_no);
                    const grade = getGrade(Number(total.percentage));

                    return (
                      <tr key={s.admission_no} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-inherit">{s.roll_no}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{s.admission_no}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {s.personal_details?.first_name}{" "}
                          {s.personal_details?.last_name}
                        </td>

                        {components.map((c) => {
                          const isAbsent = marksData[s.admission_no]?.[c.component_id]?.absent;
                          
                          return (
                            <td key={c.component_id} className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={c.max_marks}
                                  disabled={isAbsent}
                                  value={marksData[s.admission_no]?.[c.component_id]?.obtained || 0}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      s.admission_no,
                                      c.component_id,
                                      e.target.value,
                                      c.max_marks
                                    )
                                  }
                                  className={`w-full px-3 py-2 text-center border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                                    isAbsent ? 'bg-gray-100 text-gray-400' : 'border-gray-300'
                                  }`}
                                />
                                <label className="flex items-center justify-center gap-1 text-xs text-gray-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isAbsent}
                                    onChange={() => handleAbsentToggle(s.admission_no, c.component_id)}
                                    className="rounded"
                                  />
                                  Absent
                                </label>
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          {total.obtained}/{total.max}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          {total.percentage}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getGradeColor(grade)}`}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Total Students: <span className="font-semibold text-gray-900">{students.length}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading || !selectedExam || !selectedSubject}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Save size={18} /> Save Draft
                </button>

                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading || !selectedExam || !selectedSubject}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Eye size={18} /> Save & Publish
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : (
              <>
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Found</h3>
                <p className="text-gray-600">Please select a class and section to view students</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}