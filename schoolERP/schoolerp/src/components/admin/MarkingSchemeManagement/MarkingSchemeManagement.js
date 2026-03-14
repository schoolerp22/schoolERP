import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, X, Archive, Trash2, CheckCircle, GraduationCap } from 'lucide-react';
import axios from 'axios';

// Compute current academic year (April–March)
const computeAcademicYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    const start = now.getMonth() < 3 ? y - 1 : y;
    return `${start}-${start + 1}`;
};

const ALL_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const CLASS_NUMS = Array.from({ length: 12 }, (_, i) => i + 1);
const PRE_PRIMARY_CLASSES = ["PG", "Nursery", "LKG", "UKG"];

const STAGE_PRESETS = [
    { key: "CBSE_PRE_PRIMARY", label: "Pre-Primary", sub: "PG to UKG", classes: ["PG", "Nursery", "LKG", "UKG"] },
    { key: "CBSE_PRIMARY", label: "Primary", sub: "Class 1 to 5", classRange: [1, 5] },
    { key: "CBSE_MIDDLE", label: "Middle", sub: "Class 6 to 8", classRange: [6, 8] },
    { key: "CBSE_SECONDARY", label: "Secondary", sub: "Class 9 to 10", classRange: [9, 10] },
    { key: "CBSE_SR_SECONDARY", label: "Sr. Secondary", sub: "Class 11 to 12", classRange: [11, 12] }
];

