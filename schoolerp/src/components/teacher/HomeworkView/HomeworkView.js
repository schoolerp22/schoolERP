import React, { useState,useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assignHomework,  getHomework } from '../../../feature/teachers/teacherSlice';

const HomeworkView = ({ selectedClass, teacherId, profile }) => {
  const dispatch = useDispatch();
  const { loading, homework } = useSelector((state) => state.teacher);

  useEffect(() => {
    if (teacherId) {
      dispatch(getHomework(teacherId)); // 🔥 REQUIRED
    }
  }, [teacherId, dispatch]);

  const [showModal, setShowModal] = useState(false);
  const [homeworkForm, setHomeworkForm] = useState({
    subject: '',
    topic: '',
    description: '',
    dueDate: ''
  });

  const submitHomework = () => {
    dispatch(assignHomework({
      teacherId,
      homeworkData: {
        ...homeworkForm,
        classSection: selectedClass,
        teacher: {
          id: teacherId,
          name: profile.personal_details.name
        }
      }
    })).then(() => {
      dispatch(getHomework(teacherId)); // 🔥 refresh list
    });

    setShowModal(false);
    setHomeworkForm({ subject: '', topic: '', description: '', dueDate: '' });
  };

  return (
 <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold">Homework Management</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Assign New Homework
          </button>
        </div>

        {/* 🔥 SHOW HOMEWORK */}
        {homework.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No homework assigned yet
          </p>
        ) : (
          <div className="space-y-4">
            {homework.map((hw) => (
              <div
                key={hw._id}
                className="border rounded-xl p-4"
              >
                <div className="flex justify-between">
                  <h4 className="font-semibold">
                    {hw.subject} — {hw.topic}
                  </h4>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {hw.status}
                  </span>
                </div>

                <p className="text-gray-600 mt-1">
                  {hw.description}
                </p>

                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                  <span>Class: {hw.class_section}</span>
                  <span>
                    Due: {new Date(hw.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Assign Homework</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={homeworkForm.subject}
                  onChange={(e) => setHomeworkForm({...homeworkForm, subject: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={homeworkForm.topic}
                  onChange={(e) => setHomeworkForm({...homeworkForm, topic: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({...homeworkForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={homeworkForm.dueDate}
                  onChange={(e) => setHomeworkForm({...homeworkForm, dueDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={submitHomework}
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

export default HomeworkView;