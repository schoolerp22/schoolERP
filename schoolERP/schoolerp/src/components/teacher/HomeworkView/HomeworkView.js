import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assignHomework, getHomework, editHomework, getHomeworkSubmissions } from '../../../feature/teachers/teacherSlice';
import { Download, Edit, Users, X, Paperclip, CheckCircle, Clock } from 'lucide-react';

const HomeworkView = ({ selectedClass, teacherId, profile, students }) => {
  const dispatch = useDispatch();
  const { loading, homework, submissions } = useSelector((state) => state.teacher);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (teacherId) {
      dispatch(getHomework(teacherId));
    }
  }, [teacherId, dispatch]);

  const [showModal, setShowModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [homeworkForm, setHomeworkForm] = useState({
    subject: '',
    topic: '',
    description: '',
    dueDate: '',
    attachment: null
  });

  const handleEditClick = (hw) => {
    setEditingId(hw._id);
    setHomeworkForm({
      subject: hw.subject,
      topic: hw.topic,
      description: hw.description,
      dueDate: hw.due_date ? new Date(hw.due_date).toISOString().split('T')[0] : '',
      attachment: null
    });
    setShowModal(true);
  };

  const handleSubmissionsClick = (hwId) => {
    dispatch(getHomeworkSubmissions({ teacherId, homeworkId: hwId }));
    setShowSubmissionsModal(true);
  };

  const submitHomework = () => {
    const formData = new FormData();
    formData.append("classSection", selectedClass);
    formData.append("subject", homeworkForm.subject);
    formData.append("topic", homeworkForm.topic);
    formData.append("description", homeworkForm.description);
    formData.append("dueDate", homeworkForm.dueDate);
    formData.append("teacher", JSON.stringify({
      id: teacherId,
      name: profile.personal_details.name
    }));

    if (homeworkForm.attachment) {
      formData.append("attachment", homeworkForm.attachment);
    }

    if (editingId) {
      dispatch(editHomework({ teacherId, homeworkId: editingId, homeworkData: formData }))
        .then(() => {
          dispatch(getHomework(teacherId));
          setEditingId(null);
        });
    } else {
      dispatch(assignHomework({ teacherId, homeworkData: formData }))
        .then(() => dispatch(getHomework(teacherId)));
    }

    setShowModal(false);
    setHomeworkForm({ subject: '', topic: '', description: '', dueDate: '', attachment: null });
  };

  const API_Base = process.env.REACT_APP_API_URL || '';

  return (
    <div className="space-y-4 sm:space-y-8 p-1">
      <div className="bg-white rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 sm:mb-4 px-4 sm:px-0">
          <h3 className="text-lg font-bold text-gray-900">Homework Management</h3>
          <button
            onClick={() => {
              setEditingId(null);
              setHomeworkForm({ subject: '', topic: '', description: '', dueDate: '', attachment: null });
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <span>+ Assign New Homework</span>
          </button>
        </div>

        {homework.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center mx-4 sm:mx-0 shadow-sm">
            <p className="text-gray-500 font-medium">No homework assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 px-4 sm:px-0">
            {homework.map((hw) => (
              <div key={hw._id} className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-300 group">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-[15px] sm:text-lg text-gray-900 leading-tight">
                      {hw.subject} <span className="text-gray-300 mx-1">|</span> <span className="text-gray-700 font-semibold">{hw.topic}</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-[11px] sm:text-sm font-medium text-indigo-600 flex items-center gap-1">
                        <span className="text-gray-400">Created:</span> {new Date(hw.assigned_date).toLocaleDateString()}
                      </p>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <p className="text-[11px] sm:text-sm font-medium text-rose-500 flex items-center gap-1">
                        <span className="text-gray-400">Due:</span> {new Date(hw.due_date).toLocaleDateString()}
                      </p>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-lg">
                        <span className="text-[11px] sm:text-sm font-bold text-indigo-700">{hw.submissionCount || 0}</span>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Submitted</span>
                        <span className="text-indigo-200">/</span>
                        <span className="text-[11px] sm:text-sm font-bold text-gray-500">{(hw.totalStudents || 0) - (hw.submissionCount || 0)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Pending</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSubmissionsClick(hw._id)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wide transition-colors"
                    >
                      <Users size={14} /> <span className="hidden sm:inline">Submissions</span>
                      <span className="sm:hidden">Subs</span>
                    </button>
                    <button
                      onClick={() => handleEditClick(hw)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mt-3 text-sm leading-relaxed sm:pr-8">
                  {hw.description}
                </p>

                {hw.attachment && (
                  <div className="mt-4 pt-4 border-t border-gray-50 flex">
                    <a
                      href={`${API_Base}${hw.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <Paperclip size={14} className="text-gray-400" />
                      {hw.attachment_original_name || 'View Attachment'}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-3">
              {editingId ? 'Edit Homework' : 'Assign Homework'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={homeworkForm.subject}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={homeworkForm.topic}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, topic: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Algebra"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  rows="4"
                  placeholder="Detailed instructions..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={homeworkForm.dueDate}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setHomeworkForm({ ...homeworkForm, attachment: e.target.files[0] })}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitHomework}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Assign')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl sm:rounded-t-xl sticky top-0 z-10">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Submission Report</h3>
                <p className="text-xs text-gray-500 font-medium">({submissions.length} / {students?.length || 0}) Students Submitted</p>
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : !students || students.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-gray-400 block mb-2">No students found in this class view list.</span>
                  <span className="text-xs text-gray-500">(Try selecting a class in the header)</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => {
                    const submission = submissions.find(s => s.admission_no === student.admission_no);
                    const isSubmitted = !!submission;

                    return (
                      <div key={student._id} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${isSubmitted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-gray-50/30 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSubmitted ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {isSubmitted ? <CheckCircle size={16} /> : <Clock size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{student.personal_details.first_name} {student.personal_details.last_name}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Roll: {student.academic?.roll_no || 'N/A'}</p>
                          </div>
                        </div>

                        {isSubmitted ? (
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase">Submitted</p>
                              <p className="text-[10px] text-gray-400">{new Date(submission.submitted_at).toLocaleDateString()}</p>
                            </div>
                            {submission.attachment && (
                              <a
                                href={`${API_Base}${submission.attachment}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"
                                title="Download Submission"
                              >
                                <Download size={16} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded">Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkView;