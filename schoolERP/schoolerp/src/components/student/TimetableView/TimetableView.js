import React from "react";
import { Clock, User, Calendar, Coffee } from "lucide-react";
import "./TimetableView.css";

const TimetableView = ({ timetable }) => {
  if (!timetable || Object.keys(timetable).length === 0) {
    return (
      <div className="tt-empty-state">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-600">No timetable available</p>
        <p className="text-sm text-gray-400">Ask your class teacher to upload the schedule.</p>
      </div>
    );
  }

  // Ensure order of days
  const ORDERED_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sortedDays = ORDERED_DAYS.filter(day => timetable[day] && timetable[day].length > 0);

  const getDayColor = (day) => {
    const colors = {
      Monday: "blue",
      Tuesday: "emerald",
      Wednesday: "amber",
      Thursday: "purple",
      Friday: "rose",
      Saturday: "cyan"
    };
    return colors[day] || "indigo";
  };

  return (
    <div className="tt-container">
      <header className="tt-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Weekly Timetable</h2>
          <p className="text-gray-500">Your class schedule at a glance</p>
        </div>
        <div className="tt-legend">
          <span className="legend-item"><span className="dot class"></span> Class</span>
          <span className="legend-item"><span className="dot break"></span> Break</span>
        </div>
      </header>

      <div className="tt-grid">
        {sortedDays.map((day) => {
          const color = getDayColor(day);
          return (
            <div key={day} className={`tt-card ${color}-theme`}>
              <div className="tt-card-header">
                <h3 className="tt-day-name">{day}</h3>
                <span className="tt-period-count">{timetable[day].length} Periods</span>
              </div>

              <div className="tt-timeline">
                {timetable[day].map((period, i) => (
                  <div key={i} className={`tt-item ${period.type.toLowerCase()}`}>
                    <div className="tt-time-column">
                      <span className="tt-time-start">{period.startTime}</span>
                      <div className="tt-time-line"></div>
                      <span className="tt-time-end">{period.endTime}</span>
                    </div>

                    <div className="tt-content-card">
                      {period.type === 'Class' ? (
                        <>
                          <div className="tt-subject-row">
                            <h4 className="tt-subject-name">{period.subject}</h4>
                          </div>
                          <div className="tt-teacher-row">
                            <User size={14} className="icon-teacher" />
                            <span>{period.teacher}</span>
                          </div>
                        </>
                      ) : (
                        <div className="tt-break-content">
                          <Coffee size={16} className="icon-break" />
                          <span>{period.subject || period.type}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimetableView;
