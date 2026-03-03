import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getClasses, getFeeHeads, getFeeStructure, saveFeeStructure, createFeeHead, deleteAdhocFee, updateAdhocFee } from "../../../feature/accounting/accountingSlice";
import accountingService from "../../../feature/accounting/accountingService";
import { Settings, Plus, Save, Trash2, Info, Pencil, Check, X } from "lucide-react";

/**
 * SuperAdmin / SchoolAdmin Fee Configuration
 * Defines classes, fee heads, and customizes fee structures
 */
const FeeManagementView = () => {
    const dispatch = useDispatch();
    const { classes, feeHeads, currentFeeStructure, isLoading } = useSelector((state) => state.accounting);

    const [activeTab, setActiveTab] = useState("Structure");

    // Forms State
    // const [newClass, setNewClass] = useState("");
    const [newFeeHead, setNewFeeHead] = useState({ name: "", type: "Standard", frequency: "Monthly", optional: false });
    const [selectedClass, setSelectedClass] = useState("");

    // Structure Builder State
    const [structureBuilder, setStructureBuilder] = useState([]);
    const [classCharges, setClassCharges] = useState([]);

    // Edit state for additional charges
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({ name: "", amount: "", category: "", frequency: "", section: "" });

    useEffect(() => {
        dispatch(getClasses());
        dispatch(getFeeHeads());
    }, [dispatch]);

    // Handle Class Creation
    // const handleCreateClass = (e) => {
    //     e.preventDefault();
    //     if (newClass) {
    //         dispatch(createClass({ className: newClass }));
    //         setNewClass("");
    //         // Need a brief timeout or API refresh pattern
    //         setTimeout(() => dispatch(getClasses()), 500);
    //     }
    // };

    // Handle Fee Head Creation
    const handleCreateFeeHead = (e) => {
        e.preventDefault();
        if (newFeeHead.name) {
            dispatch(createFeeHead(newFeeHead));
            setNewFeeHead({ name: "", type: "Standard", frequency: "Monthly", optional: false });
            setTimeout(() => dispatch(getFeeHeads()), 500);
        }
    };

    // Load structure for selected class
    useEffect(() => {
        if (selectedClass) {
            dispatch(getFeeStructure(selectedClass));
            fetchClassCharges(selectedClass);
        }
    }, [selectedClass, dispatch]);

    const fetchClassCharges = async (className) => {
        try {
            const res = await accountingService.getAdhocFeesByClass(className);
            setClassCharges(Array.isArray(res) ? res : []);
        } catch { setClassCharges([]); }
    };

    const handleDeleteCharge = async (feeId) => {
        if (!window.confirm("Remove this additional charge?")) return;
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

    useEffect(() => {
        if (currentFeeStructure && currentFeeStructure.className === selectedClass) {
            setStructureBuilder(currentFeeStructure.feeHeads);
        } else {
            setStructureBuilder([]);
        }
    }, [currentFeeStructure, selectedClass]);

    // Structure Builder Handlers
    const addHeadToStructure = (headId) => {
        const head = feeHeads.find(h => h._id === headId);
        if (head && !structureBuilder.find(s => s.headId === headId)) {
            setStructureBuilder([...structureBuilder, { headId: head._id, name: head.name, frequency: head.frequency, amount: 0 }]);
        }
    };

    const removeHeadFromStructure = (headId) => {
        setStructureBuilder(structureBuilder.filter(s => s.headId !== headId));
    };

    const updateHeadAmount = (headId, amount) => {
        setStructureBuilder(structureBuilder.map(s =>
            s.headId === headId ? { ...s, amount: Number(amount) } : s
        ));
    };

    const handleSaveStructure = () => {
        if (!selectedClass) return alert("Select a class first");
        if (structureBuilder.length === 0) return alert("Add at least one fee head");

        // Validate amounts
        if (structureBuilder.some(s => s.amount <= 0)) {
            return alert("All fee amounts must be greater than 0");
        }

        dispatch(saveFeeStructure({
            className: selectedClass,
            feeHeads: structureBuilder
        }));
        alert("Fee structure saved successfully");
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Settings size={28} className="text-blue-600" />
                        Fee Management
                    </h2>
                    <p className="text-gray-500 mt-2">Configure classes, fee types, and structures for your school.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="flex border-b border-gray-200">
                    {["Structure", "Classes", "Fee Heads"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-4 font-medium text-sm transition-colors relative ${activeTab === tab ? "text-blue-700 bg-blue-50/50" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            {tab} Configuration
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* STRUCTURE TAB */}
                    {activeTab === "Structure" && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">1. Select Class</h3>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="" disabled>-- Select Class --</option>
                                    {classes.map(c => <option key={c._id} value={c.className}>{c.className}</option>)}
                                </select>
                                {classes.length === 0 && (
                                    <p className="text-sm text-red-500 mt-2 font-medium">⚠️ No classes found. Please create classes in the "Classes Configuration" tab first.</p>
                                )}
                                <div className="mb-6"></div>

                                <h3 className="text-lg font-bold text-gray-800 mb-4 mt-8">2. Add Fee Heads</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    {feeHeads.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No fee heads created yet. Go to "Fee Heads Configuration" to create them.</p>
                                    ) : feeHeads.map(head => {
                                        const isAdded = structureBuilder.some(s => s.headId === head._id);
                                        return (
                                            <div key={head._id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-sm text-gray-800">{head.name}</p>
                                                    <p className="text-xs text-gray-500">{head.frequency}</p>
                                                </div>
                                                <button
                                                    onClick={() => isAdded ? removeHeadFromStructure(head._id) : addHeadToStructure(head._id)}
                                                    className={`p-1.5 rounded-full ${isAdded ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                                >
                                                    {isAdded ? <Trash2 size={16} /> : <Plus size={16} />}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="md:col-span-8">
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
                                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="text-xl font-bold text-gray-800">
                                            Structure Editor: <span className="text-blue-600">{selectedClass || "No Class Selected"}</span>
                                        </h3>
                                        <button
                                            onClick={handleSaveStructure}
                                            disabled={!selectedClass || structureBuilder.length === 0}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Save size={18} /> Save Structure
                                        </button>
                                    </div>

                                    <div className="p-6 flex-1">
                                        {!selectedClass ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                <Settings size={64} className="mb-4 opacity-20" />
                                                <p className="text-lg">Select a class to build its fee structure</p>
                                            </div>
                                        ) : structureBuilder.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                <Plus size={64} className="mb-4 opacity-20" />
                                                <p className="text-lg">Add fee heads from the left panel</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">
                                                    <div className="col-span-5">Fee Head</div>
                                                    <div className="col-span-3">Frequency</div>
                                                    <div className="col-span-3 text-right">Amount (₹)</div>
                                                    <div className="col-span-1 text-center">Action</div>
                                                </div>

                                                {structureBuilder.map(item => (
                                                    <div key={item.headId} className="grid grid-cols-12 gap-4 items-center py-2">
                                                        <div className="col-span-5 font-medium text-gray-800">{item.name}</div>
                                                        <div className="col-span-3">
                                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                                                {item.frequency}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.amount || ""}
                                                                onChange={(e) => updateHeadAmount(item.headId, e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 text-center">
                                                            <button onClick={() => removeHeadFromStructure(item.headId)} className="text-gray-400 hover:text-red-500 p-1">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                                                    <div className="bg-blue-50 px-8 py-4 rounded-xl border border-blue-100">
                                                        <span className="text-sm font-semibold text-blue-800 mr-4">Total Monthly Payable:</span>
                                                        <span className="text-2xl font-bold text-blue-700">
                                                            ₹ {structureBuilder.filter(s => s.frequency === "Monthly").reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- ADD ADMIN VIEW FOR CLASS CHARGES MIGRATED FROM ACCOUNTANT PORTAL --- */}
                            {selectedClass && (
                                <div className="md:col-span-12 mt-8">
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                                            <h3 className="text-xl font-bold text-gray-800">
                                                Additional Class Charges <span className="text-blue-600">— {selectedClass}</span>
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">Temporary or event-based fees applied directly to this class.</p>
                                        </div>
                                        <div className="p-6">
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
                                                                    <>
                                                                        <td className="p-2">
                                                                            <input type="text" value={editValues.name} onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                                                                                style={{ width: '100%', padding: '4px 8px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.84rem', outline: 'none' }} />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <select value={editValues.category} onChange={e => setEditValues({ ...editValues, category: e.target.value })}
                                                                                style={{ padding: '4px 6px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.8rem', background: '#fff' }}>
                                                                                <option value="Activity">Activity</option>
                                                                                <option value="Event">Event</option>
                                                                                <option value="Fine">Fine</option>
                                                                                <option value="Program">Program</option>
                                                                                <option value="Other">Other</option>
                                                                            </select>
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <select value={editValues.frequency} onChange={e => setEditValues({ ...editValues, frequency: e.target.value })}
                                                                                style={{ padding: '4px 6px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.8rem', background: '#fff' }}>
                                                                                <option value="Monthly">Monthly</option>
                                                                                <option value="One-time">One-time</option>
                                                                                <option value="Quarterly">Quarterly</option>
                                                                            </select>
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <select value={editValues.section} onChange={e => setEditValues({ ...editValues, section: e.target.value })}
                                                                                style={{ padding: '4px 6px', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '0.8rem', background: '#fff' }}>
                                                                                <option value="">All</option>
                                                                                <option value="A">A</option>
                                                                                <option value="B">B</option>
                                                                                <option value="C">C</option>
                                                                                <option value="D">D</option>
                                                                            </select>
                                                                        </td>
                                                                        <td className="p-2 text-gray-400 text-xs">{charge.addedByRole === 'accountant' ? 'Accountant' : 'Admin'}</td>
                                                                        <td className="p-2 text-right">
                                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', background: '#fff', border: '1px solid #93c5fd', borderRadius: '4px', overflow: 'hidden', width: '110px', marginLeft: 'auto' }}>
                                                                                <span style={{ padding: '4px 6px', background: '#f1f5f9', color: '#64748b', fontWeight: '600', fontSize: '0.82rem' }}>₹</span>
                                                                                <input type="text" inputMode="numeric" value={editValues.amount} onChange={e => setEditValues({ ...editValues, amount: e.target.value.replace(/[^0-9]/g, '') })}
                                                                                    style={{ padding: '4px 6px', border: 'none', outline: 'none', width: '70px', fontSize: '0.84rem', textAlign: 'right' }} />
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-2 text-center">
                                                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                                <button onClick={() => handleSaveEdit(charge._id)} style={{ background: '#dcfce7', border: 'none', color: '#16a34a', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px' }} title="Save"><Check size={15} /></button>
                                                                                <button onClick={handleCancelEdit} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px' }} title="Cancel"><X size={15} /></button>
                                                                            </div>
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td className="p-3 font-medium text-gray-900">{charge.name}</td>
                                                                        <td className="p-3">
                                                                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4338ca', textTransform: 'uppercase' }}>{charge.category}</span>
                                                                        </td>
                                                                        <td className="p-3">
                                                                            <span className={`px-2 py-1 text-xs rounded-md ${charge.frequency === 'Monthly' ? 'bg-blue-50 text-blue-700' : charge.frequency === 'Quarterly' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'}`}>{charge.frequency || "One-time"}</span>
                                                                        </td>
                                                                        <td className="p-3 text-gray-600 font-medium">{charge.section || "All"}</td>
                                                                        <td className="p-3">
                                                                            {charge.addedByRole ? (
                                                                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: charge.addedByRole === 'accountant' ? '#f0fdf4' : '#f0f9ff', color: charge.addedByRole === 'accountant' ? '#166534' : '#0369a1', border: `1px solid ${charge.addedByRole === 'accountant' ? '#bbf7d0' : '#bae6fd'}` }}>
                                                                                    {charge.addedByRole === 'accountant' ? 'Accountant' : 'Admin'}
                                                                                </span>
                                                                            ) : (<span className="text-gray-400 text-xs">Unknown</span>)}
                                                                        </td>
                                                                        <td className="p-3 font-semibold text-right">₹ {Number(charge.amount).toLocaleString()}</td>
                                                                        <td className="p-3 text-center">
                                                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                                {!charge.isPaid && (
                                                                                    <button onClick={() => handleStartEdit(charge)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }} title="Edit charge"><Pencil size={15} /></button>
                                                                                )}
                                                                                {!charge.isPaid && (
                                                                                    <button onClick={() => handleDeleteCharge(charge._id)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }} title="Delete charge"><Trash2 size={15} /></button>
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
                                                <div className="text-center py-6 text-gray-500 flex flex-col items-center">
                                                    <Info className="mb-2 text-gray-300" size={32} />
                                                    <p style={{ fontSize: '0.88rem' }}>No ad-hoc charges exist for this class.</p>
                                                    <p className="text-xs text-gray-400 mt-1">To add custom class-wide fees, please use the Accountant Portal module.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* CLASSES TAB */}
                    {activeTab === "Classes" && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                <span className="text-blue-500 text-xl mt-0.5">ℹ️</span>
                                <div>
                                    <p className="font-semibold text-blue-800">Classes auto-populate from Student Records</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        All classes below are automatically detected from your enrolled students.
                                        To add a new class, simply enroll a student in that class from the <strong>Students</strong> section.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-700">#</th>
                                            <th className="p-4 font-semibold text-gray-700">Class Name</th>
                                            <th className="p-4 font-semibold text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.length === 0 ? (
                                            <tr><td colSpan={3} className="p-6 text-center text-gray-400">No classes found. Enroll students to populate classes.</td></tr>
                                        ) : classes.map((c, idx) => (
                                            <tr key={c._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                <td className="p-4 text-gray-400 text-sm">{idx + 1}</td>
                                                <td className="p-4 font-semibold text-gray-800">{c.className}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 text-xs rounded-md bg-green-50 text-green-700 font-medium">Active</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {/* FEE HEADS TAB */}
                    {activeTab === "Fee Heads" && (
                        <div className="flex gap-8">
                            <div className="flex-1 w-full max-w-md bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    Create Fee Head
                                </h3>
                                <form onSubmit={handleCreateFeeHead} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fee Head Name</label>
                                        <input
                                            type="text"
                                            value={newFeeHead.name}
                                            onChange={(e) => setNewFeeHead({ ...newFeeHead, name: e.target.value })}
                                            placeholder="e.g. Tuition Fee"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                        <select
                                            value={newFeeHead.frequency}
                                            onChange={(e) => setNewFeeHead({ ...newFeeHead, frequency: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly (Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar)</option>
                                            <option value="One-time">One-time (Admission)</option>
                                            <option value="Yearly">Yearly (Annual Charges)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type/Category</label>
                                        <select
                                            value={newFeeHead.type}
                                            onChange={(e) => setNewFeeHead({ ...newFeeHead, type: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="Tuition">Tuition</option>
                                            <option value="Transport">Transport</option>
                                            <option value="Registration">Registration</option>
                                        </select>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 mt-4">
                                        Add Fee Head
                                    </button>
                                </form>
                            </div>

                            <div className="flex-[2] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-700">Head Name</th>
                                            <th className="p-4 font-semibold text-gray-700">Frequency</th>
                                            <th className="p-4 font-semibold text-gray-700">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feeHeads.map(head => (
                                            <tr key={head._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-800">{head.name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs rounded-md ${head.frequency === 'Monthly' ? 'bg-blue-50 text-blue-700' :
                                                            head.frequency === 'Quarterly' ? 'bg-teal-50 text-teal-700' :
                                                                head.frequency === 'Yearly' ? 'bg-purple-50 text-purple-700' :
                                                                    'bg-orange-50 text-orange-700'
                                                        }`}>
                                                        {head.frequency}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600">{head.type}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeeManagementView;
