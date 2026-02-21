import React, { useState, useEffect } from "react";
import { Save, Eye, Download, Upload, AlertCircle, CheckCircle, X, FileUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  getStudentsForResults,
  getMarkingScheme,
  uploadResults,
  clearError,
  clearSuccess
} from "../../../feature/teachers/teacherSlice";

export default function ResultsUpload({ teacherId, profile, selectedClass: initialSelectedClass }) {
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
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState(initialClass || "10");
  const [selectedSection, setSelectedSection] = useState(initialSection || "A");
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

  // Map new marking scheme structure to old component format for UI compatibility
  const mapComponents = (scheme) => {
    if (!scheme?.components || scheme.components.length === 0) {
      return defaultComponents;
    }

    const mapped = [];
    scheme.components.forEach((comp) => {
      if (comp.sub_components && comp.sub_components.length > 0) {
        // If component has sub-components, flatten them
        comp.sub_components.forEach((subComp) => {
          mapped.push({
            component_id: `${comp.name.toLowerCase().replace(/\s+/g, '_')}_${subComp.name.toLowerCase().replace(/\s+/g, '_')}`,
            component_name: `${comp.name} - ${subComp.name}`,
            max_marks: subComp.max_marks
          });
        });
      } else {
        // No sub-components, use component directly
        mapped.push({
          component_id: comp.name.toLowerCase().replace(/\s+/g, '_'),
          component_name: comp.name,
          max_marks: comp.max_marks
        });
      }
    });
    return mapped;
  };

  // Use marking scheme components or default
  const components = mapComponents(markingScheme);

  // ===== FETCH DATA =====
  useEffect(() => {
    if (!teacherId) return;

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
    // Allow empty string to clear the input
    if (value === "") {
      setMarksData((prev) => ({
        ...prev,
        [admissionNo]: {
          ...prev[admissionNo],
          [componentId]: {
            ...prev[admissionNo]?.[componentId],
            obtained: ""
          }
        }
      }));
      return;
    }

    const numValue = Number(value);

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

    // Validate that at least some marks are entered (allow 0)
    const hasMarks = Object.values(marksData).some(studentMarks =>
      Object.values(studentMarks).some(mark => mark.obtained !== "" && mark.obtained !== undefined && mark.obtained !== null)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

        {/* Header Section */}
        <div className="bg-transparent sm:bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Upload Results</h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1 font-medium">Enter marks and publish results</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-2xl hidden sm:block">
              <Upload className="text-indigo-600" size={28} />
            </div>
          </div>

          {/* SELECTION */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              >
                {["A", "B", "C", "D"].map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              >
                <option value="">Select Exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Banner */}
          {markingScheme?.scheme_name ? (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Using: {markingScheme.scheme_name}</p>
                <p>
                  {components.map(c => c.component_name).join(' + ')}
                  {' '}(Total: {components.reduce((sum, c) => sum + c.max_marks, 0)} marks)
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Using Default Marking Scheme</p>
                <p>Theory (70 marks) + Practical (30 marks). Admin can configure marking schemes for custom components.</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-row items-center gap-2 sm:gap-3 overflow-x-auto hide-scrollbar pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={downloadTemplate}
              disabled={!students.length}
              className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap active:scale-95"
            >
              <Download size={18} /> Template
            </button>

            <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-sm whitespace-nowrap active:scale-95">
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

        {/* DATA ENTRY SECTION */}
        {students.length > 0 ? (
          <div className="bg-transparent sm:bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-100 overflow-hidden mb-24 sm:mb-0">

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[140px]">Admission No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[180px]">Student Name</th>
                    {components.map((c) => (
                      <th key={c.component_id} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[140px]">
                        <div>{c.component_name}</div>
                        <div className="text-[10px] font-medium text-indigo-400 mt-0.5">(Max: {c.max_marks})</div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">%</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {students.map((s, idx) => {
                    const total = calculateTotal(s.admission_no);
                    const grade = getGrade(Number(total.percentage));

                    return (
                      <tr key={s.admission_no} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 bg-inherit">{s.roll_no}</td>
                        <td className="px-4 py-3 text-xs font-mono font-medium text-gray-500">{s.admission_no}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {s.personal_details?.first_name} {s.personal_details?.last_name}
                        </td>

                        {components.map((c) => {
                          const isAbsent = marksData[s.admission_no]?.[c.component_id]?.absent;

                          return (
                            <td key={c.component_id} className="px-4 py-3">
                              <div className="flex flex-col gap-1.5 items-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={c.max_marks}
                                  disabled={isAbsent}
                                  value={marksData[s.admission_no]?.[c.component_id]?.obtained !== undefined ? marksData[s.admission_no]?.[c.component_id]?.obtained : ""}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      s.admission_no,
                                      c.component_id,
                                      e.target.value,
                                      c.max_marks
                                    )
                                  }
                                  className={`w-20 px-2 py-1.5 text-center text-sm font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isAbsent ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-white focus:bg-white'
                                    }`}
                                />
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 cursor-pointer uppercase tracking-wider">
                                  <input
                                    type="checkbox"
                                    checked={isAbsent}
                                    onChange={() => handleAbsentToggle(s.admission_no, c.component_id)}
                                    className="w-3 h-3 text-red-500 border-gray-300 rounded focus:ring-red-500"
                                  />
                                  Abs
                                </label>
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 text-center text-sm font-bold text-indigo-700 bg-indigo-50/30">
                          {total.obtained}<span className="text-xs text-gray-400 font-medium">/{total.max}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 bg-indigo-50/30">
                          {total.percentage}%
                        </td>
                        <td className="px-4 py-3 text-center bg-indigo-50/30">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getGradeColor(grade)}`}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden flex flex-col gap-3 px-4 sm:px-0">
              {students.map((s) => {
                const total = calculateTotal(s.admission_no);
                const grade = getGrade(Number(total.percentage));

                return (
                  <div key={s.admission_no} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-md">Roll {s.roll_no}</span>
                          <span className="text-[10px] font-mono font-medium text-gray-400">{s.admission_no}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                          {s.personal_details?.first_name} {s.personal_details?.last_name}
                        </h3>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1 ${getGradeColor(grade)}`}>
                          Grade {grade}
                        </span>
                        <div className="text-sm font-bold text-indigo-700">{total.obtained}<span className="text-xs text-gray-400">/{total.max}</span></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {components.map((c) => {
                        const isAbsent = marksData[s.admission_no]?.[c.component_id]?.absent;

                        return (
                          <div key={c.component_id} className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate mr-2">{c.component_name}</label>
                              <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-50 px-1.5 rounded">Max {c.max_marks}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={c.max_marks}
                                disabled={isAbsent}
                                placeholder="0"
                                value={marksData[s.admission_no]?.[c.component_id]?.obtained !== undefined ? marksData[s.admission_no]?.[c.component_id]?.obtained : ""}
                                onChange={(e) =>
                                  handleMarkChange(
                                    s.admission_no,
                                    c.component_id,
                                    e.target.value,
                                    c.max_marks
                                  )
                                }
                                className={`flex-1 w-full px-2 py-2 text-center text-sm font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isAbsent ? 'bg-gray-200 border-gray-200 text-gray-400' : 'bg-white border-gray-200 text-gray-900'
                                  }`}
                              />
                              <label className="flex flex-col items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isAbsent}
                                  onChange={() => handleAbsentToggle(s.admission_no, c.component_id)}
                                  className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-[8px] font-bold text-gray-500 uppercase">Abs</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed sm:static bottom-0 left-0 right-0 sm:mt-0 p-4 sm:p-6 bg-white sm:bg-gray-50 border-t border-gray-100 sm:border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none pb-safe">
              <div className="text-sm font-semibold text-gray-500 w-full sm:w-auto text-center sm:text-left">
                Students: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{students.length}</span>
              </div>
              <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading || !selectedExam || !selectedSubject}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 px-4 sm:px-6 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm"
                >
                  <Save size={18} /> Draft
                </button>

                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading || !selectedExam || !selectedSubject}
                  className="flex-[2] sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm"
                >
                  <Eye size={18} /> Publish
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-transparent sm:bg-white sm:rounded-2xl sm:border border-gray-100 sm:shadow-sm p-8 sm:p-16 text-center mx-4 sm:mx-0">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-200 border-t-indigo-600"></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Loading students...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="text-gray-300" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Students Found</h3>
                <p className="text-sm font-medium text-gray-500">Please select a class and section to view students</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}