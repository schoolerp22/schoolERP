import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentDues, addAdhocFee, deleteAdhocFee } from '../../../feature/accounting/accountingSlice';
import { X, User, Phone, Mail, MapPin, Users, Bus, CreditCard, BookOpen, Plus, Trash2, Loader2, Info } from 'lucide-react';

const StudentDetailModal = ({ isOpen, onClose, student }) => {
    const dispatch = useDispatch();
    const { studentDues, isLoading } = useSelector((state) => state.accounting);

    const [showAddCharge, setShowAddCharge] = useState(false);
    const [newCharge, setNewCharge] = useState({ name: "", amount: "", category: "Other", frequency: "One-time" });

    useEffect(() => {
        if (isOpen && student?.admission_no) {
            dispatch(getStudentDues(student.admission_no));
        }
    }, [isOpen, student, dispatch]);

    const handleAddCharge = async () => {
        if (!newCharge.name.trim() || !newCharge.amount) {
            alert("Please enter charge name and amount");
            return;
        }
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
        dispatch(getStudentDues(student.admission_no));
    };

    const handleDeleteCharge = async (feeId) => {
        if (!window.confirm("Remove this charge?")) return;
        await dispatch(deleteAdhocFee(feeId));
        dispatch(getStudentDues(student.admission_no));
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                    <h3 className="text-2xl font-semibold text-gray-900">Student Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                            <User size={20} />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Admission No</p>
                                <p className="font-semibold text-gray-900">{student.admission_no}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Roll No</p>
                                <p className="font-semibold text-gray-900">{student.roll_no}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Class</p>
                                <p className="font-semibold text-gray-900">{student.class}-{student.section}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">House</p>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {student.house}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Charges / Ad-Hoc Fees Section */}
                    <div className="border-2 border-indigo-100 p-6 rounded-lg bg-indigo-50/30">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                                <CreditCard size={20} className="text-indigo-600" />
                                Individual Student Charges (Fines, Extra Classes, etc.)
                            </h4>
                            <button
                                onClick={() => setShowAddCharge(!showAddCharge)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                                <Plus size={16} /> Add Charge
                            </button>
                        </div>

                        {showAddCharge && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-200 mb-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Charge Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Science Exhibition Fee, Library Fine"
                                            value={newCharge.name}
                                            onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Amount (₹)</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="0"
                                                value={newCharge.amount}
                                                onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value.replace(/[^0-9]/g, '') })}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Category</label>
                                            <select
                                                value={newCharge.category}
                                                onChange={(e) => setNewCharge({ ...newCharge, category: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            >
                                                <option value="Activity">Activity</option>
                                                <option value="Event">Event</option>
                                                <option value="Fine">Fine</option>
                                                <option value="Program">Program</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowAddCharge(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCharge}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                                    >
                                        Apply Charge
                                    </button>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        ) : studentDues?.adhocFees?.length > 0 ? (
                            <div className="overflow-x-auto bg-white rounded-lg border border-indigo-100">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-600">Charge Name</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600">Category</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">Amount</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {studentDues.adhocFees.map((fee) => (
                                            <tr key={fee._id} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-800">{fee.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                        {fee.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-gray-900 text-right font-mono">
                                                    ₹{fee.amount?.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {!fee.isPaid ? (
                                                        <button
                                                            onClick={() => handleDeleteCharge(fee._id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete Charge"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Paid</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-indigo-200">
                                <Info className="mx-auto text-indigo-300 mb-2" size={32} />
                                <p className="text-sm text-gray-500">No individual charges applied to this student.</p>
                                <p className="text-xs text-gray-400 mt-1">Use "Add Charge" to apply student-specific fines or fees.</p>
                            </div>
                        )}
                    </div>

                    {/* Personal Details */}
                    <div className="border border-gray-200 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={20} />
                            Personal Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Full Name</p>
                                <p className="font-semibold text-gray-900">
                                    {student.personal_details?.first_name} {student.personal_details?.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Gender</p>
                                <p className="font-semibold text-gray-900">{student.personal_details?.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date of Birth</p>
                                <p className="font-semibold text-gray-900">{student.personal_details?.date_of_birth || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-semibold text-gray-900">{student.personal_details?.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-semibold text-gray-900">{student.personal_details?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 col-span-2">
                                <MapPin size={16} className="text-gray-500 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-semibold text-gray-900">{student.personal_details?.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Identity Documents */}
                    <div className="border border-gray-200 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-4">Identity Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Aadhar Number</p>
                                <p className="font-semibold text-gray-900 font-mono">{student.identity?.aadhar_no || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">PAN Number</p>
                                <p className="font-semibold text-gray-900 font-mono">{student.identity?.pan_no || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Parent Details */}
                    <div className="border border-gray-200 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users size={20} />
                            Parent Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Father's Name</p>
                                <p className="font-semibold text-gray-900">{student.parent_record?.father_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Mother's Name</p>
                                <p className="font-semibold text-gray-900">{student.parent_record?.mother_name || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Primary Contact</p>
                                    <p className="font-semibold text-gray-900">{student.parent_record?.primary_contact || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Secondary Contact</p>
                                    <p className="font-semibold text-gray-900">{student.parent_record?.secondary_contact || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transport Details */}
                    <div className="border border-gray-200 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bus size={20} />
                            Transport Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${student.transport?.used ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {student.transport?.used ? 'Using Transport' : 'Not Using Transport'}
                                </span>
                            </div>
                            {student.transport?.used && (
                                <>
                                    <div>
                                        <p className="text-sm text-gray-600">Bus Number</p>
                                        <p className="font-semibold text-gray-900">{student.transport?.bus_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Monthly Fee</p>
                                        <p className="font-semibold text-gray-900">₹{student.transport?.monthly_fee || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Distance</p>
                                        <p className="font-semibold text-gray-900">{student.transport?.distance || 0} km</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Pickup Location</p>
                                        <p className="font-semibold text-gray-900">{student.transport?.pickup_location || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Drop Location</p>
                                        <p className="font-semibold text-gray-900">{student.transport?.drop_location || 'N/A'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    {student.payment_history && student.payment_history.length > 0 && (
                        <div className="border border-gray-200 p-6 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard size={20} />
                                Payment History
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {student.payment_history.map((payment, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-sm text-gray-900">₹{payment.amount}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${payment.status === 'Paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600">{payment.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Exam Records */}
                    {student.exam_records && student.exam_records.length > 0 && (
                        <div className="border border-gray-200 p-6 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <BookOpen size={20} />
                                Exam Records
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks Obtained</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Marks</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {student.exam_records.map((exam, index) => {
                                            const percentage = ((exam.marks_obtained / exam.total_marks) * 100).toFixed(2);
                                            return (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{exam.term}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{exam.subject}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{exam.marks_obtained}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-600">{exam.total_marks}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${percentage >= 75
                                                            ? 'bg-green-100 text-green-800'
                                                            : percentage >= 50
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;
