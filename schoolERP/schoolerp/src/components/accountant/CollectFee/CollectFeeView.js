import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents, getStudentDues, collectPayment, clearCurrentReceipt, reset, addAdhocFee, deleteAdhocFee } from "../../../feature/accounting/accountingSlice";
import { Search, User, FileText, CheckCircle, ChevronDown, ChevronUp, Upload, X, Plus, Trash2 } from "lucide-react";
import "./CollectFeeView.css";
import { useNavigate } from "react-router-dom";

const CollectFeeView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { students, studentDues, isLoading, isSuccess, currentReceipt } = useSelector((state) => state.accounting);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [expandedMonths, setExpandedMonths] = useState([]);

    // Per-fee-head pay amounts: { monthKey: { headName: amountToPay } }
    const [headPayAmounts, setHeadPayAmounts] = useState({});

    // One-time fee selection + custom amounts
    const [selectedOneTimeFees, setSelectedOneTimeFees] = useState([]);
    const [oneTimePayAmounts, setOneTimePayAmounts] = useState({}); // { feeName: amountToPay }

    // Ad-hoc / Additional Charges
    const [selectedAdhocFees, setSelectedAdhocFees] = useState([]);  // array of fee _id
    const [adhocPayAmounts, setAdhocPayAmounts] = useState({});      // { feeId: amount string }
    const [showAddCharge, setShowAddCharge] = useState(false);
    const [newCharge, setNewCharge] = useState({ name: "", amount: "", category: "Other", frequency: "One-time" });

    // Extra charges
    const [lateFee, setLateFee] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [remarks, setRemarks] = useState("");

    // Payment Details
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [chequeDetails, setChequeDetails] = useState({ number: "", bank: "" });
    const [transactionId, setTransactionId] = useState("");
    const [transactionProofFile, setTransactionProofFile] = useState(null);

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
        resetForm();
    };

    const resetForm = () => {
        setSelectedMonths([]);
        setExpandedMonths([]);
        setHeadPayAmounts({});
        setSelectedOneTimeFees([]);
        setOneTimePayAmounts({});
        setSelectedAdhocFees([]);
        setAdhocPayAmounts({});
        setShowAddCharge(false);
        setNewCharge({ name: "", amount: "", category: "Other", frequency: "One-time" });
        setLateFee(0);
        setDiscountAmount(0);
        setRemarks("");
        setPaymentMode("Cash");
        setChequeDetails({ number: "", bank: "" });
        setTransactionId("");
        setTransactionProofFile(null);
    };

    // Toggle month selection / expansion
    const toggleMonth = (monthKey, feeBreakdown, isPaid) => {
        if (selectedMonths.includes(monthKey)) {
            setSelectedMonths(selectedMonths.filter(m => m !== monthKey));
            setExpandedMonths(expandedMonths.filter(m => m !== monthKey));
            // Clear pay amounts for this month
            const newAmounts = { ...headPayAmounts };
            delete newAmounts[monthKey];
            setHeadPayAmounts(newAmounts);
        } else {
            if (!isPaid) {
                setSelectedMonths([...selectedMonths, monthKey]);
            }
            if (!expandedMonths.includes(monthKey)) {
                setExpandedMonths([...expandedMonths, monthKey]);
            }
            if (!isPaid) {
                // Initialize pay amounts to full remaining for each head
                const amounts = {};
                (feeBreakdown || []).forEach(h => {
                    const remaining = h.remainingAmount !== undefined ? h.remainingAmount : h.amount;
                    amounts[h.name] = String(remaining || 0);
                });
                setHeadPayAmounts({ ...headPayAmounts, [monthKey]: amounts });
            }
        }
    };

    // Toggle expand/collapse
    const toggleExpand = (monthKey) => {
        if (expandedMonths.includes(monthKey)) {
            setExpandedMonths(expandedMonths.filter(m => m !== monthKey));
        } else {
            setExpandedMonths([...expandedMonths, monthKey]);
        }
    };

    // Update pay amount for a specific fee head (stores string for clean input)
    const updateHeadPayAmount = (monthKey, headName, value, maxAmount) => {
        // Allow empty string so user can clear and retype
        let cleanVal = value.replace(/[^0-9]/g, '');
        // Remove leading zeros
        if (cleanVal.length > 1) cleanVal = cleanVal.replace(/^0+/, '') || '0';
        // Cap at max
        if (Number(cleanVal) > maxAmount) cleanVal = String(maxAmount);
        setHeadPayAmounts({
            ...headPayAmounts,
            [monthKey]: {
                ...headPayAmounts[monthKey],
                [headName]: cleanVal
            }
        });
    };

    // Get numeric value of a head pay amount
    const getHeadNum = (monthKey, headName, fallback) => {
        const val = headPayAmounts[monthKey]?.[headName];
        if (val === undefined || val === '') return fallback;
        return Number(val) || 0;
    };

    // Set a head to full or zero
    const toggleHeadFull = (monthKey, headName, maxAmount) => {
        const current = getHeadNum(monthKey, headName, maxAmount);
        const newVal = current >= maxAmount ? '0' : String(maxAmount);
        setHeadPayAmounts({
            ...headPayAmounts,
            [monthKey]: {
                ...headPayAmounts[monthKey],
                [headName]: newVal
            }
        });
    };

    // Toggle one-time fee selection
    const toggleOneTimeFee = (feeName, amount, isPaid) => {
        if (isPaid) return;
        if (selectedOneTimeFees.includes(feeName)) {
            setSelectedOneTimeFees(selectedOneTimeFees.filter(f => f !== feeName));
            const newAmts = { ...oneTimePayAmounts };
            delete newAmts[feeName];
            setOneTimePayAmounts(newAmts);
        } else {
            setSelectedOneTimeFees([...selectedOneTimeFees, feeName]);
            setOneTimePayAmounts({ ...oneTimePayAmounts, [feeName]: String(amount || 0) });
        }
    };

    // Update one-time fee pay amount
    const updateOneTimePayAmount = (feeName, value, maxAmount) => {
        let cleanVal = value.replace(/[^0-9]/g, '');
        if (cleanVal.length > 1) cleanVal = cleanVal.replace(/^0+/, '') || '0';
        if (Number(cleanVal) > maxAmount) cleanVal = String(maxAmount);
        setOneTimePayAmounts({ ...oneTimePayAmounts, [feeName]: cleanVal });
    };

    // Toggle ad-hoc fee selection
    const toggleAdhocFee = (fee) => {
        if (fee.isPaid) return;
        const feeId = fee._id;
        if (selectedAdhocFees.includes(feeId)) {
            setSelectedAdhocFees(selectedAdhocFees.filter(id => id !== feeId));
            const newAmts = { ...adhocPayAmounts };
            delete newAmts[feeId];
            setAdhocPayAmounts(newAmts);
        } else {
            setSelectedAdhocFees([...selectedAdhocFees, feeId]);
            const remaining = fee.amount - (fee.paidAmount || 0);
            setAdhocPayAmounts({ ...adhocPayAmounts, [feeId]: String(remaining) });
        }
    };

    const updateAdhocPayAmount = (feeId, value, maxAmount) => {
        let cleanVal = value.replace(/[^0-9]/g, '');
        if (cleanVal.length > 1) cleanVal = cleanVal.replace(/^0+/, '') || '0';
        if (Number(cleanVal) > maxAmount) cleanVal = String(maxAmount);
        setAdhocPayAmounts({ ...adhocPayAmounts, [feeId]: cleanVal });
    };

    // Add new ad-hoc charge
    const handleAddCharge = async () => {
        if (!newCharge.name.trim() || !newCharge.amount) {
            alert("Please enter charge name and amount");
            return;
        }
        const student = selectedStudent || studentDues?.student;
        await dispatch(addAdhocFee({
            name: newCharge.name.trim(),
            amount: Number(newCharge.amount),
            appliedTo: "student",
            admissionNo: student.admission_no,
            category: newCharge.category,
            frequency: newCharge.frequency
        }));
        setNewCharge({ name: "", amount: "", category: "Other", frequency: "One-time" });
        setShowAddCharge(false);
        // Refresh dues to get updated adhocFees
        dispatch(getStudentDues(student.admission_no));
    };

    // Delete ad-hoc charge
    const handleDeleteCharge = async (feeId) => {
        if (!window.confirm("Remove this charge?")) return;
        await dispatch(deleteAdhocFee(feeId));
        const student = selectedStudent || studentDues?.student;
        dispatch(getStudentDues(student.admission_no));
    };

    // Calculate total amount being paid
    const calculateAmountPaying = () => {
        let total = 0;
        // Monthly heads amounts
        selectedMonths.forEach(mk => {
            const amounts = headPayAmounts[mk] || {};
            Object.values(amounts).forEach(a => total += (Number(a) || 0));
        });
        // One-time fee amounts
        selectedOneTimeFees.forEach(fn => {
            total += (Number(oneTimePayAmounts[fn]) || 0);
        });
        // Ad-hoc fee amounts
        selectedAdhocFees.forEach(feeId => {
            total += (Number(adhocPayAmounts[feeId]) || 0);
        });
        return total;
    };

    // Calculate total full amount of selected fees (before partial)
    const calculateSelectedTotal = () => {
        let total = 0;
        const dues = studentDues?.dues || [];
        selectedMonths.forEach(mk => {
            const due = dues.find(d => d.monthKey === mk);
            if (due) {
                (due.feeBreakdown || []).forEach(h => {
                    total += (h.remainingAmount !== undefined ? h.remainingAmount : h.amount) || 0;
                });
            }
        });
        (studentDues?.oneTimeFees || []).forEach(f => {
            if (selectedOneTimeFees.includes(f.name)) total += f.amount || 0;
        });
        // Ad-hoc fees full amounts
        (studentDues?.adhocFees || []).forEach(f => {
            if (selectedAdhocFees.includes(f._id)) {
                total += (f.amount - (f.paidAmount || 0)) || 0;
            }
        });
        return total;
    };

    const selectedTotal = calculateSelectedTotal();
    const amountPaying = calculateAmountPaying();
    const netPayable = amountPaying + Number(lateFee) - Number(discountAmount);
    const amountLeftOnSelected = Math.max(0, selectedTotal - amountPaying);

    // Total outstanding across ALL unpaid months + one-time fees + adhoc fees
    const totalOutstanding = (() => {
        let total = 0;
        (studentDues?.dues || []).forEach(d => {
            if (!d.isPaid) total += d.totalDue || 0;
        });
        (studentDues?.oneTimeFees || []).forEach(f => {
            if (!f.isPaid) total += f.amount || 0;
        });
        (studentDues?.adhocFees || []).forEach(f => {
            total += (f.amount - (f.paidAmount || 0)) || 0;
        });
        return total;
    })();

    const needsTransactionDetails = ["Online", "UPI", "Bank Transfer"].includes(paymentMode);

    const handlePayment = () => {
        const student = selectedStudent || studentDues?.student;
        if (!student) { alert("Please select a student first"); return; }

        if (selectedMonths.length === 0 && selectedOneTimeFees.length === 0) {
            alert("Please select at least one fee to pay");
            return;
        }

        if (netPayable <= 0) { alert("Amount must be greater than 0"); return; }

        if (paymentMode === "Cheque" && (!chequeDetails.number || !chequeDetails.bank)) {
            alert("Please enter Cheque Number and Bank Name");
            return;
        }

        // Build fee breakdown with per-head pay amounts
        const feeBreakdownItems = [];
        selectedMonths.forEach(mk => {
            const amounts = headPayAmounts[mk] || {};
            Object.entries(amounts).forEach(([headName, rawAmt]) => {
                const amt = Number(rawAmt) || 0;
                if (amt > 0) {
                    const existing = feeBreakdownItems.find(x => x.headName === headName);
                    if (existing) existing.amount += amt;
                    else feeBreakdownItems.push({ headName, amount: amt });
                }
            });
        });

        // Add ad-hoc fees
        selectedAdhocFees.forEach(feeId => {
            const fee = (studentDues?.adhocFees || []).find(f => f._id === feeId);
            if (fee) {
                const amt = Number(adhocPayAmounts[feeId]) || 0;
                if (amt > 0) {
                    feeBreakdownItems.push({ headName: fee.name, amount: amt });
                }
            }
        });

        // Add one-time fees
        selectedOneTimeFees.forEach(fn => {
            const amt = Number(oneTimePayAmounts[fn]) || 0;
            if (amt > 0) {
                feeBreakdownItems.push({ headName: fn, amount: amt });
            }
        });

        // Build FormData
        const formData = new FormData();
        formData.append("admissionNo", student.admission_no);
        formData.append("months", JSON.stringify(selectedMonths));
        formData.append("feeBreakdown", JSON.stringify(feeBreakdownItems));
        formData.append("totalAmount", selectedTotal);
        formData.append("amountPaid", netPayable);
        formData.append("lateFee", Number(lateFee));
        formData.append("discountAmount", Number(discountAmount));
        formData.append("paymentMode", paymentMode);
        formData.append("remarks", remarks);

        if (paymentMode === "Cheque") {
            formData.append("chequeNo", chequeDetails.number);
            formData.append("bankName", chequeDetails.bank);
        }
        if (transactionId) formData.append("transactionId", transactionId);
        if (transactionProofFile) formData.append("transactionProof", transactionProofFile);

        dispatch(collectPayment(formData));
    };

    // Handle success
    useEffect(() => {
        if (isSuccess && currentReceipt) {
            dispatch(reset());
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
                                    {totalOutstanding > 0 ? "Dues Pending" : "Fully Paid"}
                                </div>
                            </div>

                            {studentDues.feeStructure ? (
                                <div className="fee-collection-body">
                                    {/* Total Outstanding Banner */}
                                    <div className="outstanding-banner">
                                        <div className="outstanding-banner-left">
                                            <span className="outstanding-label">Total Outstanding</span>
                                            <span className="outstanding-hint">Select fees below. Pay full or partial per fee head.</span>
                                        </div>
                                        <span className="outstanding-amount">₹ {totalOutstanding.toLocaleString()}</span>
                                    </div>

                                    {/* Additional Charges (Ad-hoc Fees) - MOVED TO TOP FOR VISIBILITY */}
                                    <div className="adhoc-highlight-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                        <h4 className="fee-section-title" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                Additional Charges (Fines, Events, etc.)
                                                {(studentDues?.adhocFees || []).length > 0 &&
                                                    <span style={{ fontSize: '0.7rem', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>
                                                        {(studentDues.adhocFees || []).length}
                                                    </span>
                                                }
                                            </span>
                                            <button
                                                className="add-charge-btn"
                                                onClick={() => setShowAddCharge(!showAddCharge)}
                                                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                            >
                                                <Plus size={14} /> Add Charge
                                            </button>
                                        </h4>

                                        {/* Add Charge Form */}
                                        {showAddCharge && (
                                            <div className="add-charge-form">
                                                <input
                                                    type="text"
                                                    placeholder="Fee name (e.g. Dance Class, Event Fee)"
                                                    value={newCharge.name}
                                                    onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                                                    className="charge-name-input"
                                                />
                                                <div className="charge-row">
                                                    <div className="head-amount-input-wrap">
                                                        <span className="rupee-prefix">₹</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            className="head-amount-input"
                                                            placeholder="Amount"
                                                            value={newCharge.amount}
                                                            onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value.replace(/[^0-9]/g, '') })}
                                                        />
                                                    </div>
                                                    <select
                                                        value={newCharge.category}
                                                        onChange={(e) => setNewCharge({ ...newCharge, category: e.target.value })}
                                                        className="charge-category-select"
                                                    >
                                                        <option value="Activity">Activity</option>
                                                        <option value="Event">Event</option>
                                                        <option value="Fine">Fine</option>
                                                        <option value="Program">Program</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <select
                                                        value={newCharge.frequency}
                                                        onChange={(e) => setNewCharge({ ...newCharge, frequency: e.target.value })}
                                                        className="charge-category-select"
                                                    >
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="One-time">One-time</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                    </select>
                                                    <button className="charge-save-btn" onClick={handleAddCharge}>Save</button>
                                                    <button className="charge-cancel-btn" onClick={() => setShowAddCharge(false)}>✕</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* List of ad-hoc fees */}
                                        {(studentDues?.adhocFees || []).length > 0 ? (
                                            <div className="fee-months-list">
                                                {(studentDues.adhocFees || []).map(fee => {
                                                    const remaining = fee.amount - (fee.paidAmount || 0);
                                                    const isSelected = selectedAdhocFees.includes(fee._id);
                                                    const payAmt = adhocPayAmounts[fee._id] ?? String(remaining);
                                                    const numPayAmt = Number(payAmt) || 0;
                                                    const isPartial = numPayAmt > 0 && numPayAmt < remaining;
                                                    return (
                                                        <div key={fee._id} className={`fee-month-card ${isSelected ? 'selected' : ''} ${fee.isPaid ? 'paid-month' : ''}`}>
                                                            <div className="fee-month-header" onClick={() => toggleAdhocFee(fee)}>
                                                                <div className="fee-month-left">
                                                                    {isSelected
                                                                        ? <CheckCircle size={18} className="check-icon" />
                                                                        : (fee.isPaid ? <CheckCircle size={18} className="check-icon-paid" /> : <div className="empty-circle"></div>)
                                                                    }
                                                                    <span className="month-label">{fee.name}</span>
                                                                    <span className="adhoc-category-badge">{fee.category}</span>
                                                                    {fee.isPaid && <span className="month-paid-badge">Paid</span>}
                                                                </div>
                                                                <div className="fee-month-right">
                                                                    {isSelected ? (
                                                                        <div className="head-amount-input-wrap" onClick={(e) => e.stopPropagation()}>
                                                                            <span className="rupee-prefix">₹</span>
                                                                            <input
                                                                                type="text"
                                                                                inputMode="numeric"
                                                                                className={`head-amount-input ${isPartial ? 'partial' : ''}`}
                                                                                value={payAmt}
                                                                                onChange={(e) => updateAdhocPayAmount(fee._id, e.target.value, remaining)}
                                                                                onFocus={(e) => e.target.select()}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="month-amount">₹{remaining.toLocaleString()}</span>
                                                                    )}
                                                                    {isPartial && <span className="partial-tag">Partial</span>}
                                                                    {!fee.isPaid && fee.appliedTo === 'student' && (
                                                                        <button
                                                                            className="charge-delete-btn"
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteCharge(fee._id); }}
                                                                            title="Remove charge"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            !showAddCharge && <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '8px 0 0' }}>No additional charges. Click "+ Add Charge" to add event fees, fines, etc.</p>
                                        )}
                                    </div>

                                    {/* Monthly Fees Section */}
                                    <h4 className="fee-section-title">Select Months to Pay</h4>
                                    <div className="fee-months-list">
                                        {(studentDues.dues || []).map(due => (
                                            <div key={due.monthKey} className={`fee-month-card ${selectedMonths.includes(due.monthKey) ? "selected" : ""} ${due.isPaid ? "paid-month" : ""}`}>
                                                <div className="fee-month-header" onClick={() => toggleMonth(due.monthKey, due.feeBreakdown, due.isPaid)}>
                                                    <div className="fee-month-left">
                                                        {selectedMonths.includes(due.monthKey)
                                                            ? <CheckCircle size={18} className="check-icon" />
                                                            : (due.isPaid ? <CheckCircle size={18} className="check-icon-paid" /> : <div className="empty-circle"></div>)
                                                        }
                                                        <span className="month-label">{due.label}</span>
                                                        {due.isPaid && <span className="month-paid-badge">Paid</span>}
                                                    </div>
                                                    <div className="fee-month-right">
                                                        <span className="month-amount">₹{due.totalDue?.toLocaleString()}</span>
                                                        <button
                                                            className="expand-btn"
                                                            onClick={(e) => { e.stopPropagation(); toggleExpand(due.monthKey); }}
                                                        >
                                                            {expandedMonths.includes(due.monthKey) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expandable fee heads with editable amounts */}
                                                {expandedMonths.includes(due.monthKey) && (
                                                    <div className="fee-heads-breakdown">
                                                        {(due.feeBreakdown || []).map(head => {
                                                            const maxAmt = head.remainingAmount !== undefined ? head.remainingAmount : head.amount;
                                                            const rawVal = headPayAmounts[due.monthKey]?.[head.name];
                                                            const displayVal = rawVal !== undefined ? rawVal : String(maxAmt);
                                                            const numVal = Number(displayVal) || 0;
                                                            const isPartial = numVal > 0 && numVal < maxAmt;
                                                            const isZero = numVal === 0;
                                                            return (
                                                                <div key={head.name} className={`fee-head-row ${isZero ? "skipped" : ""}`}>
                                                                    <div className="fee-head-left" onClick={() => toggleHeadFull(due.monthKey, head.name, maxAmt)}>
                                                                        {numVal > 0
                                                                            ? <CheckCircle size={14} className="check-icon-sm" />
                                                                            : <div className="empty-circle-sm"></div>
                                                                        }
                                                                        <span className="head-name">{head.name}</span>
                                                                        {head.paidAmount > 0 && (
                                                                            <span className="head-paid-badge">₹{head.paidAmount} paid</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="fee-head-right">
                                                                        <span className="head-total-label">of ₹{maxAmt}</span>
                                                                        <div className="head-amount-input-wrap">
                                                                            <span className="rupee-prefix">₹</span>
                                                                            <input
                                                                                type="text"
                                                                                inputMode="numeric"
                                                                                className={`head-amount-input ${isPartial ? "partial" : ""}`}
                                                                                value={displayVal}
                                                                                onChange={(e) => updateHeadPayAmount(due.monthKey, head.name, e.target.value, maxAmt)}
                                                                                onFocus={(e) => e.target.select()}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                disabled={due.isPaid}
                                                                                readOnly={due.isPaid}
                                                                            />
                                                                        </div>
                                                                        {isPartial && <span className="partial-tag">Partial</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {/* Month subtotal */}
                                                        <div className="fee-head-row month-subtotal">
                                                            <span>Month Paying:</span>
                                                            <span className="month-subtotal-amount">
                                                                ₹ {Object.values(headPayAmounts[due.monthKey] || {}).reduce((s, v) => s + (Number(v) || 0), 0).toLocaleString()}
                                                                <span className="of-total"> / ₹{due.totalDue?.toLocaleString()}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* One-Time Fees Section */}
                                    {(studentDues.oneTimeFees || []).length > 0 && (
                                        <>
                                            <h4 className="fee-section-title mt-4">One-Time Fees</h4>
                                            <div className="fee-months-list">
                                                {(studentDues.oneTimeFees || []).map(fee => {
                                                    const isSelected = selectedOneTimeFees.includes(fee.name);
                                                    const payAmt = oneTimePayAmounts[fee.name] ?? fee.amount;
                                                    return (
                                                        <div
                                                            key={fee.name}
                                                            className={`fee-month-card onetime ${isSelected ? "selected" : ""} ${fee.isPaid ? "paid-month" : ""}`}
                                                        >
                                                            <div className="fee-month-header" onClick={() => toggleOneTimeFee(fee.name, fee.amount, fee.isPaid)}>
                                                                <div className="fee-month-left">
                                                                    {isSelected
                                                                        ? <CheckCircle size={18} className="check-icon" />
                                                                        : (fee.isPaid ? <CheckCircle size={18} className="check-icon-paid" /> : <div className="empty-circle"></div>)
                                                                    }
                                                                    <span className="month-label">{fee.name}</span>
                                                                    <span className="onetime-badge">One-time</span>
                                                                    {fee.isPaid && <span className="month-paid-badge">Paid</span>}
                                                                </div>
                                                                <div className="fee-month-right">
                                                                    {isSelected ? (
                                                                        <div className="head-amount-input-wrap" onClick={(e) => e.stopPropagation()}>
                                                                            <span className="rupee-prefix">₹</span>
                                                                            <input
                                                                                type="number"
                                                                                className="head-amount-input"
                                                                                value={payAmt}
                                                                                onChange={(e) => updateOneTimePayAmount(fee.name, e.target.value, fee.amount)}
                                                                                min="0"
                                                                                max={fee.amount}
                                                                            />
                                                                            <span className="head-total-label">of ₹{fee.amount}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="month-amount">₹{fee.amount?.toLocaleString()}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}


                                    {/* Late Fee & Discount */}
                                    <div className="fee-extras-grid mt-4">
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

                                    {/* Payment Mode */}
                                    <h4 className="fee-section-title mt-4">Payment Details</h4>
                                    <div className="payment-mode-selector">
                                        {["Cash", "Online", "Card", "UPI", "Cheque", "Bank Transfer"].map(mode => (
                                            <button
                                                key={mode}
                                                className={`payment-mode-btn ${paymentMode === mode ? "active" : ""}`}
                                                onClick={() => setPaymentMode(mode)}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Cheque Details */}
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

                                    {/* Transaction Details for Online/UPI/Bank Transfer */}
                                    {needsTransactionDetails && (
                                        <div className="transaction-details-section">
                                            <div className="fee-extras-grid">
                                                <div className="fee-input-group">
                                                    <label>Transaction / Reference ID</label>
                                                    <input
                                                        type="text"
                                                        value={transactionId}
                                                        onChange={(e) => setTransactionId(e.target.value)}
                                                        placeholder="e.g. TXN123456789"
                                                    />
                                                </div>
                                                <div className="fee-input-group">
                                                    <label>Upload Transaction Proof</label>
                                                    <div className="file-upload-area">
                                                        {transactionProofFile ? (
                                                            <div className="file-selected">
                                                                <span className="file-name">{transactionProofFile.name}</span>
                                                                <button
                                                                    className="file-remove-btn"
                                                                    onClick={() => setTransactionProofFile(null)}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="file-upload-label">
                                                                <Upload size={16} />
                                                                <span>Choose file (PDF, JPG, PNG)</span>
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                    onChange={(e) => setTransactionProofFile(e.target.files[0])}
                                                                    hidden
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Summary Box */}
                                    <div className="fee-summary-box">
                                        <div className="fee-summary-row">
                                            <span>Selected Fee Heads Total:</span>
                                            <span>₹ {selectedTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="fee-summary-row">
                                            <span>You Are Paying:</span>
                                            <span style={{ fontWeight: 700 }}>₹ {amountPaying.toLocaleString()}</span>
                                        </div>
                                        {amountLeftOnSelected > 0 && (
                                            <div className="fee-summary-row text-orange">
                                                <span>Remaining on Selected (pay later):</span>
                                                <span>₹ {amountLeftOnSelected.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {Number(lateFee) > 0 && (
                                            <div className="fee-summary-row">
                                                <span>Late Fee:</span>
                                                <span className="text-red">+ ₹ {Number(lateFee).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {Number(discountAmount) > 0 && (
                                            <div className="fee-summary-row">
                                                <span>Discount:</span>
                                                <span className="text-green">- ₹ {Number(discountAmount).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="fee-summary-row total">
                                            <span>💰 Net Amount to Collect:</span>
                                            <span>₹ {netPayable.toLocaleString()}</span>
                                        </div>
                                        <div className={`fee-summary-row amount-left ${(totalOutstanding - amountPaying) > 0 ? 'has-due' : 'all-clear'}`}>
                                            <span>📋 Total Due Left After Payment:</span>
                                            <span>₹ {Math.max(0, totalOutstanding - amountPaying).toLocaleString()}{(totalOutstanding - amountPaying) <= 0 ? ' — All Clear ✓' : ''}</span>
                                        </div>
                                    </div>

                                    <button
                                        className="pay-now-btn"
                                        onClick={handlePayment}
                                        disabled={isLoading || netPayable <= 0}
                                    >
                                        {isLoading ? "Processing..." : amountLeftOnSelected > 0 ? `Collect ₹${netPayable.toLocaleString()} (Partial) & Generate Receipt` : `Collect ₹${netPayable.toLocaleString()} & Generate Receipt`}
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
