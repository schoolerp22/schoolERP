import React from "react";
import "./HomeworkView.css";

const HomeworkView = ({ homework }) => {
  if (!homework || homework.length === 0) {
    return <p className="empty-text">No homework assigned</p>;
  }

  // Sort by due date (recent first)
  const sortedHomework = [...homework].sort(
    (a, b) => new Date(b.due_date) - new Date(a.due_date)
  );

  // Group by due date
  const groupedByDate = sortedHomework.reduce((acc, item) => {
    const dateKey = new Date(item.due_date).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  return (
    <div className="homework-container">
      <h2 className="page-title">📘 Homework Assigned</h2>

      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date} className="date-group">
          <h4 className="date-heading">{date}</h4>

          {items.map((hw) => (
            <div key={hw._id} className="homework-card">
              <div className="card-header">
                <span className="subject">{hw.subject}</span>
                <span className={`status ${hw.status.toLowerCase()}`}>
                  {hw.status}
                </span>
              </div>

              <h3 className="topic">{hw.topic}</h3>

              <p className="description">{hw.description}</p>

              <div className="card-footer">
                <span>🏫 Class: {hw.class_section}</span>
                <span>👨‍🏫 {hw.teacher?.name}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default HomeworkView;
