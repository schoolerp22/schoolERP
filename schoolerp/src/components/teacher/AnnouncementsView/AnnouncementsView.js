import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAnnouncement , getAnnouncements} from '../../../feature/teachers/teacherSlice';

const AnnouncementsView = ({ selectedClass, teacherId, profile }) => {
 const dispatch = useDispatch();
  const { loading, announcements } = useSelector((state) => state.teacher);

  useEffect(() => {
    if (teacherId) {
      dispatch(getAnnouncements(teacherId)); // ✅ REQUIRED
    }
  }, [teacherId, dispatch]);

  const [showModal, setShowModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'Normal'
  });

  const submitAnnouncement = () => {
    dispatch(createAnnouncement({
      teacherId,
      announcementData: {
        ...announcementForm,
        classSection: selectedClass,
        teacher: {
          id: teacherId,
          name: profile.personal_details.name
        }
      }
    })).then(() => {
      dispatch(getAnnouncements(teacherId)); // 🔥 refresh list
    });

    setShowModal(false);
    setAnnouncementForm({ title: '', message: '', priority: 'Normal' });
  };
  return (
     <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold">Announcements</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Create Announcement
          </button>
        </div>

        {/* 🔥 SHOW ANNOUNCEMENTS */}
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No announcements yet
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div key={a._id} className="border rounded-xl p-4">
                <div className="flex justify-between">
                  <h4 className="font-semibold">{a.title}</h4>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {a.priority}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{a.message}</p>
                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                  <span>{a.class_section}</span>
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={submitAnnouncement}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
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