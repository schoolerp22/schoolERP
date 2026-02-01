import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchStudentTeachers,
    applyForLeave,
    getStudentLeaves
} from "../../../feature/students/studentSlice";
import LeaveHistory from "./LeaveHistory";
import {  Calendar, User, FileText, CheckCircle,  AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

const LeaveApplication = () => {
    const dispatch = useDispatch();
    const { profile, teachers, loading, leaveSuccess, error } = useSelector(
        (state) => state.student
    );

    const [activeTab, setActiveTab] = useState("apply"); // apply or history

    const [leaveData, setLeaveData] = useState({
        type: "One Day", // One Day, Multi Day
        from_date: "",
        to_date: "",
        reason: "",
        target_teacher_id: ""
    });

    // Fetch teachers on mount - Optimized to prevent infinite loops
    useEffect(() => {
        // Only fetch if we have an ID, teachers is null (not yet fetched), not currently loading, and no error
        if (profile?.admission_no && teachers === null && !loading && !error) {
            dispatch(fetchStudentTeachers(profile.admission_no));
        }
    }, [dispatch, profile?.admission_no, teachers, loading, error]);

    // Handle success
    useEffect(() => {
        if (leaveSuccess) {
            toast.success("Leave application submitted successfully!");
            dispatch(getStudentLeaves(profile.admission_no)); // Refresh history
            setLeaveData({
                type: "One Day",
                from_date: "",
                to_date: "",
                reason: "",
                target_teacher_id: ""
            });
            setActiveTab("history"); // Auto switch to history
        }
    }, [leaveSuccess, dispatch, profile?.admission_no]);

    // Handle error
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const handleChange = (e) => {
        setLeaveData({ ...leaveData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!leaveData.target_teacher_id) {
            toast.error("Please select a teacher for approval.");
            return;
        }
        if (!leaveData.from_date || !leaveData.reason) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const payload = {
            ...leaveData,
            to_date: leaveData.type === "One Day" ? leaveData.from_date : leaveData.to_date
        };

        dispatch(applyForLeave({
            studentId: profile.admission_no,
            leaveData: payload
        }));
    };

    return (
        <div className=" bg-gray-50 min-h-screen">
            <div className="">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FileText className="text-indigo-600" />
                    Leave Management
                </h1>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-gray-200 w-fit">
                    <button
                        onClick={() => setActiveTab("apply")}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "apply"
                            ? "bg-indigo-600 text-white shadow-md"
                            : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
                            }`}
                    >
                        Apply for Leave
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "history"
                            ? "bg-indigo-600 text-white shadow-md"
                            : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
                            }`}
                    >
                        Leave History
                    </button>
                </div>

                {activeTab === "apply" ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* ... existing form fields ... */}

                            {/* 1. Select Teacher */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Approving Teacher <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        name="target_teacher_id"
                                        value={leaveData.target_teacher_id}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                                    >
                                        <option value="">-- Select Class Teacher / Authority --</option>
                                        {teachers && teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                    <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Select the teacher who should review this request.</p>
                            </div>

                            {/* 2. Leave Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Duration</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setLeaveData({ ...leaveData, type: "One Day" })}
                                        className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-all ${leaveData.type === "One Day"
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        One Day
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLeaveData({ ...leaveData, type: "Multi Day" })}
                                        className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-all ${leaveData.type === "Multi Day"
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        Multiple Days
                                    </button>
                                </div>
                            </div>

                            {/* 3. Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {leaveData.type === "One Day" ? "Date" : "From Date"} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="from_date"
                                            value={leaveData.from_date}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    </div>
                                </div>

                                {leaveData.type === "Multi Day" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            To Date <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="to_date"
                                                value={leaveData.to_date}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Leave <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="reason"
                                    value={leaveData.reason}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Please explain why you need to take leave..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>Applying...</>
                                ) : (
                                    <>
                                        <CheckCircle size={20} /> Submit Application
                                    </>
                                )}
                            </button>

                        </form>
                    </div>
                ) : (
                    <LeaveHistory />
                )}

                {/* Helper Note - Only show on Apply tab to keep history clean */}
                {activeTab === "apply" && (
                    <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg flex items-start gap-3 border border-blue-100">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <p className="text-sm">
                            Once approved by your teacher, your attendance will be automatically marked as "Absent" (or "Leave") for the requested dates.
                            You can track the status in the Leave History tab.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default LeaveApplication;
