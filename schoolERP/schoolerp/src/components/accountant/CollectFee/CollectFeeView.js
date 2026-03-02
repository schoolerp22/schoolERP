import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents, getStudentDues, collectPayment, clearCurrentReceipt } from "../../../feature/accounting/accountingSlice";
import { Search, User, FileText, CheckCircle } from "lucide-react";
import "./CollectFeeView.css";
import { useNavigate } from "react-router-dom";

const CollectFeeView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { students, studentDues, isLoading, isSuccess, currentReceipt } = useSelector((state) => state.accounting);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState([]);

    // Extra charges state
    const [lateFee, setLateFee] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [remarks, setRemarks] = useState("");

    // Payment Details
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [chequeDetails, setChequeDetails] = useState({ number: "", bank: "" });

    // Handle Search
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            dispatch(getStudents({ search: searchQuery }));
        }
    };

    // Select student and fetch dues
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        dispatch(getStudentDues(student.admission_no));
        setSelectedMonths([]);
        setLateFee(0);
        setDiscountAmount(0);
        setRemarks("");
    };

    // Handle month selection toggling
    const toggleMonth = (monthName) => {
        if (selectedMonths.includes(monthName)) {
            setSelectedMonths(selectedMonths.filter(m => m !== monthName));
        } else {
            setSelectedMonths([...selectedMonths, monthName]);
        }
    };

    // Calculate totals using new dues[] shape
    const calculateTotal = () => {
        const unpaidDues = (studentDues?.dues || []).filter(d => selectedMonths.includes(d.monthKey));
        const base = unpaidDues.reduce((sum, d) => sum + (d.totalDue || 0), 0);
        return base + Number(lateFee) - Number(discountAmount);
    };

    const handlePayment = () => {
        // Use selectedStudent or fall back to studentDues.student
        const student = selectedStudent || studentDues?.student;

        if (!student) {
            alert("Please select a student first");
            return;
        }

        if (selectedMonths.length === 0) {
            alert("Please select at least one month");
            return;
        }

        const totalAmount = calculateTotal();
        if (totalAmount <= 0) {
            alert("Amount must be greater than 0");
            return;
        }

        if (paymentMode === "Cheque" && (!chequeDetails.number || !chequeDetails.bank)) {
            alert("Please enter Cheque Number and Bank Name");
            return;
        }

        // Build fee breakdown from selected months dues
        const unpaidDues = (studentDues?.dues || []).filter(d => selectedMonths.includes(d.monthKey));
        const feeBreakdownItems = [];
        unpaidDues.forEach(d => {
            (d.feeBreakdown || []).forEach(f => {
                const existing = feeBreakdownItems.find(x => x.headName === f.name);
                if (existing) existing.amount += (f.amount || 0);
                else feeBreakdownItems.push({ headName: f.name, amount: f.amount || 0 });
            });
        });

        const payload = {
            admissionNo: student.admission_no,
            studentName: student.name,
            totalAmount,
            paymentMode,
            months: selectedMonths,
            chequeNo: paymentMode === "Cheque" ? chequeDetails.number : null,
            bankName: paymentMode === "Cheque" ? chequeDetails.bank : null,
            remarks,
            feeBreakdown: feeBreakdownItems
        };

        dispatch(collectPayment(payload));
    };

    // Handle success
    useEffect(() => {
        if (isSuccess && currentReceipt) {
            // Clear up state when receipt generated and navigate to view it
            navigate(`/dashboard/accountant/receipts`);
            dispatch(clearCurrentReceipt());
        }
    }, [isSuccess, currentReceipt, navigate, dispatch]);

    return (
        <div className="collect-fee-container">
            <div className="accountant-header-container">
                <h2 className="accountant-page-title">Collect Fee</h2>
            </div>

            <div className="collect-fee-grid">
                {/* Left Column: Search & Selection */}
                <div className="fee-search-column">
                    <div className="accountant-card">
                        <h3 className="acc-card-title">Search Student</h3>
                        <form onSubmit={handleSearch} className="fee-search-form">
                            <input
                                type="text"
                                className="fee-search-input"
                                placeholder="Name or Admission No."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="fee-search-btn" disabled={isLoading}>
                                <Search size={18} /> Search
                            </button>
                        </form>

                        <div className="fee-search-results">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <div
                                        key={student.admission_no}
                                        className={`student-search-item ${selectedStudent?.admission_no === student.admission_no ? "selected" : ""}`}
                                        onClick={() => handleSelectStudent(student)}
                                    >
                                        <div className="student-search-avatar">
                                            <User size={20} />
                                        </div>
                                        <div className="student-search-info">
                                            <h4>{student.name}</h4>
                                            <p>{student.admission_no} • {student.class_name} ({student.section})</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-results-text">No students found. Search to begin.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Fee Details & Payment */}
                <div className="fee-details-column">
                    {studentDues ? (
                        <div className="accountant-card">
                            <div className="fee-student-header">
                                <div>
                                    <h3>{selectedStudent?.name}</h3>
                                    <p>Class: {selectedStudent?.class_name} • Adm No: {selectedStudent?.admission_no}</p>
                                </div>
                                <div className="fee-status-badge">
                                    {studentDues.unpaidMonths?.length === 0 ? "Fully Paid" : "Dues Pending"}
                                </div>
                            </div>

                            {studentDues.feeStructure ? (
                                <div className="fee-collection-body">
                                    <h4 className="fee-section-title">Select Months to Pay</h4>
                                    <div className="months-grid">
                                        {(studentDues.dues || []).filter(d => !d.isPaid).map(due => (
                                            <div
                                                key={due.monthKey}
                                                className={`month-checkbox-item ${selectedMonths.includes(due.monthKey) ? "selected" : ""}`}
                                                onClick={() => toggleMonth(due.monthKey)}
                                            >
                                                {selectedMonths.includes(due.monthKey) ? <CheckCircle size={16} /> : <div className="empty-circle"></div>}
                                                <span>{due.label}</span>
                                                <span className="month-amount">₹{due.totalDue?.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="fee-extras-grid">
                                        <div className="fee-input-group">
                                            <label>Late Fee (₹)</label>
                                            <input
                                                type="number"
                                                value={lateFee}
                                                onChange={(e) => setLateFee(e.target.value)}
                                                min="0"
                                            />
                                        </div>
                                        <div className="fee-input-group">
                                            <label>Discount (₹)</label>
                                            <input
                                                type="number"
                                                value={discountAmount}
                                                onChange={(e) => setDiscountAmount(e.target.value)}
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="fee-input-group full-width">
                                        <label>Remarks / Notes</label>
                                        <input
                                            type="text"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Optional note for this transaction"
                                        />
                                    </div>

                                    <h4 className="fee-section-title mt-4">Payment Details</h4>
                                    <div className="payment-mode-selector">
                                        {["Cash", "Online", "Card", "UPI", "Cheque"].map(mode => (
                                            <button
                                                key={mode}
                                                className={`payment-mode-btn ${paymentMode === mode ? "active" : ""}`}
                                                onClick={() => setPaymentMode(mode)}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>

                                    {paymentMode === "Cheque" && (
                                        <div className="fee-extras-grid mt-3">
                                            <div className="fee-input-group">
                                                <label>Cheque Number</label>
                                                <input
                                                    type="text"
                                                    value={chequeDetails.number}
                                                    onChange={(e) => setChequeDetails({ ...chequeDetails, number: e.target.value })}
                                                />
                                            </div>
                                            <div className="fee-input-group">
                                                <label>Bank Name</label>
                                                <input
                                                    type="text"
                                                    value={chequeDetails.bank}
                                                    onChange={(e) => setChequeDetails({ ...chequeDetails, bank: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="fee-summary-box">
                                        <div className="fee-summary-row">
                                            <span>Total Months:</span>
                                            <span>{selectedMonths.length}</span>
                                        </div>
                                        <div className="fee-summary-row total">
                                            <span>Net Payable Amount:</span>
                                            <span>₹ {calculateTotal().toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        className="pay-now-btn"
                                        onClick={handlePayment}
                                        disabled={isLoading || selectedMonths.length === 0}
                                    >
                                        {isLoading ? "Processing..." : "Collect Payment & Generate Receipt"}
                                    </button>
                                </div>
                            ) : (
                                <div className="no-structure-error">
                                    Fee structure not configured for this class yet. Contact School Admin.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="fee-placeholder-card empty">
                            <FileText size={48} className="text-gray-300 mb-4" />
                            <p>Select a student to view fee details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectFeeView;
