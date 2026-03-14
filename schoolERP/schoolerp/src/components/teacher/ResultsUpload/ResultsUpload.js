import React, { useState, useEffect } from "react";
import { Download, AlertCircle, CheckCircle, X, FileUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  getStudentsForResults,
  getMarkingScheme,
  uploadResults,
  clearError,
  clearSuccess
} from "../../../feature/teachers/teacherSlice";

export default function ResultsUpload({ teacherId, profile, selectedClass: initialSelectedClass, editSession, clearEdit }) {
  const dispatch = useDispatch();

  // Split class-section from prop
  const [initialClass, initialSection] = (initialSelectedClass || "10-A").split("-");

  // ===== REDUX STATE =====
  const {
    resultsStudents: students = [],
    markingScheme,
    loadings,
    loading: formLoading,
    error,
    success
  } = useSelector((state) => state.teacher);

  const loading = formLoading || loadings?.markingScheme || loadings?.students;

  // ===== LOCAL STATE =====
  const [examSessions, setExamSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState(initialClass || "10");
  const [selectedSection, setSelectedSection] = useState(initialSection || "A");
  const [marksData, setMarksData] = useState({});
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [showErrorMsg, setShowErrorMsg] = useState(false);

  // Handle Edit Redirection from History
  useEffect(() => {
    if (editSession) {
      setSelectedClass(editSession.class);
      setSelectedSection(editSession.section);
      setSelectedSessionId(editSession.exam_id);
      setSelectedSubject(editSession.subject);
      // Optional: Clear the edit session after setting states if needed, 
      // but keeping it helps know we are in "Edit Mode"
    }
  }, [editSession]);

  // ===== STATIC DATA =====
  const subjects = profile?.subjects || [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "English", "Hindi", "Computer Science", "Social Science"
  ];

  // Map marking scheme components dynamically based on chosen Exam Session
  const components = React.useMemo(() => {
    const mapComponents = (scheme, sessionId) => {
      const session = examSessions.find(e => e._id === sessionId);
      const examType = session?.exam_type;

      if (!scheme?.components || scheme.components.length === 0) {
        return [
          { component_id: "theory", component_name: "Theory", max_marks: 80 },
          { component_id: "internal", component_name: "Internal", max_marks: 20 }
        ];
      }

      let activeComponents = scheme.components;

      // Filter components to ONLY show those relevant to the selected Exam (e.g., FA1, Unit Test)
      if (examType) {
        // 1. Exact match by exam_code (e.g. CBSE Middle 'FA1')
        let matched = scheme.components.filter(c => c.exam_code === examType);

        // 2. Fallback to match by component type (e.g. 'UNIT_TEST' maps to type 'unit_test')
        if (matched.length === 0) {
          matched = scheme.components.filter(c => c.type === examType.toLowerCase() || c.type === examType);
        }

        // 3. Fallback for generic exams (e.g. Monday Test) not mapped in the grand scheme
        if (matched.length === 0 && session) {
          return [{
            component_id: `exam_${sessionId}`,
            component_name: `${session.name} Marks`,
            max_marks: 100 // Default max
          }];
        } else {
          activeComponents = matched;
        }
      } else {
        // Default to empty array if no session is selected yet
        return [];
      }

      const mapped = [];
      activeComponents.forEach((comp) => {
        // Break down sub components if any (e.g. Written + Oral/Practical)
        if (comp.sub_components && comp.sub_components.length > 0) {
          comp.sub_components.forEach((subComp) => {
            mapped.push({
              component_id: `${comp.component_id}_${subComp.name.toLowerCase().replace(/\\s+/g, '_')}`,
              component_name: `${comp.name} - ${subComp.name}`,
              max_marks: subComp.max_marks || comp.max_marks
            });
          });
        } else {
          mapped.push({
            component_id: comp.component_id,
            component_name: comp.name,
            max_marks: comp.max_marks
          });
        }
      });
      return mapped;
    };
    return mapComponents(markingScheme, selectedSessionId);
  }, [markingScheme, selectedSessionId, examSessions]);

  // ===== FETCH EXAM SESSIONS =====
  useEffect(() => {
    // Fetch available exam sessions from backend
    const fetchExamSessions = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE}/api/exam-sessions`);
        if (response.ok) {
          const data = await response.json();
          setExamSessions(data);
        }
      } catch (err) {
        console.error("Failed to fetch exam sessions:", err);
      }
    };
    fetchExamSessions();
  }, []);

  // ===== FETCH STUDENTS & MARKING SCHEME =====
  useEffect(() => {
    if (!teacherId || !selectedClass || !selectedSection) return;

    dispatch(
      getStudentsForResults({
        teacherId,
        classSection: `${selectedClass}-${selectedSection}`
      })
    );

    dispatch(
      getMarkingScheme({
        teacherId,
        classNum: selectedClass,
        section: selectedSection
      })
    );
  }, [teacherId, selectedClass, selectedSection, dispatch]);

  // ===== INIT & FETCH MARKS DATA =====
  useEffect(() => {
    if (!students.length || !components.length || !selectedSessionId || !selectedSubject) {
      setMarksData({});
      return;
    }

    const fetchExistingMarks = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const session = examSessions.find(s => s._id === selectedSessionId);
        const academicYear = session?.academic_year || "2025-2026";

        const url = new URL(`${API_BASE}/api/teacher/${teacherId}/results/draft`);
        url.searchParams.append("exam_id", selectedSessionId);
        url.searchParams.append("subject", selectedSubject);
        url.searchParams.append("class", selectedClass);
        url.searchParams.append("section", selectedSection);
        url.searchParams.append("academic_year", academicYear);

        const response = await fetch(url);
        let existingMarks = {};

        if (response.ok) {
          const data = await response.json();
          existingMarks = data.marks || {};
        }

        setMarksData((prev) => {
          let hasChanges = false;
          const updated = { ...prev };

          students.forEach((student) => {
            if (!updated[student.admission_no]) {
              updated[student.admission_no] = {};
              hasChanges = true;
            }

            const dbStudentMarks = existingMarks[student.admission_no] || {};

            components.forEach((comp) => {
              const currentVal = updated[student.admission_no][comp.component_id];
              const savedMark = dbStudentMarks[comp.component_id];

              if (!currentVal || Object.keys(dbStudentMarks).length > 0) {
                const newVal = {
                  obtained: savedMark && savedMark.obtained !== undefined ? savedMark.obtained : "",
                  absent: savedMark ? savedMark.absent : false
                };

                // Only update if there's a difference to prevent infinite loop
                if (!currentVal || currentVal.obtained !== newVal.obtained || currentVal.absent !== newVal.absent) {
                  updated[student.admission_no][comp.component_id] = newVal;
                  hasChanges = true;
                }
              }
            });
          });

          return hasChanges ? updated : prev;
        });

      } catch (error) {
        console.error("Error fetching existing marks", error);
      }
    };

    fetchExistingMarks();
  }, [selectedSessionId, selectedSubject, selectedClass, selectedSection, teacherId, students.length, components.length, components, examSessions, students]);

  // ===== NOTIFICATIONS =====
  useEffect(() => {
    if (success) {
      setShowSuccessMsg(true);
      setTimeout(() => { setShowSuccessMsg(false); dispatch(clearSuccess()); }, 3000);
    }
    if (error) {
      setShowErrorMsg(true);
      setTimeout(() => { setShowErrorMsg(false); dispatch(clearError()); }, 5000);
    }
  }, [success, error, dispatch]);


  // ===== AUTO GRADE CALCULATOR =====
  const calculateTotal = (admissionNo) => {
    let obtained = 0;
    let max = 0;

    components.forEach((c) => {
      const mark = marksData[admissionNo]?.[c.component_id];
      if (mark && !mark.absent && mark.obtained !== "") {
        obtained += Number(mark.obtained);
      }
      max += Number(c.max_marks);
    });

    const percentage = max > 0 ? (obtained / max) * 100 : 0;
    return {
      obtained,
      max,
      percentage: percentage.toFixed(2)
    };
  };

  const getAutoGrade = (percentage) => {
    if (!markingScheme?.grading?.grades) {
      // Default 9-point scale
      if (percentage >= 91) return "A1";
      if (percentage >= 81) return "A2";
      if (percentage >= 71) return "B1";
      if (percentage >= 61) return "B2";
      if (percentage >= 51) return "C1";
      if (percentage >= 41) return "C2";
      if (percentage >= 33) return "D";
      if (percentage > 20) return "E1";
      return "E2";
    }

    const gradeObj = markingScheme.grading.grades.find(
      g => percentage >= g.min && percentage <= g.max
    );
    return gradeObj ? gradeObj.grade : "F";
  };

  const getGradeColor = (grade) => {
    if (grade.includes("A")) return "text-green-700 bg-green-50 border-green-200";
    if (grade.includes("B")) return "text-blue-700 bg-blue-50 border-blue-200";
    if (grade.includes("C")) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (grade.includes("D")) return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  // ===== HANDLERS =====
  const handleMarkChange = (admissionNo, componentId, value, maxMarks) => {
    if (value === "") {
      setMarksData((prev) => ({
        ...prev,
        [admissionNo]: {
          ...prev[admissionNo],
          [componentId]: { ...prev[admissionNo]?.[componentId], obtained: "" }
        }
      }));
      return;
    }

    const numValue = Number(value);
    if (numValue > maxMarks) {
      alert(`Marks cannot exceed the max component marks (${maxMarks})`);
      return;
    }

    setMarksData((prev) => ({
      ...prev,
      [admissionNo]: {
        ...prev[admissionNo],
        [componentId]: { ...prev[admissionNo]?.[componentId], obtained: numValue, absent: false }
      }
    }));
  };

  const handleAbsentToggle = (admissionNo, componentId) => {
    setMarksData((prev) => {
      const isCurrentlyAbsent = prev[admissionNo]?.[componentId]?.absent;
      return {
        ...prev,
        [admissionNo]: {
          ...prev[admissionNo],
          [componentId]: {
            ...prev[admissionNo]?.[componentId],
            absent: !isCurrentlyAbsent,
            obtained: !isCurrentlyAbsent ? "" : prev[admissionNo]?.[componentId]?.obtained
          }
        }
      };
    });
  };

  const handleSubmit = (publish) => {
    if (!selectedSessionId || !selectedSubject) {
      alert("Please select both Exam Session and Subject");
      return;
    }

    const hasMarks = Object.values(marksData).some(studentMarks =>
      Object.values(studentMarks).some(mark => mark.obtained !== "" || mark.absent)
    );

    if (!hasMarks) {
      alert("Please enter marks for at least one student before uploading.");
      return;
    }

    const payload = {
      exam_id: selectedSessionId, // Ties to exam_sessions collection
      subject: selectedSubject,
      class: selectedClass,
      section: selectedSection,
      academic_year: examSessions.find(e => e._id === selectedSessionId)?.academic_year || "2025-2026",
      auto_publish: publish,
      students_marks: students.map((s) => ({
        admission_no: s.admission_no,
        marks: marksData[s.admission_no] || {}
      }))
    };

    dispatch(uploadResults({ teacherId, resultsData: payload }));
  };

  // ===== BULK EXCEL/CSV =====
  const downloadTemplate = () => {
    if (!students.length) return;

    const headers = ["Admission No", "Student Name", ...components.map(c => `${c.component_name} (Max: ${c.max_marks})`)];
    const rows = students.map(s => [
      s.admission_no,
      `${s.personal_details?.first_name || ""} ${s.personal_details?.last_name || ""}`,
      ...components.map(() => "")
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Marks_Template_Class${selectedClass}${selectedSection}_${selectedSubject}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        const newMarksData = { ...marksData };

        // Start from row 1 to skip header
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 3) continue;

          const admissionNo = row[0].trim();
          if (!students.find(s => s.admission_no === admissionNo)) continue;

          components.forEach((comp, idx) => {
            const markStr = row[idx + 2]?.trim();
            if (markStr !== undefined && markStr !== "") {
              if (markStr.toUpperCase() === "ABS" || markStr.toUpperCase() === "A") {
                newMarksData[admissionNo][comp.component_id] = { obtained: "", absent: true };
              } else {
                const markValue = parseFloat(markStr);
                if (!isNaN(markValue) && markValue <= comp.max_marks) {
                  newMarksData[admissionNo][comp.component_id] = { obtained: markValue, absent: false };
                }
              }
            }
          });
        }

        setMarksData(newMarksData);
        alert("CSV Marks mapped successfully. Please review and click Publish.");
      } catch (err) {
        alert("Failed to parse CSV. Make sure you use the downloaded template.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  // ===== UI RENDERING =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto pb-10">

        {/* Alerts */}
        {showSuccessMsg && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow flex items-center gap-2">
            <CheckCircle size={20} /> <span>Results saved successfully!</span>
            <button onClick={() => setShowSuccessMsg(false)}><X size={18} /></button>
          </div>
        )}
        {showErrorMsg && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow flex items-center gap-2">
            <AlertCircle size={20} /> <span>{error?.message || "Failed to save results"}</span>
            <button onClick={() => setShowErrorMsg(false)}><X size={18} /></button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editSession ? `Editing Results: ${editSession.exam_name} - ${editSession.subject}` : 'Upload Marks'}
              </h1>
              <p className="text-gray-500 mt-1">
                {editSession ? 'Modify student scores and re-publish as needed.' : 'Select class, exam session, and upload scores or Excel sheet.'}
              </p>
            </div>
            {editSession && (
              <button 
                onClick={clearEdit}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold transition-colors"
              >
                <X size={16} /> Cancel Editing
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                {["PG", "Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(c => (
                  <option key={c} value={c}>{isNaN(c) ? c : `Class ${c}`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                {["A", "B", "C", "D"].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exam Session</label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                <option value="">Select Exam</option>
                {examSessions.map(e => (
                  <option key={e._id} value={e._id}>{e.name} ({e.academic_year})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {markingScheme?.scheme_name && selectedSessionId && components.length > 0 && (
            <div className="mt-4 bg-indigo-50 rounded-lg p-3 flex items-center gap-2 border border-indigo-100">
              <CheckCircle className="text-indigo-600" size={18} />
              <span className="text-sm text-indigo-800 font-medium">
                Active Scheme for this Exam: <span className="font-bold">{markingScheme.scheme_name}</span>
                {markingScheme.evaluation_mode ? ` (${markingScheme.evaluation_mode})` : ''}.
                Total for this exam: <span className="font-bold">{components.reduce((sum, c) => sum + Number(c.max_marks), 0)}</span> marks.
              </span>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              disabled={!students.length || !selectedSubject}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
            >
              <Download size={16} /> Download Excel Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold cursor-pointer transition-colors">
              <FileUp size={16} /> Bulk Upload CSV
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Data Table */}
        {students.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                    {components.map(c => (
                      <th key={c.component_id} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">
                        {c.component_name} <br /> <span className="text-indigo-400 font-medium">(Max: {c.max_marks})</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(s => {
                    const totalStats = calculateTotal(s.admission_no);
                    const autoGrade = getAutoGrade(Number(totalStats.percentage));

                    return (
                      <tr key={s.admission_no} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-600">{s.roll_no}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-100">
                          {s.personal_details?.first_name} {s.personal_details?.last_name}
                        </td>

                        {components.map(c => {
                          const markData = marksData[s.admission_no]?.[c.component_id];
                          const isAbsent = markData?.absent;

                          return (
                            <td key={c.component_id} className="px-4 py-3 text-center border-r border-gray-50">
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={c.max_marks}
                                  disabled={isAbsent}
                                  value={markData?.obtained !== undefined ? markData.obtained : ""}
                                  onChange={(e) => handleMarkChange(s.admission_no, c.component_id, e.target.value, c.max_marks)}
                                  className={`w-16 px-2 py-1 text-center font-bold text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none ${isAbsent ? 'bg-gray-100 text-transparent' : 'bg-white'}`}
                                  placeholder={isAbsent ? "-" : "0"}
                                />
                                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isAbsent || false}
                                    onChange={() => handleAbsentToggle(s.admission_no, c.component_id)}
                                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                                  />
                                  AB
                                </label>
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 text-center bg-gray-50 font-bold text-gray-900">
                          {totalStats.obtained} <span className="text-xs text-gray-400 font-medium">/ {totalStats.max}</span>
                        </td>
                        <td className="px-4 py-3 text-center bg-gray-50">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getGradeColor(autoGrade)}`}>
                            {autoGrade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <span className="text-sm font-medium text-gray-500 mr-4">Total Students: {students.length}</span>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading || !selectedSessionId || !selectedSubject}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading || !selectedSessionId || !selectedSubject}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold text-sm shadow-sm disabled:opacity-50"
              >
                Publish Marks
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            {loading ? (
              <p className="text-gray-500 font-medium">Loading...</p>
            ) : (
              <div>
                <AlertCircle className="mx-auto text-gray-300 w-12 h-12 mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Ready to Upload</h3>
                <p className="text-gray-500 text-sm">Select class, section, exam and subject above to load student list.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}