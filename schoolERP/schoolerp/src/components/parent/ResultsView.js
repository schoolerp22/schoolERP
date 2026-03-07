import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchResults } from "../../feature/parent/parentSlice";

const gradeColor = (g) => {
    if (!g) return "badge-gray";
    if (["A+", "A", "O"].includes(g)) return "badge-green";
    if (["B+", "B"].includes(g)) return "badge-blue";
    if (["C"].includes(g)) return "badge-orange";
    return "badge-red";
};

export default function ResultsView() {
    const dispatch = useDispatch();
    const { selectedChild, results } = useSelector(s => s.parent);

    useEffect(() => {
        if (!selectedChild) return;
        dispatch(fetchResults({ admissionNo: selectedChild.admission_no }));
    }, [selectedChild, dispatch]);

    if (!selectedChild) return null;
    const exams = results[selectedChild.admission_no] || [];

    return (
        <div>
            {exams.length === 0 ? (
                <div className="parent-empty-state">
                    <div className="parent-empty-icon">📝</div>
                    <h3>No results published</h3>
                    <p>Exam results for {selectedChild.name} will appear here once uploaded by the school.</p>
                </div>
            ) : (
                exams.map((exam, idx) => (
                    <div key={exam._id || idx} className="parent-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <div>
                                <h3 className="parent-card-title" style={{ margin: 0 }}>🎓 {exam.exam_name || exam.examType || "Exam"}</h3>
                                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                    Year: {exam.academic_year || "—"} · Class: {exam.class || selectedChild.class}
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                {exam.percentage !== undefined && (
                                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: exam.percentage >= 60 ? "#38a169" : "#e53e3e" }}>
                                        {exam.percentage}%
                                    </div>
                                )}
                                {exam.grade && <span className={`badge ${gradeColor(exam.grade)}`}>{exam.grade}</span>}
                            </div>
                        </div>

                        {/* Subject marks table */}
                        {(exam.subjects || exam.marks || []).length > 0 && (
                            <table className="parent-table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Marks Obtained</th>
                                        <th>Max Marks</th>
                                        <th>%</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(exam.subjects || exam.marks || []).map((s, i) => {
                                        const pct = s.maxMarks ? Math.round((s.marksObtained / s.maxMarks) * 100) : null;
                                        return (
                                            <tr key={i}>
                                                <td>{s.subject || s.subjectName}</td>
                                                <td style={{ fontWeight: 700 }}>{s.marksObtained ?? "—"}</td>
                                                <td>{s.maxMarks ?? "—"}</td>
                                                <td>{pct !== null ? `${pct}%` : "—"}</td>
                                                <td><span className={`badge ${gradeColor(s.grade)}`}>{s.grade || "—"}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {exam.totalMarks !== undefined && (
                                    <tfoot>
                                        <tr style={{ background: "#f8fafc" }}>
                                            <td style={{ fontWeight: 700 }}>Total</td>
                                            <td style={{ fontWeight: 700 }}>{exam.obtainedMarks ?? exam.totalObtained ?? "—"}</td>
                                            <td style={{ fontWeight: 700 }}>{exam.totalMarks ?? "—"}</td>
                                            <td style={{ fontWeight: 700 }}>{exam.percentage ?? "—"}%</td>
                                            <td><span className={`badge ${gradeColor(exam.grade)}`}>{exam.grade || "—"}</span></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        )}

                        <button
                            onClick={() => window.print()}
                            style={{ marginTop: "14px", padding: "7px 16px", borderRadius: "8px", border: "1px solid #cbd5e0", background: "#f8fafc", cursor: "pointer", fontSize: "0.8rem", color: "#475569" }}
                        >
                            🖨️ Print Report Card
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}
