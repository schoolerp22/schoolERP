import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFees, fetchReceipts, createPaymentOrder, verifyPayment, clearParentError, clearPaymentOrder } from "../../feature/parent/parentSlice";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Eye, Printer, Download, X } from "lucide-react";
import "../accountant/Receipt/ReceiptView.css";

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

export default function FeesView() {
    const dispatch = useDispatch();
    const { selectedChild, fees, receipts, loading, error, success } = useSelector(s => s.parent);
    const { user } = useSelector(s => s.auth);

    const [selectedMonths, setSelectedMonths] = useState([]);
    const [selectedAdhoc, setSelectedAdhoc] = useState([]);
    const [selectedOneTime, setSelectedOneTime] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Calculate current academic year for the default filter
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentAcademicStart = currentMonth < 3 ? currentYear - 1 : currentYear;
    const defaultAcademicYear = `${currentAcademicStart}-${currentAcademicStart + 1}`;

    const [selectedYear, setSelectedYear] = useState(defaultAcademicYear);
    const [viewingReceipt, setViewingReceipt] = useState(null);
    const [viewingBreakdown, setViewingBreakdown] = useState(null);
    const [schoolSettings, setSchoolSettings] = useState({});
    const [isThermal, setIsThermal] = useState(false);

    // Reference for printing
    const receiptRef = useRef();

    const token = localStorage.getItem("token"); // Get token once

    useEffect(() => {
        if (!selectedChild) return;
        dispatch(fetchFees(selectedChild.admission_no));
        dispatch(fetchReceipts(selectedChild.admission_no));
    }, [selectedChild, dispatch]);

    // Fetch school settings for receipt header
    useEffect(() => {
        const fetchSettings = () => {
            if (!token) return;
            fetch(`${API_BASE}/api/admin/school-settings`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : {})
                .then(data => setSchoolSettings(data || {}))
                .catch(() => { });
        };
        fetchSettings();
    }, [token]);

    const handleViewReceipt = (receipt) => {
        setViewingReceipt(receipt);
        // If settings are missing, try one last fetch
        if (!schoolSettings.schoolName) {
            fetch(`${API_BASE}/api/admin/school-settings`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : {})
                .then(data => setSchoolSettings(data || {}))
                .catch(() => { });
        }
    };

    const feeData = fees[selectedChild?.admission_no] || {};
    const studentReceipts = receipts[selectedChild?.admission_no] || [];
    const pendingDues = (feeData.dues || []).filter(d => !d.isPaid && d.totalDue > 0);
    const pendingAdhoc = (feeData.adhocFees || []).filter(f => !f.isPaid);
    const pendingOneTime = (feeData.oneTimeFees || []).filter(f => !f.isPaid);

    const selectedDues = pendingDues.filter(d => selectedMonths.includes(d.monthKey));
    const selectedAdhocItems = pendingAdhoc.filter(f => selectedAdhoc.includes(String(f._id)));
    const selectedOneTimeItems = pendingOneTime.filter(f => selectedOneTime.includes(f.name));

    const monthlyTotal = selectedDues.reduce((sum, d) => sum + d.totalDue, 0);
    const adhocTotal = selectedAdhocItems.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const oneTimeTotal = selectedOneTimeItems.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const combinedTotal = monthlyTotal + adhocTotal + oneTimeTotal;
    const hasSelection = selectedMonths.length > 0 || selectedAdhoc.length > 0 || selectedOneTime.length > 0;

    // Filter receipts by academic year
    const filteredReceipts = studentReceipts.filter(r => {
        if (!r.paidAt) return false;
        const [startYearStr, endYearStr] = selectedYear.split('-');
        const filterStart = new Date(parseInt(startYearStr), 3, 1); // April 1st of start year
        const filterEnd = new Date(parseInt(endYearStr), 2, 31, 23, 59, 59); // March 31st of end year
        const paidDate = new Date(r.paidAt);
        return paidDate >= filterStart && paidDate <= filterEnd;
    });

    // Generate academic year options for dropdown (e.g., past 3 years + current)
    const yearOptions = Array.from({ length: 4 }, (_, i) => {
        const startY = currentAcademicStart - i;
        return `${startY}-${startY + 1}`;
    });

    // Build structured fee breakdown for receipt
    const buildFeeBreakdown = () => {
        const breakdown = {};
        selectedDues.forEach(due => {
            (due.feeBreakdown || []).forEach(h => {
                if (h.remainingAmount > 0) {
                    breakdown[h.name] = (breakdown[h.name] || 0) + Number(h.remainingAmount);
                }
            });
        });
        selectedAdhocItems.forEach(f => {
            breakdown[f.name] = (breakdown[f.name] || 0) + Number(f.amount || 0);
        });
        selectedOneTimeItems.forEach(f => {
            breakdown[f.name] = (breakdown[f.name] || 0) + Number(f.amount || 0);
        });
        return Object.entries(breakdown).map(([name, amount]) => ({ name, headName: name, amount }));
    };

    const handlePay = async () => {
        if (combinedTotal <= 0) return;

        const result = await dispatch(createPaymentOrder({
            amount: combinedTotal,
            admissionNo: selectedChild.admission_no,
            description: "School Fee Payment",
        }));

        if (!result.payload?.orderId) return;
        const order = result.payload;

        const loaded = await loadRazorpayScript();
        if (!loaded) { alert("Failed to load Razorpay. Please check your internet connection."); return; }

        const feeBreakdown = buildFeeBreakdown();

        const options = {
            key: order.key,
            amount: order.amount,
            currency: order.currency,
            order_id: order.orderId,
            name: "School ERP",
            description: "School Fee Payment",
            theme: { color: "#3b82f6" },
            prefill: { name: user?.name || selectedChild.name },
            handler: async (response) => {
                try {
                    await dispatch(verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        admissionNo: selectedChild.admission_no,
                        amountPaid: combinedTotal,
                        feeBreakdown,
                        months: selectedMonths,
                        paymentMode: "Online (Razorpay)",
                    })).unwrap(); // IMPORTANT: unwrap to catch backend rejections
                    setSelectedMonths([]);
                    setSelectedAdhoc([]);
                    setSelectedOneTime([]);
                    setShowConfirmModal(false);
                    dispatch(fetchFees(selectedChild.admission_no));
                    dispatch(fetchReceipts(selectedChild.admission_no));
                } catch (err) {
                    // Error is caught and stored in Redux state by slice, but we need
                    // to close the modal to show the error banner
                    setShowConfirmModal(false);
                }
            },
        };

        setShowConfirmModal(false);
        dispatch(clearPaymentOrder());
        new window.Razorpay(options).open();
    };

    const toggleMonth = (monthKey) =>
        setSelectedMonths(prev => prev.includes(monthKey) ? prev.filter(m => m !== monthKey) : [...prev, monthKey]);

    const toggleAdhoc = (id) =>
        setSelectedAdhoc(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleOneTime = (name) =>
        setSelectedOneTime(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${viewingReceipt?.receiptNo}`,
    });

    const handleDownloadPDF = async () => {
        if (!viewingReceipt || !receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let yPos = 0;
            let remainingHeight = imgHeight;
            while (remainingHeight > 0) {
                pdf.addImage(imgData, "PNG", 0, yPos === 0 ? 0 : -pageHeight * (imgHeight / remainingHeight), imgWidth, imgHeight);
                remainingHeight -= pageHeight;
                if (remainingHeight > 0) {
                    pdf.addPage();
                    yPos += pageHeight;
                }
            }
            pdf.save(`Receipt_${viewingReceipt.receiptNo}.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("Could not generate PDF. Try the Print button instead.");
        }
    };

    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Rupees Zero Only';
        const n = Math.floor(Math.abs(num));
        if (n < 20) return `Rupees ${ones[n]} Only`;
        if (n < 100) return `Rupees ${tens[Math.floor(n / 10)]} ${ones[n % 10]} Only`.trim();
        if (n < 1000) return `Rupees ${ones[Math.floor(n / 100)]} Hundred ${n % 100 > 0 ? (n % 100 < 20 ? ones[n % 100] : tens[Math.floor((n % 100) / 10)] + ' ' + ones[n % 10]) : ''} Only`.trim();
        return `Rupees ${num.toLocaleString()} Only`;
    };

    if (!selectedChild) return null;

    const categoryColor = (cat) => {
        const map = { Fine: "#ef4444", Activity: "#8b5cf6", Program: "#3b82f6", Other: "#64748b" };
        return map[cat] || "#64748b";
    };

    return (
        <div>
            {/* Toast */}
            {success && (
                <div style={{ background: "#c6f6d5", color: "#276749", padding: "12px 20px", borderRadius: "10px", marginBottom: "16px", fontWeight: 600 }}>
                    ✅ {success}
                    <button onClick={() => dispatch(clearParentError())} style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                </div>
            )}
            {error && (
                <div style={{ background: "#fed7d7", color: "#9b2c2c", padding: "12px 20px", borderRadius: "10px", marginBottom: "16px", fontWeight: 600 }}>
                    ❌ {error}
                    <button onClick={() => dispatch(clearParentError())} style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="parent-stats-row">
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Total Paid</div>
                    <div className="parent-stat-value green">₹{(feeData.summary?.totalPaid || 0).toLocaleString()}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Pending Months</div>
                    <div className="parent-stat-value orange">{pendingDues.length}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Extra Charges</div>
                    <div className="parent-stat-value red">{pendingAdhoc.length + pendingOneTime.length}</div>
                </div>
                <div className="parent-stat-card">
                    <div className="parent-stat-label">Receipts</div>
                    <div className="parent-stat-value blue">{studentReceipts.length}</div>
                </div>
            </div>

            {/* ── Selection Summary Bar ── */}
            {hasSelection && (
                <div style={{
                    background: "#1e293b", color: "#fff", borderRadius: "12px",
                    padding: "14px 20px", marginBottom: "16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px"
                }}>
                    <div style={{ fontSize: "0.875rem" }}>
                        {selectedMonths.length > 0 && <span>📅 <b>{selectedMonths.length}</b> month(s)&nbsp;&nbsp;</span>}
                        {selectedAdhoc.length > 0 && <span>⚠️ <b>{selectedAdhoc.length}</b> charge(s)&nbsp;&nbsp;</span>}
                        {selectedOneTime.length > 0 && <span>📦 <b>{selectedOneTime.length}</b> one-time fee(s)&nbsp;&nbsp;</span>}
                        <span style={{ color: "#94a3b8" }}>Total: </span>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#60a5fa" }}>₹{combinedTotal.toLocaleString()}</span>
                    </div>
                    <button className="parent-pay-btn" onClick={() => setShowConfirmModal(true)} disabled={loading}>
                        💳 Pay Now — ₹{combinedTotal.toLocaleString()}
                    </button>
                </div>
            )}

            {/* ── Pending Monthly Fees ── */}
            {pendingDues.length > 0 && (
                <div className="parent-card">
                    <h3 className="parent-card-title">📅 Pending Monthly Fees</h3>
                    <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "14px" }}>
                        Select months to pay. Tick additional charges below and pay everything together in one step.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {pendingDues.map(due => (
                            <label key={due.monthKey} style={{
                                display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 16px",
                                borderRadius: "10px",
                                border: selectedMonths.includes(due.monthKey) ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                                background: selectedMonths.includes(due.monthKey) ? "#eff6ff" : "#f8fafc",
                                cursor: "pointer"
                            }}>
                                <input type="checkbox" checked={selectedMonths.includes(due.monthKey)}
                                    onChange={() => toggleMonth(due.monthKey)}
                                    style={{ width: 16, height: 16, accentColor: "#3b82f6", marginTop: 2, cursor: "pointer" }} />
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>{due.label}</span>
                                    <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {(due.feeBreakdown || []).filter(h => h.remainingAmount > 0).map((h, i) => (
                                            <span key={i} style={{
                                                background: "#f1f5f9", borderRadius: "6px", padding: "2px 8px",
                                                fontSize: "0.72rem", color: "#475569", fontWeight: 500
                                            }}>
                                                {h.name}: <b>₹{Number(h.remainingAmount).toLocaleString()}</b>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span style={{ fontWeight: 800, color: "#e07014", fontSize: "1rem", whiteSpace: "nowrap" }}>
                                    ₹{Number(due.totalDue).toLocaleString()}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Additional Charges ── */}
            {pendingAdhoc.length > 0 && (
                <div className="parent-card" style={{ border: "1px solid #fcd34d" }}>
                    <h3 className="parent-card-title">⚠️ Additional Charges</h3>
                    <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "14px" }}>
                        Select charges to add to your payment.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {pendingAdhoc.map(f => (
                            <label key={f._id} style={{
                                display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                                borderRadius: "10px",
                                border: selectedAdhoc.includes(String(f._id)) ? "2px solid #f59e0b" : "1px solid #fef3c7",
                                background: selectedAdhoc.includes(String(f._id)) ? "#fffbeb" : "#fefce8",
                                cursor: "pointer"
                            }}>
                                <input type="checkbox" checked={selectedAdhoc.includes(String(f._id))}
                                    onChange={() => toggleAdhoc(String(f._id))}
                                    style={{ width: 16, height: 16, accentColor: "#f59e0b", cursor: "pointer" }} />
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{f.name}</span>
                                    <div style={{ marginTop: "4px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                        <span style={{
                                            background: categoryColor(f.category) + "22",
                                            color: categoryColor(f.category),
                                            border: `1px solid ${categoryColor(f.category)}44`,
                                            borderRadius: "6px", padding: "2px 8px",
                                            fontSize: "0.72rem", fontWeight: 600
                                        }}>{f.category || "Other"}</span>
                                        {f.frequency && f.frequency !== "One-time" && (
                                            <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: "6px", padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                                                {f.frequency}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontWeight: 800, color: "#b45309", fontSize: "1rem" }}>₹{Number(f.amount || 0).toLocaleString()}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* ── One-Time Fees ── */}
            {pendingOneTime.length > 0 && (
                <div className="parent-card" style={{ border: "1px solid #c4b5fd" }}>
                    <h3 className="parent-card-title" style={{ color: "#6d28d9" }}>📦 One-Time Fees</h3>
                    <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "14px" }}>
                        Standard one-time fees applicable for the academic year.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {pendingOneTime.map((f, i) => (
                            <label key={i} style={{
                                display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                                borderRadius: "10px",
                                border: selectedOneTime.includes(f.name) ? "2px solid #8b5cf6" : "1px solid #ede9fe",
                                background: selectedOneTime.includes(f.name) ? "#f5f3ff" : "#faf5ff",
                                cursor: "pointer"
                            }}>
                                <input type="checkbox" checked={selectedOneTime.includes(f.name)}
                                    onChange={() => toggleOneTime(f.name)}
                                    style={{ width: 16, height: 16, accentColor: "#8b5cf6", cursor: "pointer" }} />
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 700, color: "#4c1d95" }}>{f.name}</span>
                                    <div style={{ marginTop: "4px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                        <span style={{
                                            background: "#ede9fe",
                                            color: "#6d28d9",
                                            borderRadius: "6px", padding: "2px 8px",
                                            fontSize: "0.72rem", fontWeight: 600
                                        }}>One-time</span>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 800, color: "#5b21b6", fontSize: "1rem" }}>₹{Number(f.amount || 0).toLocaleString()}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Fee Structure ── */}
            {feeData.feeStructure?.feeHeads?.length > 0 && (
                <div className="parent-card">
                    <h3 className="parent-card-title">📄 Fee Structure – Class {selectedChild.class}</h3>
                    <table className="parent-table">
                        <thead><tr><th>Fee Head</th><th>Frequency</th><th>Amount</th></tr></thead>
                        <tbody>
                            {feeData.feeStructure.feeHeads.map((h, i) => (
                                <tr key={i}>
                                    <td>{h.name}</td>
                                    <td><span className="badge badge-blue">{h.frequency}</span></td>
                                    <td style={{ fontWeight: 700 }}>₹{Number(h.amount || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Payment History ── */}
            {studentReceipts.length > 0 && (
                <div className="parent-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h3 className="parent-card-title">📋 Payment History</h3>
                            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "-12px", marginBottom: "14px" }}>
                                Class: <strong>{selectedChild.class}</strong> | Sec: <strong>{selectedChild.section || "—"}</strong>
                            </p>
                        </div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                fontSize: "0.875rem",
                                color: "#0f172a",
                                outline: "none",
                                cursor: "pointer"
                            }}
                        >
                            <option value="">All Years</option>
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table className="parent-table">
                            <thead>
                                <tr>
                                    <th>Receipt No</th>
                                    <th>Month(s)</th>
                                    <th>Paid</th>
                                    <th>Mode</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: "right" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReceipts.length > 0 ? filteredReceipts.map(r => (
                                    <tr key={r._id}>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#3182ce" }}>{r.receiptNo}</td>
                                        <td>{(r.months || []).join(", ") || "—"}</td>
                                        <td
                                            onClick={() => setViewingBreakdown(r)}
                                            style={{ fontWeight: 700, color: "#16a34a", cursor: "pointer", textDecoration: "underline" }}
                                        >
                                            ₹{(r.amountPaid || r.totalAmount || 0).toLocaleString()}
                                        </td>
                                        <td>{r.paymentMode}</td>
                                        <td><span className={`badge ${r.status === "paid" ? "badge-green" : "badge-orange"}`}>{r.status}</span></td>
                                        <td style={{ fontSize: "0.77rem", color: "#94a3b8" }}>
                                            {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN") : "—"}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <button
                                                onClick={() => handleViewReceipt(r)}
                                                className="receipt-view-btn"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "6px 14px",
                                                    borderRadius: "8px",
                                                    background: "#eff6ff",
                                                    color: "#3b82f6",
                                                    border: "1px solid #3b82f6",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                                            No receipts found for {selectedYear}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Receipt View Modal ── */}
            {viewingReceipt && (
                <div className="receipt-modal-overlay" style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 10000, padding: "20px"
                }}>
                    <div className="receipt-modal-container">
                        <div className="receipt-modal-header">
                            <h3>View Receipt</h3>
                            <div className="receipt-actions">
                                <button onClick={() => setIsThermal(!isThermal)} className="action-btn-secondary">
                                    Toggle Format ({isThermal ? "Thermal" : "A4"})
                                </button>
                                <button onClick={handleDownloadPDF} className="action-btn-secondary">
                                    <Download size={16} /> PDF
                                </button>
                                <button onClick={handlePrint} className="action-btn-primary">
                                    <Printer size={16} /> Print
                                </button>
                                <button onClick={() => setViewingReceipt(null)} className="close-modal-btn">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="receipt-modal-body">
                            {/* PRINTABLE AREA */}
                            <div
                                className={`receipt-print-area ${isThermal ? "thermal-format" : "a4-format"}`}
                                ref={receiptRef}
                                style={{
                                    fontFamily: "'Times New Roman', Times, serif",
                                    background: "#fff",
                                    padding: "20px",
                                    maxWidth: "520px",
                                    margin: "0 auto",
                                    border: "1px solid #94a3b8",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                                    color: "#000"
                                }}
                            >
                                <style>{`
                                    .receipt-print-area table tr.total-row { background-color: #f1f5f9 !important; }
                                    .receipt-print-area table tr.paid-row { background-color: #dcfce7 !important; }
                                    .receipt-print-area table tr.due-row { background-color: #fee2e2 !important; }
                                    @media print {
                                        .receipt-print-area { box-shadow: none !important; border: 1px solid #000 !important; width: 100% !important; max-width: 100% !important; }
                                    }
                                `}</style>
                                {/* School Header */}
                                <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "8px" }}>
                                    {(schoolSettings.phone || schoolSettings.phone2) && (
                                        <div style={{ fontSize: "11px", textAlign: "right", marginBottom: "2px" }}>
                                            Mob.: {[schoolSettings.phone, schoolSettings.phone2].filter(Boolean).join(", ")}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
                                        {schoolSettings.logo ? (
                                            <img
                                                src={`${API_BASE}${schoolSettings.logo}`}
                                                alt="School Logo"
                                                style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid #000", flexShrink: 0 }}
                                            />
                                        ) : (
                                            <div style={{ width: "60px", height: "60px", border: "2px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", flexShrink: 0 }}>
                                                LOGO
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontSize: "26px", fontWeight: "bold", letterSpacing: "1px" }}>
                                                {schoolSettings.schoolName || "School Name"}
                                            </div>
                                            <div style={{ fontSize: "12px" }}>
                                                {[schoolSettings.address1, schoolSettings.address2, schoolSettings.city, schoolSettings.state, schoolSettings.postalCode]
                                                    .filter(Boolean).join(", ")}
                                            </div>
                                            {(schoolSettings.email || schoolSettings.website) && (
                                                <div style={{ fontSize: "11px", color: "#444" }}>
                                                    {schoolSettings.email}{schoolSettings.email && schoolSettings.website ? " | " : ""}{schoolSettings.website}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Receipt No & Date Row */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderBottom: "1px solid #666", paddingBottom: "6px" }}>
                                    <div style={{ fontSize: "13px" }}>
                                        <strong>No.</strong>{" "}
                                        <span style={{ borderBottom: "1px dotted #000", minWidth: "80px", display: "inline-block", paddingRight: "8px" }}>
                                            {viewingReceipt.receiptNo}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: "bold", letterSpacing: "1px" }}>
                                        FEE RECEIPT {viewingReceipt.status === "partial" && <span style={{ color: "#dc2626", fontSize: "11px" }}>(PARTIAL)</span>}
                                    </div>
                                    <div style={{ fontSize: "13px" }}>
                                        <strong>Date:</strong>{" "}
                                        <span style={{ borderBottom: "1px dotted #000", minWidth: "90px", display: "inline-block", paddingRight: "8px" }}>
                                            {viewingReceipt.paidAt ? new Date(viewingReceipt.paidAt).toLocaleDateString("en-IN") : "-"}
                                        </span>
                                    </div>
                                </div>

                                {/* Student Details */}
                                <div style={{ marginBottom: "5px", fontSize: "13px" }}>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                                        <span><strong>Name of Student:</strong></span>
                                        <span style={{ flex: 1, borderBottom: "1px dotted #000" }}>{selectedChild.name}</span>
                                        <span><strong>Adm. No:</strong></span>
                                        <span style={{ minWidth: "80px", borderBottom: "1px dotted #000" }}>{selectedChild.admission_no}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                                        <span><strong>Class:</strong></span>
                                        <span style={{ minWidth: "60px", borderBottom: "1px dotted #000" }}>{selectedChild.class || "-"}</span>
                                        <span><strong>Sec:</strong></span>
                                        <span style={{ minWidth: "50px", borderBottom: "1px dotted #000" }}>{selectedChild.section || "-"}</span>
                                        <span><strong>Roll No:</strong></span>
                                        <span style={{ minWidth: "60px", borderBottom: "1px dotted #000" }}>{selectedChild.rollNo || "-"}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                                        <span><strong>For the Month of:</strong></span>
                                        <span style={{ flex: 1, borderBottom: "1px dotted #000" }}>
                                            {(() => {
                                                const months = viewingReceipt.months || (viewingReceipt.monthKey ? [viewingReceipt.monthKey] : []);
                                                if (!months || months.length === 0) return "—";
                                                return months.map(m => {
                                                    try {
                                                        const [y, mo] = m.split("-");
                                                        return new Date(y, mo - 1).toLocaleString("default", { month: "long", year: "numeric" });
                                                    } catch (e) {
                                                        return m;
                                                    }
                                                }).join(", ");
                                            })()}
                                        </span>
                                        <span><strong>Payment Mode:</strong></span>
                                        <span style={{ minWidth: "80px", borderBottom: "1px dotted #000" }}>{viewingReceipt.paymentMode}</span>
                                    </div>
                                    {/* Transaction ID row */}
                                    {viewingReceipt.transactionId && (
                                        <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                                            <span><strong>Transaction ID:</strong></span>
                                            <span style={{ flex: 1, borderBottom: "1px dotted #000", fontFamily: "monospace" }}>{viewingReceipt.transactionId}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Fee Table */}
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", marginTop: "12px", border: "2px solid #334155" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#1e293b", color: "#ffffff" }}>
                                            <th style={{ border: "2px solid #334155", padding: "10px 8px", textAlign: "center", width: "40px" }}>Sl. No.</th>
                                            <th style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "left" }}>DETAILS</th>
                                            <th style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", width: "120px" }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const raw = viewingReceipt.feeBreakdown;
                                            const list = Array.isArray(raw)
                                                ? raw
                                                : Object.entries(raw || {}).map(([k, v]) => ({ name: k, amount: v }));

                                            if (!list || list.length === 0) {
                                                return (
                                                    <tr>
                                                        <td style={{ border: "2px solid #334155", padding: "10px 8px", textAlign: "center" }}>1</td>
                                                        <td style={{ border: "2px solid #334155", padding: "10px 12px" }}>School Fee</td>
                                                        <td style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right" }}>{Number(viewingReceipt.amountPaid || viewingReceipt.totalAmount || 0).toFixed(2)}</td>
                                                    </tr>
                                                );
                                            }

                                            return list.map((item, idx) => {
                                                const headName = item.headName || item.name || item.head || item.head_name || "School Fee";
                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ border: "2px solid #334155", padding: "10px 8px", textAlign: "center" }}>{idx + 1}</td>
                                                        <td style={{ border: "2px solid #334155", padding: "10px 12px" }}>{headName}</td>
                                                        <td style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right" }}>{Number(item.amount || 0).toFixed(2)}</td>
                                                    </tr>
                                                );
                                            });
                                        })()}

                                        {/* Late Fee Row */}
                                        {(viewingReceipt.lateFee || 0) > 0 && (
                                            <tr>
                                                <td style={{ border: "2px solid #334155", padding: "10px 8px", textAlign: "center" }}>—</td>
                                                <td style={{ border: "2px solid #334155", padding: "10px 12px", color: "#dc2626", fontWeight: "bold" }}>Late Fee</td>
                                                <td style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", color: "#dc2626", fontWeight: "bold" }}>{Number(viewingReceipt.lateFee || 0).toFixed(2)}</td>
                                            </tr>
                                        )}

                                        {/* Discount Row */}
                                        {(viewingReceipt.discountAmount || 0) > 0 && (
                                            <tr>
                                                <td style={{ border: "2px solid #334155", padding: "10px 8px", textAlign: "center" }}>—</td>
                                                <td style={{ border: "2px solid #334155", padding: "10px 12px", color: "#16a34a", fontWeight: "bold" }}>Discount</td>
                                                <td style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", color: "#16a34a", fontWeight: "bold" }}>-{Number(viewingReceipt.discountAmount || 0).toFixed(2)}</td>
                                            </tr>
                                        )}

                                        {/* Empty filler rows */}
                                        {Array.from({ length: Math.max(0, 6 - (viewingReceipt.feeBreakdown?.length || 0)) }).map((_, i) => (
                                            <tr key={`empty-${i}`} style={{ height: "28px" }}>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>&nbsp;</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>&nbsp;</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>&nbsp;</td>
                                            </tr>
                                        ))}

                                        {/* Total Fee Amount Row */}
                                        <tr className="total-row">
                                            <td colSpan={2} style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", fontWeight: "bold", color: "#334155" }}>Total Fee Amount</td>
                                            <td style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", fontWeight: "bold", color: "#000" }}>
                                                {Number(viewingReceipt.netPayable || viewingReceipt.totalAmount || 0).toFixed(2)}
                                            </td>
                                        </tr>

                                        {/* Amount Paid Row */}
                                        <tr className="paid-row">
                                            <td colSpan={2} style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>Amount Paid</td>
                                            <td style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", fontWeight: "bold", fontSize: "17px", color: "#16a34a" }}>
                                                {Number(viewingReceipt.amountPaid || viewingReceipt.totalAmount || 0).toFixed(2)}
                                            </td>
                                        </tr>

                                        {/* Remaining Due Row */}
                                        {(viewingReceipt.remainingDue || 0) > 0 && (
                                            <tr className="due-row">
                                                <td colSpan={2} style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>Remaining Due</td>
                                                <td style={{ border: "2px solid #334155", padding: "10px 12px", textAlign: "right", fontWeight: "bold", fontSize: "17px", color: "#dc2626" }}>
                                                    {Number(viewingReceipt.remainingDue || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Amount in Words + Payment Info */}
                                <div style={{ marginTop: "10px", fontSize: "12px", borderBottom: "1px dotted #000", paddingBottom: "6px" }}>
                                    <strong>Rs. in words:</strong> {numberToWords(viewingReceipt.amountPaid || viewingReceipt.totalAmount || 0)}
                                    {viewingReceipt.remarks && (
                                        <span style={{ marginLeft: "20px" }}><strong>Remarks:</strong> {viewingReceipt.remarks}</span>
                                    )}
                                </div>

                                {/* Payment Details Row */}
                                <div style={{ marginTop: "6px", fontSize: "12px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
                                    <span><strong>Payment Mode:</strong> {viewingReceipt.paymentMode}</span>
                                    {viewingReceipt.transactionId && (
                                        <span><strong>Transaction ID:</strong> {viewingReceipt.transactionId}</span>
                                    )}
                                </div>

                                {/* Signature */}
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px", fontSize: "12px" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ borderTop: "1px solid #000", width: "150px", marginBottom: "4px" }}></div>
                                        Parent / Guardian Signature
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ borderTop: "1px solid #000", width: "150px", marginBottom: "4px" }}></div>
                                        Authorized Signatory
                                    </div>
                                </div>

                                <div style={{ textAlign: "center", fontSize: "10px", color: "#666", marginTop: "12px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
                                    This is a computer generated receipt. | {schoolSettings.schoolName || "School"}{schoolSettings.city ? `, ${schoolSettings.city}` : ""}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm + Pay Modal ── */}
            {showConfirmModal && (
                <div className="parent-modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="parent-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "480px", width: "92%" }}>
                        <h3 style={{ marginBottom: "4px" }}>💳 Payment Summary</h3>
                        <p style={{ fontSize: "0.83rem", color: "#64748b", marginBottom: "18px" }}>
                            Paying for <strong>{selectedChild.name}</strong> (Admission: {selectedChild.admission_no})
                        </p>

                        <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>

                            {/* Monthly Dues breakdown */}
                            {selectedDues.map(d => (
                                <div key={d.monthKey} style={{ marginBottom: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.875rem", color: "#1e293b", marginBottom: "4px" }}>
                                        <span>📅 {d.label}</span>
                                        <span>₹{Number(d.totalDue).toLocaleString()}</span>
                                    </div>
                                    <div style={{ paddingLeft: "20px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                        {(d.feeBreakdown || []).filter(h => h.remainingAmount > 0).map((h, i) => (
                                            <span key={i} style={{ background: "#e2e8f0", color: "#475569", borderRadius: "6px", padding: "2px 7px", fontSize: "0.7rem" }}>
                                                {h.name}: ₹{Number(h.remainingAmount).toLocaleString()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Ad-hoc charges breakdown */}
                            {selectedAdhocItems.length > 0 && (
                                <div style={{ marginTop: selectedDues.length > 0 ? "10px" : 0, paddingTop: selectedDues.length > 0 ? "10px" : 0, borderTop: selectedDues.length > 0 ? "1px dashed #e2e8f0" : "none" }}>
                                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "8px" }}>ADDITIONAL CHARGES</div>
                                    {selectedAdhocItems.map(f => (
                                        <div key={f._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: "0.875rem" }}>
                                            <div>
                                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{f.name}</span>
                                                <span style={{
                                                    marginLeft: "8px", background: categoryColor(f.category) + "22",
                                                    color: categoryColor(f.category), borderRadius: "5px", padding: "1px 7px", fontSize: "0.7rem", fontWeight: 600
                                                }}>{f.category || "Other"}</span>
                                            </div>
                                            <span style={{ fontWeight: 700 }}>₹{Number(f.amount || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* One-time fees breakdown */}
                            {selectedOneTimeItems.length > 0 && (
                                <div style={{ marginTop: (selectedDues.length > 0 || selectedAdhocItems.length > 0) ? "10px" : 0, paddingTop: (selectedDues.length > 0 || selectedAdhocItems.length > 0) ? "10px" : 0, borderTop: (selectedDues.length > 0 || selectedAdhocItems.length > 0) ? "1px dashed #e2e8f0" : "none" }}>
                                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "8px" }}>ONE-TIME FEES</div>
                                    {selectedOneTimeItems.map((f, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: "0.875rem" }}>
                                            <div>
                                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{f.name}</span>
                                                <span style={{
                                                    marginLeft: "8px", background: "#ede9fe",
                                                    color: "#6d28d9", borderRadius: "5px", padding: "1px 7px", fontSize: "0.7rem", fontWeight: 600
                                                }}>One-time</span>
                                            </div>
                                            <span style={{ fontWeight: 700 }}>₹{Number(f.amount || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Grand total */}
                            <div style={{ borderTop: "2px solid #e2e8f0", marginTop: "12px", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem" }}>
                                <span>Total Payable</span>
                                <span style={{ color: "#3b82f6" }}>₹{combinedTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "16px" }}>
                            💡 Secure payment via Razorpay — UPI, Card, Net Banking, or Wallet
                        </p>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="parent-pay-btn" onClick={handlePay} disabled={loading} style={{ flex: 1 }}>
                                {loading ? "Processing..." : `💳 Confirm & Pay ₹${combinedTotal.toLocaleString()}`}
                            </button>
                            <button onClick={() => setShowConfirmModal(false)}
                                style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid #CBD5E0", background: "#f8fafc", cursor: "pointer", fontSize: "0.875rem" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Distribution Breakdown Modal ── */}
            {viewingBreakdown && (
                <div className="parent-modal-overlay" onClick={() => setViewingBreakdown(null)}>
                    <div className="parent-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px", width: "90%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0 }}>📊 Payment Distribution</h3>
                            <button onClick={() => setViewingBreakdown(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
                        </div>

                        <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                                <span>Receipt: <strong>{viewingBreakdown.receiptNo}</strong></span>
                                <span>Date: <strong>{new Date(viewingBreakdown.paidAt).toLocaleDateString()}</strong></span>
                            </div>

                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                                        <th style={{ padding: "8px 0" }}>Fee Head</th>
                                        <th style={{ padding: "8px 0", textAlign: "right" }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const raw = viewingBreakdown.feeBreakdown;
                                        const list = Array.isArray(raw)
                                            ? raw
                                            : Object.entries(raw || {}).map(([k, v]) => ({ name: k, amount: v }));

                                        if (!list || list.length === 0) {
                                            return (
                                                <tr>
                                                    <td style={{ padding: "10px 0", color: "#1e293b" }}>School Fee</td>
                                                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600 }}>₹{Number(viewingBreakdown.amountPaid || viewingBreakdown.totalAmount || 0).toLocaleString()}</td>
                                                </tr>
                                            );
                                        }

                                        return list.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "10px 0", color: "#1e293b" }}>{item.headName || item.name || item.head || "School Fee"}</td>
                                                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600 }}>₹{Number(item.amount || 0).toLocaleString()}</td>
                                            </tr>
                                        ));
                                    })()}

                                    {(viewingBreakdown.lateFee || 0) > 0 && (
                                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "10px 0", color: "#dc2626" }}>Late Fee</td>
                                            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "#dc2626" }}>₹{Number(viewingBreakdown.lateFee).toLocaleString()}</td>
                                        </tr>
                                    )}

                                    {(viewingBreakdown.discountAmount || 0) > 0 && (
                                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "10px 0", color: "#16a34a" }}>Discount</td>
                                            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "#16a34a" }}>-₹{Number(viewingBreakdown.discountAmount).toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                                        <td style={{ padding: "12px 0", fontWeight: 700, color: "#1e293b" }}>Total Paid</td>
                                        <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 800, color: "#16a34a", fontSize: "1.1rem" }}>₹{Number(viewingBreakdown.amountPaid || viewingBreakdown.totalAmount || 0).toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => {
                                    setViewingBreakdown(null);
                                    handleViewReceipt(viewingBreakdown);
                                }}
                                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #3b82f6", fontWeight: 600, cursor: "pointer" }}
                            >
                                View Full Receipt
                            </button>
                            <button onClick={() => setViewingBreakdown(null)} style={{ padding: "10px 20px", borderRadius: "8px", background: "#f1f5f9", color: "#64748b", border: "none", fontWeight: 600, cursor: "pointer" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
