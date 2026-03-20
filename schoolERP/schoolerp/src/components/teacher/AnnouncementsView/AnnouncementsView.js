import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } from '../../../feature/teachers/teacherSlice';
import { Edit2, Trash2, Paperclip, FileText, Bell, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const AnnouncementsView = ({ selectedClass, teacherId, profile }) => {
  const dispatch = useDispatch();
  const { loading, announcements } = useSelector((state) => state.teacher);

  useEffect(() => {
    if (teacherId) {
      dispatch(getAnnouncements(teacherId));
    }
  }, [teacherId, dispatch]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'Normal'
  });
  const [attachment, setAttachment] = useState(null);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setAnnouncementForm({ title: '', message: '', priority: 'Normal' });
    setAttachment(null);
    setShowModal(true);
  };

  const handleOpenEdit = (announcement) => {
    setIsEditing(true);
    setCurrentId(announcement._id);
    setAnnouncementForm({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority
    });
    setAttachment(null); // Reset file input, user uploads only if changing
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      dispatch(deleteAnnouncement({ teacherId, announcementId: id }))
        .then(() => toast.success("Announcement deleted"));
    }
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const submitAnnouncement = () => {
    const formData = new FormData();
    formData.append('title', announcementForm.title);
    formData.append('message', announcementForm.message);
    formData.append('priority', announcementForm.priority);
    formData.append('classSection', selectedClass || "All");

    if (!isEditing) {
      // Only send teacher info on creation
      formData.append('teacher', JSON.stringify({
        id: teacherId,
        name: profile.personal_details.name
      }));
    }

    if (attachment) {
      formData.append('attachment', attachment);
    }

    if (isEditing) {
      dispatch(updateAnnouncement({
        teacherId,
        announcementId: currentId,
        announcementData: formData
      })).then(() => {
        toast.success("Announcement updated");
        dispatch(getAnnouncements(teacherId));
        setShowModal(false);
      });
    } else {
      dispatch(createAnnouncement({
        teacherId,
        announcementData: formData
      })).then(() => {
        toast.success("Announcement created");
        dispatch(getAnnouncements(teacherId));
        setShowModal(false);
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-8 p-1">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-4 sm:px-0">
          <div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Bell size={20} />
              </div>
              Announcements
            </h3>
            <p className="text-sm text-slate-400 font-medium mt-1 ml-13 border-l-2 border-transparent pl-13">Manage important class communications.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center font-bold text-sm active:scale-95 gap-2"
          >
            <Bell size={18} />
            <span>Create Announcement</span>
          </button>
        </div>

        {/* SHOW ANNOUNCEMENTS */}
        {announcements.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50/50 rounded-3xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-6">
               <Bell className="text-indigo-400" size={36} />
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-2">No active announcements</h4>
            <p className="text-slate-400 font-bold text-sm max-w-sm leading-relaxed">Keep your students and parents informed by broadcasting your first message.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 px-4 sm:px-0">
            <AnimatePresence>
            {announcements.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 hover:border-indigo-100 transition-all duration-300 group">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                       <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg font-black flex items-center gap-1.5 ${a.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                        a.priority === 'Low' ? 'bg-slate-100 text-slate-600' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                        {a.priority === 'High' ? <AlertTriangle size={12} /> : a.priority === 'Low' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                        {a.priority}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <FileText size={12} />
                         {new Date(a.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors pr-8">{a.title}</h4>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 mt-4 text-sm whitespace-pre-wrap leading-relaxed max-w-4xl">{a.message}</p>

                {a.attachment && (
                  <div className="mt-5 inline-block">
                    <a
                      href={`${process.env.REACT_APP_API_URL}${a.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 px-4 py-2.5 rounded-xl border border-indigo-100 transition-all"
                    >
                      <Paperclip size={14} />
                      View Attachment
                    </a>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-slate-50 flex items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
                    Visible to: <span className="text-slate-700 ml-1">{a.class_section}</span>
                  </span>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto relative custom-scrollbar">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                {isEditing ? <Edit2 size={24} /> : <Bell size={24} />}
              </div>
              {isEditing ? 'Edit Announcement' : 'New Announcement'}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800 shadow-sm focus:shadow-md focus:shadow-indigo-100"
                  placeholder="e.g. Exam Schedule Release"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Message</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl outline-none transition-all resize-none text-sm font-medium text-slate-700 shadow-sm focus:shadow-md focus:shadow-indigo-100 leading-relaxed"
                  rows="5"
                  placeholder="Write your announcement here..."
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority</label>
                <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[20px] border border-slate-100 shadow-inner">
                  {['Low', 'Normal', 'High'].map((p) => (
                    <button
                      key={p}
                      onClick={(e) => { e.preventDefault(); setAnnouncementForm({ ...announcementForm, priority: p }); }}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${announcementForm.priority === p
                        ? p === 'High' ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : p === 'Low' ? 'bg-slate-500 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Attachment (Optional)</label>
                <div className="relative group cursor-pointer w-full text-center py-6 px-4 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 focus-within:border-indigo-500 rounded-2xl transition-all h-32 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-3 pointer-events-none">
                    <Paperclip className={`${attachment ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'} transition-colors`} size={28} />
                    <p className="text-xs font-bold text-slate-600">
                      {attachment ? attachment.name : isEditing ? 'Click to replace existing file' : 'Click to upload or drag & drop'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-black text-sm uppercase tracking-widest transition-all ring-1 ring-slate-200/50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAnnouncement}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? 'Processing...' : isEditing ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnnouncementsView;