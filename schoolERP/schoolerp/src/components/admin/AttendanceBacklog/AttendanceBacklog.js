import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

const AttendanceBacklog = () => {
    const [backlogs, setBacklogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        class_section: 'All',
        reason: ''
    });

    const adminId = 'ADMIN-001'; // TODO: Get from auth context

    // Fetch backlogs
    const fetchBacklogs = async () => {
        setLoading(true);
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${API_BASE}/api/admin/${adminId}/attendance-backlog`);
            setBacklogs(response.data);
        } catch (error) {
            console.error('Error fetching backlogs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBacklogs();
    }, []);

    // Create backlog
    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            await axios.post(`${API_BASE}/api/admin/${adminId}/attendance-backlog`, formData);
            setShowCreateForm(false);
            setFormData({ start_date: '', end_date: '', class_section: 'All', reason: '' });
            fetchBacklogs();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating backlog');
        } finally {
            setLoading(false);
        }
    };

    // Close backlog
    const handleClose = async (backlogId) => {
        if (!window.confirm('Are you sure you want to close this backlog window?')) return;

        setLoading(true);
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            await axios.patch(`${API_BASE}/api/admin/${adminId}/attendance-backlog/${backlogId}/close`);
            fetchBacklogs();
        } catch (error) {
            alert(error.response?.data?.message || 'Error closing backlog');
        } finally {
            setLoading(false);
        }
    };

    // Delete backlog
    const handleDelete = async (backlogId) => {
        if (!window.confirm('Are you sure you want to delete this backlog window?')) return;

        setLoading(true);
        try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            await axios.delete(`${API_BASE}/api/admin/${adminId}/attendance-backlog/${backlogId}`);
            fetchBacklogs();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting backlog');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Backlog Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage attendance backlog windows for teachers</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    {showCreateForm ? <X size={18} /> : <Plus size={18} />}
                    {showCreateForm ? 'Cancel' : 'Create Backlog'}
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Backlog Window</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select
                                    value={formData.class_section.split('-')[0]}
                                    onChange={(e) => {
                                        const newClass = e.target.value;
                                        const section = formData.class_section.includes('-') ? formData.class_section.split('-')[1] : 'All';
                                        setFormData({
                                            ...formData,
                                            class_section: newClass === 'All' ? 'All' : `${newClass}-${section}`
                                        });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="All">All Classes</option>
                                    {['PRE-NUR', 'NUR', 'LKG', 'UKG', ...[...Array(10)].map((_, i) => (i + 1).toString())].map((cls) => (
                                        <option key={cls} value={cls}>{isNaN(cls) ? cls : `Class ${cls}`}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                <select
                                    disabled={formData.class_section === 'All'}
                                    value={formData.class_section.includes('-') ? formData.class_section.split('-')[1] : 'All'}
                                    onChange={(e) => {
                                        const className = formData.class_section.split('-')[0];
                                        const newSection = e.target.value;
                                        setFormData({
                                            ...formData,
                                            class_section: newSection === 'All' ? className : `${className}-${newSection}`
                                        });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                                >
                                    <option value="All">All Sections</option>
                                    {['A', 'B', 'C', 'D'].map((s) => (
                                        <option key={s} value={s}>Section {s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                            <textarea
                                required
                                placeholder="Why is this backlog window being opened?"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Backlog Window'}
                        </button>
                    </form>
                </div>
            )}

            {/* Backlogs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Backlog Windows</h3>
                </div>

                {loading && backlogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : backlogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
                        <p>No backlog windows created yet</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {backlogs.map((backlog) => (
                                <div key={backlog._id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-medium text-gray-900 text-sm">
                                                {formatDate(backlog.start_date)} - {formatDate(backlog.end_date)}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                                                    Class: {backlog.class_section}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            {backlog.status === 'Open' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                                    <CheckCircle size={14} />
                                                    Open
                                                </span>
                                            ) : backlog.status === 'Expired' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                                    <Calendar size={14} />
                                                    Expired
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                                    <XCircle size={14} />
                                                    Closed
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                        <span className="font-medium">Reason: </span>
                                        {backlog.reason}
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                                        <span>Created: {formatDate(backlog.created_at)}</span>

                                        <div className="flex items-center gap-2">
                                            {(backlog.status === 'Open' || backlog.status === 'Expired') && (
                                                <button
                                                    onClick={() => handleClose(backlog._id)}
                                                    className="p-1.5 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors flex items-center gap-1"
                                                    title="Close backlog"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(backlog._id)}
                                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                                                title="Delete backlog"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {backlogs.map((backlog) => (
                                        <tr key={backlog._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(backlog.start_date)} - {formatDate(backlog.end_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                                                    {backlog.class_section}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {backlog.reason}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {backlog.status === 'Open' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                                        <CheckCircle size={14} />
                                                        Open
                                                    </span>
                                                ) : backlog.status === 'Expired' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                                        <Calendar size={14} />
                                                        Expired
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                                        <XCircle size={14} />
                                                        Closed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(backlog.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    {(backlog.status === 'Open' || backlog.status === 'Expired') && (
                                                        <button
                                                            onClick={() => handleClose(backlog._id)}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                            title="Close backlog"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(backlog._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete backlog"
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

export default AttendanceBacklog;
