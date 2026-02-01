import React from "react";
import "./TimetableView.css";

const TimetableView = ({ timetable }) => {
  if (!timetable || typeof timetable !== "object") {
    return <p className="empty-text">No timetable available</p>;
  }

  return (
    <section className="tt-wrapper">
      <header className="tt-header">
        <h2>Weekly Timetable</h2>
        <p>Class schedule overview</p>
      </header>

      <div className="tt-grid">
        {timetable && Object.entries(timetable).map(([day, periods]) => (
          <article key={day} className="tt-day">
            <h3 className="tt-day-title">{day}</h3>

            {Array.isArray(periods) ? (
              periods.map((p, i) => (
                <div key={i} className="tt-period">
                  <span className="tt-time">{p.time}</span>

                  <div className="tt-info">
                    <span className="tt-subject">{p.subject}</span>
                    <span className="tt-teacher">
                      {p.teacher?.name}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic p-4 text-center">No classes scheduled</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default TimetableView;
