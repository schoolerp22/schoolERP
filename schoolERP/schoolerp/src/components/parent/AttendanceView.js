import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAttendance } from "../../feature/parent/parentSlice";


export default function AttendanceView() {
    const dispatch = useDispatch();
    const { selectedChild, attendance } = useSelector(s => s.parent);
    const [activeMonth, setActiveMonth] = useState(null);

    useEffect(() => {
        if (!selectedChild) return;
        dispatch(fetchAttendance({ admissionNo: selectedChild.admission_no }));
    }, [selectedChild, dispatch]);

    if (!selectedChild) return null;

    const data = attendance[selectedChild.admission_no] || {};
    const { records = [], summary = {} } = data;

    // Group records by month
    const byMonth = records.reduce((acc, r) => {
        const m = r.date?.slice(0, 7); // YYYY-MM
        if (!acc[m]) acc[m] = [];
        acc[m].push(r);
        return acc;
    }, {});

    const months = Object.keys(byMonth).sort().reverse();

    const monthToDisplay = activeMonth || months[0];
    const monthRecords = byMonth[monthToDisplay] || [];

    // Build calendar grid for that month
    const buildGrid = (monthKey, records) => {
        if (!monthKey) return [];
        const [y, m] = monthKey.split("-").map(Number);
        const firstDay = new Date(y, m - 1, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(y, m, 0).getDate();
        const grid = [];
        // Leading empty cells
        for (let i = 0; i < firstDay; i++) grid.push({ empty: true });
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const rec = records.find(r => r.date && r.date.startsWith(dateStr));
            grid.push({ day: d, status: rec?.status || null, date: dateStr });
        }
        return grid;
    };

    const grid = buildGrid(monthToDisplay, monthRecords);

    return (
        <div>
            {/* Summary */}
            <div className="parent-stats-row">
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Total Days</div>
                    <div className="parent-stat-value blue">{summary.total ?? "—"}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Present</div>
                    <div className="parent-stat-value green">{summary.present ?? "—"}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Absent</div>
                    <div className="parent-stat-value red">{summary.absent ?? "—"}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Attendance %</div>
                    <div className={`parent-stat-value ${(summary.percentage ?? 0) >= 75 ? "green" : "red"}`}>
                        {summary.percentage ?? "—"}%
                    </div>
                </div>
            </div>

            {/* Month tabs */}
            {months.length > 0 && (
                <div className="parent-card">
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                        {months.map(m => (
                            <button
                                key={m}
                                onClick={() => setActiveMonth(m)}
                                style={{
                                    padding: "5px 14px", borderRadius: "20px", border: "2px solid",
                                    borderColor: m === (activeMonth || months[0]) ? "#4299e1" : "#e2e8f0",
                                    background: m === (activeMonth || months[0]) ? "#ebf8ff" : "#f8fafc",
                                    color: m === (activeMonth || months[0]) ? "#2b6cb0" : "#64748b",
                                    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer"
                                }}
                            >
                                {new Date(m + "-01").toLocaleString("default", { month: "short", year: "2-digit" })}
                            </button>
                        ))}
                    </div>

                    <h3 className="parent-card-title" style={{ margin: "0 0 12px" }}>
                        📅 {monthToDisplay ? new Date(monthToDisplay + "-01").toLocaleString("default", { month: "long", year: "numeric" }) : "Attendance Calendar"}
                    </h3>

                    {/* Day headers */}
                    <div className="attendance-calendar">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", padding: "4px" }}>{d}</div>
                        ))}
                        {grid.map((cell, i) => {
                            if (cell.empty) return <div key={i} className="att-day empty" />;
                            return (
                                <div key={i} title={cell.date}
                                    className={`att-day ${cell.status === "Present" ? "present" : cell.status === "Absent" ? "absent" : "holiday"}`}>
                                    {cell.day}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: "flex", gap: "20px", marginTop: "16px", fontSize: "0.78rem" }}>
                        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#c6f6d5", borderRadius: 3, marginRight: 4 }} />Present</span>
                        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#fed7d7", borderRadius: 3, marginRight: 4 }} />Absent</span>
                        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#e2e8f0", borderRadius: 3, marginRight: 4 }} />Holiday/No Class</span>
                    </div>
                </div>
            )}

            {/* Recent records table */}
            {monthRecords.length > 0 && (
                <div className="parent-card">
                    <h3 className="parent-card-title">📋 Daily Records</h3>
                    <table className="parent-table">
                        <thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead>
                        <tbody>
                            {monthRecords.sort((a, b) => b.date?.localeCompare(a.date))
                                .map(r => (
                                    <tr key={r._id || r.date}>
                                        <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                                        <td>{new Date(r.date).toLocaleString("default", { weekday: "short" })}</td>
                                        <td><span className={`badge ${r.status === "Present" ? "badge-green" : "badge-red"}`}>{r.status}</span></td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}

            {records.length === 0 && (
                <div className="parent-empty-state">
                    <div className="parent-empty-icon">📅</div>
                    <h3>No attendance data</h3>
                    <p>Attendance records for {selectedChild.name} will appear here once added by the school.</p>
                </div>
            )}
        </div>
    );
}
