import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getClasses, getFeeStructure, addAdhocFee, deleteAdhocFee, updateAdhocFee } from "../../../feature/accounting/accountingSlice";
import accountingService from "../../../feature/accounting/accountingService";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

const FeeStructureView = () => {
    const dispatch = useDispatch();
    const { classes, currentFeeStructure, isLoading } = useSelector((state) => state.accounting);
    const [selectedClass, setSelectedClass] = useState("");
    const [classCharges, setClassCharges] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCharge, setNewCharge] = useState({ name: "", amount: "", category: "Other", frequency: "Monthly", section: "" });

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({ name: "", amount: "", category: "", frequency: "", section: "" });

    useEffect(() => {
        dispatch(getClasses());
    }, [dispatch]);

    const handleClassSelect = (e) => {
        const className = e.target.value;
        setSelectedClass(className);
        if (className) {
            dispatch(getFeeStructure(className));
            fetchClassCharges(className);
        }
    };

    const fetchClassCharges = async (className) => {
        try {
            const res = await accountingService.getAdhocFeesByClass(className);
            setClassCharges(Array.isArray(res) ? res : []);
        } catch { setClassCharges([]); }
    };

    const handleAddClassCharge = async () => {
        if (!newCharge.name.trim() || !newCharge.amount) {
            alert("Please enter charge name and amount");
            return;
        }
        await dispatch(addAdhocFee({
            name: newCharge.name.trim(),
            amount: Number(newCharge.amount),
            appliedTo: "class",
            className: selectedClass,
            section: newCharge.section,
            category: newCharge.category,
            frequency: newCharge.frequency
        }));
        setNewCharge({ name: "", amount: "", category: "Other", frequency: "Monthly", section: "" });
        setShowAddForm(false);
        fetchClassCharges(selectedClass);
    };

    const handleDeleteCharge = async (feeId) => {
        if (!window.confirm("Remove this charge?")) return;
        await dispatch(deleteAdhocFee(feeId));
        fetchClassCharges(selectedClass);
    };

    const handleStartEdit = (charge) => {
        setEditingId(charge._id);
        setEditValues({
            name: charge.name,
            amount: String(charge.amount),
            category: charge.category || "Other",
            frequency: charge.frequency || "Monthly",
            section: charge.section || ""
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValues({ name: "", amount: "", category: "", frequency: "", section: "" });
    };

    const handleSaveEdit = async (feeId) => {
        if (!editValues.name.trim() || !editValues.amount) {
            alert("Name and amount are required");
            return;
        }
        await dispatch(updateAdhocFee({
            feeId,
            data: {
                name: editValues.name.trim(),
                amount: Number(editValues.amount),
                category: editValues.category,
                frequency: editValues.frequency,
                section: editValues.section
            }
        }));
        setEditingId(null);
        fetchClassCharges(selectedClass);
    };

    return (
        <div className="accountant-dashboard-view">
            <div className="accountant-header-container">
                <h2 className="accountant-page-title">Fee Structure Review</h2>
            </div>

            <div className="accountant-card mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class to View Structure</label>
                <select
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleClassSelect}
                    defaultValue=""
                >
                    <option value="" disabled>Select a class</option>
                    {classes.map(c => (
                        <option key={c._id} value={c.className}>{c.className}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Note: Main fee structure changes must be made by the School Admin.</p>
            </div>

            <div className="accountant-card">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading structure...</div>
                ) : currentFeeStructure ? (
                    <div>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">
                                Structure: <span className="text-blue-600">{currentFeeStructure.className}</span>
                            </h3>
                            <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                                Active Configuration
                            </span>
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                    <th className="p-4 font-semibold text-sm w-16">S.No</th>
                                    <th className="p-4 font-semibold text-sm">Fee Head Name</th>
                                    <th className="p-4 font-semibold text-sm">Frequency</th>
                                    <th className="p-4 font-semibold text-sm text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentFeeStructure.feeHeads.map((head, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-500">{index + 1}</td>
                                        <td className="p-4 font-medium text-gray-900">{head.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-md ${head.frequency === 'Monthly' ? 'bg-blue-50 text-blue-700' :
                                                head.frequency === 'Yearly' ? 'bg-purple-50 text-purple-700' :
                                                    'bg-orange-50 text-orange-700'
                                                }`}>
                                                {head.frequency}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-right">₹ {head.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="p-4 text-right font-bold text-gray-700">Total Monthly Payable:</td>
                                    <td className="p-4 text-right font-bold text-lg text-blue-600">
                                        ₹ {currentFeeStructure.feeHeads
                                            .filter(h => h.frequency === 'Monthly')
                                            .reduce((sum, h) => sum + h.amount, 0)
                                            .toLocaleString()}
                                    </td>
                                </tr>
                                {currentFeeStructure.feeHeads.some(h => h.frequency === 'Quarterly') && (
                                    <tr className="bg-teal-50">
                                        <td colSpan="3" className="p-4 text-right font-semibold text-teal-700">Quarterly Payable (per quarter):</td>
                                        <td className="p-4 text-right font-bold text-lg text-teal-700">
                                            ₹ {currentFeeStructure.feeHeads
                                                .filter(h => h.frequency === 'Quarterly')
                                                .reduce((sum, h) => sum + h.amount, 0)
                                                .toLocaleString()}
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">📋</div>
                        <p>Select a class above to view its fee structure</p>
                    </div>
                )}
            </div>

            {/* Additional Class Charges Section */}
            {selectedClass && (
                <div className="accountant-card" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 className="text-lg font-bold text-gray-800">
                            Additional Class Charges — <span className="text-blue-600">{selectedClass}</span>
                        </h3>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', border: 'none',
                                borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: '#fff', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            <Plus size={14} /> Add Class Charge
                        </button>
                    </div>

                    {/* Add Form */}
                    {showAddForm && (
                        <div style={{
                            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px',
                            padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px'
                        }}>
                            <input
                                type="text"
                                placeholder="Charge name (e.g. Annual Day Fee, Lab Fee, Dance Class)"
                                value={newCharge.name}
                                onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                                    <span style={{ padding: '6px 8px', background: '#f1f5f9', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>₹</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Amount"
                                        value={newCharge.amount}
                                        onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value.replace(/[^0-9]/g, '') })}
                                        style={{ padding: '6px 10px', border: 'none', outline: 'none', width: '100px', fontSize: '0.88rem' }}
                                    />
                                </div>
                                <select
                                    value={newCharge.category}
                                    onChange={(e) => setNewCharge({ ...newCharge, category: e.target.value })}
                                    style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
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
                                    style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="One-time">One-time</option>
                                    <option value="Quarterly">Quarterly</option>
                                </select>
                                <select
                                    value={newCharge.section}
                                    onChange={(e) => setNewCharge({ ...newCharge, section: e.target.value })}
                                    style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                                >
                                    <option value="">All Sections</option>
                                    <option value="A">Section A</option>
                                    <option value="B">Section B</option>
                                    <option value="C">Section C</option>
                                    <option value="D">Section D</option>
                                </select>
                                <button
                                    onClick={handleAddClassCharge}
                                    style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', background: '#16a34a', color: '#fff', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}
                                >Save</button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}
                                >✕</button>
                            </div>
                        </div>
                    )}

                    {/* List of class charges */}
                    {classCharges.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                    <th className="p-3 font-semibold text-sm">Charge Name</th>
                                    <th className="p-3 font-semibold text-sm">Category</th>
                                    <th className="p-3 font-semibold text-sm">Frequency</th>
                                    <th className="p-3 font-semibold text-sm">Section</th>
                                    <th className="p-3 font-semibold text-sm">Added By</th>
                                    <th className="p-3 font-semibold text-sm text-right">Amount (₹)</th>
                                    <th className="p-3 font-semibold text-sm text-center" style={{ width: '80px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {classCharges.map(charge => (
                                    <tr key={charge._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        {editingId === charge._id ? (
                                            // Inline edit row
                                            <>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={editValues.name}
                                                        onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                                                        style={{ width: '100%', padding: '4px 8px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.84rem', outline: 'none' }}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <select
                                                        value={editValues.category}
                                                        onChange={e => setEditValues({ ...editValues, category: e.target.value })}
                                                        style={{ padding: '4px 6px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.8rem', background: '#fff' }}
                                                    >
                                                        <option value="Activity">Activity</option>
                                                        <option value="Event">Event</option>
                                                        <option value="Fine">Fine</option>
                                                        <option value="Program">Program</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <select
                                                        value={editValues.frequency}
                                                        onChange={e => setEditValues({ ...editValues, frequency: e.target.value })}
                                                        style={{ padding: '4px 6px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.8rem', background: '#fff' }}
                                                    >
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="One-time">One-time</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <select
                                                        value={editValues.section}
                                                        onChange={e => setEditValues({ ...editValues, section: e.target.value })}
                                                        style={{ padding: '4px 6px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.8rem', background: '#fff' }}
                                                    >
                                                        <option value="">All</option>
                                                        <option value="A">A</option>
                                                        <option value="B">B</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 text-gray-400 text-xs">
                                                    {charge.addedByRole === 'accountant' ? 'Accountant' : 'Admin'}
                                                </td>
                                                <td className="p-2 text-right">
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', background: '#fff', border: '1px solid #93c5fd', borderRadius: '4px', overflow: 'hidden', width: '110px', marginLeft: 'auto' }}>
                                                        <span style={{ padding: '4px 6px', background: '#f1f5f9', color: '#64748b', fontWeight: '600', fontSize: '0.82rem' }}>₹</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={editValues.amount}
                                                            onChange={e => setEditValues({ ...editValues, amount: e.target.value.replace(/[^0-9]/g, '') })}
                                                            style={{ padding: '4px 6px', border: 'none', outline: 'none', width: '70px', fontSize: '0.84rem', textAlign: 'right' }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleSaveEdit(charge._id)}
                                                            style={{ background: '#dcfce7', border: 'none', color: '#16a34a', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px' }}
                                                            title="Save changes"
                                                        >
                                                            <Check size={15} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            style={{ background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px' }}
                                                            title="Cancel"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            // Normal read row
                                            <>
                                                <td className="p-3 font-medium text-gray-900">{charge.name}</td>
                                                <td className="p-3">
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600',
                                                        background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4338ca', textTransform: 'uppercase'
                                                    }}>{charge.category}</span>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 text-xs rounded-md ${charge.frequency === 'Monthly' ? 'bg-blue-50 text-blue-700' :
                                                        charge.frequency === 'Quarterly' ? 'bg-purple-50 text-purple-700' :
                                                            'bg-orange-50 text-orange-700'
                                                        }`}>{charge.frequency || "One-time"}</span>
                                                </td>
                                                <td className="p-3 text-gray-600 font-medium">{charge.section || "All"}</td>
                                                <td className="p-3">
                                                    {charge.addedByRole ? (
                                                        <span style={{
                                                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                                            background: charge.addedByRole === 'accountant' ? '#f0fdf4' : '#f0f9ff',
                                                            color: charge.addedByRole === 'accountant' ? '#166534' : '#0369a1',
                                                            border: `1px solid ${charge.addedByRole === 'accountant' ? '#bbf7d0' : '#bae6fd'}`
                                                        }}>
                                                            {charge.addedByRole === 'accountant' ? 'Accountant' : 'Admin'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Unknown</span>
                                                    )}
                                                </td>
                                                <td className="p-3 font-semibold text-right">₹ {Number(charge.amount).toLocaleString()}</td>
                                                <td className="p-3 text-center">
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                        {!charge.isPaid && (
                                                            <button
                                                                onClick={() => handleStartEdit(charge)}
                                                                style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                                                                title="Edit charge"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                        )}
                                                        {!charge.isPaid && (
                                                            <button
                                                                onClick={() => handleDeleteCharge(charge._id)}
                                                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                                                title="Delete charge"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-6 text-gray-500" style={{ fontSize: '0.88rem' }}>
                            No additional charges for this class. Click "+ Add Class Charge" to add event fees, activity fees, fines, etc.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeeStructureView;
