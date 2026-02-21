import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, X, Edit2, Archive, Trash2, Eye, CheckCircle, Copy } from 'lucide-react';
import axios from 'axios';

const MarkingSchemeManagement = () => {
    const [schemes, setSchemes] = useState([]);
    const [templates, setTemplates] = useState({});
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [formData, setFormData] = useState({
        scheme_name: '',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        applicable_to: {
            classes: [],
            sections: []
        },
        components: [],
        grading_system: {
            type: 'both',
            grade_ranges: []
        }
    });

    const adminId = 'ADMIN-001'; // TODO: Get from auth context

    // Fetch templates
    useEffect(() => {
        fetchTemplates();
        fetchSchemes();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/admin/${adminId}/marking-schemes/templates`);
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const fetchSchemes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/admin/${adminId}/marking-schemes`);
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
                grading_system: template.grading_system
            });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`http://localhost:5000/api/admin/${adminId}/marking-schemes`, {
                ...formData,
                template: selectedTemplate || undefined
            });
            setShowCreateForm(false);
            resetForm();
            fetchSchemes();
            alert('Marking scheme created successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating marking scheme');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (schemeId) => {
        if (!window.confirm('Archive this marking scheme?')) return;

        setLoading(true);
        try {
            await axios.patch(`http://localhost:5000/api/admin/${adminId}/marking-schemes/${schemeId}/archive`);
            fetchSchemes();
        } catch (error) {
            alert(error.response?.data?.message || 'Error archiving scheme');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (schemeId) => {
        if (!window.confirm('Permanently delete this marking scheme? This cannot be undone.')) return;

        setLoading(true);
        try {
            await axios.delete(`http://localhost:5000/api/admin/${adminId}/marking-schemes/${schemeId}`);
            fetchSchemes();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting scheme');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            scheme_name: '',
            academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
            applicable_to: { classes: [], sections: [] },
            components: [],
            grading_system: { type: 'both', grade_ranges: [] }
        });
        setSelectedTemplate('');
    };

    const handleClassInput = (value) => {
        const classes = value.split(',').map(c => c.trim()).filter(c => c);
        setFormData({ ...formData, applicable_to: { ...formData.applicable_to, classes } });
    };

    const handleSectionInput = (value) => {
        const sections = value.split(',').map(s => s.trim()).filter(s => s);
        setFormData({ ...formData, applicable_to: { ...formData.applicable_to, sections } });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Marking Scheme Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure exam structures and grading systems</p>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Marking Scheme</h3>

                    {/* Template Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Choose Template</label>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {Object.keys(templates).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleTemplateSelect(key)}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${selectedTemplate === key
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {selectedTemplate === key && <CheckCircle size={16} className="text-indigo-600" />}
                                        <span className="font-medium text-sm">{templates[key].scheme_name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{templates[key].description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.scheme_name}
                                    onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., CBSE 2026"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="2025-2026"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Applicable Classes <span className="text-xs text-gray-500">(comma-separated or "All")</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    onChange={(e) => handleClassInput(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="1, 2, 3 or All"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Applicable Sections <span className="text-xs text-gray-500">(comma-separated or "All")</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    onChange={(e) => handleSectionInput(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="A, B, C or All"
                                />
                            </div>
                        </div>

                        {/* Preview Components */}
                        {formData.components.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h4 className="font-medium text-sm text-gray-700 mb-3">Exam Components Preview</h4>
                                <div className="space-y-2">
                                    {formData.components.map((comp, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{comp.name}</span>
                                            <span className="text-gray-600">
                                                {comp.weight}% (Max: {comp.max_marks})
                                                {comp.sub_components && ` - ${comp.sub_components.length} sub-components`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Marking Scheme'}
                        </button>
                    </form>
                </div>
            )}

            {/* Schemes List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Existing Marking Schemes</h3>
                </div>

                {loading && schemes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : schemes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
                        <p>No marking schemes created yet</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {schemes.map((scheme) => (
                                <div key={scheme._id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {scheme.scheme_name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Year: {scheme.academic_year}
                                            </p>
                                        </div>
                                        <div>
                                            {scheme.status === 'Active' ? (
                                                <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                    Archived
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700">
                                            Classes: {scheme.applicable_to?.classes?.join(', ') || 'All'}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700">
                                            Sections: {scheme.applicable_to?.sections?.join(', ') || 'All'}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700">
                                            {scheme.components?.length || 0} Components
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50 mt-2">
                                        {scheme.status === 'Active' && (
                                            <button
                                                onClick={() => handleArchive(scheme._id)}
                                                className="flex-1 sm:flex-none flex justify-center py-2 px-3 text-sm text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                                                title="Archive"
                                            >
                                                Archive
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(scheme._id)}
                                            className="flex-1 sm:flex-none flex justify-center py-2 px-3 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                            title="Delete"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Components</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {schemes.map((scheme) => (
                                        <tr key={scheme._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {scheme.scheme_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {scheme.academic_year}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {scheme.applicable_to?.classes?.join(', ') || 'All'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {scheme.applicable_to?.sections?.join(', ') || 'All'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {scheme.components?.length || 0} components
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {scheme.status === 'Active' ? (
                                                    <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                        Archived
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    {scheme.status === 'Active' && (
                                                        <button
                                                            onClick={() => handleArchive(scheme._id)}
                                                            className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                                            title="Archive"
                                                        >
                                                            <Archive size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(scheme._id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MarkingSchemeManagement;
