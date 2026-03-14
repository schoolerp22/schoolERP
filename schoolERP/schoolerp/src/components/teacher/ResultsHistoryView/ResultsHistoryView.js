import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  getResultsHistory, 
  deleteResultSession,
  clearSuccess,
  clearError
} from "../../../feature/teachers/teacherSlice";
import { 
  Trash2, 
  Edit3, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Calendar
} from "lucide-react";

const ResultsHistoryView = ({ teacherId, profile, onEdit }) => {
  const dispatch = useDispatch();
  const { resultsHistory, loadings, success, error } = useSelector((state) => state.teacher);
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [academicYear, setAcademicYear] = useState("2025-26");

  useEffect(() => {
    dispatch(getResultsHistory({ teacherId, year: academicYear }));
  }, [dispatch, teacherId, academicYear]);

  const handleDelete = (session) => {
    if (window.confirm(`Are you sure you want to delete all results for ${session.exam_name} - ${session.subject} (${session.class}-${session.section})? This action cannot be undone.`)) {
      dispatch(deleteResultSession({
        teacherId,
        params: {
          exam_id: session.exam_id,
          subject: session.subject,
          class: session.class,
          section: session.section,
          academic_year: academicYear
        }
      }));
    }
  };

  // Get unique classes, sections and subjects from BOTH history data AND teacher profile
  const assignedClasses = profile?.assigned_classes || [];
  const profileSubjects = profile?.subjects || [];

  const uniqueClasses = [...new Set([
    ...resultsHistory.map(h => h.class),
    ...assignedClasses.map(ac => ac.class)
  ])].filter(Boolean).sort();

  const uniqueSections = [...new Set([
    ...resultsHistory.map(h => h.section),
    ...assignedClasses.map(ac => ac.section)
  ])].filter(Boolean).sort();

  const sessionSubjects = [...new Set([
    ...resultsHistory.map(h => h.subject),
    ...profileSubjects
  ])].filter(Boolean).sort();

  const filteredHistory = resultsHistory.filter(h => {
    const classMatch = selectedClass === "All" || h.class === selectedClass;
    const sectionMatch = selectedSection === "All" || h.section === selectedSection;
    const subjectMatch = selectedSubject === "All" || h.subject === selectedSubject;
    return classMatch && sectionMatch && subjectMatch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Results</h1>
            <p className="text-gray-500 mt-1">Filter by class and subject to manage your uploads.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <select 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-transparent text-sm font-semibold outline-none"
              >
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
              </select>
            </div>
            
            <button 
              onClick={() => dispatch(getResultsHistory({ teacherId, year: academicYear }))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              title="Refresh List"
            >
              <RefreshCw size={20} className={loadings.results ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Class</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Section</label>
            <select 
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            >
              <option value="All">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Subject</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            >
              <option value="All">All Subjects</option>
              {sessionSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span>Action completed successfully!</span>
          </div>
          <button onClick={() => dispatch(clearSuccess())}><X size={18} /></button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error?.message || "Something went wrong"}</span>
          </div>
          <button onClick={() => dispatch(clearError())}><X size={18} /></button>
        </div>
      )}

      {loadings.results ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading history...</p>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((session, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    {session.exam_name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={14} />
                    {new Date(session.last_updated).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{session.subject}</h3>
                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 rounded">
                    Class {session.class}-{session.section}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Total Students</div>
                    <div className="flex items-center gap-1 text-gray-700 font-bold">
                      <Users size={16} className="text-gray-400" />
                      {session.total_students}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Status</div>
                    <div className={`flex items-center gap-1 font-bold ${session.published_count === session.total_students ? 'text-green-600' : 'text-amber-600'}`}>
                      {session.published_count === session.total_students ? (
                        <><CheckCircle size={16} /> Published</>
                      ) : (
                        <><AlertCircle size={16} /> Draft ({session.total_students - session.published_count})</>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => onEdit(session)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm transition-colors"
                  >
                    <Edit3 size={16} /> Edit Marks
                  </button>
                  <button 
                    onClick={() => handleDelete(session)}
                    className="flex items-center gap-2 text-gray-400 hover:text-red-600 font-bold text-sm transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-gray-300" size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No upload history found</h3>
          <p className="text-gray-500 mt-2">Any marks you upload will appear here for management.</p>
        </div>
      )}
    </div>
  );
};

export default ResultsHistoryView;
