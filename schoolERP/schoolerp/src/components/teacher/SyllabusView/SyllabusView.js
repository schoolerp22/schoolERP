import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadSyllabus, getSyllabus, updateSyllabus, deleteSyllabus } from '../../../feature/teachers/teacherSlice';
import { Download, Edit, Trash2, Paperclip, BookOpen, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const SyllabusView = ({ selectedClass, teacherId, profile }) => {
  const dispatch = useDispatch();
  const { syllabus } = useSelector((state) => state.teacher);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [syllabusForm, setSyllabusForm] = useState({
    title: '',
    subject: '',
    description: '',
    attachment: null
  });

  useEffect(() => {
    if (teacherId) {
      dispatch(getSyllabus(teacherId));
    }
  }, [teacherId, dispatch]);

  const API_Base = process.env.REACT_APP_API_URL || '';

  const handleEditClick = (syl) => {
    setEditingId(syl._id);
    setSyllabusForm({
      title: syl.title,
      subject: syl.subject,
      description: syl.description,
      attachment: null
    });
    setShowModal(true);
  };

  const handleDeleteClick = (sylId) => {
    if (window.confirm("Are you sure you want to delete this syllabus?")) {
      dispatch(deleteSyllabus({ teacherId, syllabusId: sylId }))
        .unwrap()
        .then(() => {
          toast.success("Syllabus deleted successfully");
          dispatch(getSyllabus(teacherId));
        })
        .catch((err) => toast.error(err.message || "Failed to delete syllabus"));
    }
  };

  const handleFormSubmit = () => {
    if (!syllabusForm.title || !syllabusForm.subject) {
      toast.warning("Title and subject are required.");
      return;
    }

    const formData = new FormData();
    formData.append("classSection", selectedClass);
    formData.append("title", syllabusForm.title);
    formData.append("subject", syllabusForm.subject);
    formData.append("description", syllabusForm.description);
    
    // Pass teacher info as JSON string
    formData.append("teacher", JSON.stringify({
      id: teacherId,
      name: profile?.personal_details?.name || "Teacher"
    }));

    if (syllabusForm.attachment) {
      formData.append("attachment", syllabusForm.attachment);
    }

    if (editingId) {
      dispatch(updateSyllabus({ teacherId, syllabusId: editingId, syllabusData: formData }))
        .unwrap()
        .then(() => {
          toast.success("Syllabus updated successfully");
          dispatch(getSyllabus(teacherId));
          setEditingId(null);
          setShowModal(false);
        })
        .catch(err => toast.error(err.message || "Failed to update syllabus"));
    } else {
      dispatch(uploadSyllabus({ teacherId, syllabusData: formData }))
        .unwrap()
        .then(() => {
          toast.success("Syllabus uploaded successfully");
          dispatch(getSyllabus(teacherId));
          setShowModal(false);
        })
        .catch(err => toast.error(err.message || "Failed to upload syllabus"));
    }

    setSyllabusForm({ title: '', subject: '', description: '', attachment: null });
  };

  const classSyllabus = syllabus.filter(s => s.class_section === selectedClass || s.class_section === "All");

  return (
    <div className="space-y-4 sm:space-y-8 p-1">
      <div className="bg-white rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 sm:px-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600">
              Syllabus Management
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Upload and manage course syllabus for <span className="text-indigo-600 border px-2 py-0.5 rounded-md border-indigo-100 bg-indigo-50/50">{selectedClass}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setSyllabusForm({ title: '', subject: '', description: '', attachment: null });
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm hover:shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Upload Syllabus</span>
          </button>
        </div>

        {classSyllabus.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 border border-slate-100 rounded-[24px] p-12 text-center mx-4 sm:mx-0 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-indigo-300" />
            </div>
            <h4 className="text-lg font-bold text-slate-700 mb-1">No Syllabus Found</h4>
            <p className="text-slate-500 font-medium text-sm">You haven't uploaded any syllabus for this class yet.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 outline-none">
            <AnimatePresence>
            {classSyllabus.map((syl, i) => (
              <motion.div 
                key={syl._id} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-80" />
                <div className="flex justify-between items-start gap-4 pl-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {syl.subject}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {new Date(syl.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 leading-tight mt-2 text-lg">
                      {syl.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(syl)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(syl._id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mt-3 text-sm leading-relaxed pl-2 line-clamp-2">
                  {syl.description || "No description provided."}
                </p>

                {syl.attachment && (
                  <div className="mt-5 pt-4 border-t border-gray-50 flex pl-2">
                    <a
                      href={`${API_Base}${syl.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 rounded-xl text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
                    >
                      <Download size={16} />
                      Download File
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
              
              <h3 className="text-2xl font-bold mb-6 text-gray-900">
                {editingId ? 'Edit Syllabus' : 'Upload Syllabus'}
              </h3>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Subject *</label>
                    <input
                      type="text"
                      value={syllabusForm.subject}
                      onChange={(e) => setSyllabusForm({ ...syllabusForm, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900"
                      placeholder="e.g. Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Title *</label>
                    <input
                      type="text"
                      value={syllabusForm.title}
                      onChange={(e) => setSyllabusForm({ ...syllabusForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900"
                      placeholder="e.g. Term 1 Syllabus"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={syllabusForm.description}
                    onChange={(e) => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-gray-900 text-sm"
                    placeholder="Provide a brief overview of the syllabus..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Attachment (PDF, Doc)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center relative hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      onChange={(e) => setSyllabusForm({ ...syllabusForm, attachment: e.target.files[0] })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-indigo-600 transition-colors">
                      <Paperclip size={24} />
                      <span className="text-sm font-medium">
                        {syllabusForm.attachment ? syllabusForm.attachment.name : "Click to select or drag a file here"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFormSubmit}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200"
                >
                  {editingId ? 'Save Changes' : 'Upload Syllabus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyllabusView;
