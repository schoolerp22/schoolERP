import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitHomework, getStudentHomework } from "../../../feature/students/studentSlice";
import {  Download, Upload, CheckCircle, BookOpen } from 'lucide-react';
import "./HomeworkView.css";

const HomeworkView = ({ homework, studentId }) => {
  const dispatch = useDispatch();
  const [submittingId, setSubmittingId] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const { loading } = useSelector(state => state.student); // Assuming global student loading state handles this

  if (!homework || homework.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-10">
        <BookOpen size={48} className="text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-600">No homework assigned yet</p>
      </div>
    );
  }

  // Sort by due date (recent first)
  const sortedHomework = [...homework].sort(
    (a, b) => new Date(b.due_date) - new Date(a.due_date)
  );

  const API_Base = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSubmit = (hwId) => {
    if (!submissionFile && !submissionNote) return alert("Please add a note or attach a file.");

    const formData = new FormData();
    formData.append("note", submissionNote);
    if (submissionFile) {
      formData.append("attachment", submissionFile);
    }

    dispatch(submitHomework({ studentId, homeworkId: hwId, submissionData: formData }))
      .then(() => {
        alert("Homework Submitted Successfully!");
        setSubmittingId(null);
        setSubmissionFile(null);
        setSubmissionNote("");

        // Refresh the homework list to show "Submitted" status immediately
        dispatch(getStudentHomework(studentId));
      });
  };

  return (
    <div className="homework-container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">📘 Homework Assigned</h2>
      </div>

      <div className="homework-grid">
        {sortedHomework.map((hw) => (
          <div key={hw._id} className="homework-card">
            <div className="card-header">
              <span className="subject">{hw.subject}</span>
              <span className={`status ${hw.status.toLowerCase()}`}>
                {hw.status}
              </span>
            </div>

            <h3 className="topic">{hw.topic}</h3>
            <p className="description">{hw.description}</p>

            {hw.attachment && (
              <a
                href={`${API_Base}${hw.attachment}`}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
              >
                <Download size={14} /> Download Attachment
              </a>
            )}

            <div className="card-footer">
              <span>🏫 Class: {hw.class_section}</span>
              <span>👨‍🏫 {hw.teacher?.name}</span>
            </div>

            <div className="submission-section">
              {hw.submission ? (
                <div className="submitted-badge">
                  <CheckCircle size={16} /> Submitted
                </div>
              ) : submittingId === hw._id ? (
                <div className="submission-form">
                  <input
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                    className="file-input"
                  />
                  <input
                    type="text"
                    placeholder="Add a note (optional)"
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    className="note-input"
                  />
                  <div className="form-actions">
                    <button onClick={() => handleSubmit(hw._id)} disabled={loading} className="btn-submit">
                      {loading ? 'Uploading...' : 'Submit'}
                    </button>
                    <button onClick={() => setSubmittingId(null)} className="btn-cancel">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSubmittingId(hw._id)} className="btn-open-submit">
                  <Upload size={14} /> Submit Homework
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeworkView;