const MarkingSchemeManagement = () => {
    const [schemes, setSchemes] = useState([]);
    const [templates, setTemplates] = useState({});
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // UI selections
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedPrePrimary, setSelectedPrePrimary] = useState([...PRE_PRIMARY_CLASSES]);
    const [classFrom, setClassFrom] = useState(1);
    const [classTo, setClassTo] = useState(5);
    const [allSections, setAllSections] = useState(true);
    const [selectedSections, setSelectedSections] = useState([]);

    const [formData, setFormData] = useState({
        scheme_name: '',
        academic_year: computeAcademicYear(),
        applicable_to: { classes: [], sections: [] },
        components: [],
        grading_system: { type: 'both', grade_ranges: [] }
    });

    const adminId = 'ADMIN-001';

    // Fetch templates & schemes
    useEffect(() => {
        fetchTemplates();
        fetchSchemes();
    }, []);

    const fetchTemplates = async () => {
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${API_BASE}/api/admin/${adminId}/marking-schemes/templates`);
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const fetchSchemes = async () => {
        setLoading(true);
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${API_BASE}/api/admin/${adminId}/marking-schemes`);
            setSchemes(response.data);
        } catch (error) {
            console.error('Error fetching schemes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (templateKey) => {
        setSelectedTemplate(templateKey);
        if (templates[templateKey]) {
            const template = templates[templateKey];
            setFormData({
                ...formData,
                scheme_name: template.scheme_name,
                components: template.components,
                grading_system: template.grading || template.grading_system // support both forms
            });

            // Auto-fill class ranges based on stage
            const stage = STAGE_PRESETS.find(s => s.key === templateKey);
            if (stage) {
                if (stage.classRange) {
                    setClassFrom(stage.classRange[0]);
                    setClassTo(stage.classRange[1]);
                }
            }
        }
    };

    const getClassesArray = () => {
        if (selectedTemplate === "CBSE_PRE_PRIMARY") {
            return selectedPrePrimary;
        }
        const arr = [];
        const start = Math.min(classFrom, classTo);
        const end = Math.max(classFrom, classTo);
        for (let i = start; i <= end; i++) {
            arr.push(String(i));
        }
        return arr;
    };

    const togglePrePrimaryClass = (cls) => {
        setSelectedPrePrimary(prev =>
            prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
        );
    };

    const toggleSection = (sec) => {
        setSelectedSections(prev =>
            prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
        );
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const classesArr = getClassesArray();
            const sectionsArr = allSections ? ['All'] : selectedSections;

            if (classesArr.length === 0) {
                alert("Please select at least one class.");
                setLoading(false);
                return;
            }

            if (!allSections && sectionsArr.length === 0) {
                alert("Please select at least one section.");
                setLoading(false);
                return;
            }

            await axios.post(`${API_BASE}/api/admin/${adminId}/marking-schemes`, {
                ...formData,
                applicable_to: { classes: classesArr, sections: sectionsArr },
                template: selectedTemplate || undefined
            });
            setShowCreateForm(false);
            resetForm();
            fetchSchemes();
            alert('Marking scheme created successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating scheme');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (schemeId) => {
        if (!window.confirm("Are you sure you want to archive this scheme? It won't be available for new exams.")) return;
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            await axios.put(`${API_BASE}/api/admin/${adminId}/marking-schemes/${schemeId}/status`, { status: 'Archived' });
            fetchSchemes();
        } catch (error) {
            alert('Error archiving scheme');
        }
    };

    const handleDelete = async (schemeId) => {
        if (!window.confirm("Are you sure you want to permanently delete this scheme?")) return;
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            await axios.delete(`${API_BASE}/api/admin/${adminId}/marking-schemes/${schemeId}`);
            fetchSchemes();
        } catch (error) {
            alert('Error deleting scheme');
        }
    };

    const resetForm = () => {
        setSelectedTemplate('');
        setClassFrom(1);
        setClassTo(5);
        setAllSections(true);
        setSelectedSections([]);
        setSelectedPrePrimary([...PRE_PRIMARY_CLASSES]);
        setFormData({
            scheme_name: '',
            academic_year: computeAcademicYear(),
            applicable_to: { classes: [], sections: [] },
            components: [],
            grading_system: { type: 'both', grade_ranges: [] }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Marking Scheme Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure CBSE stage-wise exam structures and grading</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    {showCreateForm ? <X size={18} /> : <Plus size={18} />}
                    {showCreateForm ? 'Cancel' : 'Create Scheme'}
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Create CBSE Marking Scheme</h3>

                    {/* Stage Template Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-3">1. Select Academic Stage</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {STAGE_PRESETS.map((stage) => (
                                <button
                                    key={stage.key}
                                    type="button"
                                    onClick={() => handleTemplateSelect(stage.key)}
                                    className={`p-3 border-2 rounded-xl text-left transition-all relative overflow-hidden ${selectedTemplate === stage.key
                                            ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {selectedTemplate === stage.key && (
                                        <div className="absolute top-2 right-2 flex items-center justify-center bg-indigo-600 text-white rounded-full w-5 h-5">
                                            <CheckCircle size={14} />
                                        </div>
                                    )}
                                    <GraduationCap size={20} className={`mb-2 ${selectedTemplate === stage.key ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    <span className="block font-bold text-sm text-gray-900">{stage.label}</span>
                                    <span className="block text-[11px] font-medium text-gray-500 mt-1">{stage.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Scheme Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.scheme_name}
                                    onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                                    placeholder="e.g., CBSE Primary 2026"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Academic Year</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                                    placeholder="2025-2026"
                                />
                            </div>
                        </div>

                        {/* Class & Section Selection */}
                        <div className="border border-gray-200 rounded-xl p-5">
                            <label className="block text-sm font-bold text-gray-900 mb-4">2. Assign to Classes & Sections</label>

                            {selectedTemplate === "CBSE_PRE_PRIMARY" ? (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Pre-Primary Classes</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRE_PRIMARY_CLASSES.map(cls => (
                                            <button
                                                key={cls}
                                                type="button"
                                                onClick={() => togglePrePrimaryClass(cls)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${selectedPrePrimary.includes(cls)
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                                    <div className="w-full">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">From Class</label>
                                        <select
                                            value={classFrom}
                                            onChange={e => setClassFrom(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                                        >
                                            {CLASS_NUMS.map(n => <option key={n} value={n}>Class {n}</option>)}
                                        </select>
                                    </div>
                                    <span className="text-gray-400 font-bold hidden sm:block mt-6">TO</span>
                                    <div className="w-full">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">To Class</label>
                                        <select
                                            value={classTo}
                                            onChange={e => setClassTo(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                                        >
                                            {CLASS_NUMS.map(n => <option key={n} value={n}>Class {n}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Sections</label>
                                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allSections}
                                        onChange={() => setAllSections(!allSections)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                                    />
                                    <span className="text-sm font-bold text-gray-900">Apply to All Sections</span>
                                </label>

                                {!allSections && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {ALL_SECTIONS.map(sec => (
                                            <button
                                                key={sec}
                                                type="button"
                                                onClick={() => toggleSection(sec)}
                                                className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors border ${selectedSections.includes(sec)
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {sec}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Components Preview */}
                        {formData.components.length > 0 && (
                            <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-5">
                                <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                    <BookOpen size={16} />
                                    Included Exam Components
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {formData.components.map((c, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-800">{c.name}</span>
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Max: {c.max_marks}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => { setShowCreateForm(false); resetForm(); }}
                                className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedTemplate}
                                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Creating...' : 'Create Scheme'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List of Schemes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-100 p-4">
                    <h3 className="text-lg font-bold text-gray-900">Active Schemes</h3>
                </div>

                {loading && !schemes.length ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : schemes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>No marking schemes found for this academic year.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {schemes.map((scheme) => (
                            <div key={scheme._id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:bg-gray-50 transition-colors ${scheme.status === 'Archived' ? 'opacity-60 bg-gray-50' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-base font-bold text-gray-900">{scheme.scheme_name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${scheme.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {scheme.status || 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 font-medium mt-1">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Year: {scheme.academic_year}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Classes: {scheme.applicable_to?.classes?.join(', ')}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Sections: {scheme.applicable_to?.sections?.join(', ')}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400 font-medium">
                                        {scheme.components?.length || 0} Components
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {scheme.status === 'Active' && (
                                        <button
                                            onClick={() => handleArchive(scheme._id)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                            title="Archive Scheme"
                                        >
                                            <Archive size={14} /> <span className="sm:hidden">Archive</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(scheme._id)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Delete Scheme"
                                    >
                                        <Trash2 size={14} /> <span className="sm:hidden">Delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarkingSchemeManagement;
