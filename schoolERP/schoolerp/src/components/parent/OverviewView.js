import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAttendance, fetchFees } from "../../feature/parent/parentSlice";

export default function OverviewView() {
    const dispatch = useDispatch();
    const { selectedChild, attendance, fees } = useSelector(s => s.parent);

    useEffect(() => {
        if (!selectedChild) return;
        if (!attendance[selectedChild.admission_no]) dispatch(fetchAttendance({ admissionNo: selectedChild.admission_no }));
        if (!fees[selectedChild.admission_no]) dispatch(fetchFees(selectedChild.admission_no));
    }, [selectedChild, dispatch, attendance, fees]);

    if (!selectedChild) return null;
    const att = attendance[selectedChild.admission_no]?.summary || {};
    const feeData = fees[selectedChild.admission_no];

    return (
        <div>
            {/* Profile Banner */}
            <div className="parent-profile-card">
                <div className="parent-profile-avatar">{selectedChild.name?.[0] || "S"}</div>
                <div>
                    <div className="parent-profile-name">{selectedChild.name}</div>
                    <div className="parent-profile-sub">
                        Class {selectedChild.class} – Section {selectedChild.section}
                        {selectedChild.roll_no && ` · Roll No: ${selectedChild.roll_no}`}
                    </div>
                    <div className="parent-profile-sub">Adm. No: {selectedChild.admission_no}</div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="parent-stats-row">
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Attendance %</div>
                    <div className={`parent-stat-value ${att.percentage >= 75 ? "green" : "red"}`}>
                        {att.percentage ?? "—"}%
                    </div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Days Present</div>
                    <div className="parent-stat-value green">{att.present ?? "—"}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Days Absent</div>
                    <div className="parent-stat-value red">{att.absent ?? "—"}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Total Paid</div>
                    <div className="parent-stat-value blue">
                        ₹{(feeData?.summary?.totalPaid || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Recent Receipts */}
            {feeData?.receipts?.length > 0 && (
                <div className="parent-card">
                    <h3 className="parent-card-title">📋 Recent Payments</h3>
                    <table className="parent-table">
                        <thead>
                            <tr>
                                <th>Receipt No</th>
                                <th>Month</th>
                                <th>Mode</th>
                                <th>Amount Paid</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeData.receipts.slice(0, 5).map(r => (
                                <tr key={r._id}>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#3182ce" }}>{r.receiptNo}</td>
                                    <td>{(r.months || []).join(", ")}</td>
                                    <td>{r.paymentMode}</td>
                                    <td>₹{(r.amountPaid || r.totalAmount || 0).toLocaleString()}</td>
                                    <td><span className={`badge ${r.status === "paid" ? "badge-green" : "badge-orange"}`}>{r.status}</span></td>
                                    <td style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN") : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Ad-hoc fees pending */}
            {(feeData?.adhocFees || []).filter(f => !f.isPaid).length > 0 && (
                <div className="parent-card" style={{ border: "1px solid #fbd38d", background: "#fffff0" }}>
                    <h3 className="parent-card-title">⚠️ Pending Additional Charges</h3>
                    {feeData.adhocFees.filter(f => !f.isPaid).map(f => (
                        <div key={f._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #fefcbf" }}>
                            <span style={{ fontSize: "0.875rem" }}>{f.name} <span className="badge badge-orange">{f.category}</span></span>
                            <span style={{ fontWeight: 700 }}>₹{f.amount?.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
