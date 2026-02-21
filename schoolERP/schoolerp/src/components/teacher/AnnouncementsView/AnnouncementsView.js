import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } from '../../../feature/teachers/teacherSlice';
import { Edit2, Trash2, Paperclip, FileText, Check, X } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-transparent sm:bg-white sm:rounded-xl sm:shadow-sm sm:border sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between mb-2 sm:mb-4 gap-4 px-4 sm:px-0">
          <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center justify-center font-semibold shadow-sm active:scale-95 transition-all gap-2"
          >
            <span>+ Create Announcement</span>
          </button>
        </div>

        {/* SHOW ANNOUNCEMENTS */}
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center mx-4 sm:mx-0 shadow-sm">
            <p className="text-gray-500 font-medium">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 px-4 sm:px-0">
            {announcements.map((a) => (
              <div key={a._id} className="bg-white border border-gray-100 sm:border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{a.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.priority === 'High' ? 'bg-red-100 text-red-700' :
                      a.priority === 'Low' ? 'bg-gray-100 text-gray-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                      {a.priority}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 mt-2 text-sm whitespace-pre-wrap">{a.message}</p>

                {a.attachment && (
                  <div className="mt-3">
                    <a
                      href={`${process.env.REACT_APP_API_URL}${a.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition"
                    >
                      <Paperclip size={14} />
                      View Attachment
                    </a>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="bg-white px-2 py-1 rounded border border-gray-200">
                    To: {a.class_section}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 animate-in fade-in duration-200 block">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
              {isEditing ? <Edit2 size={24} className="text-indigo-600" /> : <FileText size={24} className="text-indigo-600" />}
              {isEditing ? 'Edit Announcement' : 'Create Announcement'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="e.g. Exam Schedule Release"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                  rows="4"
                  placeholder="Write your announcement here..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <div className="flex gap-2">
                  {['Low', 'Normal', 'High'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setAnnouncementForm({ ...announcementForm, priority: p })}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition ${announcementForm.priority === p
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
                />
                {isEditing && !attachment && (
                  <p className="text-xs text-gray-500 mt-1 italic">Leave empty to keep existing file (if any)</p>
                )}
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition flex justify-center items-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={submitAnnouncement}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-sm disabled:opacity-50 transition flex justify-center items-center gap-2"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Check size={18} />
                      {isEditing ? 'Update' : 'Publish'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsView;