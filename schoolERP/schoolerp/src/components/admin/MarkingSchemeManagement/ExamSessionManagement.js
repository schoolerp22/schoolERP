import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Server, Clock } from 'lucide-react';
import axios from 'axios';

// Compute current academic year (April–March)
const computeAcademicYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    const start = now.getMonth() < 3 ? y - 1 : y;
    return `${start}-${start + 1}`;
};

const CLASS_NUMS = ["PG", "Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const ExamSessionManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [examTypes, setExamTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        exam_type: '',
        term: 1,
        academic_year: computeAcademicYear(),
        start_date: '',
        end_date: '',
        applicable_classes: [],
        status: 'Active'
    });

    // Fetch EXAM TYPES from backend to populate dropdown
    const fetchExamTypes = async () => {
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${API_BASE}/api/admin/ADMIN-001/exam-types`);
            setExamTypes(response.data);
        } catch (error) {
            console.error('Error fetching Exam Types:', error);
            // Fallback if endpoint missing
            setExamTypes([
                { code: "FA1", label: "Formative Assessment 1 (FA1)", term: 1 },
                { code: "SA1", label: "Summative Assessment 1 / Half Yearly", term: 1 },
                { code: "WEEKLY_TEST", label: "Weekly Test", term: 1 },
                { code: "UNIT_TEST", label: "Unit Test", term: 1 }
            ]);
        }
    };

    // Fetch actual Exam Sessions
    const fetchSessions = async () => {
        setLoading(true);
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${API_BASE}/api/exam-sessions`);
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching Exam Sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExamTypes();
        fetchSessions();
    }, []);

    const handleClassToggle = (cls) => {
        setFormData(prev => ({
            ...prev,
            applicable_classes: prev.applicable_classes.includes(cls)
                ? prev.applicable_classes.filter(c => c !== cls)
                : [...prev.applicable_classes, cls]
        }));
    };

    const handleSelectAllClasses = () => {
        setFormData(prev => ({ ...prev, applicable_classes: CLASS_NUMS }));
    };

    const handleClearClasses = () => {
        setFormData(prev => ({ ...prev, applicable_classes: [] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.exam_type || formData.applicable_classes.length === 0) {
            alert('Please fill out name, exam type, and select at least one class.');
            return;
        }

        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            await axios.post(`${API_BASE}/api/exam-sessions`, formData);
            alert('Exam Session Created Successfully!');
            setShowCreateForm(false);
            fetchSessions(); // refresh

            // reset form
            setFormData({
                name: '',
                exam_type: '',
                term: 1,
                academic_year: computeAcademicYear(),
                start_date: '',
                end_date: '',
                applicable_classes: [],
                status: 'Active'
            });
        } catch (error) {
            console.error("Error creating session", error);
            alert("Error creating session.");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-indigo-600" /> Exam Sessions
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Active Exam Sessions dictate which columns teachers see when uploading results.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={20} /> Create Exam Session
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8 animation-fade-in">
                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                        <h2 className="text-lg font-semibold text-gray-800">New Exam Session</h2>
                        <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Term 1 Final, FA1"
                                    required
                                />
                            </div>

                            {/* CBSE Component Type mapping */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type Mapping *</label>
                                <select
                                    value={formData.exam_type}
                                    onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                >
                                    <option value="">Select CBSE Internal Mapping</option>
                                    {examTypes.map((t, idx) => (
                                        <option key={idx} value={t.code}>{t.label} (Term {t.term})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Academic Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                                <input
                                    type="text"
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Term */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                                <select
                                    value={formData.term}
                                    onChange={(e) => setFormData({ ...formData, term: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value={1}>Term 1</option>
                                    <option value={2}>Term 2</option>
                                </select>
                            </div>
                        </div>

                        {/* Classes mapping */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-gray-700">Applicable Classes *</label>
                                <div className="space-x-4">
                                    <button type="button" onClick={handleSelectAllClasses} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Select All</button>
                                    <button type="button" onClick={handleClearClasses} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear</button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {CLASS_NUMS.map(cls => (
                                    <div
                                        key={cls}
                                        onClick={() => handleClassToggle(cls)}
                                        className={`px-3 py-1 text-sm rounded-full cursor-pointer transition-colors border ${formData.applicable_classes.includes(cls)
                                                ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Class {cls.replace('Class ', '')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                            >
                                Save Exam Session
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Active Sessions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Current Exam Sessions</h2>
                    <span className="text-sm text-gray-500">{sessions.length} sessions tracking</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <Clock className="animate-spin mb-2" size={24} />
                        Loading sessions...
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Server size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Exam Sessions Created</h3>
                        <p className="text-sm">Teachers cannot upload marks until you define active exams tracking.</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="mt-4 text-indigo-600 font-medium hover:text-indigo-800 underline"
                        >
                            Create First Exam Session
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3 tracking-wider">Session Name</th>
                                    <th className="px-6 py-3 tracking-wider">Exam Type</th>
                                    <th className="px-6 py-3 tracking-wider">Term / Year</th>
                                    <th className="px-6 py-3 tracking-wider">Applicable Classes</th>
                                    <th className="px-6 py-3 tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sessions.map((session) => (
                                    <tr key={session._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{session.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-semibold">
                                                {session.exam_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            Term {session.term} <br />
                                            <span className="text-xs text-gray-400">{session.academic_year}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {session.applicable_classes.slice(0, 4).map(c => (
                                                    <span key={c} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                                        {c}
                                                    </span>
                                                ))}
                                                {session.applicable_classes.length > 4 && (
                                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">
                                                        +{session.applicable_classes.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamSessionManagement;
