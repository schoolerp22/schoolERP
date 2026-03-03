import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { getReceipts, getReceiptById } from "../../../feature/accounting/accountingSlice";
import { Printer, Download, Eye, Search, X, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./ReceiptView.css";

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ReceiptListView = () => {
    const dispatch = useDispatch();
    const { receipts, currentReceipt, isLoading } = useSelector((state) => state.accounting);

    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [searchStudent, setSearchStudent] = useState("");
    const [viewingReceipt, setViewingReceipt] = useState(null);
    const [isThermal, setIsThermal] = useState(false);
    const [schoolSettings, setSchoolSettings] = useState({});

    // Component reference for printing
    const receiptRef = useRef();

    useEffect(() => {
        dispatch(getReceipts({}));

        // Fetch school settings for dynamic receipt header
        const token = localStorage.getItem("token");
        fetch(`${API_BASE}/api/admin/school-settings`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.ok ? r.json() : {})
            .then(data => setSchoolSettings(data || {}))
            .catch(() => { });
    }, [dispatch]);

    const handleSearch = (e) => {
        e.preventDefault();
        dispatch(getReceipts({
            studentId: searchStudent,
            startDate: dateRange.start,
            endDate: dateRange.end
        }));
    };

    const openReceipt = (receipt) => {
        if (!receipt.feeBreakdown || receipt.feeBreakdown.length === 0) {
            dispatch(getReceiptById(receipt._id));
            setViewingReceipt(null);
        } else {
            setViewingReceipt(receipt);
        }
    };

    useEffect(() => {
        if (currentReceipt) {
            setViewingReceipt(currentReceipt);
        }
    }, [currentReceipt]);

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

    const handleDownloadProof = () => {
        if (!viewingReceipt?.transactionProof) return;
        const token = localStorage.getItem("token");
        const url = `${API_BASE}/api/accounting/payments/receipt/${viewingReceipt._id}/download-proof`;
        // Use fetch + blob to handle auth'd download
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (!r.ok) throw new Error("Download failed");
                return r.blob();
            })
            .then(blob => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = viewingReceipt.transactionProofOriginalName || "transaction-proof";
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => {
                console.error("Proof download error:", err);
                alert("Could not download transaction proof.");
            });
    };

    // Number to words
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

    const getStatusBadgeClass = (receipt) => {
        if (receipt.status === "partial") return "status-partial";
        return "status-paid";
    };

    return (
        <div className="receipt-list-container">
            <div className="accountant-header-container">
                <h2 className="accountant-page-title">Receipts & History</h2>
            </div>

            <div className="accountant-card mb-6">
                <form onSubmit={handleSearch} className="receipt-filters">
                    <div className="filter-group">
                        <label>Student Adm No.</label>
                        <input
                            type="text"
                            placeholder="e.g. CH135"
                            value={searchStudent}
                            onChange={(e) => setSearchStudent(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Date From</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Date To</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="receipt-filter-btn">
                        <Search size={16} /> Filter
                    </button>
                </form>
            </div>

            <div className="accountant-card">
                {isLoading && !viewingReceipt ? (
                    <div className="receipt-loading">Loading receipts...</div>
                ) : (
                    <div className="receipt-table-wrapper">
                        <table className="receipt-table">
                            <thead>
                                <tr>
                                    <th>Receipt No</th>
                                    <th>Date</th>
                                    <th>Student Info</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Mode</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receipts.length > 0 ? (
                                    receipts.map((receipt) => (
                                        <tr key={receipt._id}>
                                            <td className="font-medium text-blue-600">{receipt.receiptNo}</td>
                                            <td>{receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString("en-IN") : "-"}</td>
                                            <td>
                                                <div className="text-sm font-medium">{receipt.studentName}</div>
                                                <div className="text-xs text-gray-500">{receipt.admissionNo} • Class {receipt.class}</div>
                                            </td>
                                            <td className="font-semibold">₹ {(receipt.amountPaid || receipt.totalAmount || 0).toLocaleString()}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadgeClass(receipt)}`}>
                                                    {receipt.status === "partial" ? "Partial" : "Paid"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`payment-badge ${receipt.paymentMode?.toLowerCase().replace(' ', '-')}`}>
                                                    {receipt.paymentMode}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => openReceipt(receipt)} className="receipt-view-btn">
                                                    <Eye size={16} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-gray-500">
                                            No receipts found for the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Receipt View Modal */}
            {viewingReceipt && (
                <div className="receipt-modal-overlay">
                    <div className="receipt-modal-container">
                        <div className="receipt-modal-header">
                            <h3>View Receipt</h3>
                            <div className="receipt-actions">
                                {viewingReceipt.transactionProof && (
                                    <button onClick={handleDownloadProof} className="action-btn-proof">
                                        <FileDown size={16} /> Download Proof
                                    </button>
                                )}
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
                                style={{ fontFamily: "'Times New Roman', Times, serif", background: "#fff", padding: "24px", maxWidth: "680px", margin: "0 auto" }}
                            >
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
                                        <span style={{ flex: 1, borderBottom: "1px dotted #000" }}>{viewingReceipt.studentName}</span>
                                        <span><strong>Adm. No:</strong></span>
                                        <span style={{ minWidth: "80px", borderBottom: "1px dotted #000" }}>{viewingReceipt.admissionNo}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                                        <span><strong>Class:</strong></span>
                                        <span style={{ minWidth: "60px", borderBottom: "1px dotted #000" }}>{viewingReceipt.class || "-"}</span>
                                        <span><strong>Sec:</strong></span>
                                        <span style={{ minWidth: "50px", borderBottom: "1px dotted #000" }}>{viewingReceipt.section || "-"}</span>
                                        <span><strong>Roll No:</strong></span>
                                        <span style={{ minWidth: "60px", borderBottom: "1px dotted #000" }}>{viewingReceipt.rollNo || "-"}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                                        <span><strong>For the Month of:</strong></span>
                                        <span style={{ flex: 1, borderBottom: "1px dotted #000" }}>
                                            {(viewingReceipt.months || []).map(m => {
                                                const [y, mo] = m.split("-");
                                                return new Date(y, mo - 1).toLocaleString("default", { month: "long", year: "numeric" });
                                            }).join(", ") || "—"}
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
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginTop: "8px" }}>
                                    <thead>
                                        <tr style={{ background: "#222", color: "#fff" }}>
                                            <th style={{ border: "1px solid #555", padding: "6px 8px", width: "40px" }}>Sl. No.</th>
                                            <th style={{ border: "1px solid #555", padding: "6px 8px", textAlign: "left" }}>DETAILS</th>
                                            <th style={{ border: "1px solid #555", padding: "6px 8px", width: "100px", textAlign: "right" }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(viewingReceipt.feeBreakdown || []).map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{idx + 1}</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{item.headName}</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right" }}>{Number(item.amount || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}

                                        {/* Late Fee Row */}
                                        {(viewingReceipt.lateFee || 0) > 0 && (
                                            <tr>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{(viewingReceipt.feeBreakdown?.length || 0) + 1}</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", color: "#dc2626" }}>Late Fee</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right", color: "#dc2626" }}>{Number(viewingReceipt.lateFee || 0).toFixed(2)}</td>
                                            </tr>
                                        )}

                                        {/* Discount Row */}
                                        {(viewingReceipt.discountAmount || 0) > 0 && (
                                            <tr>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>—</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", color: "#16a34a" }}>Discount</td>
                                                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right", color: "#16a34a" }}>-{Number(viewingReceipt.discountAmount || 0).toFixed(2)}</td>
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
                                        <tr style={{ background: "#f5f5f5" }}>
                                            <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>Total Fee Amount</td>
                                            <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                                                {Number(viewingReceipt.netPayable || viewingReceipt.totalAmount || 0).toFixed(2)}
                                            </td>
                                        </tr>

                                        {/* Amount Paid Row */}
                                        <tr style={{ background: "#f0fff4" }}>
                                            <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>Amount Paid</td>
                                            <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontSize: "15px", color: "#16a34a" }}>
                                                {Number(viewingReceipt.amountPaid || viewingReceipt.totalAmount || 0).toFixed(2)}
                                            </td>
                                        </tr>

                                        {/* Remaining Due Row */}
                                        {(viewingReceipt.remainingDue || 0) > 0 && (
                                            <tr style={{ background: "#fef2f2" }}>
                                                <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>Remaining Due</td>
                                                <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontSize: "15px", color: "#dc2626" }}>
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
                                    {viewingReceipt.paymentMode === "Cheque" && viewingReceipt.chequeNo && (
                                        <>
                                            <span><strong>Cheque No:</strong> {viewingReceipt.chequeNo}</span>
                                            <span><strong>Bank:</strong> {viewingReceipt.bankName}</span>
                                        </>
                                    )}
                                    {viewingReceipt.transactionProof && (
                                        <span style={{ color: "#2563eb" }}><strong>📎 Proof Attached</strong></span>
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
        </div>
    );
};

export default ReceiptListView;
